import { ICONS, person } from './journey-icons.js';
import { SKILL_GROUPS, TRANSFERS, FOUNDATIONS, MAYA_PATTERNS, mayaSeasons, transferLevels, practiseSeason, levelWord } from './journey-game.js';
import { wait } from './journey-motion.js';

const GROUP_ICON = { soccer: 'soccerSmall', cello: 'celloSmall', basketball: 'basketball', guitar: 'guitar' };

/** Skill box markup shared by Maya’s lanes and the game. */
export function skillBoxMarkup({ id, group, title, skills, owner = '' }) {
  return `<section class="skill-box" id="${id}" data-group="${group}" aria-label="${owner ? `${owner}: ` : ''}${title} skills">
    <header><h3>${ICONS[GROUP_ICON[group]] ?? ''}<span class="box-title">${title}</span></h3><span class="box-note"></span></header>
    ${skills.map(skill => `<div class="skill-row" data-skill="${skill.id}">
      <span class="skill-name">${skill.label}</span>
      <div class="meter" data-group="${group}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${owner ? `${owner}, ` : ''}${skill.label}">
        <i class="carried" style="--level:0"></i><i class="fill" style="--level:0;--from:0"></i><i class="ghost" hidden></i>
      </div>
      <span class="skill-meta"><span class="skill-word">Just starting</span>
      <span class="boost-note">${FOUNDATIONS[skill.id] && FOUNDATIONS[skill.id] !== skill.id ? `↑ helped by ${labelFor(FOUNDATIONS[skill.id]).toLowerCase()}` : ''}</span></span>
    </div>`).join('')}
  </section>`;
}

function labelFor(skillId) {
  for (const group of Object.values(SKILL_GROUPS)) {
    const found = group.skills.find(skill => skill.id === skillId);
    if (found) return found.label;
  }
  return skillId;
}

/** Update a box's meters. `carried` is the part brought from another skill. */
export function setSkillBox(box, levels, { carried = {}, ghost = null } = {}) {
  for (const row of box.querySelectorAll('.skill-row')) {
    const id = row.dataset.skill;
    const level = levels[id] ?? 0;
    const carry = Math.min(level, carried[id] ?? 0);
    const meter = row.querySelector('.meter');
    meter.querySelector('.fill').style.setProperty('--level', String(level));
    meter.querySelector('.fill').style.setProperty('--from', String(carry));
    meter.querySelector('.carried').style.setProperty('--level', String(carry));
    const ghostEl = meter.querySelector('.ghost');
    if (ghost && ghost[id] !== undefined) { ghostEl.hidden = false; ghostEl.style.setProperty('--level', String(ghost[id])); }
    else ghostEl.hidden = true;
    meter.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    const word = levelWord(level);
    const headStart = carry > 0.08;
    meter.setAttribute('aria-valuetext', headStart ? `${word}, with a head start` : word);
    row.querySelector('.skill-word').textContent = headStart ? `${word} · head start` : word;
  }
}

const SEASON_LABELS = ['Start', 'Season 1', 'Season 2', 'Season 3', 'Basketball'];

