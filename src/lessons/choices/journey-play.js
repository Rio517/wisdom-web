import { ICONS } from './journey-icons.js';
import {
  ACTIVITIES, DAYS, MAX_ENERGY, SKILL_GROUPS, TRANSFERS,
  replayChoices, summarize, transferLevels,
} from './journey-game.js';
import { skillBoxMarkup, setSkillBox } from './journey-skills.js';
import { prefersReducedMotion } from './journey-motion.js';
import { t } from '../../i18n/runtime.js';

const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const ADVANCE_DELAY = 650;

/** "Afternoon 3 of 10 · Wednesday" — pure, so a reader-facing label is easy to check without a DOM. */
export function dayLabel(index) {
  const day = DAYS[index];
  return t('play.dayLabel', { n: index + 1, total: DAYS.length, weekday: day.label });
}

/** The small kind caption under an activity button: "Soccer" / "Cello" / "Rest & fun". */
export function activityKind(activity) {
  return activity.rest ? t('play.kindRest') : t(`game.group.${activity.group}`);
}

/** The sentence(s) describing what a day's choice built, cost or rested. */
export function resultMessage(result) {
  if (result.rest) return t('play.result.rest');
  const parts = [];
  // Whole sentences per activity and per boost pair, so every language can
  // keep its own grammar (German capitals, gendered possessives).
  const grown = Object.entries(result.gains).filter(([, gain]) => gain > 0).map(([id]) => id);
  const all = Object.keys(ACTIVITIES[result.activity]?.gains ?? {});
  if (grown.length === all.length && grown.length) parts.push(t(`play.result.grew.${result.activity}`));
  else if (grown.length) parts.push(t('play.result.grewSome', { skills: new Intl.ListFormat(t.locale, { type: 'conjunction' }).format(grown.map(id => t(`game.skill.${id}`))) }));
  if (result.boosts.length) {
    const boost = result.boosts.find(item => item.from !== item.skill) ?? result.boosts[0];
    parts.push(boost.from === boost.skill ? t('play.result.selfBoost') : t(`play.result.boost.${boost.skill}`));
  }
  if (result.tired) parts.push(t('play.result.tired'));
  return parts.join(' ');
}

/** The live-region sentence announced when a day's choice changes. */
export function announceText(index, entry) {
  const day = DAYS[index];
  const activity = ACTIVITIES[entry.activity];
  return t('play.announce', { weekday: day.label, activity: activity.label, result: resultMessage(entry) });
}

/** The first not-yet-chosen day in a choices array (or its length, if every day is chosen). */
export function frontierIndex(choiceIds) {
  const index = choiceIds.findIndex(id => id == null);
  return index === -1 ? choiceIds.length : index;
}

function pulse(el) {
  if (!el) return;
  el.classList.remove('play-pop');
  // eslint-disable-next-line no-void
  void el.offsetWidth;
  el.classList.add('play-pop');
}

function activityMarkup(activityId, dayIndex) {
  const activity = ACTIVITIES[activityId];
  return `<li><button type="button" class="play-activity" data-day="${dayIndex}" data-activity="${activityId}" aria-pressed="false">
    <span class="play-activity-icon">${ICONS[activity.icon]}</span>
    <span class="play-activity-label">${escapeHTML(activity.label)}</span>
    <span class="play-activity-kind">${escapeHTML(activityKind(activity))}</span>
  </button></li>`;
}

function dayCardMarkup(day, index) {
  return `<li class="play-card" data-day="${index}" aria-labelledby="play-heading-${index}">
    <p class="play-day-label" id="play-label-${index}">${escapeHTML(dayLabel(index))}${day.chance ? `<span class="chance-tag">${escapeHTML(day.chance)}</span>` : ''}</p>
    <h2 class="play-heading" id="play-heading-${index}">${escapeHTML(day.situation)}</h2>
    <ul class="play-options" aria-labelledby="play-heading-${index}">${day.options.map(id => activityMarkup(id, index)).join('')}</ul>
    <div class="play-result" data-role="result"></div>
  </li>`;
}

function railTileMarkup(index) {
  return `<li class="play-rail-item"><button type="button" class="play-rail-tile" data-day="${index}" disabled>
    <span class="play-rail-icon" aria-hidden="true"></span><span class="play-rail-num" aria-hidden="true">${index + 1}</span>
  </button></li>`;
}

