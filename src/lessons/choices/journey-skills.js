// Skill boxes: a group's skills as bars, each with its level in words (Lesson 2's pictures and its
// activity, and the earlier ten-afternoon activity in journey-play.js).
import { ICONS } from './journey-icons.js';
import { FOUNDATIONS, levelWord } from './journey-game.js';
import { t } from '../../i18n/runtime.js';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const GROUP_ICON = { soccer: 'soccerSmall', cello: 'celloSmall', basketball: 'basketball', guitar: 'guitar' };

/** Skill box markup (journey-play.js). */
export function skillBoxMarkup({ id, group, title, skills, owner = '' }) {
  const boxLabel = owner ? t('skills.boxLabelOwner', { owner, title }) : t('skills.boxLabel', { title });
  return `<section class="skill-box" id="${id}" data-group="${group}" aria-label="${esc(boxLabel)}">
    <header><h3>${ICONS[GROUP_ICON[group]] ?? ''}<span class="box-title">${esc(title)}</span></h3><span class="box-note"></span></header>
    ${skills.map(skill => `<div class="skill-row" data-skill="${skill.id}">
      <span class="skill-name">${esc(skill.label)}</span>
      <div class="meter" data-group="${group}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${esc(owner ? t('skills.meterLabelOwner', { owner, skill: skill.label }) : skill.label)}">
        <i class="carried" style="--level:0"></i><i class="fill" style="--level:0;--from:0"></i><i class="ghost" hidden></i>
      </div>
      <span class="skill-meta"><span class="skill-word">${esc(levelWord(0))}</span>
      <span class="boost-note">${FOUNDATIONS[skill.id] && FOUNDATIONS[skill.id] !== skill.id ? esc(t(`skills.boost.${skill.id}`)) : ''}</span></span>
    </div>`).join('')}
  </section>`;
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
    meter.setAttribute('aria-valuetext', headStart ? t('skills.withHeadStart', { word }) : word);
    row.querySelector('.skill-word').textContent = headStart ? t('skills.headStartShort', { word }) : word;
  }
}
