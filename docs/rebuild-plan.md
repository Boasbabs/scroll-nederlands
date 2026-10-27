# TaalNudge v2 rebuild: status and plan

Branch `rebuild/v2` (v1 is on `main`). This file is the handoff between sessions: update the status table when a phase is done.

## Owner's requirements for the rebuild

- Reimplement the spec (the A0→A2 Dutch Chrome extension) because v1 felt weak.
- Use the brand palette: Sunset Orange `#f36b2e`, Mango `#f59a1e`, Ocean Water `#c4e7e5`, Brilliant Blue `#253c96`, Oiler Navy `#19244e`, plus the board's chunky rounded type and organic squiggle pattern.
- **No invented UI/UX**: every UI/UX decision is validated with the Mobbin MCP and cited in `docs/ux-research.md`.
- **Every phase is tested before the next phase starts** (unit/integration tests, plus a visual check in the preview harness for UI).
- Audio is researched and generated with ElevenLabs (keys in `.env.local`, never printed).
- Animations follow John Lasseter's application of the 12 animation principles (see `src/ui/motion.css`), with `prefers-reduced-motion` respected.
- Sessions hand off to a fresh session at 45% context, continuing at max effort.

## Status

| Phase | State | Evidence |
|---|---|---|
| Curriculum model v2 + migration + validator | Done | `tests/curriculum` (16 tests) |
| Curriculum curation (items, dialogue-reply exercises, nl-NL review) | Done (6 agents, first session); `src/curriculum/content/**` is free to edit. 272 lessons, 1,024 learning items (down from 1,153: fragments, grammar labels, echo glosses and "x → y" pairs replaced by recallable chunks), 1,524 exercises (choice 688, type 497, cloze 173, order 112, write 54), about 100 new "What do you reply?" dialogue exercises (`choice` + `context`, mostly transfer stage), about 250 exercises pointing `items` at the secondary item they drill. Glosses: nouns as "the X" with de/het in the Dutch; register tags in `english` when items in one module would share a gloss; usage in `note`. Some exercises reference other modules' items (e.g. `s2-travel-transfer/overstappen`), so the validator flags their removal | `tests/curriculum`: validator reports 0 issues |
| Learning engine (schedule, selection, plans, progress, summary, answers) | Done | `tests/engine` (35 tests) |
| Storage, browsing trigger, shared actions | Done | `tests/storage` (18 tests) |
| Audio playback module | Done | `tests/audio` (7 tests) |
| Audio voice research | Done: Serge de Beer reads the main voice and Roos the second speaker in dialogues, on `eleven_v4` with `language_code: "nl"` | `docs/audio-research.md` |
| UX research (Mobbin) | Done: ~110 cited screens/flows (§7–§8 added while building; the `ai_usage_notice` returned by later searches was shown to the owner each time); composed/rule items are marked in the doc | `docs/ux-research.md` |
| Design tokens, motion, core components, style tile | Done, colour roles aligned with the research (correct = Ocean sheet + blue button; miss = Sunset 12% tint + navy button, no red; progress blue; Mango = come back to this), visually checked | `preview/style-tile.tsx` on http://localhost:5199 |
| Lesson player, side panel, nudge | **Done** (built by the second session, tested and checked by the third). Engine helpers, `src/ui/{env,format,sfx,hotkeys}`, player (all step and exercise kinds, feedback sheet with retry, per-pair match grading, quit and shortcut sheets, end screens), panel (onboarding, Today, Course, Review, Progress, Settings), nudge (card, ⋯ menu, toast with Undo, micro session), preview pages. Every screen visually checked in the preview (see "Phase 6: checks and fixes") | `tests/ui/panel.test.tsx` (10), `tests/ui/nudge.test.tsx` (7), `tests/ui/player.test.tsx` (4), `tests/engine` (44); 106 tests passed then, 4 skipped (`tests/audio/clips.test.ts` waited for the clips) |
| Entrypoints (background, content script, offscreen audio) | **Done** (fourth session). `src/extension/` holds the wiring with injectable APIs (registration sync, prompt loop, placement, offscreen relay, clip player, messages, guarded clip manifest); `entrypoints/` stays thin. See "Phase 7: what was built" | `tests/extension` (33 tests: registration 6, placement and measuring 10, prompt loop 12, clip player and offscreen relay 5); `pnpm build` manifest checked |
| ElevenLabs generation + verification | **41% done** (first session): 1,270 of 3,115 clips. Target phrases, learning items and listening exercises are complete, plus 39 of the 266 lines in dialogue-reply exercises; dialogues, examples and model answers have none yet. The run stopped cleanly at the monthly quota. After the reset, `pnpm audio:generate` resumes with the remaining 1,845 clips (64,473 characters), then `pnpm build`. Speech-to-text flagged 42 clips that need a listen by ear | `tests/audio/clips.test.ts` (the manifest matches the course and every clip file exists); `docs/audio-qa.md` |
| Build, Chrome smoke test, README | **Done** (fourth session): `pnpm build` passes; unpacked build smoke-tested in Chrome for Testing (16/16 checks, see "Phase 9: what was checked"); README rewritten from `curriculumStats`; final report in `docs/final-report.md` | `npx vitest run` 143 pass; `npx tsc --noEmit` clean |

