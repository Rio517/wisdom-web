# 014 — Languages and localization

Status: Implemented locally. English is published; Spanish, German and French are unreviewed draft translations. Created: 2026-09-30. Updated: 2026-09-30.

The site is written in English and translated into Spanish, German and French. This document is the reference for how languages work in the code, how to change words, how to add or review a translation, and what a translation tool needs to support. It extends [002 — Delivery architecture](002-delivery-architecture.md).

The implementation follows the usual conventions of the Astro and JavaScript ecosystem rather than a project-specific format: Astro's i18n routing, flat JSON message catalogs, ICU MessageFormat, the standard `Intl` APIs and Astro content collections for long-form Markdown.

## Routes

| Language | Home | Lesson 1 |
| --- | --- | --- |
| English (source) | `/` | `/choices/the-paths-we-make/` |
| Spanish | `/es/` | `/es/choices/the-paths-we-make/` |
| German | `/de/` | `/de/choices/the-paths-we-make/` |
| French | `/fr/` | `/fr/choices/the-paths-we-make/` |

Every page is written once under `src/pages/[...locale]/` and built for each language by `localeStaticPaths()`. Scene fragments (`#paths-many`, `#hike-plan`) are the same in every language. `astro.config.mjs` declares the languages with `i18n: { locales, defaultLocale: 'en', routing: { prefixDefaultLocale: false } }`. GitHub Pages serves one `404.html`; it renders in English and switches its words on the client when the missing address sits under a language prefix.

Each page sets `<html lang>`, and an English Markdown page shown in place of a missing translation is marked `lang="en"`.

## Publishing a translation

`LOCALE_STATUS` in `src/i18n/config.js` marks each language `published` or `draft`.

- **Draft** pages are built and reachable by their URL for review. They carry `noindex`, English pages don't link to them, and they are left out of `hreflang` alternates. On a draft page the language switcher offers every language so a reviewer can compare.
- **Published** pages appear in the language switcher (sidebar and footer) and in `hreflang` alternates. The switcher is hidden while only one language is published.

A language moves to `published` only after a fluent reader has reviewed its catalog and Markdown pages. The current drafts were written by an AI model on 2026-09-30 from the English source, following the rules below. They have not been reviewed by a native speaker.

## Where words live

| What | Where | Format |
| --- | --- | --- |
| Interface and lesson text | `src/i18n/messages/<locale>.json` | Flat JSON, semantic keys, ICU MessageFormat values |
| Long-form pages (About, Notes for grown-ups) | `src/content/pages/<locale>/…` | Markdown with `title`, `description`, `kicker` frontmatter |
| Language list, prefixes and status | `src/i18n/config.js` | JavaScript |

English (`en.json`) is the source catalog, and every other catalog has exactly the same keys. The readable [lesson copy](../content/choices-journey.md) is generated from `en.json` with `npm run copy:lesson`. `node tooling/lesson-copy.mjs de` prints the same document in German (or `es`, `fr`) for review.

