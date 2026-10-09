// Example choices for the life-path explorer and the life map's story sets.
// Structure lives here; the words live in the message catalogs
// (explore.choice.*, explore.closed.*, map.story*). They illustrate the kinds of
// decisions people make at different ages—not a plan, a ranking of lives, or a
// prediction of what follows.
import { t as runtimeT } from '../../i18n/runtime.js';

export const CHOICE_BANDS = [
  { id: 'family', until: 7, by: 'family', items: ['swimmingLessons', 'bedtimeStoriesEveryNight', 'nurseryWithFriends', 'twoLanguagesAtHome', 'singingAndMusicAtHome', 'playingOutsideEveryDay', 'lotsOfTimeWithGrandparents', 'aDanceClass', 'puzzlesAndBuildingBlocks', 'libraryVisitsEveryWeek', 'helpingToBake'] },
  { id: 'child', until: 11, items: ['joinTheChessClub', 'tryGymnastics', 'artClubAfterSchool', 'learnToCodeWithA', 'joinTheScouts', 'getATutorForMaths', 'practiseTimesTables', 'startViolin', 'growVegetables', 'learnToSkateboard', 'joinTheChoir'] },
  { id: 'preteen', until: 15, items: ['applyForTheGiftedProgramme', 'getAMathsTutor', 'startASecondLanguage', 'volunteerAtTheAnimalShelter', 'joinDramaClub', 'switchFromPianoToDrums', 'drawEveryDay', 'takeUpRunning', 'quitAClubThatIsnt', 'helpLookAfterAYounger', 'startASchoolNewspaper'] },
  { id: 'teen', until: 19, items: ['takeTheScienceSubjects', 'getAPartTimeJob', 'focusOnArt', 'studyHardForExams', 'takeATradeCourse', 'joinTheDebateTeam', 'captainTheTeam', 'learnToDrive', 'chooseHistoryAndLanguages', 'makeMusicWithFriends', 'takeABreakFromSport'] },
  { id: 'youngAdult', until: 26, items: ['goToUniversity', 'startAnApprenticeship', 'travelForAYear', 'startWorking', 'moveToANewCity', 'studyMusic', 'trainToTeach', 'workAndStudyPartTime', 'stayNearFamily'] },
  { id: 'adult', until: 41, items: ['changeCareers', 'startAFamily', 'goBackToStudy', 'moveAbroad', 'takeOnABigProject', 'buildSomethingOfYourOwn', 'takeAJobCloserTo', 'trainForAMarathon', 'learnANewLanguage', 'careForAParent', 'leadATeam', 'workFewerHours', 'buyASmallHouse'] },
  { id: 'midlife', until: 56, items: ['learnSomethingNew', 'mentorSomeoneYounger', 'startANewHobby', 'switchToPartTime', 'moveToTheCountryside', 'volunteerLocally', 'takeAYearOff', 'goBackToSchool', 'startACommunityGarden', 'learnToPaint', 'retrainForANewJob'] },
  { id: 'later', until: Infinity, items: ['retire', 'keepWorkingAWhileLonger', 'volunteer', 'travel', 'teachOthersYourCraft', 'spendTimeWithGrandchildren', 'startPainting', 'joinAChoir', 'growAGarden', 'writeYourStory'] },
];

/**
 * Chains for the explorer: steps that build on each other over a life.
 * `kind` is a choice the reader makes, or a surprise they don't choose
 * (`lucky` opens something, `roadblock` gets in the way). A step is available
 * when any of its `after` steps is on the path (starters have none) and the
 * fork's age is within [from, until]. `big` steps move the path further.
 * Design note: notes/explorer-chains.md. Words: explore.step.<id>.
 */
const step = (kind, from, until, after = [], extra = {}) => ({ kind, from, until, after, ...extra });
const choice = (...args) => step('choice', ...args);
const lucky = (...args) => step('lucky', ...args);
const roadblock = (...args) => step('roadblock', ...args);
const BIG = { big: true };

