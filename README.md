# TaalNudge

A Chrome extension (Manifest V3) that teaches Dutch from absolute beginner (A0/pre-A1) through A1 to A2. You learn in 2-minute breaks offered while you browse X and LinkedIn, or in a focused-practice side panel. Both use one schedule and one store of progress.

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

Load it in Chrome (116 or later):

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose `dist/chrome-mv3`.
3. Click the TaalNudge toolbar icon. The side panel opens on the welcome screen.
4. The onboarding asks your level, then offers prompts on X and LinkedIn. **Turn on prompts** opens Chrome's permission dialog for those sites only. You can change this later in **Settings → Browsing prompts**.

Other commands:

| Command | What it does |
|---|---|
| `pnpm dev` | WXT dev mode with auto-reload in a fresh Chrome profile |
| `pnpm compile` | Type-check (`tsc --noEmit`) |
| `pnpm validate:curriculum` | Validate the curriculum (also part of `pnpm test`) |
| `pnpm zip` | Zip the build for the Chrome Web Store |
| `pnpm vite --config preview/vite.config.ts --port 5299` | UI preview harness: `/panel.html?state=fresh\|today\|caughtup\|path\|recall` (side panel with a seeded learner) and `/nudge.html` (in-page card on a fake feed) |
| `pnpm audio:generate` | Generate the ElevenLabs clips (needs a key in `.env.local`; see `docs/audio-research.md`) |
| `pnpm audio:generate --recorded` | Process a speaker's recordings from `recordings/<speaker>/` into `public/audio/recorded/` with ffmpeg (no API calls) |

## What it does

- **Curriculum.** 272 original lessons in 4 stages and 56 modules, bundled as data (`src/curriculum/content/**`, plan in `docs/curriculum-plan.md`):

  | Stage | Level | Modules | Lessons |
  |---|---|---|---|
  | 0 · Foundations | pre-A1 | 8 | 49 |
  | 1 · Everyday A1 | A1 | 20 | 100 |
  | 2 · Towards A2 | A1→A2 | 17 | 71 |
  | 3 · A2 communication | A2 | 11 | 52 |

  - 206 core lessons, each built around one target phrase or pattern with its translation, word breakdown, examples and a tip.
  - 52 practice lessons that recombine earlier material in a new situation, often as a dialogue.
  - 14 scored checkpoints.
  - 1,024 learning items (recallable phrases and chunks, nouns with de/het) and 1,524 authored exercises: 688 multiple choice (about 100 of them "What do you reply?" dialogue turns), 497 typed, 173 fill-the-gap, 112 word order and 54 short writing tasks. 204 are listening items and 66 have a reading passage. Drills for each item (meaning choice, listen and choose, tiles, typing, dictation, match pairs) are generated on top.

  The validator (`pnpm validate:curriculum`) checks ids, required fields, answers, references and prerequisites, answer leaks and coverage of every objective in `src/curriculum/objectives.ts`. It reports 0 issues.
- **Micro-learning on X and LinkedIn.** After about 8 minutes of active browsing (5, 8, 15 or 30 in Settings), a card appears 24px from the right edge, 16px above the site's own bottom-right buttons. It offers **Learn now**, **Not now**, and a ⋯ menu with **Snooze** (30 min, 1 hour, until tomorrow) and **Quiet mode**; snoozing shows a toast with **Undo**. **Learn now** grows the card into a micro-lesson (a new phrase and two quick exercises, or a short review). The card never covers the feed column or an open chat: it moves to the bottom-left, or waits for the next interval. It never takes focus, waits while you type, keeps its keystrokes away from the site's shortcuts, and appears in one tab at a time, at most three times per browsing session.
- **Focused practice (side panel).** Today (reviews due, continue the course, new words, ear training, quick practice), Course (stage → module → lesson path with done, current, locked and checkpoint nodes, replay and "Jump here" placement), Review (with writing waiting for correction), Progress and Settings. Lessons, reviews and checkpoints run full-panel with the same player as the card.
- **Learning engine.** Each item moves through *introduced → recognition → supported recall → independent recall → transfer*. A correct answer moves it up and pushes the next review out (1, 3, 7, 14, 30, then 60 days). A wrong answer shows the correct form, drops the item two steps, brings it back in 10 minutes and makes its next exercise easier. "Strong" means unaided recall after a gap of a week or more. Missed items return later in the same lesson.
- **Checkpoints.** Cumulative, scored, focused practice only. Missed lessons go back into review. Learners who already know some Dutch can take a stage's final checkpoint as a placement test.
- **Fluent Forever layers.** Methods from Gabriel Wyner's *Fluent Forever*, added beside the course. The lessons and their ids are unchanged, and `docs/fluent-forever-plan.md` has the plan, the status and as-built notes. Each layer adds learning items, and the same scheduler reviews them all.
  - **Basic words.** 625 everyday words in 21 themes, in `src/words/`. 469 are new; the other 156 are course words counted by reference. Today's "New words" card teaches up to 5 at a time, or 3 in a browsing break. The daily limit is 5 by default, and Settings offers off, 3, 5 or 10. Batches mix themes and never come before due reviews.
  - **Ear training.** 12 minimal-pair contrasts such as a/aa, ui/ij and g/h, in `src/sounds/`. Today's "Ear training" card introduces one per session with both sounds, a tip and word pairs to play, then runs six "Which word did you hear?" trials. After that each contrast comes back in reviews, by ear only.
  - **Pictures and cues.** Recall drills avoid the English where they can. In order, the cue is the learner's own note when it uses the word, a picture, the lesson's situation for its main phrase, or a lesson example with the phrase blanked. Six photos ship so far, credited in Settings → Image credits, and `pnpm images:fetch` turns the owner's picks into more. In the side panel a learner can give a word their own picture from a Dutch image search. Cards show the Dutch first and keep the English behind "Show meaning"; Settings → Learning → Show translations turns that off.
  - **De or het.** Each of the 485 singular nouns gets its own "De or het?" item, which the scheduler reviews apart from the noun's meaning. The item starts when the learner meets the noun, and nouns met before this layer existed catch up at 10 a day. Every het-word carries one image the learner picks, such as "made of gold" or their own words, and cards and answers show it.
  - **Make it yours.** Learn and word cards let the learner write one line about their own life with the word or phrase. Reviews show the line as a cue, or blank the word out of it when the line uses it. When an item slips for the fourth time and has no note or own picture yet, the answer sheet offers "Make it yours" once.
  - **Corrections.** Under a writing task's model answer, "Copy for correction" puts the text and a one-line request on the clipboard, to send to a tutor or a Dutch friend. The Review tab keeps the text until the learner pastes in the corrected version. Each change becomes a fill-the-gap item, with what the learner first wrote as the hint.
