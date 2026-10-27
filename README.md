# TaalNudge

A Chrome extension (Manifest V3) that teaches Dutch from absolute beginner (A0/pre-A1) through A1 to A2. You learn in short lessons and spaced reviews offered while you browse X and LinkedIn, or in a focused-practice side panel.

TaalNudge is a working product name, not a checked trademark. It is a practice tool built around an original A0–A2 curriculum. It is not a certified course and does not certify proficiency.

## Quick start

```bash
pnpm install
```

```bash
pnpm test
```

```bash
pnpm build
```

Load it in Chrome:

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose `dist/chrome-mv3`.
3. Click the TaalNudge toolbar icon. The side panel opens on **Practice**.
4. To get prompts while browsing, go to **Settings → Prompts while browsing** and switch on X and/or LinkedIn. Chrome asks for access to that site only.

Other commands:

| Command | What it does |
|---|---|
| `pnpm dev` | WXT dev mode with auto-reload in a fresh Chrome profile |
| `pnpm compile` | Type-check |
| `pnpm validate:curriculum` | Validate the curriculum (also part of `pnpm test`) |
| `pnpm zip` | Zip for the Chrome Web Store |
| `pnpm vite --config preview/vite.config.ts` | UI preview harness on http://localhost:5199 (`/` side panel, `/nudge.html` in-page card on a fake feed) |
| `pnpm audio:generate` | Pre-generate ElevenLabs clips (see Audio) |

## What it does

- **Curriculum.** 272 original lessons in 4 stages and 56 modules, bundled as data (see `docs/curriculum-plan.md`):

  | Stage | Level | Modules | Lessons |
  |---|---|---|---|
  | 0 · Foundations | pre-A1 | 8 | 49 |
  | 1 · Everyday A1 | A1 | 20 | 100 |
  | 2 · Towards A2 | A1→A2 | 17 | 71 |
  | 3 · A2 communication | A2 | 11 | 52 |

  Lessons by kind:
  - 206 core lessons, each with one objective, a situation, Dutch target, translation, word breakdown, pattern note, examples and pronunciation tip.
  - 52 practice lessons that recombine earlier material in new situations, usually as a dialogue.
  - 14 scored checkpoints.

  There are 1,423 exercises with answers and explanations: 589 multiple choice, 495 typed, 173 fill-the-gap, 112 word order and 54 short writing tasks. Of these, 203 are listening items and 66 have a reading passage. Every core and practice lesson has an exercise at each of the four stages. A validator (`pnpm validate:curriculum`) checks ids, required fields, answer definitions, references and prerequisites, stage order and answer leaks. It also checks coverage of every required objective in `src/curriculum/objectives.ts`.
- **Micro-learning on X and LinkedIn.** After about 8 minutes of active browsing (configurable from 5 to 60), a small card appears in a bottom corner. It offers **Learn now**, **Not now**, and a ⋯ menu with **Snooze** (30 min, 1 hour, until tomorrow) and **Quiet mode**. **Learn now** expands the card into a 1–2 minute lesson or a single review question. The card never covers the feed column, never locks scrolling, and waits while you type. Only one prompt exists across tabs, with at most three per browsing session.
- **Focused practice (side panel).** Due reviews come first, then the curriculum, then checkpoints. The panel also has the full roadmap (stage → module → lesson, with locked, current and done states), a progress summary and settings.
- **Learning engine.** Each lesson teaches one item that moves through *introduced → recognition → supported recall → independent recall → transfer*. A correct answer raises the level and pushes the next review out (1, 3, 7, 14, 30, then 60 days). A wrong answer gives corrective feedback, drops one level so the next exercise is easier, falls back two intervals and brings the item back in 10 minutes. Completing a lesson is tracked separately from demonstrated recall. "Strong" means independent recall that has survived at least a week-long interval.
- **Checkpoints.** These are cumulative and scored, and run in focused practice only. Every wrong answer sends the lesson it tests back into review. A stage's checkpoints must be attempted before the next stage unlocks, but passing is not required.
- **Audio.** Standard Netherlands Dutch (`nl-NL`) through a small speech module (see Audio).
- **Local only.** Progress, review schedules and settings live in `chrome.storage.local`. There is no account, backend or analytics, and no page content is read.

## Project structure

```
entrypoints/
  background.ts          Registers the prompt script only for granted sites; opens the side panel
  content/               Content script: activity timing, prompt placement, shadow-root mount
  sidepanel/             Focused-practice entry (React)
src/
  curriculum/
    types.ts             Lesson, Exercise, CurriculumModule, CurriculumStage
    structure.ts         Stage and module order
    objectives.ts        Required objectives per stage (validated for coverage)
    content/<stage>/     Lesson data, one file per module
    validate.ts          Curriculum validator
  engine/                Pure TypeScript: answers, progress, schedule, selection, summary
  learning/actions.ts    The one bridge from UI to engine + storage (used by both modes)
  storage/store.ts       chrome.storage.local read-modify-write with parsing/defaults
  trigger/browsing.ts    Pure prompt-timing rules (threshold, snooze, quiet, caps, sessions)
  audio/                 Speech abstraction (bundled clips → nl-NL synthesis → graceful off)
  ui/                    React components shared by the side panel and the in-page card
docs/
  curriculum-plan.md     Lesson-by-lesson plan, ids, assumptions
  curriculum-authoring.md How to add or edit lessons
  ux-research.md         Mobbin research behind every UI decision
tests/                   Engine, storage/trigger, audio, curriculum validation, UI flows
preview/                 Dev-only harness to run the UI in a normal tab
scripts/                 Audio generation, icon drawing
```