## Architecture (new code)

```
src/curriculum/
  types.ts        Lesson model v2: per-lesson learning `items` (main item first), exercise kinds
                  choice | match | cloze | order | type | write, `items` refs, dialogue `context`, `strict`
  assemble.ts     Pure assembly: stage/module order, global item ids "lesson-id/key", exerciseItemIds()
  index.ts        Bundles content/<stage>/<module>.ts → `curriculum`, `course` (CurriculumIndex)
  validate.ts     Structure, references, answers, leaks, coverage of objectives.ts, curriculumStats()
  structure.ts, objectives.ts, content/**   Data (4 stages, 56 modules, 272 lessons, 1,024 items)
src/engine/       Pure TS, no React/browser
  answers.ts      normalizeAnswer, checkTyped (accent/typo tolerance, `strict`), checkOrder, checkWriting, diffTokens
  schedule.ts     Item stages introduced→recognition→supportedRecall→independentRecall→transfer;
                  intervals 1/3/7/14/30/60 days; wrong → step −2, back in 10 min, next exercise easier;
                  early practice never pushes an item out; "strong" = unaided recall after a ≥7-day gap
  exercises.ts    Review exercise choice (authored at the needed stage, not the last one seen) and
                  generated drills for chunks (meaning choice, listen, tiles, type, dictation, match)
  plan.ts         SessionPlan steps: learn → chunks → dialogue → speak → exercises (focused);
                  learn + 2 exercises (micro); reviews; checkpoints
  progress.ts     completeLesson / recordReviewResults / completeCheckpoint (misses applied last), mergeProgress
  selection.ts    getNextActivity: due reviews first, then the next lesson on the path; checkpoints only in focused
  summary.ts      Lessons x/y, stage/module progress, items new/learning/strong, due now, 7-day forecast
src/storage/store.ts   chrome.storage.local wrapper: parsing with defaults, queued writes, per-item merge
src/trigger/browsing.ts Prompt rules: active time (sleep-capped ticks), sessions, 3 prompts/session,
                  one prompt across tabs (lease), typing, quiet mode, snooze, failed-item memory
src/learning/actions.ts createLearning(): the only bridge UI → engine + storage (both modes)
src/audio/speech.ts     Clip (ElevenLabs manifest) → nl-NL synthesis → silent with reason; dialogue voices a/b
src/ui/theme.css        Tokens and colour roles; bundled fonts (public/fonts, OFL)
src/ui/motion.css       Lasseter-based keyframes and easing/timing tokens, reduced-motion fallback
src/ui/components.css   Buttons (tactile edge), audio, progress, chips, tip, options, tiles, input, sheet, band
src/ui/components/      Icon, Button, AudioButton (+SpeechProvider), ProgressBar, Decor (pattern, wordmark, sparks)
src/ui/env.tsx          UiEnv context: learning, course, prefs/setPrefs, sfx, surface (panel|card), now, openSidePanel, permissions, canRecord
src/ui/hotkeys.ts       Enter / 1–9 / Backspace / Esc / ? (window in the panel, scoped to the card on host pages)
src/ui/player/          SessionPlayer (queue, retries labelled Review, combo, results → learning.finish), ExerciseStep
                        (Check → FeedbackSheet; first try graded), exercises.tsx (choice, match, cloze, tiles with FLIP arc,
                        type, write), steps.tsx (learn, key phrases, dialogue, speak with MediaRecorder, recall), SessionComplete
src/ui/panel/           PanelApp (shell, tabs, sessions), Onboarding, screens.tsx (Today, Review, Progress), CourseScreen, SettingsScreen
src/ui/nudge/           NudgeCard (card, ⋯ menu, toast), NudgeApp (states + NudgeController), preview.ts
preview/                Dev harness (vite): style tile, panel.html?state=…, nudge.html (fake feed, shadow root), fake-chrome.ts
```

