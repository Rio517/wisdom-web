// One version of the hike's water, on the hike map as the lesson shows it at
// the Halfway step: the map stage on the left, the reading panel on the right.
// `?beat=plan|turnback|practice|retry|closed|respond` shows another step's map.
import { t } from '../../src/i18n/runtime.js';
import { CHAPTERS } from '../../src/lessons/choices/journey-story.js';
import { createHikeScene } from './scene.js';
import { runWater } from './water-layer.js';
import { createFlatWater } from './water-flat.js';
import { fit, VIEW } from './geometry.js';

const VERSIONS = ['a', 'b', 'c'];
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function choiceMarkup(beat, picked) {
  const option = beat.choice.options.find(entry => entry.id === picked);
  return `<p class="choice-prompt" id="choice-prompt">${esc(beat.choice.prompt)}</p>
    <ul class="choice-list" aria-labelledby="choice-prompt">${beat.choice.options.map(entry => `<li>
      <button class="choice-button" type="button" data-choice="${entry.id}" aria-pressed="${entry.id === picked}"><span class="choice-mark" aria-hidden="true"></span>${esc(entry.label)}</button></li>`).join('')}</ul>
    <div aria-live="polite">${option ? `<p class="choice-feedback" data-tone="${option.story ? 'story' : 'other'}">${esc(option.feedback)}</p>` : ''}</div>`;
}

export async function start(app, version) {
  const params = new URLSearchParams(location.search);
  const chapter = CHAPTERS.find(entry => entry.id === 'hike');
  const wanted = params.get('beat');
  const beatIndex = Math.max(0, chapter.beats.findIndex(entry => entry.id === (wanted || 'halfway')));
  const beat = chapter.beats[beatIndex];
  document.title = `${t(`hikeWater.${version}.name`)} · ${t('hikeWater.title')} · ${t('site.name')}`;
  app.innerHTML = `
  <header class="journey-header">
    <div class="journey-home"><a class="journey-brand" href="./">${esc(t('site.name'))} <span>${esc(t('site.tagline'))}</span></a></div>
    <nav class="hw-versions" aria-label="${esc(t('hikeWater.versionsLabel'))}">${VERSIONS.map(id => `<a href="./${id}.html${esc(location.search)}"${id === version ? ' aria-current="page"' : ''}>${esc(t(`hikeWater.${id}.name`))}</a>`).join('')}</nav>
    <a class="quiet-link hw-all" href="./">${esc(t('hikeWater.all'))}</a>
  </header>
  <main class="journey" id="journey">
    <section class="stage" id="stage" aria-label="${esc(t('lesson.ui.illustration'))}">
      <div class="scene scene-hike" id="scene-hike" data-scene="hike"></div>
      <p class="sr-only">${esc(beat.alt)}</p>
    </section>
    <aside class="narration" id="narration" aria-labelledby="beat-heading">
      <div class="narration-body">
        <p class="beat-kicker">${esc(t('lesson.ui.kickerStep', { kicker: beat.kicker, step: beatIndex + 1, total: chapter.beats.length }))}</p>
        <h1 id="beat-heading">${esc(beat.heading)}</h1>
        <div class="beat-text">${beat.body.map(text => `<p>${esc(text)}</p>`).join('')}</div>
        <div class="beat-extra" id="beat-extra"></div>
        <p class="beat-note" id="hw-note" hidden>${esc(t('hikeWater.fallback'))}</p>
      </div>
    </aside>
  </main>`;

  const root = app.querySelector('#scene-hike');
  const stage = app.querySelector('#stage');
  const scene = createHikeScene(root);
  scene.show(beat.id, { animate: false });

  const extra = app.querySelector('#beat-extra');
  const renderChoice = picked => {
    if (!beat.choice) return;
    extra.innerHTML = choiceMarkup(beat, picked);
    extra.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
      scene.choose(beat.id, button.dataset.choice);
      renderChoice(button.dataset.choice);
      extra.querySelector(`[data-choice="${button.dataset.choice}"]`)?.focus();
    }));
  };
  renderChoice(null);

  // The water layer: A draws flat in Canvas 2D; B and C use Three.js and fall
  // back to A's still drawing when WebGL is missing or lost.
  let canvas = scene.water;
  let renderer = null;
  let fallback = null;
  let water = null;
  const useFallback = reason => {
    fallback = String(reason?.message ?? reason);
    water?.stop();
    renderer?.dispose();
    const fresh = document.createElement('canvas');
    fresh.className = canvas.className;
    fresh.setAttribute('aria-hidden', 'true');
    canvas.replaceWith(fresh);
    canvas = fresh;
    renderer = createFlatWater(canvas);
    water = runWater({ canvas, stage, renderer, still: true });
    app.querySelector('#hw-note').hidden = false;
    api.water = water;
  };
  const timings = {};
  const api = { version, scene, get fallback() { return fallback; }, water: null, alignment, timings };
  globalThis.hikeWater = api;

  if (version === 'a') {
    renderer = createFlatWater(canvas);
  } else {
    try {
      let mark = performance.now();
      const { createThreeWater } = await import('./water-three.js');
      timings.module = performance.now() - mark;
      mark = performance.now();
      renderer = createThreeWater(canvas, { onLost: () => useFallback('WebGL context lost') });
      timings.create = performance.now() - mark;
      mark = performance.now();
      await renderer.ready;
      timings.compileWait = performance.now() - mark;
    } catch (error) {
      useFallback(error);
    }
  }
  if (!fallback) {
    const mark = performance.now();
    water = runWater({ canvas, stage, renderer });
    timings.firstFrame = performance.now() - mark;
    canvas.dataset.ready = 'true';
    api.water = water;
  }

  // How far the water layer sits from the map's SVG layers, in CSS pixels, at a few landmarks.
  function alignment() {
    const svgs = [...root.querySelectorAll(':scope > svg')];
    const box = canvas.getBoundingClientRect();
    const { k, ox, oy } = fit(box.width, box.height);
    const marks = [[628, 505], [380, 280], [1084, 554], [1066, 248], [0, 0], [VIEW.width, VIEW.height]];
    let worst = 0;
    for (const svg of svgs) {
      const matrix = svg.getScreenCTM();
      for (const [x, y] of marks) {
        const point = new DOMPoint(x, y).matrixTransform(matrix);
        worst = Math.max(worst, Math.abs(point.x - (box.left + ox + x * k)), Math.abs(point.y - (box.top + oy + y * k)));
      }
    }
    return { worstPx: worst, canvas: { css: [box.width, box.height], buffer: [canvas.width, canvas.height] } };
  }
}
