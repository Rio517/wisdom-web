// Example choices for the life-path explorer. They are illustrations of the
// kinds of decisions people make at different ages—not a plan, a ranking of
// lives, or a prediction of what follows.

export const CHOICE_BANDS = [
  {
    until: 7,
    by: 'family',
    choices: [
      'Swimming lessons', 'Bedtime stories every night', 'Nursery with friends', 'Two languages at home',
      'Singing and music at home', 'Playing outside every day', 'Lots of time with grandparents', 'A dance class',
      'Puzzles and building blocks', 'Library visits every week', 'Helping to bake',
    ],
  },
  {
    until: 11,
    choices: [
      'Join a soccer team', 'Start piano lessons', 'Join the chess club', 'Read every night', 'Try gymnastics',
      'Art club after school', 'Learn to code with a friend', 'Join the Scouts', 'Get a tutor for maths',
      'Practise times tables', 'Start violin', 'Grow vegetables', 'Learn to skateboard', 'Join the choir',
    ],
  },
  {
    until: 15,
    choices: [
      'Apply for the gifted programme', 'Join the school band', 'Try out for the team', 'Get a maths tutor',
      'Join the robotics club', 'Start a second language', 'Volunteer at the animal shelter', 'Join drama club',
      'Switch from piano to drums', 'Draw every day', 'Take up running', 'Quit a club that isn’t fun',
      'Help look after a younger brother', 'Start a school newspaper',
    ],
  },
  {
    until: 19,
    choices: [
      'Take the science subjects', 'Get a part-time job', 'Focus on art', 'Study hard for exams',
      'Take a trade course', 'Join the debate team', 'Captain the team', 'Learn to drive',
      'Volunteer at a clinic', 'Choose history and languages', 'Make music with friends', 'Take a break from sport',
    ],
  },
  {
    until: 26,
    choices: [
      'Go to university', 'Start an apprenticeship', 'Travel for a year', 'Start working', 'Train as a nurse',
      'Train as an electrician', 'Move to a new city', 'Study music', 'Start a small business', 'Train to teach',
      'Work and study part-time', 'Stay near family', 'Train as a chef',
    ],
  },
  {
    until: 41,
    choices: [
      'Change careers', 'Start a family', 'Go back to study', 'Move abroad', 'Take on a big project at work',
      'Build something of your own', 'Take a job closer to family', 'Train for a marathon', 'Learn a new language',
      'Care for a parent', 'Lead a team', 'Work fewer hours', 'Buy a small house',
    ],
  },
  {
    until: 56,
    choices: [
      'Learn something new', 'Mentor someone younger', 'Start a new hobby', 'Switch to part-time',
      'Move to the countryside', 'Volunteer locally', 'Take a year off', 'Go back to school', 'Start a community garden',
      'Learn to paint', 'Retrain for a new job',
    ],
  },
  {
    until: Infinity,
    choices: [
      'Retire', 'Keep working a while longer', 'Volunteer', 'Travel', 'Teach others your craft',
      'Spend time with grandchildren', 'Start painting', 'Join a choir', 'Grow a garden', 'Write your story',
    ],
  },
];

export const CLOSED_REASONS = {
  young: ['No places left this year', 'It cost too much right now', 'It was too far away',
    'It stopped running this year', 'The family moved', 'Nobody could take you there'],
  adult: ['Money was tight that year', 'It wasn’t offered nearby', 'Someone in the family needed care',
    'An injury got in the way', 'The timing didn’t work out', 'Someone else got the place'],
};

/** Small deterministic hash so a seed and an id always give the same answer. */
export function hash(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) / 4294967296;
}

export function bandFor(age) {
  return CHOICE_BANDS.find(band => age < band.until) ?? CHOICE_BANDS.at(-1);
}

/**
 * Distinct labels for the options of one fork. `avoid` lists labels already
 * used on the current path so a life doesn't repeat itself.
 */
export function labelsForFork(age, key, count, avoid = []) {
  const band = bandFor(age);
  const pool = band.choices.filter(label => !avoid.includes(label));
  const source = pool.length >= count ? pool : band.choices;
  const start = Math.floor(hash(`${key}:label`) * source.length);
  const step = 1 + Math.floor(hash(`${key}:step`) * Math.max(1, source.length - 1));
  const labels = [];
  for (let offset = 0; labels.length < count && offset < source.length * 2; offset += 1) {
    const label = source[(start + offset * step) % source.length];
    if (!labels.includes(label)) labels.push(label);
  }
  for (let offset = 0; labels.length < count; offset += 1) {
    const label = source[(start + offset) % source.length];
    if (!labels.includes(label)) labels.push(label);
  }
  return { labels, byFamily: band.by === 'family' };
}

export function closedReason(age, key) {
  const list = age < 19 ? CLOSED_REASONS.young : CLOSED_REASONS.adult;
  return list[Math.floor(hash(`${key}:reason`) * list.length)];
}

/**
 * Story sets for the life map in chapter 1. One is picked at random per
 * visit. `taken` sit on the travelled route (early, loosely related),
 * `untaken` on gray branches, and the two future groups sit on connected
 * branches: `build` grows from what was already started, `fresh` starts
 * something new. Each group is [first step, one way on, another way on].
 */