v1 code (UI, entrypoints, old engine) was removed on this branch; it is in git history on `main`. The 463 v1 clips and their manifest were never committed; they were moved out of `public/audio/` to the first session's scratchpad (`…/scratchpad/v1-audio/`), which is temporary.

## Next phases, in order

### Phase 6: lesson player, side panel, nudge (UI)
Build strictly from `docs/ux-research.md` decisions (cite them in code comments only where non-obvious). Use the tokens, motion classes and components already in `src/ui`.
- `src/ui/env.tsx`: context with `learning`, `speaker`/`SpeechProvider`, `prefs`, `mode`, sound effects, `openSidePanel`.
- `src/ui/player/`: `SessionPlayer` runs a `SessionPlan` (top bar: close, `ProgressBar`, combo), steps `LearnCard`, `ChunksCard`, `DialogueCard`, `SpeakCard` (listen, record with MediaRecorder where allowed, play back, self-rate; never graded), exercises `Choice` (incl. listen-only and dialogue `context`), `Match`, `Cloze`, `Order` (tiles move along an arc via FLIP), `TypeAnswer` (incl. dictation), `Write`; `FeedbackSheet` (correct/wrong, `diffTokens`, explanation, "Try again" for typed/tiles; first try is graded); `CompleteCard` (3 stats, missed phrases with audio, next action). Results → `learning.finish(plan, results)` with `exerciseId: planned.exerciseId`.
- `src/ui/panel/`: onboarding (2–3 steps incl. per-site permission request), Home/Today, Path (stages → modules → lessons; locked/current/done; checkpoints), Progress (summary), Settings (interval slider 3–60, per-site toggles, quiet mode, snooze, autoplay, speech rate, sound effects, reset with confirm).
- `src/ui/nudge/`: corner card (Learn now / Not now / ⋯ Snooze 30 min, 1 hour, until tomorrow, Quiet mode), expands into a micro session, snooze toast with Undo. Never covers the feed column, never steals focus or scroll, keyboard isolated from the host page.
- Keyboard: Enter = Check/Continue, 1–5 = options, Esc = close (focused practice).
- Tests: Testing Library flows (learn → answer → feedback → complete persists progress; wrong answer shows correct answer and retry; nudge buttons call trigger/prefs correctly). Visual check of every screen in `preview/` (add `panel.html` and `nudge.html` with a fake feed; mock chrome APIs with in-memory storage).

### Phase 6: checks and fixes (third session)
- **Tests**: `tests/ui/panel.test.tsx` (onboarding asks `permissions.request(['x','linkedin'])` inside the click and saves sites, interval and `onboarded`, then starts lesson 1; denied or skipped access keeps going with prompts off; A1 learners start the Stage 0 placement; Today caught-up block vs review card; Settings toggles, chips, snooze/Resume, refused access; reset asks first, Esc and `Keep my progress` keep everything; Course done/current/locked/checkpoint nodes, replay, `Jump here` placement) and `tests/ui/nudge.test.tsx` (`Not now`/`×`, ⋯ menu items and focus, snooze + Undo, quiet mode + Undo, the toast leaving after `TOAST_MS`, Learn now → micro session → `rememberFailed`, Open side panel, keys only inside the card, nothing to practise).
- **Visually checked** in `preview/` (port 5299): Course path and the "Current lesson" pill, Review tab (due and caught up), Progress (rows, item lists, upcoming tiles), Settings, reset dialog, every step and exercise kind (learn, key phrases, dialogue, speaking, choice with passage, listen-and-choose, dialogue reply, cloze with hint, tiles, typed with typo tolerance, dictation, short writing, recall card), correct/wrong/retry sheets, Review chip, combo, lesson/review/checkpoint (pass and fail) end screens, quit and `?` sheets, onboarding prompts step, and `nudge.html` (card, ⋯ menu, toast, expanded micro session, compact sheets, end line).
- **Fixed**: interval and snooze chips wrapped at 360–380px (now share one line); the Snooze row had no affordance and only its label was clickable (whole row + chevron, Mobbin-validated, `docs/ux-research.md` §8); the zero "Strong" ring drew a dot; `Start review (n)` promised everything due instead of the batch of 10; Today read "Checkpoint: Checkpoint: …"; the writing counter read "21/12 words" past the minimum; a wrong choice underlined every word of the correct answer instead of the words that differ; the card's end screen stretched its buttons to fill the expanded card; generated match drills put whole sentences on 48px tiles (now items ≤ 32 characters; `MATCH_TILE_CHARS`, test in `tests/engine/learning.test.ts`); module rows had a run-on accessible name.
- **Preview harness**: `panel.html?…&lesson=<id>` puts that lesson next on the path; `state=recall` makes reviews show recall cards; the panel frame is a containing block, so fixed dialogs stay inside it as in the real panel. The page reloads on engine or `nudge.css` edits (inline CSS). Automation keys: `?` must be sent with `dispatchEvent` (the key tool does not produce it).
- Known gaps for phase 7: the side panel entrypoint must import `nudge.css` (the onboarding shows the real prompt card); the in-page card's `--tn-max-height`, placement and collision rule (§1.11) belong to the content script; the preview pins the card at a fixed spot, so it can overlap its fake feed in narrow windows.

