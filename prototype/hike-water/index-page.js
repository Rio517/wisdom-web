// The round's front page: the question and a link to each version.
import { t } from '../../src/i18n/runtime.js';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function start(app) {
  document.title = `${t('hikeWater.title')} · ${t('site.name')}`;
  app.innerHTML = `<main class="hw-index">
    <p class="kicker">${esc(t('lesson.chapter.hike.kicker'))}</p>
    <h1>${esc(t('hikeWater.title'))}</h1>
    <p class="hw-lede">${esc(t('hikeWater.lede'))}</p>
    <ul class="hw-list">${['a', 'b', 'c'].map(id => `<li><a href="./${id}.html">${esc(t(`hikeWater.${id}.name`))}</a><p>${esc(t(`hikeWater.${id}.about`))}</p></li>`).join('')}</ul>
  </main>`;
}
