# TaalNudge v2: final handoff report

Spec §15, as of 2026-10-27 (branch `rebuild/v2`). Audio generation (phase 8) stopped at the ElevenLabs monthly quota with 1,270 of the course's 3,115 clips made; `docs/audio-research.md` covers the voices and the quota, `docs/audio-qa.md` the clip QA.

## 1. What was built

A Manifest V3 Chrome extension (WXT, React 19, TypeScript) that teaches Dutch from A0 to A2 in two modes that share one schedule and one store of progress:

- **Micro-learning on X and LinkedIn.** After a configurable stretch of active browsing, a corner card offers a 2-minute break: Learn now / Not now / ⋯ (snooze, quiet mode). Learn now grows the card into a micro-lesson (a new phrase and two exercises, or a short review) with the same feedback as the side panel.
- **Focused practice in the side panel.** Onboarding with level and placement, Today, Course path, Review, Progress and Settings; lessons, reviews and checkpoints in a full-panel player with every exercise kind.
- **The learning engine** (item stages, spaced intervals, relearning, checkpoints, placement) in pure TypeScript, and a 272-lesson original curriculum with a validator.
- **Audio**: ElevenLabs clips where the manifest has them, nl-NL synthesis otherwise; in-page clips play through an offscreen document.
- Every UI decision is cited in `docs/ux-research.md` (Mobbin); colours follow the Makuteam palette roles in `src/ui/theme.css`, documented in `docs/colour-system.md`; motion follows Lasseter's principles in `src/ui/motion.css` with reduced-motion support.

## 2. Project structure and important files

See README "How the pieces fit". The files that matter most:

- `src/learning/actions.ts`: the only bridge from the UI to the engine and storage, used by both modes.
- `src/engine/*`: schedule, exercise choice, plans, progress, selection, summary.
- `src/trigger/browsing.ts`: when the card may appear (pure rules).
- `src/extension/*`: browser wiring with injectable APIs (registration sync, prompt loop, placement, offscreen relay, clip player).
- `entrypoints/*`: thin WXT entrypoints (background, content, side panel, offscreen).
- `src/ui/panel/PanelApp.tsx`, `src/ui/nudge/NudgeApp.tsx`, `src/ui/player/SessionPlayer.tsx`: the two surfaces and the shared player.
- `docs/rebuild-plan.md` (status per phase), `docs/ux-research.md`, `docs/curriculum-plan.md`.

## 3. Curriculum

4 stages, 56 modules, 272 lessons (206 core, 52 practice, 14 checkpoints), 1,024 learning items and 1,524 authored exercises (688 multiple choice, about 100 of them dialogue replies; 497 typed; 173 fill-the-gap; 112 word order; 54 short writing; 204 listening; 66 with a reading passage), plus generated drills per item. Stage 0 Foundations (pre-A1): 8 modules, 49 lessons. Stage 1 Everyday A1: 20, 100. Stage 2 Towards A2: 17, 71. Stage 3 A2 communication: 11, 52. All content is original and bundled; the validator reports 0 issues and checks coverage of every objective in `src/curriculum/objectives.ts`. Lesson-by-lesson plan: `docs/curriculum-plan.md`.

## 4. Commands

```bash
pnpm install
```

```bash
pnpm test
```

```bash
pnpm compile
```

```bash
pnpm build
```

Then `chrome://extensions` → Developer mode → Load unpacked → `dist/chrome-mv3` (Chrome 116+). The toolbar icon opens the side panel.

## 5. What works end to end, and what is limited

Verified:
- `npx vitest run`: 143 tests pass (curriculum validator, engine, storage, audio, UI flows for the panel, the card and the player, and the extension wiring). `npx tsc --noEmit` is clean. `pnpm build` passes; the manifest has no required host permissions and no static content scripts.
- The unpacked build in Chrome for Testing: the service worker starts; the side panel renders onboarding and follows storage changes; the in-page script is registered only for the granted origin; on a page served at `https://x.com` (a local stand-in feed), the card appears after the interval, 24px from the right and 16px above X-style buttons, clear of the feed column, with the brand fonts; it holds the cross-tab lease; keys typed in it do not reach the page; Learn now runs the micro-lesson in the card; a clip plays through the offscreen document; no console errors. Every side panel screen and the card were also checked visually in the preview harness (third session).

Limited or not verified:
- Live x.com and linkedin.com were not tested (they need a logged-in account; their markup changes often). Placement relies on known feed selectors and on measuring fixed elements in the bottom corners.
- Opening the side panel from the card was not exercised in a real browser window (headless Chrome has no side panel UI). It follows Chrome's documented pattern; if Chrome refuses, the panel page opens in a tab.
- Recording in the side panel depends on Chrome granting the extension microphone access; without it the speaking step stays listen-and-repeat.
- Audio: 1,270 of 3,115 clips (41%) are generated, covering every target phrase, learning item and listening exercise, and 39 of the 266 lines in dialogue-reply exercises. Dialogues, examples and model answers have no clips yet, so they use the browser's voice until `pnpm audio:generate` resumes after the quota resets. Speech-to-text flagged 42 clips that still need a listen by ear (`docs/audio-qa.md`).

## 6. Known limitations

- **Pronunciation**: browser voices vary by device and need a Dutch voice; speaking is self-rated, not scored.
- **Curriculum accuracy**: written and reviewed by AI agents, not yet by a qualified NT2 teacher; accepted answers are explicit lists (with accent and typo tolerance), so a correct but unexpected answer can be marked wrong; writing is checked for required words and length only.
- **Scheduling**: intervals, the checkpoint pass mark and the prompt threshold are heuristics, not tuned values.
- **Browser**: page shortcuts registered in the capture phase see keys before the card stops them; the side panel and pages share `chrome.storage.local`, with queued, per-item merged writes, but two pages answering the same item at the same instant can still overwrite each other.

## 7. Most valuable next improvement

A review of the Dutch by a qualified NT2 teacher (Stage 0–1 first) together with a listen-through of the generated clips. After that, a session on live x.com and linkedin.com to tune the card's placement selectors and keyboard isolation.