The engine, trigger and curriculum have no React or browser dependencies. The side panel and the in-page card call the same `createLearningActions`, which reads and writes the same stored state, so both modes always agree.

## Audio

`src/audio/speech.ts` tries three things in order:

1. **A bundled clip**, if `src/audio/clip-manifest.json` maps the sentence to a file in `public/audio/`. No clips ship yet (see below).
2. **Browser speech synthesis**, with `lang = "nl-NL"` and a Dutch voice: nl-NL first (Chrome's "Google Nederlands" if present), then another Dutch variety, which triggers a warning. Voices that load late are awaited.
3. **Silence with an explanation**, when no Dutch voice exists. An English voice reading Dutch would teach the wrong sounds, so the app does not use one.

**ElevenLabs research.** Two test samples were generated through the ElevenLabs MCP: one on the default voice with `eleven_v3`, one with `eleven_multilingual_v2`, using hard sounds such as g/ch, ui, ij/ei and eu. No ElevenLabs voice ID for a native Netherlands Dutch speaker could be confirmed from here, and a script cannot judge accent. So no clips are bundled, and nothing claims they have been verified. To bundle clips:

1. Pick a native Netherlands Dutch voice in the ElevenLabs Voice Library and listen to it.
2. Run the generator with that voice:

```bash
ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... pnpm audio:generate --targets-only --stage s0
```

3. Listen to a sample of the generated files, then run it again without the filters for everything. The full course is roughly 1,600 unique sentences. Check your ElevenLabs character quota first.

Clips are used automatically and fall back to synthesis if a page blocks extension media.

## Privacy and permissions

- Required permissions: `storage`, `sidePanel` and `scripting`.
- X (`x.com`, `twitter.com`) and LinkedIn (`www.linkedin.com`) are **optional host permissions**, requested per site from Settings. The content script is registered at runtime only for granted sites and unregistered when access is removed. If access is refused, focused practice keeps working.
- The content script listens for scroll, pointer and key events only to learn *that* you are active. It never reads post text, account names or any page content, and never sends anything anywhere. Placement measures only the size of the host's chat docks so the card can avoid them.
- The service worker keeps no timers. Activity time is accrued by the visible, focused tab and saved to storage every 15 seconds. Long gaps start a new browsing session, and one accrual tick is capped so sleep never counts as browsing.

## Known limitations

- **Pronunciation.** Speech synthesis voices differ by device and OS. `nl-NL` is requested and preferred but not guaranteed. Chrome's "Google Nederlands" needs a network connection; offline system voices may sound different. Letter-by-letter spelling items and multi-speaker listening items are read by one voice, with turns separated by pauses. No ElevenLabs clips are bundled yet (see Audio).
- **Curriculum accuracy.** The content is original and was written and then independently reviewed by AI agents for nl-NL correctness. It has not been checked by a qualified human NT2 teacher. Expect occasional unnatural phrasing or an answer variant that is missing. Accepted answers are listed explicitly, so a correct but unanticipated sentence can be marked wrong. The feedback shows the model answer and offers a retry, and the retry does not count against you.
- **What is assessed.** Speaking is learner-led (listen, slow replay, say it aloud) and not assessed. Writing tasks are checked leniently, for required words and length, and always show a model answer. They cannot judge whether a message makes sense. Completing the course does not mean A2 proficiency, and the app does not claim it does.
- **Scheduling.** The intervals (10 min relearn, 1/3/7/14/30/60 days) and the 70% checkpoint pass mark are transparent heuristics, not optimised values. The 8-minute prompt threshold is a configurable starting point.
- **Browser integration.** The in-page prompt, its placement around X's and LinkedIn's chat docks, and keyboard isolation from site shortcuts were tested in the preview harness and unit tests. They were not tested on live x.com or linkedin.com, whose markup changes often. If a site's capture-phase shortcut handlers see keystrokes before the card does, typing in the card could trigger a site shortcut. At window widths under about 1000px, the corner card can overlap the edge of the feed column. Opening the side panel from the in-page card depends on Chrome passing the user gesture through; if it doesn't, practice opens in a tab.
- **Storage.** The side panel and the page write to the same `chrome.storage.local` keys. Writes are queued within each context. Two contexts answering at the same instant could, in theory, overwrite each other's last answer.

## Most valuable next improvement

Get the Dutch content and audio checked by people. In priority order:
1. Have a qualified NT2 teacher review the 272 lessons, starting with Stage 0–1, where errors cost beginners the most.
2. Pick a native Netherlands Dutch ElevenLabs voice and run `pnpm audio:generate`, so every learner hears the same verified pronunciation.

After that, the biggest product improvement would be a live test pass on x.com and linkedin.com to tune the prompt placement and keyboard isolation.