export const STEPS = {
  // Maths and science
  mathsClub: choice(7, 12),
  mathsTournament: choice(9, 15, ['mathsClub']),
  teacherSpots: lucky(10, 17, ['mathsTournament', 'mathsClub']),
  scienceSubjects: choice(14, 18, ['teacherSpots', 'mathsTournament']),
  scholarship: lucky(16, 20, ['scienceSubjects'], BIG),
  studyScience: choice(17, 23, ['scholarship', 'scienceSubjects'], BIG),
  phd: choice(21, 30, ['studyScience', 'studyPartTime'], BIG),
  unkindSupervisor: roadblock(22, 33, ['phd']),
  leavePhd: choice(22, 34, ['unkindSupervisor'], BIG),
  newSupervisor: choice(22, 34, ['unkindSupervisor']),
  discovery: lucky(24, 50, ['phd', 'newSupervisor'], BIG),
  parentIll: roadblock(18, 45, ['studyScience', 'nurseTraining', 'studyLanguages', 'studyEngineering'], BIG),
  pauseStudies: choice(18, 46, ['parentIll'], BIG),
  studyPartTime: choice(18, 46, ['parentIll']),
  teachScience: choice(22, 60, ['leavePhd', 'studyScience', 'pauseStudies']),
  dataJob: choice(22, 60, ['leavePhd', 'studyScience']),
  // Music
  startPiano: choice(7, 11),
  schoolBand: choice(9, 15, ['startPiano']),
  bandInvite: lucky(12, 22, ['schoolBand']),
  playGigs: choice(14, 30, ['bandInvite', 'schoolBand']),
  songOnRadio: lucky(17, 40, ['playGigs'], BIG),
  recordAlbum: choice(18, 45, ['songOnRadio'], BIG),
  handInjury: roadblock(15, 45, ['playGigs', 'schoolBand'], BIG),
  writeSongs: choice(16, 60, ['handInjury', 'songOnRadio']),
  teachMusic: choice(18, 65, ['handInjury', 'playGigs']),
  // Sport
  joinSoccer: choice(5, 10),
  tryOutTeam: choice(9, 15, ['joinSoccer']),
  scoutWatches: lucky(12, 18, ['tryOutTeam'], BIG),
  youthAcademy: choice(13, 19, ['scoutWatches'], BIG),
  playPro: choice(17, 30, ['youthAcademy'], BIG),
  kneeInjury: roadblock(13, 32, ['tryOutTeam', 'youthAcademy', 'playPro'], BIG),
  physio: choice(16, 40, ['kneeInjury']),
  coachKids: choice(15, 65, ['kneeInjury', 'tryOutTeam', 'playPro']),
  // Caring
  firstAid: choice(11, 16),
  volunteerClinic: choice(14, 20, ['firstAid']),
  nurseTraining: choice(17, 26, ['volunteerClinic'], BIG),
  nurseMentor: lucky(20, 45, ['nurseTraining']),
  midwife: choice(21, 50, ['nurseMentor', 'nurseTraining']),
  hospitalCloses: roadblock(23, 55, ['nurseTraining', 'midwife'], BIG),
  moveForWork: choice(23, 56, ['hospitalCloses'], BIG),
  // Making things
  roboticsClub: choice(9, 15),
  robotContest: choice(11, 17, ['roboticsClub']),
  robotPrize: lucky(11, 18, ['robotContest']),
  studyEngineering: choice(16, 23, ['robotPrize', 'robotContest'], BIG),
  electrician: choice(16, 25, ['robotContest', 'roboticsClub'], BIG),
  ownBusiness: choice(21, 50, ['studyEngineering', 'electrician', 'trainChef'], BIG),
  bigCustomer: lucky(22, 55, ['ownBusiness'], BIG),
  businessFails: roadblock(22, 55, ['ownBusiness'], BIG),
  newIdea: choice(22, 58, ['businessFails']),
  saveUp: choice(22, 58, ['businessFails']),
  // Words and languages
  readNightly: choice(5, 10),
  schoolPaper: choice(9, 15, ['readNightly']),
  exchangeTrip: lucky(12, 18, ['schoolPaper', 'readNightly']),
  studyLanguages: choice(16, 23, ['exchangeTrip', 'schoolPaper']),
  moveAbroad: choice(19, 45, ['studyLanguages', 'exchangeTrip'], BIG),
  interpreter: choice(20, 55, ['studyLanguages']),
  publishersSayNo: roadblock(18, 60, ['schoolPaper', 'studyLanguages']),
  keepWriting: choice(18, 62, ['publishersSayNo']),
  bookDeal: lucky(20, 66, ['keepWriting'], BIG),
  // Food
  helpBake: choice(3, 7, [], { byFamily: true }),
  bakeSale: choice(7, 13, ['helpBake']),
  cafeJob: choice(14, 20, ['bakeSale']),
  chefOffer: lucky(15, 26, ['cafeJob']),
  trainChef: choice(16, 28, ['chefOffer', 'cafeJob'], BIG),
  openBakery: choice(24, 55, ['trainChef'], BIG),
  rentDoubles: roadblock(25, 60, ['openBakery']),
  marketStall: choice(25, 62, ['rentDoubles']),
  // Anyone, any time
  friendInvites: lucky(7, 16),
  friendForLife: lucky(9, 60),
  oldFriendJob: lucky(25, 60),
  illForMonths: roadblock(10, 60),
  slowReturn: choice(10, 62, ['illForMonths']),
  jobEnds: roadblock(26, 60, [], BIG),
  retrain: choice(26, 62, ['jobEnds'], BIG),
};