export const MAP_STORIES = [
  { taken: ['Learned to swim', 'Joined a soccer team'], untaken: ['Piano lessons', 'Chess club', 'Art club'], build: ['Make the school team', 'Captain the team', 'Coach younger kids'], fresh: ['Start cello', 'Get a cello tutor', 'Switch to piano'] },
  { taken: ['Library visits', 'Joined the chess club'], untaken: ['Gymnastics', 'Drum lessons', 'Scouts'], build: ['Play in chess tournaments', 'Teach chess at school', 'Study maths further'], fresh: ['Join drama club', 'Write a play', 'Try film-making'] },
  { taken: ['Singing at home', 'Started piano'], untaken: ['Soccer team', 'Karate', 'Coding club'], build: ['Take piano exams', 'Play in a jazz band', 'Study music'], fresh: ['Join the running club', 'Run a half-marathon', 'Train as a PE teacher'] },
  { taken: ['Building with blocks', 'Joined the robotics club'], untaken: ['Choir', 'Swimming team', 'Pottery class'], build: ['Win a robotics contest', 'Study engineering', 'Electronics apprenticeship'], fresh: ['Learn to cook', 'Work in a café kitchen', 'Train as a chef'] },
  { taken: ['Playing outside a lot', 'Joined the Scouts'], untaken: ['Violin', 'Ballet', 'Chess club'], build: ['Lead a Scout patrol', 'Volunteer as a leader', 'Study outdoor education'], fresh: ['Try photography', 'Photograph school events', 'Study design'] },
  { taken: ['Drawing every day', 'Joined art club'], untaken: ['Soccer', 'Piano', 'Science club'], build: ['Build an art portfolio', 'Study illustration', 'Design posters for local shops'], fresh: ['Volunteer at an animal shelter', 'Work at a vet’s', 'Study animal care'] },
  { taken: ['Two languages at home', 'Joined Spanish club'], untaken: ['Gymnastics', 'Trumpet', 'Robotics'], build: ['Go on a language exchange', 'Study languages', 'Work as an interpreter'], fresh: ['Join the swim team', 'Become a lifeguard', 'Teach swimming'] },
  { taken: ['Helping in the garden', 'Grew vegetables'], untaken: ['Hockey', 'Guitar', 'Drama'], build: ['Join a community garden', 'Study plant science', 'Work at a garden centre'], fresh: ['Get a maths tutor', 'Join the maths club', 'Study accounting'] },
  { taken: ['Learned to ride a bike', 'Joined a cycling club'], untaken: ['Piano', 'Chess', 'Swimming'], build: ['Enter cycle races', 'Train as a bike mechanic', 'Lead cycling tours'], fresh: ['Start guitar', 'Form a band', 'Record your own songs'] },
  { taken: ['Doing puzzles', 'Practised times tables'], untaken: ['Football', 'Art club', 'Choir'], build: ['Join the gifted maths group', 'Enter the maths olympiad', 'Study computer science'], fresh: ['Try the school play', 'Join a youth theatre', 'Study stage design'] },
  { taken: ['Dancing at home', 'Joined a dance class'], untaken: ['Soccer', 'Chess', 'Coding'], build: ['Enter dance competitions', 'Teach dance to kids', 'Study dance'], fresh: ['Get a science tutor', 'Win a science fair prize', 'Train as a nurse'] },
  { taken: ['Reading comics', 'Started writing stories'], untaken: ['Tennis', 'Violin', 'Scouts'], build: ['Write for the school paper', 'Study journalism', 'Publish a short story'], fresh: ['Try basketball', 'Join a league team', 'Referee games'] },
  { taken: ['Building dens outdoors', 'Joined a woodwork club'], untaken: ['Piano', 'Ballet', 'Chess'], build: ['Make your own furniture', 'Carpentry apprenticeship', 'Open a small workshop'], fresh: ['Learn first aid', 'Volunteer as a first-aider', 'Train as a paramedic'] },
  { taken: ['Loving animals', 'Helped at a riding stable'], untaken: ['Swimming', 'Coding', 'Drums'], build: ['Care for the horses', 'Study veterinary nursing', 'Work on a farm'], fresh: ['Join the debate club', 'Enter debate contests', 'Study law'] },
  { taken: ['Playing in the park', 'Joined a tennis club'], untaken: ['Cello', 'Art', 'Scouts'], build: ['Play tennis tournaments', 'Coach tennis', 'Study sports science'], fresh: ['Learn to code', 'Build your own game', 'Study software design'] },
  { taken: ['Singing in the car', 'Joined the choir'], untaken: ['Soccer', 'Robotics', 'Karate'], build: ['Sing choir solos', 'Study singing', 'Sing in a band'], fresh: ['Help a brother with homework', 'Tutor younger kids', 'Train to teach'] },
  { taken: ['Watching the stars', 'Joined the science club'], untaken: ['Football', 'Violin', 'Dance'], build: ['Enter the science fair', 'Study physics', 'Work at a planetarium'], fresh: ['Try rowing', 'Row for a club', 'Coach rowing'] },
  { taken: ['Cooking with family', 'Baked for the school fair'], untaken: ['Soccer', 'Piano', 'Chess'], build: ['Run a bake sale stall', 'Train as a pastry chef', 'Open a small bakery'], fresh: ['Start trumpet', 'Join a brass band', 'Study music technology'] },
  { taken: ['Playing board games', 'Joined the maths club'], untaken: ['Swimming', 'Art', 'Drama'], build: ['Enter maths competitions', 'Study statistics', 'Work as a data analyst'], fresh: ['Start karate', 'Earn a black belt', 'Teach self-defence'] },
  { taken: ['Making friends easily', 'Joined the student council'], untaken: ['Ballet', 'Chess', 'Guitar'], build: ['Lead the student council', 'Study politics', 'Work for a charity'], fresh: ['Try pottery', 'Sell pottery at markets', 'Study ceramics'] },
];
