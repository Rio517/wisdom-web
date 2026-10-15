// Dialecto in-context editing for an Astro site (dev only).
//
// Setup is one line in astro.config.mjs:
//
//   import dialectoInContext from './tooling/dialecto-in-context.mjs'
//   integrations: [dialectoInContext()]
//
// Active in `astro dev` as soon as it is installed; inert for build, preview and tests.
// Everything else is optional (option or env var, option wins): url / DIALECTO_URL,
// project / DIALECTO_PROJECT, catalogs / DIALECTO_CATALOGS, sourceLocale /
// DIALECTO_SOURCE_LOCALE, enabled / DIALECTO_IN_CONTEXT=off. The site is identified by
// its git remote, served to the overlay at /__dialecto/context.
// CI scan (needs DIALECTO_SCAN_TOKEN and a numeric DIALECTO_PROJECT):
//   node tooling/dialecto-in-context.mjs scan [--worktree]
//
// Spec: ddd-plan/engineering/spec-0016-in-context-editor-json.md (§3 codec, §4 site, §6 add-on).

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const ADDON_VERSION = '2.0.0';
export const DEFAULT_URL = 'https://dialecto.eu';

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

// ---------------------------------------------------------------- formatter recording (spec §4)
//
// Plural/select wording can only be previewed exactly with the values the page
// formatted it with. In dev the page's `intl-messageformat` is swapped for a
// subclass whose `format` records those values into the message's own marker
// header (after U+001E in the payload), on the server and in the browser; the
// browser also gets `window.__dialectoFormat` so the overlay re-renders an edit
// with the page's own formatter. The wrapper's recorder is generated from these
// very functions' source, so what the tests exercise is exactly what ships.

const REC_OPEN = String.fromCodePoint(0x2062);
const REC_HEADER_END = String.fromCodePoint(0x2063);
const REC_CLOSE = String.fromCodePoint(0x2064);
const REC_RECORD_SEP = String.fromCodePoint(0x1e);
const REC_DIGITS = [0x200c, 0x200d, 0x2060, 0x2061].map((cp) => String.fromCodePoint(cp));

function recToDigits(text) {
  let out = '';
  for (const byte of new TextEncoder().encode(text)) {
    out += REC_DIGITS[(byte >> 6) & 3] + REC_DIGITS[(byte >> 4) & 3] + REC_DIGITS[(byte >> 2) & 3] + REC_DIGITS[byte & 3];
  }
  return out;
}

function recFromDigits(digits) {
  if (digits.length === 0 || digits.length % 4 !== 0) return null;
  const bytes = new Uint8Array(digits.length / 4);
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 4; j++) {
      const value = REC_DIGITS.indexOf(digits[i * 4 + j]);
      if (value < 0) return null;
      byte = (byte << 2) | value;
    }
    bytes[i] = byte;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function recStrip(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === REC_OPEN) {
      const end = text.indexOf(REC_HEADER_END, i + 1);
      if (end >= 0) {
        i = end;
        continue;
      }
    }
    if (char !== REC_CLOSE && char !== REC_HEADER_END) out += char;
  }
  return out;
}

// JSON of the values, or null when one can't round-trip (a function, a rich-text tag…).
function encodeArgs(values) {
  const out = {};
  for (const [name, value] of Object.entries(values)) {
    if (value === null || typeof value === 'boolean') {
      out[name] = value;
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      out[name] = value;
    } else if (typeof value === 'string') {
      out[name] = value.includes(REC_OPEN) ? { $marked: recStrip(value) } : value;
    } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      out[name] = { $date: value.toISOString() };
    } else {
      return null;
    }
  }
  return JSON.stringify(out);
}

