# Finch-style restyle: plan

Agreed with the owner on 2026-10-28, in an interview of 27 questions (the "Replace the side panel icons" session). The goal is to give every TaalNudge surface the look and feel of [Finch](https://mobbin.com/apps/finch-ios-62797eb5-a84b-44de-8b68-e00178a8bc60/74002971-2ebd-4e9e-a3cd-bd225e19e0e9/screens) (Self-care pet): its grounds, cards, tiles, bars, buttons, toasts and celebrations. Every decision is checked on Mobbin, and every animation follows John Lasseter's principles of animation.

## Status

| Phase | What | Status |
|---|---|---|
| 0 | Commit the work already in the tree | Done (a826a3a) |
| 1 | Shared parts: tokens and components | Done |
| 2 | Side panel shell and the four tabs | Done |
| 3 | Lesson player and end screens | Not started |
| 4 | Onboarding and Settings | Not started |
| 5 | In-page card, toasts and dialogs | Not started |
| 6 | Motion pass | Not started |

## Rules

- **Look and feel only.** No mascots, characters, scene illustrations, emoji sets or anything else that isn't TaalNudge's own. Copy stays, apart from section headings moving to sentence case.
- **Colours.** Keep the Makuteam palette and its roles (`docs/colour-system.md`): one colour, one job; the contrast rules stay. Page grounds use only blues and greys, so a ground never carries a state meaning.
- **Type.** Keep ink text (`#16171D`) and the two fonts, Fredoka (display) and Nunito (body).
- **Local-only runtime.** No CDN, no network, no new host permissions, no new runtime dependencies. Confetti and every other effect is our own CSS and TypeScript. New glyphs come from Phosphor (MIT, see below).
- Never edit `src/curriculum/content/**` or any lesson or item id.
- **Reduced motion.** Follow the system setting. There is no in-app motion switch.
- **Evidence.** Cite a Finch screen for every look-and-feel decision. Where Finch has no equivalent (exercises, the onboarding level picker, the in-page card's placement), cite the closest learning or habit app on Mobbin, as `docs/ux-research.md` already does, and mark it as a gap fill.
- **Every phase:**
  1. `pnpm compile`, `pnpm test` and `pnpm build` pass. UI tests change only where text or structure changes on purpose.
  2. Before/after screenshots from the preview harness go to the owner, without waiting for approval.
  3. Decisions go in `docs/ux-research.md` §13 (with the Finch evidence) and, for colour roles, `docs/colour-system.md`.
  4. Commit the phase on `main`, with a message that names it and only the phase's files staged.
- **Phase 0.** Before any restyle work, commit the uncommitted work already in the tree: the Fluent Forever phases 1–7, the Phosphor icons and the Today redesign. Commit only after the three checks pass. Use one commit, or a few named for what they hold where files don't overlap. Check `git status` first, and leave out anything that must never be committed: secrets, build output, and video work (that lives outside the repo).
- **Context.** Before this session's context passes 55%, update the status table above and hand over to a fresh max-effort session on the same checkout.

## Finch on Mobbin (the evidence)

| Screen | What it shows |
|---|---|
| [Home – goals](https://mobbin.com/screens/6e24c2f2-42f4-42da-9450-5c021b7d3678), [goals list](https://mobbin.com/screens/321091b1-9529-44fe-9e32-c712d124b23f) | Teal ground. Goals as raised white rows: a light circular tile, a bold title, and a square 3D check button with a bottom edge. The tab bar marks Home with a soft rounded tile behind its icon and label. |
| [Home – 1st Adventure](https://mobbin.com/screens/13d6c98d-d362-4ae2-971f-d63601dcd598), [10th Adventure](https://mobbin.com/screens/b4c61bff-c543-4c41-a6d1-77c4643b7296) | A translucent panel on the ground holding a thick white bar with the count inside ("0 / 15", "3 / 20"). A dark translucent pill toast. |
| [Home – goal checked](https://mobbin.com/screens/c773fdf3-6f37-45c1-b527-12874802e923) | Confetti over the list, and two stacked dark pill toasts ("Lee gained +3 energy!"). |
| [Home – adventure completed](https://mobbin.com/screens/71f93784-098b-40b0-a587-e36f8a94ad06) | A completion card on the ground: a tile with a tick badge, a bold title and a muted line. |
| [Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b), [Special Quests](https://mobbin.com/screens/788408da-9386-4c82-8582-f52c1421c2f3) | Mint ground. Bold sentence-case section titles ("Weekly Milestones", "Special Quests"). Saturated rounded-square tiles with a glyph. Thick bars with the count inside. Grey 3D "Hint" buttons. The Quests tab carries the highlight tile. |
| [Daily Quests](https://mobbin.com/screens/0f2995d0-af24-421c-a8ed-a0ec72410940), [with View Event](https://mobbin.com/screens/60c2b3a2-3d78-4fd4-a341-78b26bc99658) | A dashed vertical connector with circles beside raised rows. A green 3D "Claim!", grey 3D arrow buttons, a blue 3D "View Event". A reward card with a full bar. |
| [Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52) | A dialog as a white rounded card: a round grey × top left, then a centred tile, a title, a thick bar, a hint line and an inner "Rewards" card. |
| [Settings](https://mobbin.com/screens/9f3079cb-12d4-464e-a75e-ca3f169520c6), [Preferences](https://mobbin.com/screens/91b90ef0-e7e7-4628-9099-85b10f560668), [App settings](https://mobbin.com/screens/d3556b6d-6e6e-430a-98e1-39bec5c7f947) | Pale blue-grey ground. The back chevron and the centred title sit on the ground. Small grey caps group labels over grouped white cards. A small icon in front of every row, chevrons, helper lines under labels, values on the right. |
| [Settings sheet](https://mobbin.com/screens/3a36f14a-9051-4e06-a980-701963c02e92) | A bottom sheet with a round grey ×, a centred title and grouped rows. |
| [Completing a goal (flow)](https://mobbin.com/flows/2d8a4c8a-20d1-4239-b528-c4fbd26742a7) | An action sheet (Skip, Complete, Snooze). Then a full-screen colour field: confetti, a bar filling to MAX with a glowing cap, "Woohoo!", a translucent reward pill and a big white 3D Continue. |
| [Goal stats (flow)](https://mobbin.com/flows/08a13ba9-335e-43ca-89b2-579180ba37e2) | A tinted head ground, stat pills with icons ("4 this month", "4 all time") and a month calendar of ticks. |

## Decisions

### Grounds and bars
- **One light ground per surface, from the blues and greys only:**

  | Surface | Ground |
  |---|---|
  | Today | light Denim Blue |
  | Course | light Dark Cerulean, a soft teal-blue (the nearest to Finch's home teal) |
  | Review | light Mid Blue |
  | Progress | light Dodger Blue |
  | Settings | pale blue-grey, like Finch's |
  | Lesson player | neutral pale grey-blue |
  | In-page card | the Today ground |

  Each is a light mix with white, so white cards stand out. Check that ink and muted text (`#5A5D69`) keep at least 4.5:1 on every ground. The current `--bg` `#F3F4F7` goes.
- **Header:** the title, streak chip and gear sit on the ground with no white fill and no rule (Finch Settings, Preferences).
- **Tab bar:** stays white, raised off the ground by a soft edge. The selected tab gets Finch's soft rounded tile behind its icon and label, which slides to the new tab. The filled Warm Blue glyph and label stay (`docs/ux-research.md` §11).

### Cards
- **Raised white cards everywhere:** no 1px outlines, one shared soft raised edge underneath, and a radius of 20–24px (Finch goal and quest rows).
- **Tappable cards press down** like the buttons do.

### Buttons
- **Primary:** stays Warm Blue 3D.
- **Secondary and small row buttons:** a light grey or white face with a soft grey bottom edge and an ink label, with no outline (Finch's "Hint" and arrow buttons).
- **Ghost text buttons** stay as they are.
- **On the Warm Blue celebration field**, the main button stays Golden Yellow with an ink label, as colour-system.md sets on Warm Blue.

### Icon tiles
- **Activity tiles:** saturated rounded squares with a Phosphor glyph, one colour per kind of activity, used the same way everywhere (Finch Quests). Green and red never appear in tiles.

  | Activity | Tile | Glyph |
  |---|---|---|
  | Lessons | Warm Blue | white |
  | Reviews | Golden Yellow | ink |
  | Quick practice | Mango Orange | ink |
  | New words | Denim Blue | ink |
  | Ear training | Dark Cerulean | white |
  | Articles (de/het) | Mid Blue | white |
  | Checkpoints | Butterfly Bush (as now) | white |

  These glyph colours all pass the contrasts already listed in colour-system.md.
- **Settings rows:** each gets a small tile in the soft blue/grey style with a Phosphor glyph (Finch Settings), so the saturated colours stay reserved for activities. Switches stay Warm Blue.

### Progress bars
- **Thick and rounded, with the count inside** (Finch Quests, Adventure bar). The fill stays Warm Blue, the progress colour. The count is white over the fill and ink over the track.
- **Applies to** the bars in cards and lists: Continue, modules, stages, words, sound pairs, articles and lessons.
- **The lesson's top progress bar keeps its current style.**

### Headings and type
- **Section titles** on Today, Course, Review and Progress become bold sentence case in the display font, set outside the cards on the ground ("To do today", "This week"), as in Finch Quests.
- **Caps labels stay** for Settings groups (Finch Settings) and for small context lines inside cards (e.g. STAGE 0 · GREETINGS).
- **Type:** ink text and both fonts stay; only sizes and weights change where headings move.

### Toasts and dialogs
- **Toasts** (snooze, quiet mode) become pills in Dark Cerulean, the palette's dark-surface colour, with white text and Undo (Finch home toasts).
- **Sheets and dialogs** (Quit lesson, Reset progress, the ⋯ menu) become raised white cards with a round grey × and a centred title (Finch Quest detail, Settings sheet).

### Per surface
- **Today:** the structure from §12 of the research doc stays; it takes the new ground, raised cards, a section title outside the To do today card, coloured activity tiles and thick bars. The review card stays Golden Yellow.
- **Course:** the structure stays (stage cards with their colour bands, module rows, lesson stepper). It takes raised cards, thick bars, Finch's dashed connector with circles (Daily Quests), soft buttons and motion. Stage bands keep their colours.
- **Review and Progress:** the same content and sections. They take raised cards, bold section titles, thick bars with counts, icon tiles on rows and motion. Progress keeps its 7-day row; no month calendar or stat pills, which would add content.
- **Settings:** pale blue-grey ground, back chevron and title on the ground, caps group labels, grouped raised cards, and a small soft tile on every row.
- **Onboarding:** the steps sit on a ground, with raised level rows and start cards and soft buttons. The welcome screen stays a full Warm Blue field.
- **Lesson player:** the neutral ground, with prompt cards and answer options as raised white cards that press down. The × sits in a round grey button, like Finch's dialogs. The correct and incorrect sheets keep their green and red tints.
- **End screens** (lesson complete, review done, ear training done, new words done, checkpoint result):
  - A full-screen Warm Blue field in Finch's layout: confetti in palette colours, the lesson or module bar filling up, the title, then stats as translucent pills ("Lee got +139 Rainbow Stones" in Finch).
  - The main button stays Golden Yellow with an ink label.
  - Lists such as "Review these" sit in a raised white card below.
- **In-page card:** the full Finch look. It takes the Today ground, raised parts, soft buttons, thick bars, icon tiles, the Dark Cerulean toast and the Finch-style menu. Its micro-lesson ends on a full Warm Blue celebration field inside the card.

## Motion (Lasseter's principles)

John Lasseter, *Principles of Traditional Animation Applied to 3D Computer Animation* (SIGGRAPH 1987), lists eleven principles:
1. Squash and stretch
2. Timing
3. Anticipation
4. Staging
5. Follow-through and overlapping action
6. Straight-ahead and pose-to-pose action
7. Slow in and out
8. Arcs
9. Exaggeration
10. Secondary action
11. Appeal

The owner chose **playful and quick**:
- Most moves take 150–400ms; a celebration takes up to about 1.2s.
- Exaggeration is saved for celebrations.
- Motion goes on presses and check-offs, screen changes, progress and counts, and celebrations.
- Use and extend the tokens in `src/ui/motion.css`: `--t-tap`, `--t-quick`, `--t-base`, `--t-slow`, `--t-scene`, `--ease-spring`, `--ease-out` and `--stagger`.

| Moment | Principles | Motion |
|---|---|---|
| Press: buttons, raised cards, To do today lines, answer options, tabs | Squash and stretch, timing, follow-through | Down: the face drops into its edge and squashes (about `scale(1.015, 0.96)`) in `--t-tap` with an ease-out. Release: it springs back past rest and settles (`--ease-spring`, about 180ms). `.tn-btn` already does this; extend it to everything raised. |
| Tick: a line turns done, an option turns correct | Squash and stretch, follow-through, a little exaggeration | The tick disc pops 0.6 → 1.12 → 1 in about 320ms, and the ✓ draws in just after it (overlap). |
| Tab switch | Anticipation, arcs, slow in and out, staging, overlap | Anticipation: the tile dips 2px and squashes for about 60ms. It then slides to the new tab on a shallow arc (about 260ms, ease-in-out) and settles with a small stretch. The glyph pops from outline to fill. The new tab's cards settle in from 8px below with a 40ms stagger (about 220ms, ease-out). |
| Sheets and dialogs | Anticipation, staging, slow in and out | The backdrop fades in first. The sheet dips about 4px, then rises with a small overshoot (about 280ms). The exit is quicker, with an ease-in (about 180ms). |
| Toast | Slow in and out, secondary action | The pill rises from below with a small overshoot (about 240ms). Its timer bar drains while it shows. It leaves with an ease-in drop and fade (about 160ms). |
| Progress and counts | Slow in and out, follow-through, secondary action | Bars fill with an ease-out and a 3–5% overshoot (about 400ms), and the existing glint stays. The count inside ticks up with the fill. The streak chip bumps (about 1.15×) with one flame wobble when the streak grows. |
| Celebration field: end screens and the in-page card's end | Staging, exaggeration, straight-ahead action, arcs, overlap, appeal | Within about 1.2s: the field arrives (about 200ms); the title pops with squash and stretch; the bar fills to its new value with follow-through; 24–40 confetti pieces in palette colours burst on parabolic arcs, spin and fall (straight-ahead, about 900ms); the stat pills arrive one after another (80ms stagger); the main button lands last. |
| Reduced motion | — | Every moment above becomes an opacity fade, as `motion.css` already does globally. Confetti and sparks are hidden entirely rather than left still: today the sparks stay parked on top of the ✓ in the Correct sheet. |

## Phases

| Phase | What changes | Screenshots |
|---|---|---|
| 0. Commit existing work | Commit the tree as described under Rules, after compile, test and build pass. | None |
| 1. Shared parts | **Tokens in `theme.css`:** the surface grounds, the card raise, tile colours, toast colour.<br>**`components.css`:** raised card, soft secondary button, thick progress bar with the count inside (`ProgressBar` gains an optional count), an icon tile component, round × button, dialog card.<br>**Fix while here:** `.tn-audio svg { width: 52% }` resolves narrower than intended inside the grid button (18.7×23.9px in the 48px button), so audio glyphs draw at about 70% of the planned size. | `preview/` style tile and Today |
| 2. Shell and tabs | Header on the ground; white raised tab bar with the sliding tile; Today, Course, Review and Progress as decided above. | `?state=today`, `caughtup`, `fresh` and `path`; every tab |
| 3. Player and end screens | Player ground, raised prompts and options, round ×, soft buttons; full Warm Blue celebration fields with confetti, bar fill, pills and the yellow button. | A learn card, multiple choice, the feedback sheets, every end screen |
| 4. Onboarding and Settings | Ground, raised level rows and start cards, soft buttons; Settings with its pale ground, caps labels and row tiles. | Every onboarding step; Settings, including snooze open and the reset dialog |
| 5. In-page card, toasts, dialogs | The card's full Finch look and in-card celebration; Dark Cerulean toasts; Finch dialogs for Quit, Reset and the ⋯ menu. | `/nudge.html`: card, menu, micro-lesson, end, toast |
| 6. Motion pass | Everything in the motion table, checked with reduced motion on and off. | A short screen recording or frame strips of each moment, plus a final before/after set of every page |

## For the build session

- **Preview harness:** `.claude/launch.json`, config `taalnudge-preview-alt` on port 5299. Port 5199 may be held by another session.
  - Panel seeds: `/panel.html?state=` `today`, `caughtup`, `fresh`, `path`, `recall`, `pictures`, `articles`, `notes`, `corrections`.
  - The in-page card is at `/nudge.html`.
- **Screenshot scripts:** copied to the shared notes folder `…/side-session-notes/local_ef634bd7-f405-44ae-b78c-f8295d31cb18/tools/`. They drive headless Chrome through the DevTools protocol.
  - `shoot.mjs`: every tab, Settings, a lesson, and the card, its menu and micro-lesson; pass `more` for a learn card and feedback.
  - `shoot-today.mjs`: Today in three states, full height and at 720px.
  - `compare.py` and `sheet.py`: before/after sheets.
  - `gen-phosphor.mjs`: regenerates `src/ui/components/phosphor.ts` from `@phosphor-icons/core` 2.1.1. Download the npm tarball into a scratch folder and check its integrity first.
  - Earlier before/after shots are in that folder's `icon-screenshots/` and `today-screenshots/`.
- **Mobbin tools are deferred** (`search_screens`, `search_flows`); load them with ToolSearch. When a result carries the `ai_usage_notice`, show its text to the owner word for word.
