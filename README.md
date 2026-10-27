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
- **Focused practice (side panel).** Today (reviews due, continue the course, quick practice), Course (stage → module → lesson path with done, current, locked and checkpoint nodes, replay and "Jump here" placement), Review, Progress and Settings. Lessons, reviews and checkpoints run full-panel with the same player as the card.
- **Learning engine.** Each item moves through *introduced → recognition → supported recall → independent recall → transfer*. A correct answer moves it up and pushes the next review out (1, 3, 7, 14, 30, then 60 days). A wrong answer shows the correct form, drops the item two steps, brings it back in 10 minutes and makes its next exercise easier. "Strong" means unaided recall after a gap of a week or more. Missed items return later in the same lesson.
- **Checkpoints.** Cumulative, scored, focused practice only. Missed lessons go back into review. Learners who already know some Dutch can take a stage's final checkpoint as a placement test.
- **Audio.** Standard Netherlands Dutch (`nl-NL`): ElevenLabs clips where the manifest has them (with a slow replay at 0.7×), the browser's nl-NL voice otherwise, and silence with an explanation if there is no Dutch voice.
- **Local only.** Progress, schedules and settings live in `chrome.storage.local`. There is no account, backend or analytics, and no page content is read.

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
  engine/                Pure TypeScript: answers, schedule, exercise choice, plans, progress, selection, summary
  learning/actions.ts    The one bridge from UI to engine + storage (both modes)
  storage/store.ts       chrome.storage.local with parsing, defaults, queued writes and per-item merge
  trigger/browsing.ts    Pure prompt rules: active time, sessions, caps, lease, typing, quiet, snooze
  extension/             Browser wiring with injectable APIs: registration sync, prompt loop, placement,
                         offscreen relay, clip player, messages, guarded clip manifest
  audio/speech.ts        Clip → nl-NL synthesis → silent with a reason
  ui/                    Tokens, motion, components, lesson player, side panel, in-page card
docs/
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

## Privacy and permissions

- Required permissions: `storage`, `sidePanel`, `scripting` and `offscreen` (audio playback for the card).
- X (`x.com`, `twitter.com`) and LinkedIn (`www.linkedin.com`) are **optional host permissions**, requested from the side panel. The in-page script is registered at runtime only for granted sites, unregistered when access is removed, and started in tabs that were already open when access is granted. If access is refused, focused practice keeps working.
- The in-page script listens for pointer, wheel, scroll and key events only to learn *that* you are active. It never reads post text, names or other page content, and sends nothing anywhere. To place the card it measures the size of the feed column and of fixed elements in the bottom corners.
- Only the fonts are exposed to the two sites (web-accessible), because the card's text uses them in the page. Clips play in the offscreen document, so the audio files are not exposed.

## Known limitations

- **Pronunciation.** The ElevenLabs clips cover the sentences in the manifest; anything else falls back to the browser's voice, which differs by device and OS (Chrome's "Google Nederlands" needs a network connection). Without any Dutch voice, audio stays silent rather than using an English voice. Speaking is self-rated, never scored.
- **Curriculum accuracy.** The content is original and was written and reviewed by AI agents for nl-NL correctness. It has not been checked by a qualified human NT2 teacher. Accepted answers are listed explicitly (with accent and typo tolerance), so a correct but unanticipated sentence can be marked wrong; typed and tile exercises offer a retry first. Writing is checked for required words and length only. Finishing the course does not mean A2 proficiency.
- **Scheduling.** The intervals (10-minute relearn; 1/3/7/14/30/60 days), the checkpoint pass mark and the 8-minute prompt threshold are transparent heuristics, not tuned values.
- **Browser integration.** The card was smoke-tested in Chrome for Testing on a local page served at `https://x.com` (placement above X-style buttons, fonts, lease, key isolation, micro-lesson, offscreen audio), not on live x.com or linkedin.com, whose markup changes often. The feed column is found by known selectors (`data-testid="primaryColumn"` on X, `main` on LinkedIn); docks and chat windows are measured as fixed elements in the bottom corners. Capture-phase shortcut handlers on the page see keystrokes before the card stops them. Opening the side panel from the card relies on Chrome keeping the click's user gesture through the message to the background worker (as in Chrome's own sample); if Chrome refuses, the panel opens in a tab. Recording in the side panel depends on Chrome granting microphone access to the extension; without it the speaking step stays listen-and-repeat.
- **Storage.** The side panel and pages write to the same `chrome.storage.local` keys. Writes are queued per page and merged per item, but two pages answering at the same instant could still overwrite each other's newest answer for the same item.

## Most valuable next improvement

Have a qualified NT2 teacher review the Dutch, starting with Stage 0–1, where errors cost beginners the most, and listen through the generated clips. After that, a pass on live x.com and linkedin.com to tune the card's placement selectors and keyboard isolation.
