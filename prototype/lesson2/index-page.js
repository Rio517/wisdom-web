// The round's front page: what each direction is, in a line or two.
import { t, esc } from './ui.js';

const LETTERS = ['a', 'b', 'c'];

export function start(app) {
  const de = new URLSearchParams(location.search).get('lang') === 'de';
  const keep = de ? '?lang=de' : '';
  app.innerHTML = `<main class="l2-index">
      <p class="kicker">${esc(t('l2.index.kicker'))}</p>
      <h1>${esc(t('l2.index.heading'))}</h1>
      <p class="l2-index-text">${esc(t('l2.index.text'))}</p>
      <ol>${LETTERS.map(letter => `<li><a href="./${letter}.html${keep}">${esc(t('l2.dir.letter', { letter: letter.toUpperCase() }))} · ${esc(t(`l2.dir.${letter}`))}</a>
        <p>${esc(t(`l2.index.${letter}`))}</p></li>`).join('')}</ol>
      <p><a class="l2-index-lang" href="${de ? location.pathname : `${location.pathname}?lang=de`}" lang="${de ? 'en' : 'de'}">${de ? 'English' : 'Deutsch'}</a></p>
    </main>`;
}
