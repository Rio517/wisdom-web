export const CORE_SCENES = [
  {
    "id": "possibilities",
    "fragment": "more-than-one-path",
    "topic": "Many possible paths",
    "eyebrow": "The life map",
    "heading": "Your life has many possible paths.",
    "paragraphs": [
      "You can grow in directions you haven’t imagined yet. What you learn, try and practise can change which opportunities you’re ready for.",
      "There isn’t one perfect route. Your choices matter—but they are only part of the story."
    ],
    "backLabel": "Back",
    "nextLabel": "Next"
  },
  {
    "id": "accumulation",
    "fragment": "small-choices-add-up",
    "topic": "Choices add up",
    "eyebrow": "What builds over time",
    "heading": "Small choices can change what comes next.",
    "paragraphs": [
      "What you learn today can help you learn more tomorrow. Practising a skill, keeping a promise or asking for help can build something over time.",
      "The choices you repeat matter too. Putting something off again and again can leave a bigger problem. One difficult day doesn’t decide your future; you can begin again."
    ],
    "backLabel": "Back",
    "nextLabel": "Next"
  },
  {
    "id": "control",
    "fragment": "not-everything-is-yours-to-choose",
    "topic": "Outside your control",
    "eyebrow": "Circumstances and response",
    "heading": "Not everything is yours to choose.",
    "paragraphs": [
      "Other people, the support and resources around you, and chance also shape your life. A good choice cannot guarantee the outcome you want.",
      "When a plan goes wrong, you can pause, ask for help and look for another way forward. That’s resilience—not controlling everything, but finding how to respond."
    ],
    "backLabel": "Back",
    "nextLabel": "Finish"
  }
];

export const ALFREDO_SCENES = [
  {
    "id": "example",
    "fragment": "alfredo-hikes",
    "topic": "Begin the example",
    "eyebrow": "Example · The hike",
    "heading": "Your choices add up.",
    "paragraphs": [
      "Alfredo and his father want to hike to a mountain lake. They pack, study the map and set off. No single step will get them there. Many small steps, with rest along the way, can.",
      "Life works like that too: what you do now can change what becomes possible later."
    ],
    "backLabel": "Overview",
    "nextLabel": "Start the hike"
  },
  {
    "id": "steps",
    "fragment": "small-actions-add-up",
    "topic": "The first setback",
    "eyebrow": "First attempt",
    "heading": "Turning back isn’t giving up.",
    "paragraphs": [
      "Partway up, they realise they haven’t brought enough water for the whole hike. They turn back before it runs low.",
      "Alfredo is disappointed. So is his father. They missed the lake, but learned something useful: next time, they need a better plan."
    ],
    "backLabel": "Back",
    "nextLabel": "Try again"
  },
  {
    "id": "later",
    "fragment": "what-happened-before",
    "topic": "Take the learning with you",
    "eyebrow": "Another attempt",
    "heading": "Take the learning with you.",
    "paragraphs": [
      "On smaller hikes, Alfredo practises reading the map with his father. Each outing builds on the last.",
      "For another try at the lake, they plan their water and rest stops together. Alfredo recognises landmarks and helps check the route. They aren’t starting from scratch."
    ],
    "backLabel": "Back",
    "nextLabel": "See what happens"
  },
  {
    "id": "world",
    "fragment": "plans-meet-world",
    "topic": "Resilience",
    "eyebrow": "A second setback",
    "heading": "Plans can change. You can respond.",
    "paragraphs": [
      "Rain has damaged the lake trail. A ranger tells them it’s closed. Their careful preparation couldn’t prevent this.",
      "After a rest, Alfredo and his father choose a shorter, open trail. The lake can wait; their learning stays with them.",
      "That’s resilience: recovering from a setback, asking for help and finding a way forward—not pushing on at any cost. What could you carry into your next try?"
    ],
    "backLabel": "Back",
    "nextLabel": "Finish"
  }
];

export const CHOICES_DEEP_DIVES = {
  "learning": {
    "id": "learning",
    "scene": "later",
    "heading": "What carries forward?",
    "paragraph": "One walk doesn’t teach everything. On each outing, Alfredo compares a few landmarks with the map. What he recognises gives him a starting point for learning more. His father still helps, and a new route still needs checking.",
    "returnLabel": "Back to the story"
  },
  "changing": {
    "id": "changing",
    "scene": "world",
    "heading": "Does resilience mean never stopping?",
    "paragraph": "No. Turning back, resting, asking for help or choosing a different goal can all be useful responses. Alfredo can be disappointed and still decide what to do next. He doesn’t have to pretend the setback feels good.",
    "returnLabel": "Back to the story"
  }
};

