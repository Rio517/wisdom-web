// Reads the round's copy.md, so the frames show exactly the words in that file.
// `#### <id> <slug> · <Heading>` starts a step; plain lines are story paragraphs;
// `- **Title.** text` lines are takeaways; `- key: value` lines are the picture's words;
// `Picture:` lines are notes for the reader of copy.md and are not drawn.
import raw from '../../docs/design/003-lesson-two/v03-practice-paper/copy.md?raw';

function parse(text) {
  const steps = new Map();
  let chapter = null;
  let step = null;
  for (const line of text.split('\n')) {
    const chapterMatch = line.match(/^### Chapter · (.+)$/);
    if (chapterMatch) { chapter = chapterMatch[1].trim(); continue; }
    if (/^### [ABC] · /.test(line)) { chapter = null; continue; }
    const stepMatch = line.match(/^#### (\w+) ([\w-]+) · (.+)$/);
    if (stepMatch) {
      step = { id: stepMatch[1], slug: stepMatch[2], heading: stepMatch[3].trim(), chapter, body: [], takeaways: [], words: {} };
      steps.set(step.id, step);
      continue;
    }
    if (/^## /.test(line)) { step = null; continue; }
    if (!step || !line.trim() || line.startsWith('Picture:')) continue;
    const takeaway = line.match(/^- \*\*(.+?)\*\* (.+)$/);
    if (takeaway) { step.takeaways.push({ title: takeaway[1], text: takeaway[2] }); continue; }
    const word = line.match(/^- ([\w.]+): (.+)$/);
    if (word) { step.words[word[1]] = word[2].trim(); continue; }
    step.body.push(line.trim());
  }
  return steps;
}

export const STEPS = parse(raw);
export const step = id => {
  const found = STEPS.get(id);
  if (!found) throw new Error(`copy.md has no step ${id}`);
  return found;
};
/** A picture word of a step, failing loudly when copy.md lacks it. */
export const word = (id, key) => {
  const value = step(id).words[key];
  if (value === undefined) throw new Error(`copy.md step ${id} has no word ${key}`);
  return value;
};
/** Words a reader reads in a step: the heading, paragraphs and takeaways. */
export const countWords = s => [s.heading, ...s.body, ...s.takeaways.flatMap(t => [t.title, t.text])]
  .join(' ').split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