export function createSkillsScene(root) {
  const soccer = SKILL_GROUPS.soccer.skills;
  const basketball = TRANSFERS.basketball.skills;
  const seasons = { a: mayaSeasons({ pattern: MAYA_PATTERNS.a }), b: mayaSeasons({ pattern: MAYA_PATTERNS.b }) };
  const transfer = { a: transferLevels(seasons.a.at(-1).levels, 'basketball'), b: transferLevels(seasons.b.at(-1).levels, 'basketball') };
  const late = { a: practiseSeason(transfer.a, MAYA_PATTERNS.a, 0.05), b: practiseSeason(transfer.b, MAYA_PATTERNS.a, 0.05) };

  const lane = key => `<article class="lane lane-${key}" aria-label="${key === 'a' ? 'Path A: Maya keeps practising' : 'Path B: Maya mostly skips'}">
      <div class="lane-who">${person({ shirt: key === 'a' ? '#285442' : '#5f8fa3', ball: true })}
        <strong>Path ${key.toUpperCase()}</strong><span>${key === 'a' ? 'Keeps practising' : 'Mostly skips'}</span></div>
      <div class="calendar">
        <p class="calendar-title">Weeks she practised</p>
        <div class="calendar-rows">${[1, 2, 3].map(season => `<div class="calendar-row" data-season="${season}"><small>Season ${season}</small>${MAYA_PATTERNS[key].map(() => '<span class="week"></span>').join('')}<span class="growth" data-level="0"></span></div>`).join('')}
          <div class="calendar-row basket-row" data-season="4" hidden><small>Basketball</small>${MAYA_PATTERNS.a.map(() => '<span class="week" data-kind="basket"></span>').join('')}<span class="growth" data-level="0"></span></div>
        </div>
      </div>
      <div class="lane-box" id="lane-box-${key}">${skillBoxMarkup({ id: `box-${key}`, group: 'soccer', title: 'Soccer', skills: soccer, owner: `Path ${key.toUpperCase()} Maya` })}</div>
    </article>`;

  root.innerHTML = `<div class="season-bar">
      <label id="season-label">Time</label>
      <div class="season-steps" role="group" aria-labelledby="season-label"><span class="season-fill"></span>
        ${SEASON_LABELS.map((label, index) => `<button class="season-step" type="button" data-season="${index}" aria-pressed="false"><i></i>${label}</button>`).join('')}
      </div>
    </div>
    <div class="lanes-wrap">
      <svg class="fork" viewBox="0 0 100 400" preserveAspectRatio="none" aria-hidden="true">
        <path class="fork-a" d="M6 200 C 50 200, 50 100, 100 100" vector-effect="non-scaling-stroke"/>
        <path class="fork-b" d="M6 200 C 50 200, 50 300, 100 300" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="fork-start"><span class="fork-dot"></span><span>Maya, 8</span></div>
      <div class="lanes" data-split="false">${lane('a')}${lane('b')}</div>
    </div>
    <p class="illustration-note skills-note">Illustration only. The bars show an idea, not a measurement.</p>`;

  const $ = selector => root.querySelector(selector);
  const lanes = $('.lanes');
  const steps = [...root.querySelectorAll('.season-step')];
  let current = null;
  let season = 0;
  let sport = 'soccer';
  let scrubbable = false;

  function setSeasonBar(value) {
    steps.forEach((step, index) => {
      step.setAttribute('aria-pressed', String(index === value));
      step.dataset.done = String(index < value);
      step.disabled = !scrubbable || index > 3;
    });
    const track = root.querySelector('.season-steps');
    const first = steps[0].getBoundingClientRect();
    const target = steps[value].getBoundingClientRect();
    const box = track.getBoundingClientRect();
    root.querySelector('.season-fill').style.width = `${Math.max(0, target.left + target.width / 2 - (first.left + first.width / 2))}px`;
    void box;
  }

  const total = levels => Object.values(levels).reduce((sum, value) => sum + value, 0);
  const growthWord = gain => (gain < 0.001 ? 0 : gain < 0.3 ? 1 : gain < 0.6 ? 2 : 3);
  const lateLevels = late;
  function setGrowth(key, upTo, late) {
    root.querySelectorAll(`.lane-${key} .calendar-row`).forEach(row => {
      const rowSeason = Number(row.dataset.season);
      const badge = row.querySelector('.growth');
      let level = 0;
      if (rowSeason <= 3 && rowSeason <= upTo) level = growthWord(total(seasons[key][rowSeason].levels) - total(seasons[key][rowSeason - 1].levels));
      if (rowSeason === 4 && late) level = growthWord(total(lateLevels[key]) - total(transfer[key]));
      badge.dataset.level = String(level);
      badge.innerHTML = level ? `<span class="growth-long">grew </span>${['', 'a little', 'more', 'a lot'][level]}` : '';
    });
  }

  function setCalendar(key, upTo, { basket = 0, animateSeason = null } = {}) {
    const rows = root.querySelectorAll(`.lane-${key} .calendar-row`);
    rows.forEach(row => {
      const rowSeason = Number(row.dataset.season);
      const pattern = rowSeason === 4 ? (key === 'b' ? MAYA_PATTERNS.a : MAYA_PATTERNS.a) : MAYA_PATTERNS[key];
      const on = rowSeason === 4 ? basket : rowSeason <= upTo;
      [...row.querySelectorAll('.week')].forEach((week, index) => {
        const value = on && pattern[index] ? 'true' : 'false';
        if (week.dataset.on !== value) {
          week.dataset.on = value;
          week.classList.toggle('pop', value === 'true' && animateSeason === rowSeason);
          if (value === 'true' && animateSeason === rowSeason) week.style.animationDelay = `${index * 70}ms`;
          else week.style.animationDelay = '';
        }
      });
    });
  }

  function setBoosts(key, levels) {
    const box = $(`#box-${key}`);
    const boosts = [];
    if (sport === 'soccer') {
      if (levels.ballControl > 0.28) boosts.push('passing');
      if (levels.passing > 0.28) boosts.push('positioning');
    }
    box.dataset.boosts = boosts.join(' ');
  }

  function useSport(next, animate) {
    if (sport === next) return;
    sport = next;
    for (const key of ['a', 'b']) {
      const holder = $(`#lane-box-${key}`);
      holder.innerHTML = next === 'soccer'
        ? skillBoxMarkup({ id: `box-${key}`, group: 'soccer', title: 'Soccer', skills: soccer, owner: `Path ${key.toUpperCase()} Maya` })
        : skillBoxMarkup({ id: `box-${key}`, group: 'basketball', title: 'Basketball', skills: basketball, owner: `Path ${key.toUpperCase()} Maya` });
      if (animate) holder.firstElementChild.classList.add('flip');
      if (next === 'basketball') holder.querySelector('.box-note').textContent = 'striped = from soccer';
    }
  }

  function setSeason(value, { animate = false } = {}) {
    season = value;
    useSport('soccer', false);
    for (const key of ['a', 'b']) {
      const levels = seasons[key][value].levels;
      setSkillBox($(`#box-${key}`), levels);
      setBoosts(key, levels);
      setCalendar(key, value, { animateSeason: animate ? value : null });
      setGrowth(key, value, false);
      root.querySelectorAll(`.lane-${key} .basket-row`).forEach(row => { row.hidden = true; });
    }
    setSeasonBar(value);
  }

  function setBasketball({ late = false, animate = false } = {}) {
    useSport('basketball', animate);
    setSeasonBar(4);
    for (const key of ['a', 'b']) {
      root.querySelectorAll(`.lane-${key} .basket-row`).forEach(row => { row.hidden = !late; });
      setCalendar(key, 3, { basket: late ? 1 : 0, animateSeason: animate && late ? 4 : null });
      setGrowth(key, 3, late);
      const levels = late ? lateLevels[key] : transfer[key];
      setSkillBox($(`#box-${key}`), levels, { carried: transfer[key] });
    }
  }

  steps.forEach((step, index) => step.addEventListener('click', () => {
    if (!scrubbable || index > 3) return;
    setSeason(index, { animate: true });
  }));

  async function show(beatId, { from = null, animate = true, token } = {}) {
    current = beatId;
    scrubbable = beatId === 'builds';
    root.dataset.scrub = String(scrubbable);
    const sequential = animate && from;
    if (beatId === 'fork') {
      setSeason(0);
      lanes.dataset.split = 'false';
      if (animate) { await wait(420, token); if (token?.cancelled || current !== 'fork') return; }
      lanes.dataset.split = 'true';
      return;
    }
    lanes.dataset.split = 'true';
    if (beatId === 'slow') {
      if (sequential && from === 'fork') { setSeason(0); await wait(250, token); if (token?.cancelled) return; }
      setSeason(1, { animate: sequential });
      return;
    }
    if (beatId === 'builds') {
      if (sequential && from === 'slow') {
        setSeason(1);
        if (!(await wait(300, token))) return;
        setSeason(2, { animate: true });
        if (!(await wait(1500, token)) || current !== 'builds') return;
        setSeason(3, { animate: true });
        return;
      }
      setSeason(3);
      return;
    }
    if (beatId === 'transfer') {
      if (sequential && from === 'builds') setSeason(3);
      setBasketball({ animate: sequential });
      return;
    }
    if (beatId === 'never-late') {
      if (sequential && from === 'transfer') {
        setBasketball();
        if (!(await wait(250, token))) return;
      }
      setBasketball({ late: true, animate: sequential });
    }
  }

  new ResizeObserver(() => { if (current) setSeasonBar(sport === 'basketball' ? 4 : season); }).observe(root);
  return { show, hide() {} };
}