// A marked message's output with its argument values recorded in its header.
function annotate(output, values) {
  if (typeof output !== 'string' || values === null || typeof values !== 'object') return output;
  if (output[0] !== REC_OPEN) return output;
  const end = output.indexOf(REC_HEADER_END);
  if (end < 0) return output;
  const payload = recFromDigits(output.slice(1, end));
  if (payload === null || payload.includes(REC_RECORD_SEP)) return output;
  const json = encodeArgs(values);
  if (json === null) return output;
  return REC_OPEN + recToDigits(payload + REC_RECORD_SEP + json) + output.slice(end);
}

export { annotate, encodeArgs };

const codepoint = (char) => `String.fromCodePoint(0x${char.codePointAt(0).toString(16)})`;

const RECORDER_SOURCE = [
  `const REC_OPEN = ${codepoint(REC_OPEN)};`,
  `const REC_HEADER_END = ${codepoint(REC_HEADER_END)};`,
  `const REC_CLOSE = ${codepoint(REC_CLOSE)};`,
  `const REC_RECORD_SEP = ${codepoint(REC_RECORD_SEP)};`,
  `const REC_DIGITS = [${REC_DIGITS.map(codepoint).join(', ')}];`,
  ...[recToDigits, recFromDigits, recStrip, encodeArgs, annotate].map(String),
].join('\n\n');

export { RECORDER_SOURCE as recorderSource };

const FORMATTER_ID = '\0dialecto-in-context:intl-messageformat';

const FORMATTER_SOURCE = `import * as real from 'intl-messageformat';
export * from 'intl-messageformat';

${RECORDER_SOURCE}

const Base = real.IntlMessageFormat;

export class IntlMessageFormat extends Base {
  constructor(...args) {
    super(...args);
    const format = this.format.bind(this);
    this.format = (values) => annotate(format(values), values);
  }
}
export default IntlMessageFormat;

if (typeof window !== 'undefined') {
  window.__dialectoFormat = (source, locale, values) => new Base(source, locale).format(values);
  window.dispatchEvent(new Event('dialecto:formatter'));
}
`;

// Every import of 'intl-messageformat' from the site's code resolves to the recording wrapper.
function formatterPlugin() {
  return {
    name: 'dialecto-in-context:formatter',
    enforce: 'pre',
    apply: 'serve',
    resolveId(source, importer) {
      return source === 'intl-messageformat' && importer !== FORMATTER_ID ? FORMATTER_ID : null;
    },
    load(id) {
      return id === FORMATTER_ID ? FORMATTER_SOURCE : null;
    },
  };
}

// ---------------------------------------------------------------- configuration

const LOCALE_FILE = /^[a-z]{2,3}([-_][A-Za-z0-9]{2,8})*$/;
const OVERRIDES_PATH = '/__dialecto/overrides';
const CONTEXT_PATH = '/__dialecto/context';
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

const OFF_VALUES = new Set(['off', 'false', '0']);

// The first non-empty string among the candidates (option > env > default).
const firstText = (...candidates) => {
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
};

/**
 * Pure: options and DIALECTO_* env into the add-on's settings. Precedence is
 * option > env > default. `DIALECTO_REPO` is a deprecated alias of the project
 * (`projectFromAlias` tells the caller to hint at the new name).
 */
