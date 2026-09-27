// Single source for the guided journey's words. The live page and the static
// reading (build-time and no-JavaScript) both render from these records.
// Editable draft: docs/content/choices-journey.md.
import { CHOICE_BANDS } from './journey-choices.js';

export const CHAPTERS = [
  {
    id: 'paths',
    title: 'Many paths',
    beats: [
      {
        id: 'cover',
        kicker: 'Choices · A guided journey',
        heading: 'The paths we make',
        body: [
          'How your choices—and the things you can’t choose—shape where a life can go.',
          'Go at your own pace. You’ll join a hike, follow one girl down two paths, spend ten afternoons, then explore a life of your own.',
        ],
        next: 'Begin',
        alt: 'A single dot marks the beginning of a life.',
      },
      {
        id: 'many',
        kicker: 'Many paths',
        heading: 'A life has many possible paths.',
        body: [
          'Each line is a way a life could go. Lines split, bend and cross. No one walks them all—and no one needs to.',
        ],
        alt: 'Hundreds of green paths branch out from the beginning dot and spread across the map.',
      },
      {
        id: 'travel',
        kicker: 'Many paths',
        heading: 'We travel one path at a time.',
        body: [
          'Here’s someone who is twelve. The dark line is their path so far. At each fork they chose one way; the others turned gray.',
          'Ahead, the green paths are still open. What they learn and practise changes which ones they’re ready for.',
        ],
        alt: 'A dot travels from the beginning to Today, age 12. Labels name some choices: dark ones taken along the route, gray ones not taken, and green ones still possible ahead.',
      },
      {
        id: 'outside',
        kicker: 'Many paths',
        heading: 'Not everything is yours to choose.',
        body: [
          'Other people, the help you have, and luck shape the path too. Some ways close for reasons nobody chose.',
          'Your choices matter—they’re just not the whole story. Let’s zoom in on one stretch of path.',
        ],
        next: 'Zoom in',
        alt: 'A few paths ahead are marked closed, with reasons such as a full team or a cancelled class. Many others remain open.',
      },
    ],
  },
  {
    id: 'hike',
    title: 'The hike',
    beats: [
      {
        id: 'plan',
        kicker: 'Alfredo’s hike',
        heading: 'Alfredo makes a plan.',
        body: [
          'Alfredo and his dad want to hike to Mirror Lake. They study the map, then pack snacks, jackets and a bottle of water each.',
          'No single step will get them there. Lots of steps, with rests along the way, can.',
        ],
        alt: 'A trail map: the trail climbs from the trailhead through a forest, over a stream and up a ridge to Mirror Lake. Alfredo and his dad wait at the trailhead with full water bottles.',
      },
      {
        id: 'halfway',
        kicker: 'Alfredo’s hike',
        heading: 'Halfway through the water.',
        body: [
          'Partway up, Alfredo checks his bottle. Half the water is gone, and the lake is still far away.',
        ],
        choice: {
          prompt: 'What should they do?',
          options: [
            {
              id: 'continue',
              label: 'Keep going to the lake',
              feedback: 'They would reach the lake with almost no water left for the long walk home. On a warm day, that could be dangerous. Dad says, “The lake will still be here. Let’s turn back.”',
            },
            {
              id: 'turn',
              label: 'Turn back now',
              feedback: 'Good thinking. The other half of the water is for getting home safely.',
              story: true,
            },
          ],
        },
        alt: 'The walkers climb to the big rock. Their water bottles are half full; the lake is still far away.',
      },
      {
        id: 'turnback',
        kicker: 'Alfredo’s hike',
        heading: 'Turning back isn’t giving up.',
        body: [
          'They head home without seeing the lake. Alfredo is disappointed. So is his dad.',
          'But they learned something useful for next time: bring enough water for there and back.',
        ],
        learned: ['water'],
        alt: 'The walkers return to the trailhead. A new card in the backpack reads: Water for there and back.',
      },
      {
        id: 'practice',
        kicker: 'Alfredo’s hike',
        heading: 'Practice builds on practice.',
        body: [
          'Over the next few weeks they take shorter walks near home. Alfredo practises reading the map and spotting landmarks.',
          'Each walk starts from what he learned on the last one. His dad still helps—learning with someone counts.',
        ],
        learned: ['map', 'landmarks', 'rest'],
        alt: 'Three short practice loops appear near home, one after another. The backpack gains three cards: Reading the map, Spotting landmarks, Resting before you’re tired.',
      },
      {
        id: 'retry',
        kicker: 'Alfredo’s hike',
        heading: 'The second try.',
        body: [
          'This time they carry more water and plan their rest stops. Alfredo recognises the big rock and the stream from the map.',
          'They aren’t starting from zero. Everything they learned is coming with them.',
        ],
        alt: 'The walkers climb past the place where they turned back last time, with plenty of water, and reach the bridge over the stream.',
      },
      {
        id: 'closed',
        kicker: 'Alfredo’s hike',
        heading: 'Something they couldn’t control.',
        body: [
          'Last night’s storm washed out part of the lake trail. A ranger at the bridge says it’s closed. All their planning couldn’t stop the rain.',
        ],
        choice: {
          prompt: 'What now?',
          options: [
            {
              id: 'sneak',
              label: 'Sneak past the sign',
              feedback: 'The sign is there because the trail isn’t safe. Ignoring it could turn a disappointing day into a dangerous one.',
            },
            {
              id: 'home',
              label: 'Go home grumpy',
              feedback: 'Feeling disappointed is normal—Alfredo feels it too, and going home would be allowed. But is there another good option?',
            },
            {
              id: 'ask',
              label: 'Ask the ranger about other trails',
              feedback: 'The ranger points to the Waterfall Trail. It’s shorter, and it’s open.',
              story: true,
            },
          ],
        },
        alt: 'Rain clouds over the ridge. The lake trail beyond the bridge is marked closed. A ranger stands at the bridge.',
      },
      {
        id: 'respond',
        kicker: 'Alfredo’s hike',
        heading: 'Plans change. You can respond.',
        body: [
          'They take the Waterfall Trail and eat lunch by the falls. The lake can wait—and everything they learned comes with them.',
          'That’s resilience: not controlling everything, but finding a good way forward.',
        ],
        closer: {
          heading: 'Does resilience mean never stopping?',
          body: [
            'No. Turning back, resting, asking for help or choosing a different goal can all be good responses.',
            'Alfredo can feel disappointed and still decide what to do next. He doesn’t have to pretend the setback feels good.',
          ],
        },
        alt: 'The walkers follow the open Waterfall Trail to a lookout beside a waterfall.',
      },
      {
        id: 'sort',
        kicker: 'Alfredo’s hike',
        heading: 'What was in their control?',
        body: [
          'Sort each card. Was it their choice, or something outside their control?',
        ],
        sort: [
          { id: 'pack', label: 'How much water to pack', mine: true },
          { id: 'storm', label: 'The storm', mine: false },
          { id: 'back', label: 'Turning back', mine: true },
          { id: 'closed', label: 'The trail closing', mine: false },
          { id: 'practise', label: 'Practising with the map', mine: true },
          { id: 'ask', label: 'Asking the ranger for help', mine: true },
        ],
        alt: 'Six cards sorted into two groups. Their choices: how much water to pack, turning back, practising with the map, asking the ranger. Outside their control: the storm, the trail closing.',
      },
    ],
  },
  {
    id: 'skills',
    title: 'Skills grow',
    beats: [
      {
        id: 'fork',
        kicker: 'Maya’s two paths',
        heading: 'Same start, two paths.',
        body: [
          'Meet Maya. She’s eight and has just joined a soccer team.',
          'Let’s imagine two ways her next three years could go. It’s the same Maya with the same start. Only her choices are different.',
        ],
        alt: 'One path splits into two lanes. Path A: Maya keeps practising. Path B: Maya mostly skips.',
      },
      {
        id: 'slow',
        kicker: 'Maya’s two paths',
        heading: 'At first, progress feels slow.',
        body: [
          'In her first season, Path A Maya goes to most practices and kicks a ball against the wall at home. Path B Maya goes now and then.',
          'After one season the difference is small. Early practice often feels like not much is happening.',
        ],
        alt: 'Season one. Path A’s calendar is mostly filled; Path B’s has a few practices. Both sets of skill bars are low, with Path A slightly ahead.',
      },
      {
        id: 'builds',
        kicker: 'Maya’s two paths',
        heading: 'Then learning builds on learning.',
        body: [
          'Once Path A Maya can control the ball without staring at it, she can look up and see her teammates. That makes passing and positioning easier to learn.',
          'Each skill gives the next one a place to stand. Path B Maya is still working on the basics, so the gap grows.',
        ],
        scrub: true,
        alt: 'Seasons two and three. Path A’s skill bars rise faster than before, with arrows showing ball control helping passing and passing helping positioning. Path B’s bars rise slowly.',
      },
      {
        id: 'transfer',
        kicker: 'Maya’s two paths',
        heading: 'Trying something new.',
        body: [
          'At eleven, both Mayas try basketball. It’s a different ball, and dribbling with your hands is new.',
          'But Path A Maya already knows where to stand and when to pass—that carries across. Path B Maya has to learn nearly all of it from the start.',
        ],
        alt: 'Both skill boxes switch to basketball. Path A starts with part of Court sense and Passing already filled, carried across from soccer. Dribbling starts low for both. Path B starts low on all three.',
      },
      {
        id: 'never-late',
        kicker: 'Maya’s two paths',
        heading: 'It’s never too late to start.',
        body: [
          'Path B Maya can start practising any season. When she does, her skills grow too. She has more to build than Path A Maya, but the door isn’t closed.',
          'Real life is messier than this picture. Coaches, time, money for a team and luck matter too. Not every skill carries across, and practice doesn’t guarantee a result.',
        ],
        alt: 'Both Mayas practise basketball for a season. Path B’s calendar fills for the first time and her bars rise; Path A keeps her head start.',
      },
    ],
  },
  {
    id: 'play',
    title: 'Your turn',
    beats: [
      {
        id: 'game',
        kicker: 'Your turn',
        heading: 'Ten afternoons, two skills.',
        body: [
          'You play soccer and you’re learning the cello. You have ten afternoons after school. Each one, choose what to do—and watch what builds up.',
          'Rest counts too. When you’re worn out, practice doesn’t stick as well.',
        ],
        game: true,
        alt: 'A game of ten afternoons. Each afternoon offers three choices. Skill boxes for soccer and cello, and an energy meter, show what builds up.',
      },
    ],
  },
  {
    id: 'explore',
    title: 'Explore',
    beats: [
      {
        id: 'explore',
        kicker: 'Explore',
        heading: 'Choose a life path.',
        body: [
          'Start at the beginning and pick a choice at each fork. Hover a path to see where it could lead. Some ways close for reasons you can’t control. You can always go back.',
        ],
        explore: true,
        alt: 'An interactive map of example life choices. At each fork, two or three labelled choices branch ahead; some are closed with a reason. The chosen path turns dark green, with gray branches for choices not taken.',
      },
    ],
  },
  {
    id: 'wrap',
    title: 'Take it with you',
    short: 'Takeaways',
    beats: [
      {
        id: 'takeaways',
        kicker: 'Take it with you',
        heading: 'What to take with you.',
        body: [
          'Your choices matter—they’re just not the whole story. The paths ahead are still open. What will you practise next?',
        ],
        takeaways: [
          { icon: 'add', heading: 'Choices add up.', text: 'Small things you repeat can grow into something big—for better or worse. One hard day doesn’t decide your future.' },
          { icon: 'build', heading: 'Learning builds on learning.', text: 'What you know gives the next thing a place to start, sometimes even in something new.' },
          { icon: 'weather', heading: 'Not everything is yours to choose.', text: 'When plans change, you can pause, ask for help and find another way forward.' },
        ],
        alt: 'The life map returns, with the traveller at Today and many light green paths still open ahead.',
      },
    ],
  },
];

