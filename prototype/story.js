export const MOMENTS = [
  {
    age: 8,
    title: 'Ask when something is confusing',
    preview: 'Early support helps Mika build a base for later learning.',
    summary: 'Mika asks for a drawing of equal parts and practices connecting the picture to a fraction. This is a starting point, not mastery of everything that follows.',
  },
  {
    age: 12,
    title: 'Return to a difficult idea',
    preview: 'How Mika responds to a fractions gap changes which later routes stay easier to reach.',
    summary: 'Equivalent fractions are confusing. Mika repeatedly avoids the difficult problems, so the missing understanding adds another difficulty when ratios appear.',
  },
  {
    age: 16,
    title: 'Repair a gap before the next step',
    preview: 'Support and extra work can rebuild preparation after an earlier deadline passes.',
    summary: 'Mika wants an invented design course that requires ratios. With support, Mika catches up before a later intake. Being prepared makes Mika eligible; it does not guarantee a place, and the first intake stays missed.',
  },
  {
    age: 25,
    title: 'Use learning in a new setting',
    preview: 'Earlier foundations can make new training easier to begin.',
    summary: 'Mika learns a spreadsheet to help budget a community event. Earlier number skills help, but the tool itself still needs learning. New abilities can create new options.',
  },
  {
    age: 40,
    title: 'Make room for new learning',
    preview: 'Time, support and cost shape which next steps fit.',
    summary: 'Mika considers a course alongside work and family responsibilities. Time, support and cost affect what is practical; forty is not a learning cutoff.',
  },
  {
    age: 60,
    title: 'Combine experience with something new',
    preview: 'Experience can support new learning, while circumstances still matter.',
    summary: 'Mika brings practical experience to a shared project and learns an unfamiliar planning tool. Experience can help, while old methods sometimes need adapting. Future routes continue.',
  },
];

export const COMPARISONS = {
  gap: {
    title: 'Leave the gap',
    action: 'Mika keeps doing the easier work but repeatedly avoids the confusing fraction problems.',
    consequence: 'The missing foundation remains. When ratios appear, Mika needs to learn both the earlier foundation and the new idea, and the first course intake passes before that work is finished.',
    steps: [
      'The confusing equivalent-fraction problems are left unresolved across several occasions.',
      'A recipe ratio now depends on an earlier idea that still needs work.',
      'The invented course reaches its first intake before Mika meets its ratio prerequisite.',
    ],
    occasions: [
      { label: 'First try', text: 'Mika avoids the confusing fraction problems and finishes only the familiar work.' },
      { label: 'Another occasion', text: 'Mika puts off asking about equivalent fractions, so the same gap remains.' },
      { label: 'Later check', text: 'Mika skips the unresolved part again when ratios begin to depend on it.' },
    ],
    outcomes: [
      { id: 'fraction-foundation', label: 'Fraction foundation needs work', status: 'needs-work' },
      { id: 'recipe-ratio', label: 'Recipe ratio needs extra learning', status: 'needs-work' },
      { id: 'first-intake', label: 'First course intake missed', status: 'missed' },
    ],
  },
  build: {
    title: 'Build the foundation',
    action: 'Mika asks for a useful explanation and returns to the difficult problems with feedback.',
    consequence: 'Earlier understanding supports the next task, so the invented course prerequisite comes within reach. Preparation creates eligibility; it does not guarantee admission or every future opportunity.',
    steps: [
      'Connect equal parts to equivalent fractions, then connect equivalent fractions to a ratio in a recipe.',
      'Practice adapting the recipe and check the answer with feedback.',
      'Use that preparation to become ready for the invented course prerequisite.',
    ],
    occasions: [
      { label: 'First try', text: 'Mika asks for a drawing that connects equal parts to fractions.' },
      { label: 'Another occasion', text: 'Mika practices equivalent fractions and uses feedback to correct a mistake.' },
      { label: 'Later check', text: 'Mika checks the connection again while adapting a recipe ratio.' },
    ],
    outcomes: [
      { id: 'fraction-foundation', label: 'Fraction foundation available', status: 'available' },
      { id: 'recipe-ratio', label: 'Recipe ratio within reach', status: 'available' },
      { id: 'course-readiness', label: 'Course prerequisite within reach', status: 'available' },
    ],
  },
  repair: {
    title: 'Work back toward the opportunity',
    action: 'After avoiding the idea, Mika asks for support and makes time for the missing learning before trying the next step.',
    consequence: 'Recovery takes extra work and time. A later intake can become available after the prerequisite is met, but the intake that already passed does not reopen.',
    steps: [
      'Revisit equal parts with a drawing.',
      'Learn equivalent fractions with support and feedback.',
      'Practice ratios by adapting a recipe.',
      'Finish the prerequisite before a later intake of the invented course.',
    ],
    occasions: [
      { label: 'First try', text: 'With support, Mika returns to equal parts after the first intake is already missed.' },
      { label: 'Another occasion', text: 'Mika gets help with equivalent fractions and checks the new understanding.' },
      { label: 'Later check', text: 'Mika practices a recipe ratio and prepares for a later intake.' },
    ],
    outcomes: [
      { id: 'equal-parts-revisit', label: 'Equal parts revisited', status: 'needs-work' },
      { id: 'supported-fractions', label: 'Equivalent fractions learned with support', status: 'needs-work' },
      { id: 'ratio-practice', label: 'Ratio practiced in a recipe', status: 'needs-work' },
      { id: 'first-intake', label: 'First course intake still missed', status: 'missed' },
      { id: 'later-intake', label: 'Later course intake available', status: 'available' },
    ],
  },
};

export const COMPOUNDING_EXPLANATION = 'Earlier learning can support later learning. This is one kind of compounding, not a fixed growth rate or guaranteed result.';

export const LAYERS = {
  pattern: {
    title: 'See how it adds up',
    paragraphs: [
      'Returning to the work, checking understanding and getting feedback can build a foundation across different nights. Repeatedly avoiding the confusing part can leave the gap in place.',
      'These are example occasions, not a streak or a required daily dose. One missed night does not erase what Mika learned.',
    ],
  },
  starting: {
    title: 'What makes the next start easier?',
    paragraphs: [
      'Knowing more can help with the next task. Arranging materials and help can make starting more practical. Repeating an action in a familiar place may make that particular start more automatic.',
      'Opening a notebook more automatically is not the same as understanding its problems. A practiced routine still needs judgment; there is no general good-choices meter.',
    ],
  },
};

export const CIRCUMSTANCES = "Not all of this is Mika's choice. The school assigns the work, and Mika does not choose what feels confusing. Available help, time, health and decisions made by adults also affect what is possible. In the two choices below, imagine that the same useful help is available to Mika. When useful help is not available, that is different from refusing to ask, and it changes what Mika can do next.";