const CORE_SCENE_INDEX = new Map(CORE_SCENES.map((scene, index) => [scene.id, index]));
const EXAMPLE_SCENE_INDEX = new Map(ALFREDO_SCENES.map((scene, index) => [scene.id, index]));

export function createLessonState({ scene = 'possibilities', comparison = 'later', age = 25 } = {}) {
  let track = EXAMPLE_SCENE_INDEX.has(scene) ? 'example' : 'core';
  let coreSceneIndex = CORE_SCENE_INDEX.get(scene) ?? 0;
  let exampleSceneIndex = EXAMPLE_SCENE_INDEX.get(scene) ?? 0;
  let coreReturnIndex = coreSceneIndex;
  let selectedComparison = comparison === 'first' ? 'first' : 'later';
  let mode = 'story';
  let deepDive = null;
  let coreCompleted = false;
  let exampleCompleted = false;
  let confirmedAge = Number.isInteger(Number(age)) && Number(age) >= 0 && Number(age) <= 70
    ? Number(age)
    : 25;
  let ageDraft = String(confirmedAge);

  const snapshot = () => {
    const scenes = track === 'example' ? ALFREDO_SCENES : CORE_SCENES;
    const sceneIndex = track === 'example' ? exampleSceneIndex : coreSceneIndex;
    return {
      mode,
      track,
      scene: scenes[sceneIndex].id,
      sceneIndex,
      comparison: selectedComparison,
      deepDive,
      completed: track === 'example'
        ? exampleCompleted && sceneIndex === scenes.length - 1
        : coreCompleted && sceneIndex === scenes.length - 1,
      coreCompleted,
      exampleCompleted,
      age: confirmedAge,
      ageDraft,
      canPreviousScene: sceneIndex > 0,
      canNextScene: sceneIndex < scenes.length - 1,
    };
  };

  const goToScene = id => {
    if (CORE_SCENE_INDEX.has(id)) {
      track = 'core';
      coreSceneIndex = CORE_SCENE_INDEX.get(id);
      coreReturnIndex = coreSceneIndex;
      mode = 'story';
      deepDive = null;
    } else if (EXAMPLE_SCENE_INDEX.has(id)) {
      track = 'example';
      exampleSceneIndex = EXAMPLE_SCENE_INDEX.get(id);
      mode = 'story';
      deepDive = null;
    }
    return snapshot();
  };

  return {
    getState: snapshot,
    goToScene,
    previousScene() {
      if (track === 'example') exampleSceneIndex = Math.max(0, exampleSceneIndex - 1);
      else {
        coreSceneIndex = Math.max(0, coreSceneIndex - 1);
        coreReturnIndex = coreSceneIndex;
      }
      deepDive = null;
      return snapshot();
    },
    nextScene() {
      if (track === 'example') exampleSceneIndex = Math.min(ALFREDO_SCENES.length - 1, exampleSceneIndex + 1);
      else {
        coreSceneIndex = Math.min(CORE_SCENES.length - 1, coreSceneIndex + 1);
        coreReturnIndex = coreSceneIndex;
      }
      deepDive = null;
      return snapshot();
    },
    enterExample() {
      coreReturnIndex = coreSceneIndex;
      track = 'example';
      exampleSceneIndex = 0;
      mode = 'story';
      deepDive = null;
      return snapshot();
    },
    returnToCore() {
      track = 'core';
      coreSceneIndex = coreReturnIndex;
      mode = 'story';
      deepDive = null;
      return snapshot();
    },
    setComparison(value) {
      if (value === 'first' || value === 'later') selectedComparison = value;
      return snapshot();
    },
    openDeepDive(id) {
      if (track === 'example' && CHOICES_DEEP_DIVES[id]?.scene === ALFREDO_SCENES[exampleSceneIndex].id) deepDive = id;
      return snapshot();
    },
    closeDeepDive() {
      deepDive = null;
      return snapshot();
    },
    enterExploration() {
      mode = 'explore';
      deepDive = null;
      return snapshot();
    },
    resumeStory() {
      mode = 'story';
      return snapshot();
    },
    finishLesson() {
      if (track === 'example' && exampleSceneIndex === ALFREDO_SCENES.length - 1) exampleCompleted = true;
      if (track === 'core' && coreSceneIndex === CORE_SCENES.length - 1) coreCompleted = true;
      return snapshot();
    },
    setAgeDraft(value) {
      ageDraft = String(value);
      return snapshot();
    },
    confirmAge() {
      const value = Number(ageDraft);
      if (!Number.isInteger(value) || value < 0 || value > 70) return false;
      confirmedAge = value;
      ageDraft = String(value);
      return true;
    },
  };
}
