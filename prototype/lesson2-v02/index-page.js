// The round's front page: the three directions and last round's D.
import { t } from '../../src/i18n/runtime.js';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const HREF = { e: './e.html', f: './f.html', g: './g.html', d: './d/d.html' };

export function start(app) {
  const de = new URLSearchParams(location.search).get('lang') === 'de';
  const keep = de ? '?lang=de' : '';
  document.body.classList.add('v2-index-page');
  app.innerHTML = `<header class="v2-top">
      <a class="v2-brand" href="./index.html${keep}">${esc(t('v2.brand'))}<span>${esc(t('v2.brandSub'))}</span></a>
      <p class="v2-study"><strong>${esc(t('v2.study'))}</strong></p>
      <nav class="v2-dirs" aria-label="${esc(t('v2.dirNav'))}">
        <a class="v2-lang" href="${de ? location.pathname : `${location.pathname}?lang=de`}" lang="${de ? 'en' : 'de'}" title="${esc(t('v2.langLabel'))}">${esc(t(de ? 'v2.langBack' : 'v2.lang'))}</a>
      </nav>
    </header>
    <main class="v2-index">
      <h1>${esc(t('v2.index.heading'))}</h1>
      <p class="v2-index-lede">${esc(t('v2.index.lede'))}</p>
      <ul class="v2-index-list">${['e', 'f', 'g', 'd'].map(letter => `<li data-letter="${letter}">
        <span class="v2-index-letter" aria-hidden="true">${letter.toUpperCase()}</span>
        <div class="v2-index-text"><h2>${esc(t(`v2.dir.${letter}`))}</h2><p>${esc(t(`v2.index.${letter}`))}</p></div>
        <a class="btn ${letter === 'd' ? 'btn-quiet' : 'btn-primary'}" href="${HREF[letter]}${keep}">${esc(t('v2.index.play', { letter: letter.toUpperCase() }))}</a>
      </li>`).join('')}</ul>
    </main>`;
}