export function resolveSettings(env = {}, options = {}, root = process.cwd()) {
  const url = (firstText(options.url, env.DIALECTO_URL) ?? DEFAULT_URL).replace(/\/+$/, '');
  const alias = firstText(options.project, env.DIALECTO_PROJECT) === null && firstText(env.DIALECTO_REPO) !== null;
  const project = firstText(options.project, env.DIALECTO_PROJECT, env.DIALECTO_REPO);
  const catalogs = firstText(options.catalogs, env.DIALECTO_CATALOGS) ?? 'src/i18n/messages';
  const enabled =
    typeof options.enabled === 'boolean' ? options.enabled : !OFF_VALUES.has((env.DIALECTO_IN_CONTEXT ?? '').trim().toLowerCase());
  return {
    enabled,
    url,
    urlValid: /^https?:\/\/[^/\s]/i.test(url),
    project,
    projectFromAlias: alias,
    token: (env.DIALECTO_SCAN_TOKEN ?? '').trim(),
    catalogs,
    catalogDir: path.resolve(root, catalogs),
    domain: path.basename(path.resolve(root, catalogs)),
    sourceLocale: firstText(options.sourceLocale, env.DIALECTO_SOURCE_LOCALE) ?? 'en',
    root,
  };
}

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
      const readContext = createContextReader(settings);
      server.middlewares.use(OVERRIDES_PATH, (req, res, next) => {
        handleOverrides(req, res, server, replaceOverrides).catch(next);
      });
      server.middlewares.use(CONTEXT_PATH, (req, res, next) => {
        handleContext(req, res, server, readContext).catch(next);
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

// ---------------------------------------------------------------- site context (spec §4, §6)

const GITHUB_SEGMENT = /^[A-Za-z0-9._-]+$/;
const MAX_DIRTY = 200;
const CONTEXT_TTL_MS = 2000;
const GIT_TIMEOUT_MS = 5000;

/** `owner/name` from a GitHub remote URL in any of its common spellings, else null. */
export function parseGitHubRemote(remote) {
  if (typeof remote !== 'string') return null;
  const text = remote.trim();
  let host;
  let repoPath;

  if (text.includes('://')) {
    let parsed;
    try {
      parsed = new URL(text);
    } catch {
      return null;
    }
    if (!['http:', 'https:', 'ssh:', 'git:'].includes(parsed.protocol)) return null;
    host = parsed.hostname;
    repoPath = parsed.pathname;
  } else {
    const scp = /^[^@\s/:]+@([^:/\s]+):(.+)$/.exec(text);
    if (!scp) return null;
    [, host, repoPath] = scp;
  }

  if (host.toLowerCase() !== 'github.com') return null;
  const segments = repoPath.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '').split('/');
  if (segments.length !== 2 || !segments.every((segment) => GITHUB_SEGMENT.test(segment))) return null;
  return segments.join('/');
}

/** Paths (repo-root relative, sorted, unique, capped) from `git status --porcelain=v1 -z`. */
export function parsePorcelainZ(output) {
  const fields = String(output ?? '').split('\0');
  const files = new Set();
  for (let i = 0; i < fields.length; i++) {
    const entry = fields[i];
    if (entry.length < 4) continue;
    files.add(entry.slice(3));
    // Renames and copies carry the original path as an extra field.
    if (entry[0] === 'R' || entry[0] === 'C' || entry[1] === 'R' || entry[1] === 'C') {
      i += 1;
      if (fields[i]) files.add(fields[i]);
    }
  }
  return [...files].sort().slice(0, MAX_DIRTY);
}

async function gitContext(root, args) {
  const { stdout } = await run('git', args, { cwd: root, timeout: GIT_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}

/**
 * A function resolving to `{repo, project, branch, sha, dirty, addon}`, computed
 * on demand from git and shared for `ttlMs` (concurrent callers share one run).
 * Never rejects: a git failure just leaves the field empty.
 */
export function createContextReader(settings, { git: gitRun = gitContext, ttlMs = CONTEXT_TTL_MS, now = Date.now } = {}) {
  let cached = null;
  const attempt = async (args) => {
    try {
      return await gitRun(settings.root, args);
    } catch {
      return null;
    }
  };

  async function compute() {
    const [remote, branch, sha, status] = await Promise.all([
      attempt(['remote', 'get-url', 'origin']),
      attempt(['rev-parse', '--abbrev-ref', 'HEAD']),
      attempt(['rev-parse', 'HEAD']),
      attempt(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', settings.catalogDir]),
    ]);
    const branchName = branch?.trim() ?? '';
    const head = sha?.trim() ?? '';
    return {
      repo: parseGitHubRemote(remote),
      project: settings.project,
      branch: branchName && branchName !== 'HEAD' ? branchName : null,
      sha: /^[0-9a-f]{40}$/.test(head) ? head : null,
      dirty: parsePorcelainZ(status),
      addon: ADDON_VERSION,
    };
  }

  return () => {
    if (!cached || now() - cached.at >= ttlMs) cached = { at: now(), promise: compute() };
    return cached.promise;
  };
}

/**
 * A GET for the context must be same-origin and on a loopback host: browsers send
 * `Sec-Fetch-Site: same-origin` (and no Origin) for a same-origin fetch, and any
 * cross-site page or DNS-rebound host is turned away.
 */
export function contextRequestAllowed(req, scheme) {
  const { host, origin } = req.headers;
  if (!loopbackHost(host)) return false;
  if (origin !== undefined && origin !== `${scheme}://${host}`) return false;
  const site = req.headers['sec-fetch-site'];
  return site === undefined || site === 'same-origin';
}

async function handleContext(req, res, server, readContext) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method_not_allowed' });
  const scheme = server.config.server.https ? 'https' : 'http';
  if (!contextRequestAllowed(req, scheme)) return send(res, 403, { error: 'forbidden_origin' });
  return send(res, 200, await readContext());
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
      probe = await fetchImpl(`${settings.url}/api/repos/${settings.project}/scan-config`, { headers: authorization });
    } catch {
      return fail(`cannot reach Dialecto at ${settings.url} — is it running?`);
    }
    if (probe.status === 401 || probe.status === 403) {
      return fail(`scan token rejected for project ${settings.project} — check DIALECTO_SCAN_TOKEN and DIALECTO_PROJECT`);
    }
    if (!probe.ok) return fail(`Dialecto answered ${probe.status} for project ${settings.project}`);

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

    const response = await fetchImpl(`${settings.url}/api/repos/${settings.project}/scans`, {
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
  return {
    name: 'dialecto',
    hooks: {
      'astro:config:setup': async ({ command, config, injectScript, updateConfig, logger }) => {
        const root = fileURLToPath(config.root);
        const settings = resolveSettings(await loadEnv('development', root), options, root);

        if (command !== 'dev') {
          logger.debug('in-context editing is off (it only runs in astro dev)');
          return;
        }
        if (!settings.enabled) {
          logger.debug('in-context editing is off (enabled: false or DIALECTO_IN_CONTEXT=off)');
          return;
        }
        if (!settings.urlValid) {
          logger.warn(`in-context editing stays off: "${settings.url}" is not an http(s) URL (check the url option or DIALECTO_URL)`);
          return;
        }
        if (settings.projectFromAlias) logger.info('DIALECTO_REPO is deprecated; rename it to DIALECTO_PROJECT');

        updateConfig({ vite: { plugins: [catalogPlugin(settings), formatterPlugin()] } });
        const loader = [
          '(function(){',
          "var s=document.createElement('script');",
          `s.src=${JSON.stringify(`${settings.url}/assets/in-context/overlay.js`)};`,
          's.async=false;',
          `s.dataset.url=${JSON.stringify(settings.url)};`,
          `s.dataset.context=${JSON.stringify(CONTEXT_PATH)};`,
          `s.dataset.overrides=${JSON.stringify(OVERRIDES_PATH)};`,
          ...(settings.project ? [`s.dataset.project=${JSON.stringify(settings.project)};`] : []),
          'document.head.appendChild(s);',
          '})();',
        ].join('');
        injectScript('head-inline', loader);
        // Loads the recording formatter on every page, so the overlay can render exact previews.
        injectScript('page', "import 'intl-messageformat';");
        logger.info(`in-context editing on → ${settings.url}${settings.project ? ` (project ${settings.project})` : ''}`);
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
  if (!settings.urlValid) {
    console.error(`[dialecto] DIALECTO_URL must be an http(s) URL, got "${settings.url}"`);
    return 1;
  }
  if (!settings.project || !/^\d+$/.test(settings.project)) {
    console.error("[dialecto] set DIALECTO_PROJECT to the project's number from its Dialecto URL, /repos/<number>");
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