export function createPlayScene(root) {
  let choices = Array(DAYS.length).fill(null);
  let state = replayChoices(choices);
  let currentIndex = 0;
  let activeKey = 0;
  let ghost = null;
  let panel = null;
  let built = false;
  let advanceTimer = null;
  let suppressFocusActivate = false;
  let rafPending = false;
  let feed = null;
  let rail = null;
  let live = null;

  function cardElement(key) {
    if (key === 'intro') return feed.querySelector('.play-intro');
    if (key === 'end') return feed.querySelector('.play-end');
    return feed.querySelector(`.play-card[data-day="${key}"]`);
  }

  function applyActiveClasses() {
    feed.querySelectorAll('.play-card').forEach(li => {
      const dayAttr = li.dataset.day;
      const isFuture = dayAttr !== undefined && Number(dayAttr) > currentIndex;
      const key = dayAttr !== undefined ? Number(dayAttr) : li.dataset.role;
      const isActive = !isFuture && key === activeKey;
      li.classList.toggle('is-active', isActive);
      li.classList.toggle('is-inactive', !isActive);
    });
  }

  function scrollToCard(key, { smooth = true } = {}) {
    const li = cardElement(key);
    if (!li) return;
    const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
    li.scrollIntoView({ behavior, block: 'center' });
  }

  function setActive(key, { scroll = true, smooth = true } = {}) {
    activeKey = key;
    applyActiveClasses();
    if (scroll) scrollToCard(key, { smooth });
  }

  function syncActiveFromScroll() {
    const feedRect = feed.getBoundingClientRect();
    const centerY = feedRect.top + feedRect.height / 2;
    let bestKey = null;
    let bestDist = Infinity;
    feed.querySelectorAll('.play-card').forEach(li => {
      const rect = li.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - centerY);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = li.dataset.day !== undefined ? Number(li.dataset.day) : li.dataset.role;
      }
    });
    if (bestKey !== null && bestKey !== activeKey) setActive(bestKey, { scroll: false });
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; syncActiveFromScroll(); });
  }

  function updateCard(index) {
    const li = feed.querySelector(`.play-card[data-day="${index}"]`);
    const activityId = choices[index];
    const entry = activityId != null ? state.history[index] : null;
    const isFuture = index > currentIndex;
    li.classList.toggle('is-chosen', activityId != null);
    li.classList.toggle('is-current', index === currentIndex);
    li.classList.toggle('is-future', isFuture);
    li.querySelectorAll('.play-activity').forEach(button => {
      const chosenHere = button.dataset.activity === activityId;
      button.setAttribute('aria-pressed', String(chosenHere));
      button.classList.toggle('is-chosen', chosenHere);
      button.disabled = isFuture;
    });
    li.querySelector('[data-role="result"]').innerHTML = entry ? `<p>${escapeHTML(resultMessage(entry))}</p>` : '';
  }

  function updateRailTile(index) {
    const button = rail.querySelector(`.play-rail-tile[data-day="${index}"]`);
    const day = DAYS[index];
    const activityId = choices[index];
    const activity = activityId ? ACTIVITIES[activityId] : null;
    const isFuture = index > currentIndex;
    const isCurrent = index === currentIndex;
    const changed = button.dataset.activity !== (activityId ?? '');
    button.dataset.activity = activityId ?? '';
    button.dataset.chosen = String(Boolean(activity));
    button.dataset.state = isFuture ? 'future' : isCurrent ? 'current' : 'done';
    button.disabled = isFuture;
    const status = activity ? activity.label : isCurrent ? t('play.rail.today') : t('play.rail.notYet');
    const label = t(index >= 5 ? 'play.rail.labelWeek2' : 'play.rail.label', { weekday: day.label, status });
    button.setAttribute('aria-label', label);
    const icon = button.querySelector('.play-rail-icon');
    icon.innerHTML = activity ? ICONS[activity.icon] : '';
    if (changed && activity) pulse(icon);
  }

  function updateEndCard() {
    const li = feed.querySelector('.play-end');
    const body = li.querySelector('[data-role="end-body"]');
    const complete = currentIndex >= DAYS.length;
    li.classList.toggle('is-complete', complete);
    li.classList.toggle('is-future', !complete);
    if (!complete) {
      body.innerHTML = `<p class="play-end-placeholder">${escapeHTML(t('play.end.placeholder'))}</p>`;
      return;
    }
    const summary = summarize(state);
    body.innerHTML = `<ul class="play-summary-list">${summary.lines.map(line => `<li>${escapeHTML(line)}</li>`).join('')}</ul>
      <h3 class="play-end-subheading">${escapeHTML(t('play.end.carries'))}</h3>
      <p>${escapeHTML(t('play.end.carriesText'))}</p>
      <div class="play-transfer-grid">
        <div>${skillBoxMarkup({ id: 'play-transfer-basketball', group: 'basketball', title: t('game.group.basketball'), skills: TRANSFERS.basketball.skills })}
          <p class="carry-note">${TRANSFERS.basketball.skills.map(skill => escapeHTML(skill.note)).join(' ')}</p></div>
        <div>${skillBoxMarkup({ id: 'play-transfer-guitar', group: 'guitar', title: t('game.group.guitar'), skills: TRANSFERS.guitar.skills })}
          <p class="carry-note">${TRANSFERS.guitar.skills.map(skill => escapeHTML(skill.note)).join(' ')}</p></div>
      </div>
      <div class="play-end-actions"><button type="button" class="solid-pill" data-action="play-again">${escapeHTML(t('play.end.again'))}</button></div>
      <p class="illustration-note">${escapeHTML(t('play.end.note'))}</p>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const id of ['basketball', 'guitar']) {
        const levels = transferLevels(state.levels, id);
        const box = body.querySelector(`#play-transfer-${id}`);
        if (box) setSkillBox(box, levels, { carried: levels });
      }
    }));
  }

  function updateAllCards() {
    for (let index = 0; index < DAYS.length; index += 1) { updateCard(index); updateRailTile(index); }
    updateEndCard();
    applyActiveClasses();
  }

  function renderPanel(flash = null) {
    if (!panel) return;
    if (!panel.querySelector('.skills-panel')) {
      panel.innerHTML = `<div class="skills-panel">
        ${skillBoxMarkup({ id: 'play-soccer', group: 'soccer', title: t('game.group.soccer'), skills: SKILL_GROUPS.soccer.skills, owner: t('play.you') })}
        ${skillBoxMarkup({ id: 'play-cello', group: 'cello', title: t('game.group.cello'), skills: SKILL_GROUPS.cello.skills, owner: t('play.you') })}
        <div class="energy"><div><strong>${escapeHTML(t('play.energy'))}</strong><small id="energy-word"></small></div>
          <div class="energy-leaves" role="meter" aria-label="${escapeHTML(t('play.energy'))}" aria-valuemin="0" aria-valuemax="${MAX_ENERGY}" id="energy-meter">${Array.from({ length: MAX_ENERGY }, () => ICONS.leaf).join('')}</div></div>
        <p class="illustration-note">${escapeHTML(t('play.noScores'))}</p>
      </div>`;
    }
    const soccer = panel.querySelector('#play-soccer');
    const cello = panel.querySelector('#play-cello');
    setSkillBox(soccer, state.levels, { ghost });
    setSkillBox(cello, state.levels, { ghost });
    const boosts = flash?.boosts?.filter(item => item.from !== item.skill).map(item => item.skill).join(' ') ?? '';
    soccer.dataset.boosts = boosts;
    cello.dataset.boosts = boosts;
    panel.querySelectorAll('.gain-chip').forEach(chip => chip.remove());
    if (flash) {
      for (const [id, gain] of Object.entries(flash.gains)) {
        if (gain <= 0) continue;
        const row = panel.querySelector(`.skill-row[data-skill="${id}"]`);
        const chip = document.createElement('span');
        chip.className = 'gain-chip';
        chip.textContent = flash.boosts.some(item => item.skill === id && item.from !== id) ? t('play.chip.boost') : t('play.chip.grew');
        row?.append(chip);
      }
    }
    const leaves = [...panel.querySelectorAll('.energy-leaves svg')];
    leaves.forEach((leaf, index) => leaf.setAttribute('data-on', String(index < state.energy)));
    const meter = panel.querySelector('#energy-meter');
    meter.setAttribute('aria-valuenow', String(state.energy));
    const word = t(state.energy === 0 ? 'play.energy.empty' : state.energy === MAX_ENERGY ? 'play.energy.full' : 'play.energy.okay');
    meter.setAttribute('aria-valuetext', word);
    panel.querySelector('#energy-word').textContent = word;
    panel.querySelector('.illustration-note').textContent = ghost ? t('play.noScoresGhost') : t('play.noScores');
  }

  function chooseActivity(index, activityId) {
    if (index > currentIndex) return;
    const wasChosen = choices[index] != null;
    choices = choices.map((id, position) => (position === index ? activityId : id));
    state = replayChoices(choices);
    currentIndex = frontierIndex(choices);
    updateAllCards();
    const entry = state.history[index];
    renderPanel(entry);
    if (live) live.textContent = announceText(index, entry);
    pulse(feed.querySelector(`.play-card[data-day="${index}"] .play-activity[data-activity="${activityId}"] .play-activity-icon`));
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    if (!wasChosen) {
      const nextKey = currentIndex >= DAYS.length ? 'end' : currentIndex;
      advanceTimer = setTimeout(() => { advanceTimer = null; setActive(nextKey, { scroll: true, smooth: true }); }, ADVANCE_DELAY);
    }
  }

  function onFocusIn(event) {
    const li = event.target.closest('.play-card[data-day]');
    if (!li) return;
    if (suppressFocusActivate) { suppressFocusActivate = false; return; }
    const index = Number(li.dataset.day);
    if (index > currentIndex || index === activeKey) return;
    setActive(index, { scroll: true, smooth: true });
  }

  function onFeedClick(event) {
    suppressFocusActivate = false;
    if (event.target.closest('[data-action="play-again"]')) { playAgain(); return; }
    const li = event.target.closest('.play-card[data-day]');
    if (!li) return;
    const index = Number(li.dataset.day);
    if (index > currentIndex) return;
    const button = event.target.closest('.play-activity');
    // Today's card answers straight away; an earlier day wakes up on the first tap.
    if (index === currentIndex && button && !button.disabled) {
      if (index !== activeKey) setActive(index, { scroll: false });
      chooseActivity(index, button.dataset.activity);
      return;
    }
    if (index !== activeKey) {
      event.preventDefault();
      setActive(index, { scroll: true, smooth: true });
      return;
    }
    if (button && !button.disabled) chooseActivity(index, button.dataset.activity);
  }

  function onRailClick(event) {
    const button = event.target.closest('.play-rail-tile');
    if (!button || button.disabled) return;
    setActive(Number(button.dataset.day), { scroll: true, smooth: true });
  }

  function playAgain() {
    if (!built) build();
    if (choices.some(id => id != null)) ghost = { ...state.levels };
    choices = Array(DAYS.length).fill(null);
    state = replayChoices(choices);
    currentIndex = 0;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    updateAllCards();
    renderPanel();
    setActive(0, { scroll: true, smooth: true });
  }

  function build() {
    root.innerHTML = `<ol class="play-feed" aria-label="${escapeHTML(t('play.feedLabel'))}">
      <li class="play-card play-intro" data-role="intro" aria-labelledby="play-intro-heading">
        <h2 id="play-intro-heading">${escapeHTML(t('play.intro.heading'))}</h2>
        <p>${escapeHTML(t('play.intro.text'))}</p>
      </li>
      ${DAYS.map((day, index) => dayCardMarkup(day, index)).join('')}
      <li class="play-card play-end" data-role="end" aria-labelledby="play-end-heading">
        <h2 id="play-end-heading">${escapeHTML(t('play.end.heading'))}</h2>
        <div data-role="end-body"></div>
      </li>
    </ol>
    <ol class="play-rail" aria-label="${escapeHTML(t('play.railLabel'))}">${DAYS.map((_, index) => railTileMarkup(index)).join('')}</ol>
    <p class="sr-only" role="status" aria-live="polite" data-role="live"></p>`;
    feed = root.querySelector('.play-feed');
    rail = root.querySelector('.play-rail');
    live = root.querySelector('[data-role="live"]');
    const resizeObserver = new ResizeObserver(() => {
      const pad = Math.max(80, Math.round(feed.clientHeight / 2) - 30);
      feed.style.setProperty('--play-pad', `${pad}px`);
    });
    resizeObserver.observe(feed);
    feed.addEventListener('scroll', onScroll, { passive: true });
    feed.addEventListener('pointerdown', () => { suppressFocusActivate = true; }, true);
    feed.addEventListener('focusin', onFocusIn);
    feed.addEventListener('click', onFeedClick);
    rail.addEventListener('click', onRailClick);
    built = true;
  }

  function show() {
    if (!built) build();
    updateAllCards();
    renderPanel();
    setActive(currentIndex >= DAYS.length ? 'end' : currentIndex, { scroll: true, smooth: false });
  }

  function hide() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
  }

  return {
    show,
    mountPanel(container) { panel = container; panel.innerHTML = ''; renderPanel(); },
    hide,
    restart: playAgain,
  };
}