- **Audio.** Standard Netherlands Dutch (`nl-NL`): a human recording where one exists, then the ElevenLabs clips where the manifest has them (with a slow replay at 0.7×), the browser's nl-NL voice otherwise, and silence with an explanation if there is no Dutch voice. The new basic words and the minimal pairs use the browser's voice until the next ElevenLabs run. `pnpm audio:generate --plan` counts what is left without calling the API, and with the course it comes to 68,503 characters. The minimal pairs are meant for human recordings, and none exist yet. A speaker's takes go in `recordings/<speaker>/`, one file per word, named after it, such as `maan.wav`. `pnpm audio:generate --recorded` runs them through the clips' ffmpeg chain into `public/audio/recorded/`. With two or three speakers, each replay of a word brings the next voice. The learner's own notes and corrections always use the browser's voice.
- **Local only.** Progress, schedules, settings, notes, drafts and corrections live in `chrome.storage.local`, and the learner's own pictures in IndexedDB. There is no account, backend or analytics, and no page content is read.

## How the pieces fit

```
entrypoints/
  background.ts          Opens the side panel on the toolbar icon; registers the in-page script only for
                         granted sites (re-synced on install, startup and permission changes); relays clips
                         to the offscreen document; opens the side panel from the card
  content/index.tsx      In-page card: shadow root, fonts, 15 s activity ticks, placement, NudgeApp
  sidepanel/             Side panel page (PanelApp)
  offscreen/             Offscreen document that plays clips for the card
src/
  curriculum/            Lesson model, stage/module structure, objectives, content, validator, stats
  words/                 The 625 basic words: themes, references to course words, placement beside the course
  sounds/                Minimal pairs for ear training, one learning item per contrast
  articles/              The de/het item of every singular noun
  corrections/           Corrections of the learner's writing: word diff, items added at runtime
  images/                Bundled picture manifest and credits, the learner's own pictures (IndexedDB), lookup
  engine/                Pure TypeScript: answers, schedule, exercise choice (cues and the picture, pair,
                         article and correction drills), plans, progress, selection, summary, article
                         catch-up, items that keep slipping
  learning/actions.ts    The one bridge from UI to engine + storage (both modes)
  storage/store.ts       chrome.storage.local with parsing, defaults, queued writes and per-item merge
  trigger/browsing.ts    Pure prompt rules: active time, sessions, caps, lease, typing, quiet, snooze
  extension/             Browser wiring with injectable APIs: registration sync, prompt loop, placement,
                         offscreen relay, clip player, messages, guarded clip and take manifests
  audio/speech.ts        Human take → clip → nl-NL synthesis → silent with a reason
  ui/                    Tokens, motion, components, lesson player, side panel, in-page card
scripts/
  generate-audio.ts      ElevenLabs clips by group (target, items, words, pairs, …); --plan counts, no API calls
  recordings.ts          Human takes from recordings/<speaker>/ → ffmpeg → public/audio/recorded/ (--recorded)
  fetch-images.ts        The owner's picture picks → license-checked 480×360 WebP files and the manifest
  ts-resolve.mjs         Lets Node's type stripping load the app's extensionless imports (the scripts use it)
docs/
  fluent-forever-plan.md The Fluent Forever layers: ground rules, status, design and as-built notes per phase
  rebuild-plan.md        Status of the v2 rebuild, phase by phase
  ux-research.md         Mobbin research behind every UI decision
  colour-system.md       The Makuteam palette: one job per colour, usage rules, contrast, evidence
  curriculum-plan.md     Lesson-by-lesson plan and assumptions
  audio-research.md      Voice research for the ElevenLabs clips
  final-report.md        Final handoff report
tests/                   Curriculum, engine, storage, audio, UI flows, extension wiring
preview/                 Dev-only harness that runs the UI in a normal tab with in-memory storage
```