### Phase 7: entrypoints
`entrypoints/background.ts` (side panel opens on action click; `chrome.scripting.registerContentScripts` only for granted optional origins from `src/sites.ts`, re-sync on `permissions.onAdded/onRemoved` and startup; offscreen document for clip playback requested by the content script), `entrypoints/sidepanel/`, `entrypoints/content/` (WXT `createShadowRootUi`, `cssInjectionMode: 'ui'`; inject `@font-face` for `TN Fredoka`/`TN Nunito` into the host document with `browser.runtime.getURL('/fonts/…')`; activity ticks every 15 s using `src/trigger/browsing.ts`; typing detection; lease), `entrypoints/offscreen/`. `wxt.config.ts`: permissions `storage`, `sidePanel`, `scripting`, `offscreen`; optional host permissions; web-accessible `fonts/*` and `audio/*`. Tests for registration sync and the content controller with fakes.

Audio clips for phase 7 (agreed with the first session, which generates them):
- Manifest `src/audio/clips.json`: `{ voices: { a: { id, name }, b: { id, name } }, model, settings, clips: Record<text, "audio/<hash>.mp3">, clipsB: Record<text, path> }`. Keys are `clipKey(text)` from `src/audio/speech.ts`; the shape is compatible with `ClipManifest`. Pass it as the speaker's `manifest`.
- It may not exist yet: guard the import, e.g. `Object.values(import.meta.glob<ClipManifest>('../audio/clips.json', { eager: true, import: 'default' }))[0] ?? { clips: {} }`.
- Paths are relative to the extension root (served from `public/`). Side panel: play with `browser.runtime.getURL(path)`. X/LinkedIn: play through the offscreen document, because page CSP can block extension media. Slow replay is playbackRate 0.7 on the same clip (`SLOW_RATE`).