export const LEARNED = {
  water: { label: 'Water for there and back', icon: 'water' },
  map: { label: 'Reading the map', icon: 'map' },
  landmarks: { label: 'Spotting landmarks', icon: 'eye' },
  rest: { label: 'Resting before you’re tired', icon: 'rest' },
};

export const SKILL_NOTES = {
  illustration: 'Illustration only. The bars show an idea, not a measurement.',
};

export function beatList() {
  return CHAPTERS.flatMap((chapter, chapterIndex) => chapter.beats.map((beat, beatIndex) => ({
    chapter, chapterIndex, beat, beatIndex, fragment: `${chapter.id}-${beat.id}`,
  })));
}

const escapeHTML = value => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function readingBeat(beat, gameDays) {
  const parts = [`<section class="reading-beat" id="read-${beat.id}">`, `<h3>${escapeHTML(beat.heading)}</h3>`];
  for (const paragraph of beat.body) parts.push(`<p>${escapeHTML(paragraph)}</p>`);
  if (beat.alt) parts.push(`<p class="reading-visual"><span>Picture:</span> ${escapeHTML(beat.alt)}</p>`);
  if (beat.choice) {
    parts.push(`<p><strong>${escapeHTML(beat.choice.prompt)}</strong></p><dl class="reading-choices">`);
    for (const option of beat.choice.options) {
      parts.push(`<dt>${escapeHTML(option.label)}${option.story ? ' <em>(what they chose)</em>' : ''}</dt><dd>${escapeHTML(option.feedback)}</dd>`);
    }
    parts.push('</dl>');
  }
  if (beat.learned) {
    parts.push(`<p class="reading-learned">Carried forward: ${beat.learned.map(id => escapeHTML(LEARNED[id].label)).join(' · ')}</p>`);
  }
  if (beat.sort) {
    const mine = beat.sort.filter(item => item.mine).map(item => escapeHTML(item.label));
    const not = beat.sort.filter(item => !item.mine).map(item => escapeHTML(item.label));
    parts.push(`<div class="reading-sort"><p><strong>Their choices:</strong> ${mine.join(' · ')}</p><p><strong>Outside their control:</strong> ${not.join(' · ')}</p></div>`);
  }
  if (beat.closer) {
    parts.push(`<aside class="reading-closer"><h4>${escapeHTML(beat.closer.heading)}</h4>${beat.closer.body.map(p => `<p>${escapeHTML(p)}</p>`).join('')}</aside>`);
  }
  if (beat.game && gameDays) {
    parts.push('<p>In the interactive version, you choose how to spend each afternoon:</p><ol class="reading-days">');
    for (const day of gameDays) {
      parts.push(`<li><strong>${escapeHTML(day.label)}.</strong> ${escapeHTML(day.situation)} <span>Choices: ${day.options.map(option => escapeHTML(option.label)).join(' · ')}.</span></li>`);
    }
    parts.push('</ol><p>Practice builds skills a little at a time, and a skill you already have makes related practice count for more. Resting restores energy; practising while worn out builds less. Afterwards, some of what you built carries across to basketball and guitar.</p>');
  }
  if (beat.explore) {
    parts.push('<p>In the interactive version, you pick one example choice at each fork, from age three to seventy. Some examples by age:</p><ul class="reading-examples">');
    let from = 3;
    for (const band of CHOICE_BANDS) {
      const until = Number.isFinite(band.until) ? band.until - 1 : 70;
      parts.push(`<li><strong>${from}–${until}${band.by === 'family' ? ' (often chosen by family)' : ''}:</strong> ${band.choices.slice(0, 4).map(escapeHTML).join(' · ')}</li>`);
      from = band.until;
    }
    parts.push('</ul><p>Some ways close for reasons outside your control—no places left, money, moving house—and you can go back to any earlier choice.</p>');
  }
  if (beat.takeaways) {
    parts.push('<ul class="reading-takeaways">');
    for (const item of beat.takeaways) parts.push(`<li><strong>${escapeHTML(item.heading)}</strong> ${escapeHTML(item.text)}</li>`);
    parts.push('</ul>');
  }
  parts.push('</section>');
  return parts.join('');
}

export function renderJourneyReading({ gameDays = null } = {}) {
  const chapters = CHAPTERS.map(chapter => `<section class="reading-chapter" aria-labelledby="read-chapter-${chapter.id}">
<h2 id="read-chapter-${chapter.id}">${escapeHTML(chapter.title)}</h2>
${chapter.beats.map(beat => readingBeat(beat, gameDays)).join('\n')}
</section>`);
  return `<article class="journey-reading" aria-labelledby="journey-reading-title">
<h1 id="journey-reading-title">Choices — The paths we make</h1>
<p class="reading-intro">A guided lesson for readers aged eight and up. The people and places are fictional examples. The pictures are illustrations, not predictions or measurements.</p>
${chapters.join('\n')}
</article>`;
}