Code never contains user-facing prose. Structure (chapter order, beat IDs, which option is the story's choice, activity numbers, icons) stays in the lesson modules; the words are looked up by key.

### Keys

Keys are stable, dotted and named after what the text is, not where it first appeared:

| Prefix | Holds |
| --- | --- |
| `site.*`, `nav.*`, `footer.*`, `common.*` | Site name, tagline, roadmap, navigation and footer |
| `home.*`, `overview.*`, `read.*`, `lessonPage.*`, `notFound.*` | Page-specific text |
| `lesson.chapter.<id>` (`.short`, `.kicker`) | Chapter names |
| `lesson.beat.<id>.*` | A step's `heading`, `body1…`, `alt` (picture description), `prompt`, `option.<id>` and `option.<id>.feedback`, `closer.*` |
| `lesson.sort.*`, `lesson.takeaway.*`, `lesson.learned.*`, `lesson.ui.*` | Lesson cards, takeaways, backpack items, lesson controls |
| `map.*`, `hike.*`, `skills.*`, `play.*`, `sort.*`, `explore.*`, `game.*` | Text inside each interactive scene |
| `reading.*` | Labels used only by the text version |

Renaming a key is a change to every catalog; prefer adding a key and removing the old one in the same change.

### Message rules

- Values use ICU MessageFormat, formatted by `intl-messageformat`. Arguments are named: `"Today · {age}"`, `"{count, plural, one {# afternoon} other {# afternoons}}"`. Every plural and select keeps an `other` branch.
- Each message is a whole sentence or label. Code doesn't join fragments into sentences, so each language can order words and agree genders and cases on its own. Where the code must list items, it uses `Intl.ListFormat` in the page's language.
- Messages contain no HTML. Templates own markup; text is inserted as text.
- Use the typographic apostrophe `’`. An ASCII `'` can start ICU quoting.
- Tone: warm, direct, readable from age eight; informal address (tú, du, tu). Keep the lesson's modesty: no guarantees, probabilities or predictions.
- Fictional names (Alfredo, Maya) and the brand name *Wisdom* are not translated.
- Short labels have tight layouts: chapter names, buttons, activity and skill names, weekdays, level words, life-map and explorer choice chips, sort cards, status pills and navigation. Keep them within about 20% of the English length. `game.level.*` words stand alone beside a bar, so they must not need to agree with a noun.

## Runtime

- **Build time.** Astro pages call `getTranslator(locale)` from `src/i18n/index.js`, which loads all catalogs and falls back to English for a missing key.
- **Browser.** Scene scripts import `t` from `src/i18n/runtime.js`. The page embeds its own language's messages in `<script type="application/json" id="i18n-messages">`, so each visitor downloads one language. The lesson page embeds the full catalog (about 52 KB of English, uncompressed); the home page embeds only the `map.*` keys its hero animation needs.
- **Fallback.** A missing key falls back to English, then to the key itself, which the tests treat as a failure.

## Checks

`npm test` includes `tests/i18n.test.js`. It checks that:

- every catalog has exactly the English keys;
- each translation keeps the English message's arguments, keeps `other` in every plural or select, and formats without error;
- fewer than 6% of a catalog's messages are left identical to English;
- every English Markdown page exists in every language.

`tests/journey-explore.test.js` also checks that every language keeps the explorer's example choices and the 20 life-map story sets distinct, so the randomly drawn labels stay unique on screen.

Layout still needs a visual check in each language after a copy change, especially German, at 1440×900, 1024×768 and 768×1024.

## Adding a language

1. Add its code to `LOCALES`, `LOCALE_NAMES`, `LOCALE_TAGS` and `LOCALE_STATUS` (as `draft`) in `src/i18n/config.js`.
2. Import its catalog in `src/i18n/index.js` and create `src/i18n/messages/<code>.json` with every key.
3. Translate `src/content/pages/en/**` into `src/content/pages/<code>/`.
4. Run `npm test`, then check the pages visually.
5. After a fluent review, set its status to `published`.

## Changing words

Edit `en.json` (or the lesson copy, then carry the change into `en.json`), update the same key in every other catalog, run `npm test` and `npm run copy:lesson`. A changed English message makes the old translations stale; until a translator has updated them, note the key in the review list below.

## Review status

| Language | Catalog | Markdown pages | Reviewed by a fluent reader |
| --- | --- | --- | --- |
| English | Source | Source | — |
| Spanish (neutral international) | Draft, 2026-09-30 | Draft | No |
| German | Draft, 2026-09-30 | Draft | No |
| French | Draft, 2026-09-30 | Draft | No |

Draft pages show a short notice ("This translation is a draft…") with a link to the English page, both on site pages and in the lesson's index drawer.

Open questions for review: whether to use regional variants (for example `es-419` and `es-ES`) and whether the brand name should stay *Wisdom* in every language.

### What a reviewer should check

Every language:
- The reader is addressed informally and without grammatical gender (the reader could be anyone). Named characters keep their gender: Alfredo is masculine, Maya feminine; the unnamed twelve-year-old on the life map is "a person" (*persona*, *Person*, *personne*).
- Short labels were shortened to fit the layout; some life-map and explorer chips were reworded freely. Read the chips for tone. `node tooling/lesson-copy.mjs <code>` prints the whole lesson for reading.
- Links to English-only material (the research library, the source code, cited papers) are marked "(in English)".

Spanish (neutral international):
- *Decisiones* for choices (never *elecciones*), *camino* for life paths, *sendero* for the hike's trail; *fútbol*, *violonchelo*, *baloncesto*, *computadora*.
- Skill levels are invariant words (*Empezando*, *Aprendiendo*, *Avanzando*, *Cada vez mejor*, *Fuerte*). "Care for a parent" became *Cuidar a un familiar*; "gifted programme" became *programa de talentos*.
- The takeaway "Learning builds on learning" is *Cada aprendizaje se apoya en el anterior*.

German:
- Lesson title *Die Wege, die wir gehen*; tagline *Ein Wegweiser fürs Leben*.
- School clubs are *-AG*; some occupations use the generic masculine (*Elektriker*, *Dolmetscher*). Decide whether to switch to paired or neutral forms.
- Life paths are *Weg*; the hike's trail is *Pfad*. Skill names: *Ballgefühl*, *Stellungsspiel*, *Spielsinn*, *Handdribbling*, *Notenlesen*, *Fingertechnik*.

French:
- Lesson title *Les chemins qu’on trace*; *foot*, *basket*, *violoncelle*; "Path A Maya" is *la Maya du Chemin A*.
- Typography (« », no-break spaces before : ; ! ?) was applied by script; check it in the interactive scenes.
- The adult notes also use *tu*; decide whether they should use *vous*.