### Phase 7: what was built (fourth session)
- `wxt.config.ts`: permissions `storage`, `sidePanel`, `scripting`, `offscreen`; `minimum_chrome_version` 116 (`sidePanel.open`, `runtime.getContexts`); X and LinkedIn only in `optional_host_permissions`; web-accessible `fonts/*` only. **Deviation:** `audio/*` is not web-accessible, because the card's clips play in the offscreen document (an extension page); exposing them would only let sites probe for the extension.
- `entrypoints/background.ts`: `setPanelBehavior({ openPanelOnActionClick: true })`; `createRegistrationSync` re-syncs on install/update (and starts the script in open granted tabs), startup, `permissions.onAdded` (starts it only in tabs of the newly granted origins, so a card in use on another site is not replaced) and `onRemoved`; runs serialised; `updateContentScripts` when the matches change. `tn:open-side-panel` calls `sidePanel.open({ tabId })` before any await: the content script's click gesture carries through `runtime.sendMessage`, as in Chrome's `cookbook.sidepanel-open` sample (content-script button → message → `sidePanel.open({ tabId: sender.tab.id })`); the docs list "a user gesture on an extension page or content script". If Chrome refuses anyway, the panel page opens in a tab. `tn:play-clip` → `createOffscreenRelay` (one document even for concurrent clips, retries while it starts listening, replies when the clip ends).
- `entrypoints/content/index.tsx`: `registration: 'runtime'` with no `matches` (WXT adds a runtime script's `matches` to the required host permissions). **Deviation:** `cssInjectionMode: 'manual'` with the CSS inlined (`?inline`) and passed to `createShadowRootUi`, instead of `'ui'`: WXT moves `@font-face` to the host document, where `/fonts/…` would resolve against x.com, so the font URLs are rewritten to `runtime.getURL('/fonts/')` first; this also means no content CSS file has to be web-accessible. `isolateEvents: true` stops key events at the shadow root. `createPromptLoop` (15 s ticks, `recordActivity`/`decidePrompt`/`claimPrompt`/`keepPrompt`/`releasePrompt`/`rememberFailedItems`, typing = editable focus or a key in the last 5 s, lease renewal while shown, untouched card removed when another tab holds the prompt or quiet mode/snooze/site-off arrives) and `placeCard(measureHost(…))` per §1.11. The card's speaker sends clips to the background; synthesis stays in the page.
- `entrypoints/sidepanel/`: imports the six stylesheets (including `nudge.css`), `createStore(browser.storage.local)`, the clip player on `runtime.getURL`, `SitePermissions` over `browser.permissions` (`originsFor` in `src/sites.ts`), `subscribe` on `storage.onChanged` for progress and prefs, `canRecord: true`.
- `entrypoints/offscreen/`: plays `tn:offscreen-play` with an `<audio>` element (`preservesPitch`, `defaultPlaybackRate` and `playbackRate`), replies when it ends.
- Small additions: `keepPrompt` in `src/trigger/browsing.ts` (hold the lease without counting a prompt), `siteForHost`/`originsFor` in `src/sites.ts`, a left-corner `transform-origin` for the expanded card in `nudge.css`.

### Phase 9: what was checked (fourth session)
- `pnpm build` → `dist/chrome-mv3`: manifest has no `content_scripts` and no required host permissions; `side_panel`, `background.service_worker`, `offscreen.html`. Content script and side panel bundles are about 1.6 MB each (the curriculum is bundled in both).
- Unpacked smoke test (Playwright driving Chrome for Testing, script outside the repo): the build copy got `https://x.com/*` as a required host permission to stand in for the permission dialog, and requests to `https://x.com` were answered with a local three-column feed with X-style Grok/Chat buttons. Passed: service worker; side panel onboarding; panel follows storage changes; content script registered for the granted origin only; card appears after the interval; 24px from the right; 16px above the dock; not over the feed; copy; brand fonts load from the extension into the page; lease held; keys typed in the card never reach the page's `keydown` listener; Learn now grows the card to 520px in its corner; a clip plays through the offscreen document; no errors in the panel or the page. Screenshots were checked by eye.
- Not checked: live x.com and linkedin.com (logged-in pages), the side panel opening from the card's `Open side panel` (headless Chrome has no side panel UI), microphone recording in the side panel.
- Note for phase 8 (resolved): `public/audio/` held the v1 clips (12-hex names) next to the new ones, and the build copies every file in it, referenced or not. The v1 clips were moved out, so it now holds only the 1,270 clips the manifest references.

### Phase 8: ElevenLabs audio (first session)
**Outcome:** 41% generated (see the status table). The final voices and model differ from the provisional ones in the plan below: Serge de Beer (main) and Roos (second voice) on `eleven_v4` with `language_code: "nl"`; `docs/audio-research.md` explains why.

Needs a valid `sk_…` key in `.env.local`. Run the prepared research harness (first session's `scratchpad/tools/research.mjs`; results feed `docs/audio-research.md`), confirm voices (provisional: Ruth `YUdpWWny7k5yb4QCeweX` main, Serge de Beer `UNBIyLbtFB9k7FKW8wJv` second voice; model `eleven_multilingual_v2`, stability 0.6, similarity 0.75, speed 0.9, `mp3_44100_64`). Rewrite `scripts/generate-audio.ts` for the v2 course: collect every Dutch string learners hear (target phrases, items, examples, dialogue lines with voice b for the second speaker, `audioText`, cloze/type model answers shown with audio), cache by hash(text+voice+model+settings), resumable, loudness-normalise (ffmpeg loudnorm ≈ −18 LUFS), verify each clip with ElevenLabs speech-to-text and flag mismatches; manifest `src/audio/clips.json` `{ voices, model, clips, clipsB }`. Slow replay = playbackRate 0.7 on the same clip. Character budget ≈ 56–90k.

### Phase 9: build and ship
`pnpm compile`, `pnpm test`, `pnpm build`; smoke-test the unpacked build (side panel page, content script on a page mapped to x.com if feasible); rewrite README (counts from `curriculumStats`, commands, limitations: pronunciation, curriculum accuracy, scheduling heuristics, browser integration, storage races); update `docs/curriculum-plan.md` counts; final report per spec §15.

## Conventions
TypeScript `type` aliases, `function` declarations for named functions, `Array<T>`, pure engine code without React or browser APIs, comments only where they add a reason. Tests live in `tests/<area>`. Don't commit unless the owner asks. Keep `pnpm vitest run` and `npx tsc --noEmit` green at the end of every phase.