The engine, trigger rules and curriculum have no React or browser dependencies. The side panel and the in-page card both go through `createLearning()`, which reads and writes the same stored state, so both modes always agree.

`indexCurriculum` places the basic words, sound contrasts and article items beside the course, and `createLearning()` merges in the learner's corrections at runtime. Each has a permanent id in its own namespace, `w-…`, `p-…`, `…#article` or `c-…`, so the scheduler, reviews and progress treat it like any course item. The 272 lessons, their order and their ids stay as they were.

## Privacy and permissions

- Required permissions: `storage`, `sidePanel`, `scripting` and `offscreen` (audio playback for the card).
- X (`x.com`, `twitter.com`) and LinkedIn (`www.linkedin.com`) are **optional host permissions**, requested from the side panel. The in-page script is registered at runtime only for granted sites, unregistered when access is removed, and started in tabs that were already open when access is granted. If access is refused, focused practice keeps working.
- The in-page script listens for pointer, wheel, scroll and key events only to learn *that* you are active. It never reads post text, names or other page content, and sends nothing anywhere. To place the card it measures the size of the feed column and of fixed elements in the bottom corners.
- Only the fonts are exposed to the two sites (web-accessible), because the card's text uses them in the page. Clips play in the offscreen document, and the card gets pictures from the background worker as data URLs, so the sites cannot load the audio or the pictures.
- "Add a picture" opens a Google Images search in a new tab when the learner clicks it. The extension shrinks the picture they paste and keeps it in IndexedDB on this computer. "Copy for correction" puts text on the clipboard when the learner clicks it, and the extension sends nothing anywhere.

## Known limitations

- **Pronunciation.** The ElevenLabs clips cover the sentences in the manifest; anything else falls back to the browser's voice, which differs by device and OS (Chrome's "Google Nederlands" needs a network connection). Without any Dutch voice, audio stays silent rather than using an English voice. Speaking is self-rated, never scored.
- **Curriculum accuracy.** The content is original and was written and reviewed by AI agents for nl-NL correctness. It has not been checked by a qualified human NT2 teacher. Accepted answers are listed explicitly (with accent and typo tolerance), so a correct but unanticipated sentence can be marked wrong; typed and tile exercises offer a retry first. Writing is checked for required words and length only. Finishing the course does not mean A2 proficiency.
- **Scheduling.** The intervals (10-minute relearn; 1/3/7/14/30/60 days), the checkpoint pass mark and the 8-minute prompt threshold are transparent heuristics, not tuned values.
- **Browser integration.** The card was smoke-tested in Chrome for Testing on a local page served at `https://x.com` (placement above X-style buttons, fonts, lease, key isolation, micro-lesson, offscreen audio), not on live x.com or linkedin.com, whose markup changes often. The feed column is found by known selectors (`data-testid="primaryColumn"` on X, `main` on LinkedIn); docks and chat windows are measured as fixed elements in the bottom corners. Capture-phase shortcut handlers on the page see keystrokes before the card stops them. Opening the side panel from the card relies on Chrome keeping the click's user gesture through the message to the background worker (as in Chrome's own sample); if Chrome refuses, the panel opens in a tab. Recording in the side panel depends on Chrome granting microphone access to the extension; without it the speaking step stays listen-and-repeat.
- **Fluent Forever layers.** The basic-word list needs the same NT2 review as the course, articles and spellings included, and the minimal pairs need a Dutch speaker's check. Only 6 of the planned pictures ship so far. Until a Dutch speaker records the pairs, the browser's voice may blur the vowel length a pair is meant to train. Three rules are simple heuristics: "Make it yours" appears on the fourth lapse, article items catch up 10 a day, and the corrections diff compares word by word, ignoring case and punctuation.
- **Storage.** The side panel and pages write to the same `chrome.storage.local` keys. Writes are queued per page and merged per item, but two pages answering at the same instant could still overwrite each other's newest answer for the same item.

## Most valuable next improvement

Have a qualified NT2 teacher review the Dutch, starting with Stage 0–1, where errors cost beginners the most, and listen through the generated clips. After that, a pass on live x.com and linkedin.com to tune the card's placement selectors and keyboard isolation.