/** Two written-out lives for the text version: one big lucky break, one big roadblock. */
export const EXAMPLE_CHAINS = [
  ['mathsClub', 'mathsTournament', 'teacherSpots', 'scienceSubjects', 'scholarship', 'studyScience', 'phd', 'unkindSupervisor', 'newSupervisor', 'discovery'],
  ['joinSoccer', 'tryOutTeam', 'scoutWatches', 'youthAcademy', 'kneeInjury', 'physio', 'coachKids'],
];

export const stepLabel = (id, t = runtimeT) => t(`explore.step.${id}`);

/**
 * Steps open to someone at `age` who has already taken the steps in `taken`.
 * A direct consequence of the step just taken (`last`) is open past its usual
 * age window, so a scholarship is always followed by the chance to use it.
 */
export function availableSteps(age, taken, last = null) {
  return Object.entries(STEPS)
    .filter(([id, item]) => !taken.has(id) && age >= item.from
      && (age <= item.until || (last && item.after.includes(last)))
      && (!item.after.length || item.after.some(before => taken.has(before))))
    .map(([id, item]) => ({ id, ...item }));
}

export const CLOSED_REASONS = {
  young: ['noPlacesLeftThisYear', 'itCostTooMuchRight', 'itWasTooFarAway', 'itStoppedRunningThisYear', 'theFamilyMoved', 'nobodyCouldTakeYouThere'],
  adult: ['moneyWasTightThatYear', 'itWasntOfferedNearby', 'someoneInTheFamilyNeeded', 'anInjuryGotInThe', 'theTimingDidntWorkOut', 'someoneElseGotThePlace'],
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

/** A band's example choices in the reader's language. */
export function bandChoices(band, t = runtimeT) {
  return band.items.map(item => t(`explore.choice.${band.id}.${item}`));
}

/**
 * Distinct labels for the options of one fork. `avoid` lists labels already
 * used on the current path so a life doesn't repeat itself.
 */
export function labelsForFork(age, key, count, avoid = [], t = runtimeT) {
  const band = bandFor(age);
  const choices = bandChoices(band, t);
  const pool = choices.filter(label => !avoid.includes(label));
  const source = pool.length >= count ? pool : choices;
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

export function closedReason(age, key, t = runtimeT) {
  const group = age < 19 ? 'young' : 'adult';
  const list = CLOSED_REASONS[group];
  return t(`explore.closed.${group}.${list[Math.floor(hash(`${key}:reason`) * list.length)]}`);
}

/**
 * Story sets for the life map in chapter 1; one is picked at random per
 * visit. `taken` sit on the travelled route (early, loosely related),
 * `untaken` on gray branches, and the two future groups sit on connected
 * branches: `build` grows from what was already started, `fresh` starts
 * something new. Each group is [first step, one way on, another way on].
 */
export const STORY_COUNT = 20;
export const STORY_SHAPE = { taken: 2, untaken: 3, build: 3, fresh: 3 };

export function mapStory(index, t = runtimeT) {
  const n = String(index + 1).padStart(2, '0');
  return Object.fromEntries(Object.entries(STORY_SHAPE).map(([part, count]) => [
    part, Array.from({ length: count }, (_, i) => t(`map.story${n}.${part}${i + 1}`)),
  ]));
}
