// Dialecto in-context editing for an Astro site (dev only).
//
//   astro.config.mjs   import dialectoInContext from './tooling/dialecto-in-context.mjs'
//                      integrations: [dialectoInContext()]
//   .env.local         DIALECTO_URL=...  DIALECTO_REPO=...  [DIALECTO_SCAN_TOKEN=...]
//   CLI                node tooling/dialecto-in-context.mjs scan [--worktree]
//
// Inert unless DIALECTO_URL and DIALECTO_REPO are set and the command is `astro dev`.
// Spec: ddd-plan/engineering/spec-0016-in-context-editor-json.md (§3 codec, §6 add-on).

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

// ---------------------------------------------------------------- marker codec (spec §3)

const OPEN = String.fromCodePoint(0x2062);
const HEADER_END = String.fromCodePoint(0x2063);
const CLOSE = String.fromCodePoint(0x2064);
const DIGITS = [0x200c, 0x200d, 0x2060, 0x2061].map((cp) => String.fromCodePoint(cp));
const FIELD_SEP = String.fromCodePoint(0x001f);

/** OPEN + base-4 header of `domain US key US locale` + HEADER_END + text + CLOSE. */
export function encodeMark(domain, key, locale, text) {
  let header = '';
  for (const byte of new TextEncoder().encode(domain + FIELD_SEP + key + FIELD_SEP + locale)) {
    header += DIGITS[(byte >> 6) & 3] + DIGITS[(byte >> 4) & 3] + DIGITS[(byte >> 2) & 3] + DIGITS[byte & 3];
  }
  return OPEN + header + HEADER_END + text + CLOSE;
}

const INVISIBLE = new RegExp(`[${DIGITS.join('')}${OPEN}${HEADER_END}${CLOSE}]`, 'g');
const escapeInvisible = (json) => json.replace(INVISIBLE, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

/**
 * Marks every string value of a flat JSON catalog, after applying dev overrides
 * (`Map` or object of key -> replacement text). Anything that is not a flat
 * object is returned untouched. Invisible marker characters are written as
 * \uXXXX escapes so the transformed module stays plain ASCII.
 */
export function markCatalog(jsonText, { domain, locale, overrides = {} }) {
  const catalog = JSON.parse(jsonText);
  if (catalog === null || typeof catalog !== 'object' || Array.isArray(catalog)) return jsonText;
  const override = (key) => (overrides instanceof Map ? overrides.get(key) : Object.hasOwn(overrides, key) ? overrides[key] : undefined);

  const marked = {};
  for (const [key, value] of Object.entries(catalog)) {
    if (typeof value !== 'string') {
      marked[key] = value;
      continue;
    }
    marked[key] = encodeMark(domain, key, locale, override(key) ?? value);
  }
  return escapeInvisible(JSON.stringify(marked));
}

// ---------------------------------------------------------------- configuration

const LOCALE_FILE = /^[a-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/;
const OVERRIDES_PATH = '/__dialecto/overrides';
const MAX_BODY = 256 * 1024;
const MAX_EDITS = 5000;

async function loadEnv(mode, root) {
  const fromProcess = Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('DIALECTO_')));
  try {
    const { loadEnv: viteLoadEnv } = await import('vite');
    return { ...viteLoadEnv(mode, root, 'DIALECTO_'), ...fromProcess };
  } catch {
    return fromProcess;
  }
}

function resolveSettings(env, options, root) {
  const url = (env.DIALECTO_URL ?? '').trim().replace(/\/+$/, '');
  const repo = (env.DIALECTO_REPO ?? '').trim();
  const catalogs = options.catalogs ?? 'src/i18n/messages';
  return {
    url,
    repo,
    token: (env.DIALECTO_SCAN_TOKEN ?? '').trim(),
    catalogs,
    catalogDir: path.resolve(root, catalogs),
    domain: path.basename(path.resolve(root, catalogs)),
    sourceLocale: options.sourceLocale ?? 'en',
    root,
  };
}

const configured = (settings) => /^https?:\/\//.test(settings.url) && settings.repo !== '';

// ---------------------------------------------------------------- Vite plugin

