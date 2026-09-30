import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { IntlMessageFormat } from 'intl-messageformat';
import { CATALOGS, getTranslator } from '../src/i18n/index.js';
import { LOCALES, DEFAULT_LOCALE, localizePath, stripLocale, localeFromPath } from '../src/i18n/config.js';

const en = CATALOGS[DEFAULT_LOCALE];
const TRANSLATED = LOCALES.filter(locale => locale !== DEFAULT_LOCALE);

// ICU argument names and plural/select branches, so a translation can't drop or rename one.
function shape(message, locale) {
  const args = new Set();
  const branches = [];
  const walk = nodes => {
    for (const node of nodes) {
      if (node.type >= 1 && node.type <= 6) args.add(node.value);
      if (node.options) {
        branches.push({ arg: node.value, keys: Object.keys(node.options) });
        for (const option of Object.values(node.options)) walk(option.value);
      }
      if (node.children) walk(node.children);
    }
  };
  walk(new IntlMessageFormat(message, locale).getAst());
  return { args: [...args].sort(), branches };
}

const sampleValues = args => Object.fromEntries(args.map(name => [name, 2]));

test('the English catalog parses and formats', () => {
  for (const [key, message] of Object.entries(en)) {
    const { args } = shape(message, 'en');
    assert.doesNotThrow(() => new IntlMessageFormat(message, 'en').format(sampleValues(args)), key);
  }
});

for (const locale of TRANSLATED) {
  test(`${locale} catalog has exactly the English keys`, () => {
    const catalog = CATALOGS[locale];
    const missing = Object.keys(en).filter(key => !(key in catalog));
    const extra = Object.keys(catalog).filter(key => !(key in en));
    assert.deepEqual(missing, [], `${locale} is missing keys`);
    assert.deepEqual(extra, [], `${locale} has keys English doesn't`);
  });

  test(`${locale} messages keep every ICU argument and plural fallback`, () => {
    for (const [key, message] of Object.entries(CATALOGS[locale])) {
      if (!(key in en)) continue;
      const source = shape(en[key], 'en');
      const target = shape(message, locale);
      assert.deepEqual(target.args, source.args, `${locale} ${key} arguments`);
      for (const branch of target.branches) assert.ok(branch.keys.includes('other'), `${locale} ${key} needs an "other" branch`);
      assert.doesNotThrow(() => new IntlMessageFormat(message, locale).format(sampleValues(target.args)), `${locale} ${key}`);
    }
  });

  test(`${locale} catalog is actually translated`, () => {
    const same = Object.keys(en).filter(key => CATALOGS[locale][key] === en[key] && /[a-z]{4}/i.test(en[key]));
    assert.ok(same.length / Object.keys(en).length < 0.06, `${locale} leaves ${same.length} messages in English: ${same.slice(0, 12).join(', ')}`);
  });
}

test('every Markdown page exists in every language', () => {
  const root = new URL('../src/content/pages/', import.meta.url).pathname;
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name.endsWith('.md') ? [join(dir, entry.name)] : []);
  const english = walk(join(root, DEFAULT_LOCALE)).map(file => relative(join(root, DEFAULT_LOCALE), file));
  assert.ok(english.length >= 2);
  for (const locale of TRANSLATED) {
    for (const page of english) assert.ok(existsSync(join(root, locale, page)), `${locale}/${page} is missing`);
  }
});

test('locale paths round-trip', () => {
  assert.equal(localizePath('/choices/', 'de'), '/de/choices/');
  assert.equal(localizePath('/de/choices/', 'en'), '/choices/');
  assert.equal(localizePath('/es/', 'fr'), '/fr/');
  assert.equal(stripLocale('/fr'), '/');
  assert.equal(stripLocale('/essays/'), '/essays/');
  assert.equal(localeFromPath('/es/choices/'), 'es');
  assert.equal(localeFromPath('/choices/'), 'en');
});

test('translators fall back to English and format plurals', () => {
  const t = getTranslator('en');
  assert.equal(t('game.summary.rest', { count: 1 }), 'You rested or played once. Fun and rest matter too.');
  assert.equal(t('no.such.key'), 'no.such.key');
  const unknown = getTranslator('xx');
  assert.equal(unknown.locale, 'en');
});
