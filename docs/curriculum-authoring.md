# Authoring curriculum content

Lesson content is plain TypeScript data. The learning engine, UI and audio read
it without any per-lesson code. To add or change lessons, edit the module files
and run the validator.

- Types: `src/curriculum/types.ts` (read it first, especially the field comments)
- Plan and lesson ids: `docs/curriculum-plan.md`
- Objective tags: `src/curriculum/objectives.ts`
- Validator: `src/curriculum/validate.ts`

## File format

One file per module at `src/curriculum/content/<stage-id>/<module-id>.ts`:

```ts
import type { LessonDraft } from '../../types';

export const lessons: Array<LessonDraft> = [
  // lessons in plan order
];
```

`moduleId`, `stageId` and `level` are filled in automatically.

## How the engine uses a lesson

1. The learner sees the **learn card**: `targetPhrase` (large, with audio),
   `meaningEn`, `situation`, `wordBreakdown`, `patternExplanation`,
   `pronunciationTip`, `examples`, `dialogue`, `speakingPrompt`. The Dutch
   in `targetPhrase`, `examples` and `dialogue` is spoken automatically when
   the learner taps play.
2. Immediately after, the learner does the **recognition** exercise (and, in
   focused practice, the supportedRecall one).
3. Later reviews pick the exercise matching the learner's demonstrated level:
   recognition → supportedRecall → independentRecall → transfer. A wrong
   answer drops one level. So each stage's exercise must make sense on its
   own, days after the learn card, without the learn card visible.

## Rules for core and practice lessons

Exercises, in this order (validator enforces stage order):

| Stage | Purpose | Usual kinds |
|---|---|---|
| `recognition` | Understand it. Short, micro-friendly, never `focusedOnly`. | `choice` (meaning of the Dutch, or which Dutch fits a situation) |
| `supportedRecall` | Produce it with help. | `cloze` with `hint`, `order` tiles, or `choice` between similar Dutch forms |
| `independentRecall` | Produce it unaided. | `type` (English situation → Dutch), no hint |
| `transfer` | Use the pattern in a different but familiar situation (new word, new person, new context). | `type`, `choice`, or `write` (stage 2+) |

You may add one extra exercise (for example a listening `choice` with
`listenOnly: true`) as long as stage order is kept. Four or five exercises per
lesson is the target.

- Recognition `choice`: 3 or 4 options, plausible distractors (similar
  meaning or form, not silly).
- `cloze`: exactly one `___`. Put accepted spellings in `answers`. A `hint`
  is a first letter pattern ("g____") or the English word.
- `order`: `words` in correct order (punctuation attached to the last word,
  e.g. `"koffie."`). The UI hides the first word's capital and the final
  punctuation on tiles, so neither gives the answer away. Add `alternatives`
  for other correct orders, written naturally (capitals and punctuation may
  differ; the words must be the same). Add 0–2
  `distractors` only when they test a real contrast (e.g. `niet`/`geen`).
- `type`: `answers[0]` is the model answer; add natural variants (je/jij,
  with/without een, both word orders when both are correct, Dank je / Dank je wel).
  Checking ignores case, accents, punctuation (. , ! ? ; : quotes) and extra
  spaces; apostrophes are kept.
- `write`: `mustInclude` is a list of any-of groups, `minWords` small (5–30),
  `modelAnswer` must satisfy both. Mark it `focusedOnly: true`.
- The transfer answer must not be the same sentence as `targetPhrase`.
- **Never reveal the answer in the prompt.** Prompts for production tasks
  describe the situation in English: "Your colleague asks where you live. Say
  you live in Utrecht." Not "Type: Ik woon in Utrecht".
- `explanation`: 1–2 sentences on why it is right and the common mistake.
- Listening: put the Dutch in `audioText`; with `listenOnly: true` the text
  is hidden until the learner answers. Use it for genuine listening tasks.
  A dictation (`type` whose answer equals `audioText`) must be `listenOnly`.
- Reading: put the Dutch text in `passage` and ask in English.
- `focusedOnly: true` on long items: passages over ~40 words, dialogues,
  writing tasks.
- `practice` lessons recombine earlier lessons in a new situation and list
  them in `revisits` (at least one). They usually carry a `dialogue`.
- Use `prerequisites` only when a lesson depends on something outside the
  normal order (rare).

## Checkpoints (`kind: 'checkpoint'`)

- 6–10 exercises mixing at least two skills (listening, reading, writing,
  plus speaking-adjacent dialogue responses).
- Every exercise sets `testsLesson` to the earlier lesson it assesses; a wrong
  answer sends that lesson back into review.
- `revisits` lists at least three earlier lessons.
- Stage order rules do not apply; most items are `transfer` or
  `independentRecall`. Use situations the learner has not seen in the exact
  form, so it tests use rather than memorised answers.