function catalogPlugin(settings) {
  const overrides = new Map(); // locale -> Map(key -> text)

  const catalogLocale = (id) => {
    const [rawFile, query = ''] = id.split('?');
    if (/(^|&)(raw|url|inline)(&|$)/.test(query)) return null;
    const file = path.normalize(rawFile);
    if (path.dirname(file) !== settings.catalogDir || !file.endsWith('.json')) return null;
    const locale = path.basename(file, '.json');
    return LOCALE_FILE.test(locale) ? locale : null;
  };

  function invalidate(server, file) {
    const timestamp = Date.now();
    const seen = new Set();
    for (const environment of Object.values(server.environments ?? {})) {
      for (const mod of environment.moduleGraph.getModulesByFile(file) ?? []) {
        environment.moduleGraph.invalidateModule(mod, seen, timestamp, true);
      }

      // The module runner keeps evaluated copies; importers hold stale bindings, so walk them too.
      const evaluated = environment.runner?.evaluatedModules;
      if (!evaluated) continue;
      const queue = [...(evaluated.getModulesByFile(file) ?? [])];
      const visited = new Set();
      while (queue.length) {
        const node = queue.shift();
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        evaluated.invalidateModule(node);
        for (const id of node.importers ?? []) {
          const importer = evaluated.getModuleById(id);
          if (importer) queue.push(importer);
        }
      }
    }
  }

  function replaceOverrides(server, edits) {
    const next = new Map();
    let applied = 0;
    for (const edit of edits) {
      if (edit.domain !== settings.domain || !LOCALE_FILE.test(edit.locale)) continue;
      if (!next.has(edit.locale)) next.set(edit.locale, new Map());
      next.get(edit.locale).set(edit.key, edit.to);
      applied += 1;
    }

    const serialize = (map) => JSON.stringify([...(map ?? [])].sort(([a], [b]) => (a < b ? -1 : 1)));
    for (const locale of new Set([...overrides.keys(), ...next.keys()])) {
      if (serialize(overrides.get(locale)) === serialize(next.get(locale))) continue;
      invalidate(server, path.join(settings.catalogDir, `${locale}.json`));
    }

    overrides.clear();
    for (const [locale, map] of next) overrides.set(locale, map);
    return applied;
  }

  return {
    name: 'dialecto-in-context:catalogs',
    enforce: 'pre',
    apply: 'serve',

    transform(code, id) {
      const locale = catalogLocale(id);
      if (!locale) return null;
      try {
        return { code: markCatalog(code, { domain: settings.domain, locale, overrides: overrides.get(locale) ?? new Map() }), map: null };
      } catch {
        return null;
      }
    },

    configureServer(server) {
      server.middlewares.use(OVERRIDES_PATH, (req, res, next) => {
        handleOverrides(req, res, server, replaceOverrides).catch(next);
      });
    },
  };
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function validEdits(payload) {
  if (payload === null || typeof payload !== 'object' || !Array.isArray(payload.edits) || payload.edits.length > MAX_EDITS) return null;
  const text = (value, max) => typeof value === 'string' && value.length <= max;
  for (const edit of payload.edits) {
    if (edit === null || typeof edit !== 'object') return null;
    if (!text(edit.domain, 512) || !text(edit.key, 512) || !text(edit.locale, 64) || !text(edit.to, 20000)) return null;
    if (edit.key === '') return null;
  }
  return payload.edits;
}

const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const loopbackHost = (host) => typeof host === 'string' && LOOPBACK_HOST.test(host);

async function handleOverrides(req, res, server, replaceOverrides) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  // Same-origin only: a page on another site must not be able to rewrite the dev catalogs.
  // The loopback Host check closes the DNS-rebinding variant (attacker origin == attacker host).
  const scheme = server.config.server.https ? 'https' : 'http';
  if (!loopbackHost(req.headers.host) || !req.headers.origin || req.headers.origin !== `${scheme}://${req.headers.host}`) {
    return send(res, 403, { error: 'forbidden_origin' });
  }
  if (Number(req.headers['content-length'] ?? 0) > MAX_BODY) return send(res, 413, { error: 'too_large' });

  const raw = await readBody(req);
  if (raw === null) return send(res, 413, { error: 'too_large' });

  let edits;
  try {
    edits = validEdits(JSON.parse(raw));
  } catch {
    edits = null;
  }
  if (!edits) return send(res, 400, { error: 'invalid_edits' });

  const applied = replaceOverrides(server, edits);
  return send(res, 200, { ok: true, applied, ignored: edits.length - applied });
}

