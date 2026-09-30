// Example choices for the life-path explorer and the life map's story sets.
// Structure lives here; the words live in the message catalogs
// (explore.choice.*, explore.closed.*, map.story*). They illustrate the kinds of
// decisions people make at different ages—not a plan, a ranking of lives, or a
// prediction of what follows.
import { t as runtimeT } from '../../i18n/runtime.js';

export const CHOICE_BANDS = [
  { id: 'family', until: 7, by: 'family', items: ['swimmingLessons', 'bedtimeStoriesEveryNight', 'nurseryWithFriends', 'twoLanguagesAtHome', 'singingAndMusicAtHome', 'playingOutsideEveryDay', 'lotsOfTimeWithGrandparents', 'aDanceClass', 'puzzlesAndBuildingBlocks', 'libraryVisitsEveryWeek', 'helpingToBake'] },
  { id: 'child', until: 11, items: ['joinASoccerTeam', 'startPianoLessons', 'joinTheChessClub', 'readEveryNight', 'tryGymnastics', 'artClubAfterSchool', 'learnToCodeWithA', 'joinTheScouts', 'getATutorForMaths', 'practiseTimesTables', 'startViolin', 'growVegetables', 'learnToSkateboard', 'joinTheChoir'] },
  { id: 'preteen', until: 15, items: ['applyForTheGiftedProgramme', 'joinTheSchoolBand', 'tryOutForTheTeam', 'getAMathsTutor', 'joinTheRoboticsClub', 'startASecondLanguage', 'volunteerAtTheAnimalShelter', 'joinDramaClub', 'switchFromPianoToDrums', 'drawEveryDay', 'takeUpRunning', 'quitAClubThatIsnt', 'helpLookAfterAYounger', 'startASchoolNewspaper'] },
  { id: 'teen', until: 19, items: ['takeTheScienceSubjects', 'getAPartTimeJob', 'focusOnArt', 'studyHardForExams', 'takeATradeCourse', 'joinTheDebateTeam', 'captainTheTeam', 'learnToDrive', 'volunteerAtAClinic', 'chooseHistoryAndLanguages', 'makeMusicWithFriends', 'takeABreakFromSport'] },
  { id: 'youngAdult', until: 26, items: ['goToUniversity', 'startAnApprenticeship', 'travelForAYear', 'startWorking', 'trainAsANurse', 'trainAsAnElectrician', 'moveToANewCity', 'studyMusic', 'startASmallBusiness', 'trainToTeach', 'workAndStudyPartTime', 'stayNearFamily', 'trainAsAChef'] },
  { id: 'adult', until: 41, items: ['changeCareers', 'startAFamily', 'goBackToStudy', 'moveAbroad', 'takeOnABigProject', 'buildSomethingOfYourOwn', 'takeAJobCloserTo', 'trainForAMarathon', 'learnANewLanguage', 'careForAParent', 'leadATeam', 'workFewerHours', 'buyASmallHouse'] },
  { id: 'midlife', until: 56, items: ['learnSomethingNew', 'mentorSomeoneYounger', 'startANewHobby', 'switchToPartTime', 'moveToTheCountryside', 'volunteerLocally', 'takeAYearOff', 'goBackToSchool', 'startACommunityGarden', 'learnToPaint', 'retrainForANewJob'] },
  { id: 'later', until: Infinity, items: ['retire', 'keepWorkingAWhileLonger', 'volunteer', 'travel', 'teachOthersYourCraft', 'spendTimeWithGrandchildren', 'startPainting', 'joinAChoir', 'growAGarden', 'writeYourStory'] },
];

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