- `targetPhrase`/`meaningEn`: a representative phrase from the checkpoint.

## Cognitive load and progression

- One primary objective per lesson. 2–4 `examples`. `patternExplanation`
  at most three short sentences.
- Use only Dutch the learner has met before or that the lesson explains in
  `wordBreakdown`.
- Stage 0: very guided; target phrases ≤ 6 words; plenty of choice/order.
- Stage 1: more typing; short readings; first messages.
- Stage 2: sentence construction, dialogues, short writing; recycle stage 1
  vocabulary in new sentences.
- Stage 3: integrated tasks. Passages, announcements, emails, `write` tasks;
  test the communicative outcome ("Did you understand which platform?",
  "Does your email say what is wrong and since when?").

## Language quality

- Standard Netherlands Dutch (nl-NL), natural and current. Correct spelling,
  de/het, verb endings, word order. Netherlands vocabulary and situations:
  pinnen, de huisarts, de gemeente, OV-chipkaart, gezellig, NS, Albert Heijn
  style supermarkets (no brand names needed). No Flemish forms (gij, ge,
  goesting, amai).
- English translations are accurate and natural. Do not over-literalise; add
  a literal gloss in `wordBreakdown` if useful.
- Pronunciation tips use plain English comparisons ("like the ch in Scottish
  loch, but softer"), never IPA alone.
- All content is original. Do not copy textbook sentences or exercises.

## Example

```ts
{
  id: 's1-food-ik-wil-graag',
  kind: 'core',
  title: "I'd like …",
  objective: 'Order a drink or food item politely.',
  situation: 'You are at the counter of a café in Utrecht and want a coffee.',
  targetPhrase: 'Ik wil graag een koffie.',
  meaningEn: "I'd like a coffee.",
  wordBreakdown: [
    { dutch: 'ik wil', english: 'I want' },
    { dutch: 'graag', english: 'gladly; makes the request polite' },
    { dutch: 'een koffie', english: 'a coffee' },
  ],
  patternExplanation:
    'Ik wil graag + what you want is the everyday polite way to ask for something. It also works with a verb: Ik wil graag betalen.',
  pronunciationTip: 'Both g sounds in graag come from the throat, like a soft version of the ch in Scottish "loch". The aa is a long "ah".',
  examples: [
    { dutch: 'Ik wil graag water.', english: "I'd like water." },
    { dutch: 'Ik wil graag een thee.', english: "I'd like a tea." },
    { dutch: 'Ik wil graag betalen.', english: "I'd like to pay." },
  ],
  speakingPrompt: 'Say it aloud as if you are at the counter: Ik wil graag een koffie.',
  skills: ['listening', 'speaking', 'reading'],
  covers: ['ordering', 'food-drinks', 'requests'],
  exercises: [
    {
      id: 'rec', stage: 'recognition', kind: 'choice',
      prompt: 'What does "Ik wil graag een koffie." mean?',
      options: ["I'd like a coffee.", 'I have a coffee.', 'Is this my coffee?'],
      answer: "I'd like a coffee.",
      explanation: 'Ik wil graag … = I would like … . "I have" would be ik heb.',
    },
    {
      id: 'cloze', stage: 'supportedRecall', kind: 'cloze',
      prompt: 'Complete the polite order.',
      sentence: 'Ik wil ___ een koffie.',
      answers: ['graag'], hint: 'g____', english: "I'd like a coffee.",
      explanation: 'Graag after wil makes it polite. Without it, Ik wil een koffie sounds blunt.',
    },
    {
      id: 'type', stage: 'independentRecall', kind: 'type',
      prompt: 'The barista looks at you. Politely ask for a coffee in Dutch.',
      answers: ['Ik wil graag een koffie.', 'Ik wil graag koffie.'],
      explanation: 'Ik wil graag + een koffie. The verb wil comes straight after ik.',
    },
    {
      id: 'listen', stage: 'independentRecall', kind: 'choice',
      prompt: 'Listen. What does the customer order?',
      audioText: 'Ik wil graag een thee en een water.', listenOnly: true,
      options: ['Tea and water', 'Coffee and water', 'Just tea'],
      answer: 'Tea and water',
      explanation: 'Een thee en een water: a tea and a water.',
    },
    {
      id: 'transfer', stage: 'transfer', kind: 'type',
      prompt: 'You have finished your coffee and want to pay. Tell the waiter.',
      answers: ['Ik wil graag betalen.'],
      explanation: 'Same pattern with a verb at the end: Ik wil graag + betalen.',
    },
  ],
}
```

## Validate

```bash
CURRICULUM_MODULES=s1-food,s1-shop pnpm validate:curriculum
```

With no `CURRICULUM_MODULES`, the full suite also checks every planned module
has content and every objective tag in `objectives.ts` is covered.