// ---------------------------------------------------------------- scan

async function git(root, args) {
  const { stdout } = await run('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  return stdout;
}

const gitTry = async (root, args) => {
  try {
    return (await git(root, args)).trim();
  } catch {
    return null;
  }
};

/** sha256 over the catalogs in path order: `path NUL content NUL` for each file. */
export function scanChecksum(templates) {
  const hash = createHash('sha256');
  for (const { path: file, content } of [...templates].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    hash.update(file).update('\0').update(content).update('\0');
  }
  return hash.digest('hex');
}

async function defaultBranch(root) {
  const head = await gitTry(root, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  if (head) return head.replace(/^origin\//, '');
  for (const name of ['main', 'master']) {
    if (await gitTry(root, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${name}`])) return name;
  }
  return null;
}

async function readCatalogs(settings, { worktree }) {
  const { root } = settings;
  const prefix = (await gitTry(root, ['rev-parse', '--show-prefix'])) ?? '';
  const dir = path.posix.join(prefix, settings.catalogs.split(path.sep).join('/')).replace(/\/$/, '');

  if (worktree) {
    const names = (await readdir(settings.catalogDir)).filter((name) => name.endsWith('.json')).sort();
    const templates = await Promise.all(
      names.map(async (name) => ({ path: path.posix.join(dir, name), content: await readFile(path.join(settings.catalogDir, name), 'utf8') })),
    );
    return { dir, templates, ref: 'working tree', sha: await gitTry(root, ['rev-parse', 'HEAD']), branch: (await gitTry(root, ['rev-parse', '--abbrev-ref', 'HEAD'])) ?? 'HEAD' };
  }

  const branch = await defaultBranch(root);
  if (!branch) {
    throw new Error("no origin/main or origin/master ref — run 'git fetch origin' (or add a remote) first");
  }
  const ref = `origin/${branch}`;
  const listed = (await git(root, ['ls-tree', '--name-only', ref, `${dir}/`])).split('\n').filter((name) => name.endsWith('.json'));
  if (listed.length === 0) {
    throw new Error(`no catalogs on ${ref} yet — commit and push ${settings.catalogs} first`);
  }
  const templates = [];
  for (const file of listed.sort()) templates.push({ path: file, content: await git(root, ['show', `${ref}:${file}`]) });
  return { dir, templates, ref, sha: await gitTry(root, ['rev-parse', ref]), branch };
}

async function divergence(settings, ref, dir) {
  const changed = new Set((await gitTry(settings.root, ['diff', '--name-only', ref, '--', `${dir}/`]))?.split('\n').filter(Boolean));
  for (const file of (await gitTry(settings.root, ['ls-files', '--others', '--exclude-standard', '--', `${dir}/`]))?.split('\n').filter(Boolean) ?? []) {
    changed.add(file);
  }
  return [...changed].map((file) => path.posix.basename(file)).sort();
}

/**
 * Posts the catalogs at origin/<default> (or the working tree with `worktree`)
 * to Dialecto's scan endpoint. Resolves to `{ok, message, level}`; never throws.
 */
export async function scan(settings, { worktree = false, log = () => {}, fetchImpl = globalThis.fetch } = {}) {
  const fail = (message) => ({ ok: false, level: 'error', message });
  const authorization = { authorization: `Bearer ${settings.token}` };

  try {
    let probe;
    try {
      probe = await fetchImpl(`${settings.url}/api/repos/${settings.repo}/scan-config`, { headers: authorization });
    } catch {
      return fail(`cannot reach Dialecto at ${settings.url} — is it running?`);
    }
    if (probe.status === 401 || probe.status === 403) {
      return fail(`scan token rejected for repo ${settings.repo} — check DIALECTO_SCAN_TOKEN and DIALECTO_REPO`);
    }
    if (!probe.ok) return fail(`Dialecto answered ${probe.status} for repo ${settings.repo}`);

    if (worktree) {
      log('warn', '--worktree reads uncommitted catalog files: testing only, a pull request from this scan would include those bytes');
    }

    const source = await readCatalogs(settings, { worktree });
    if (source.templates.length === 0) return fail(`no catalogs in ${settings.catalogs}`);

    if (!worktree) {
      const differing = await divergence(settings, source.ref, source.dir);
      if (differing.length) {
        log('warn', `${differing.join(', ')} differ from ${source.ref} (uncommitted or unpushed); Dialecto only sees ${source.ref}`);
      }
    }
    if (!source.templates.some(({ path: file }) => path.posix.basename(file) === `${settings.sourceLocale}.json`)) {
      log('warn', `source catalog ${settings.sourceLocale}.json not found in ${source.dir}`);
    }

    const response = await fetchImpl(`${settings.url}/api/repos/${settings.repo}/scans`, {
      method: 'POST',
      headers: { ...authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        gitSha: source.sha ?? '',
        gitBranch: source.branch,
        checksum: scanChecksum(source.templates),
        templates: source.templates,
      }),
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (response.status === 401) return fail('scan token rejected by the scan endpoint');
    if (!response.ok) return fail(`scan rejected (${response.status}): ${body?.error ?? 'no detail'}`);

    const short = (source.sha ?? '').slice(0, 7);
    const summary = `${source.templates.length} catalogs @ ${short || 'unknown'} (${source.ref})`;
    return { ok: true, level: 'info', message: body?.outcome === 'idempotent' ? `already up to date: ${summary}` : `scanned ${summary}` };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ---------------------------------------------------------------- Astro integration

export default function dialectoInContext(options = {}) {
  let settings = null;

  return {
    name: 'dialecto',
    hooks: {
      'astro:config:setup': async ({ command, config, injectScript, updateConfig, logger }) => {
        const root = fileURLToPath(config.root);
        settings = resolveSettings(await loadEnv('development', root), options, root);

        if (command !== 'dev' || !configured(settings)) {
          logger.debug('in-context editing is off (needs astro dev, DIALECTO_URL and DIALECTO_REPO)');
          settings = null;
          return;
        }

        updateConfig({ vite: { plugins: [catalogPlugin(settings)] } });
        const loader = [
          '(function(){',
          "var s=document.createElement('script');",
          `s.src=${JSON.stringify(`${settings.url}/assets/in-context/overlay.js`)};`,
          's.async=false;',
          `s.dataset.url=${JSON.stringify(settings.url)};`,
          `s.dataset.repo=${JSON.stringify(settings.repo)};`,
          `s.dataset.overrides=${JSON.stringify(OVERRIDES_PATH)};`,
          'document.head.appendChild(s);',
          '})();',
        ].join('');
        injectScript('head-inline', loader);
        logger.info(`in-context editing on: ${settings.url} (repo ${settings.repo})`);
      },

      'astro:server:start': ({ logger }) => {
        if (!settings || !settings.token) return;
        scan(settings, { log: (level, message) => logger[level](message) }).then((result) => logger[result.level](result.message));
      },
    },
  };
}

// ---------------------------------------------------------------- CLI

async function cli(args) {
  const [command, ...flags] = args;
  if (command !== 'scan') {
    console.error('usage: node tooling/dialecto-in-context.mjs scan [--worktree]');
    return 2;
  }
  const root = process.cwd();
  const settings = resolveSettings(await loadEnv('development', root), {}, root);
  if (!configured(settings)) {
    console.error('[dialecto] set DIALECTO_URL and DIALECTO_REPO (for example in .env.local)');
    return 1;
  }
  if (!settings.token) {
    console.error('[dialecto] set DIALECTO_SCAN_TOKEN (the repo scan token from its Dialecto settings)');
    return 1;
  }
  const result = await scan(settings, {
    worktree: flags.includes('--worktree'),
    log: (level, message) => console.error(`[dialecto] ${level === 'warn' ? 'warning: ' : ''}${message}`),
  });
  (result.ok ? console.log : console.error)(`[dialecto] ${result.message}`);
  return result.ok ? 0 : 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (invokedDirectly) process.exitCode = await cli(process.argv.slice(2));
