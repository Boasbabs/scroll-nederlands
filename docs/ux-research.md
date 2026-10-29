# TaalNudge UX research (Mobbin-validated)

Product rule: we do not invent UI/UX. Every decision here cites Mobbin screens or flows that were opened and checked by eye (searched 2026-10-27 with the Mobbin MCP). Where no single screen covers an idea, the decision is assembled from cited parts and marked *(composed)*. Behaviour rules that have no visual evidence are marked *(rule)*.

- The side panel (360–420px) is the width of a phone, so iOS learning-app patterns carry over directly. The in-page card and the host pages use web references.
- No search in the first round returned an `ai_usage_notice`; later searches did (§7, §8), and each notice was shown to the owner.
- Busuu: Mobbin showed no Busuu screens (the query matched an unrelated app), so Busuu is not cited.

---

## 1. Decisions summary (build from this)

### 1.1 Shell, type, spacing, keyboard
- Design at 360px: 16px gutters give a 328px column. Spacing steps are 4/8/12/16/24px. At 420px the column widens; there is never a second column.
- Shell: a 48px app bar (screen title on the left; streak chip and settings gear on the right), then the scroll area, then a 56px bottom tab bar with four tabs: **Today · Course · Review · Progress**. The Review tab shows a due-count badge. Lessons, reviews, checkpoints and onboarding take over the whole panel, with no tab bar and `×` at top-left.
- Icons (§11): Phosphor, bold weight at rest. The tabs are a house, an open book, a target and a bar chart; the selected tab switches to the fill weight in Warm Blue. Settings is an eight-tooth gear, and the streak and combo flames are filled.
- Flow screens (onboarding, lesson, review) have one primary button: full width (328×48px) and pinned in a bottom action zone with 16px padding. A secondary action goes directly beneath it as a 44px outline or text button. Cards on Today can each carry their own button.
- Type: a chunky, rounded display face, used only for screen titles (22px), the target Dutch phrase (28px) and large numbers. Body text is 16px, secondary text 14px, and labels are 12px caps.
- Tactile controls: buttons have a 12px radius and a 4px bottom edge in a darker tone. Option rows and tiles have a 2–3px edge. When pressed, the face drops by the height of the edge. Disabled controls are flat.
- Keyboard: `1`–`4` pick an option (each option shows its number badge). `Enter` checks, then continues *(rule: standard form submit; no lesson screen on Mobbin shows this hint)*. `Backspace` removes the last placed tile. `Esc` closes a sheet or menu; in a lesson it asks "Quit lesson?". `?` lists the shortcuts. The nudge card only handles keys while focus is inside it *(rule: X and LinkedIn use single-key shortcuts)*.

### 1.2 Colour roles (summary; the usage guide, contrast table and evidence are in `docs/colour-system.md`, see §4 and §10)
- Palette: the Makuteam board. Each colour has one job and keeps it everywhere. Type is ink `#16171D` (17.9:1 on white) or white; muted text `#5A5D69` (6.5:1). Never set text in Golden Yellow, Seaweed Green, Denim Blue or Mango Orange (all under 3:1 on white).
- **Primary CTA**: Warm Blue fill, white label (5.5:1), darker Warm Blue bottom edge. **Secondary**: a soft face on a grey bottom edge with an ink label and no outline (white on a ground, grey inside white cards; §13.1). **Links**: Warm Blue (5.5:1).
- **Selected** (before Check): Denim Blue tint fill, 2px Mid Blue border, and the number badge filled Mid Blue with a white digit.
- **Correct**: Seaweed Green tint sheet with ink text, ✓ (ink) in a Seaweed Green disc, and a Seaweed Green `Continue` with an ink label (6.3:1).
- **Incorrect**: Flush Mahogany tint sheet with ink text. The ✕ (white) sits in a Flush Mahogany disc. The differing token is bold with a Flush Mahogany underline. `Got it` and `Try again` are Flush Mahogany with a white label (5.5:1).
- **Look here** (Golden Yellow): the review card (ink text and the ink `Review now`), the `REVIEW` and `Recommended` chips, tip callouts (Golden tint), the lesson-complete badge. **Checkpoints**: Butterfly Bush disc with a white flag.
- **Progress** bars are Warm Blue on an ink-8% track. **Streak/combo, current lesson, still learning, due badge**: Mango Orange (tint chips with an orange flame and an ink count). **Disabled**: ink-8% fill, ink-45% label, no edge.
- **Brand hero** surfaces (welcome, lesson complete): Warm Blue with a Dodger Blue squiggle, white text, and Golden Yellow for the main button and the badge. **Dark surfaces** (tooltips, the `Start` bubble, the `Current lesson` pill): Dark Cerulean.
- **Stages** each own a light top-row colour for the band at the top of their card: Golden Yellow, Seaweed Green, Denim Blue, Mango Orange.

### 1.3 Onboarding (three steps, then lesson 1)
- Every step has a back arrow, a 3-segment progress bar and one question. The primary button stays disabled until a choice is made.
- **Welcome**: full-bleed brand hero with the greeting "Hallo · Hoi · Dag" in display type, one line ("Learn Dutch in 2-minute breaks while you browse") and `Get started`.
- **Level + start point**: "How much Dutch do you know?" offers three rows with signal-bar icons: *I'm new to Dutch* (A0), *I know some words* (A1), *I can handle basic conversations* (A2). Below it, "Where should we start?" offers two cards: **Start from scratch** (with a `Recommended` badge) and **Take the Stage N checkpoint** (to jump ahead).
- **Browsing prompts**: shows a live mock of the nudge card, checkboxes **X** and **LinkedIn** (both on), interval chips (5 · **8** · 15 · 30 min) and "You can change or pause this anytime in Settings". The primary `Turn on prompts` opens Chrome's permission dialog. The text button `Not now` skips. If the user skips or denies, onboarding continues and Settings shows "Prompts are off · Turn on".
- The last CTA is `Start lesson 1`.

### 1.4 Today, Review tab, caught-up state
- Today, from top to bottom (redesigned in §12):
  1. App bar: "Today", streak chip, gear.
  2. **Review card**, only while reviews are due: Golden Yellow fill; "12 reviews due" in 20px ink display type; the ink button `Review now` (white label).
  3. **Continue card**: white with a 1px light grey border. Shows "Stage 1 · Food, drinks and cafés", the lesson title, a progress bar and the primary `Continue`. With nothing due, it is the first card.
  4. **To do today**: one white card with a caps label and a list of 64px lines. Each line has a 40px tile, a bold title that says what to do, a muted count, a thin bar where there is a count, and a chevron: `Learn 5 words` (Basic words · 8 of 625 met), `Hear a or aa` (Ear training · 0 of 12 sound pairs), `Quick practice` (2 min). A finished line swaps the tile for a ✓ in a Seaweed Green disc and has no chevron: `All caught up` heads the list when nothing is due, and `New words` reads "Done for today" once the day's batch is learned.
  5. Stats row: two cells in one bordered row, "Lessons 14/270" and "Strong words 86".
- Review tab: a due count in 40px display type, `Start review (12)` and the secondary `Practice anyway`.
- Caught up (no reviews due): on Today, the ✓ line at the top of To do today ("Next review in 3 h · 8 items"); a learner with nothing in review yet gets no line. The body of the Review tab shows a 48px ink ✓ in a Seaweed Green disc, "All caught up" (18px), "Next review in 3 h · 8 items" in muted text, and the secondary `Continue course`.

### 1.5 Course path (4 stages → ~56 modules → ~270 lessons)
- The Course tab is a vertical list of four **stage cards**, each headed by a band in its stage colour (§1.2): "Stage 0 · Foundations" plus a white CEFR chip, a progress bar and "5/8 modules". The current stage is expanded and the others collapsed. Future stages carry a `Jump here` link that opens that stage's checkpoint.
- Inside a stage are **module rows** (accordions, 56px): number, title, "3/6", a thin bar and a chevron. An expanded module shows a **lesson stepper**: a 2px vertical connector with 32px nodes.
  - Done: Warm Blue disc with a white ✓. Tapping it replays the lesson.
  - Current: white disc with a 3px Mango Orange ring, a Dark Cerulean "Start" label bubble above it, and an inline primary `Start` or `Continue`.
  - Locked: ink-8% disc with an ink-45% lock. Not tappable.
  - Checkpoint: Butterfly Bush disc with a white flag, labelled "Checkpoint" in Butterfly Bush. Placed wherever the curriculum defines one (`s0-check`, `s1-check`, …).
- On open, scroll so the current lesson is in view. When it scrolls out of view, a floating pill `↑ Current lesson` appears.

### 1.6 Lesson player
- Top bar (48px): `×` on the left (40px target), a 10px rounded progress bar, and a combo chip on the right (flame + count) that appears after three correct answers in a row.
- Below the bar, 16px down: the instruction (18px bold, left-aligned), then the prompt, then the answer area. `Check` is pinned at the bottom and stays disabled until there is an answer. It is never hidden.
- **Learn card**, top to bottom:
  1. Label `NEW PHRASE`.
  2. Dutch phrase (28px display).
  3. Audio row: play (48px, Warm Blue) and slow/turtle (40px).
  4. Translation (16px muted).
  5. Word breakdown: tokens with dotted underlines; tapping or hovering shows the meaning. For multi-word phrases, add a 2-column mini table (Dutch | English).
  6. 1–2 examples: speaker, Dutch with the target word in bold Warm Blue, English muted.
  7. Tip callout.
  8. `Continue`.

  If Autoplay is on, the phrase audio plays when the card opens.
- **Multiple choice**: a prompt card (Dutch + speaker), then 2–4 option rows (52px, 8px gaps, number badge on the left).
- **Listen-and-choose**: a centred 64px play button and 48px slow button, then option rows. The text link `Can't listen now` skips audio-only items for the rest of the session *(duration is a rule)*.
- **Match pairs**: two 160px columns of 4–5 rows of 48px tiles, Dutch on the left and English on the right, both shuffled. Tap one tile in each column. A match turns both tiles Seaweed Green tint with a green ✓, after which they go disabled. A mismatch shows the incorrect style on both, then resets *(rule: no mismatch frame on Mobbin)*. `Continue` enables once every pair is matched.
- **Fill the gap (typed)**: the sentence card has an inline input in the gap (2px underline, Dodger Blue when focused) with the translation underneath. A 💡 hint button reveals the first letter *(what it reveals is a rule)*.
- **Word tiles / sentence builder**: two ruled answer lines on top and the tile bank below (wrapping, 8px gaps, 40px tiles). Tapping a tile moves it to the end of the answer and leaves a ghost slot in the bank. Tapping a placed tile sends it back. `⌫` removes the last tile.
- **Type the Dutch**: an English prompt card, then a multi-line input that is auto-focused, then the text link `Don't know`. Answers typed without diacritics are accepted, and feedback shows the accented form *(rule)*.
- **Dictation**: an audio header (play + slow), then an input, then `Check` *(composed)*.
- **Dialogue**: the partner's bubble sits on the left (32px avatar, Dutch text, speaker, and a translate icon that reveals the English). Below it, "Choose the reply" offers 2–3 numbered options. On Check, the chosen reply joins the chat as a right-aligned bubble with ✓ or ✕.
- **Short writing**: a situation card with an English cue, then a 3-line input with a character count, then `Check`. Check reveals a "Model answer" box (ink-4% fill) and a checklist ("Did you use *ik woon*?"), followed by the self-rating buttons *(composed)*.
- **Speaking** (never auto-assessed):
  1. Phrase card with play and slow buttons.
  2. A 72px Warm Blue mic button labelled "Tap to record". While recording it becomes a stop button with a live waveform and a timer.
  3. Review state: two rows, **Native ▶** and **You ▶**, plus `Record again` *(composed)*.
  4. "How close was it?" with `Not yet` / `Sounds right` (feeds scheduling).

  The text link `Can't speak now` skips speaking items for the session.

### 1.7 Answer feedback
- On Check, the answer locks and a sheet slides up over the action zone: full width, 16px top radius, 16px padding.
- **Correct**: Seaweed Green tint sheet, green ✓ disc, "Correct!" (20px bold, ink), an optional "Meaning: …" line, and the Seaweed Green `Continue`. The chosen option turns Seaweed Green tint with a green border and a ✓ badge.
- **Incorrect**: Flush Mahogany tint sheet, red ✕ disc and "Not quite" (ink).
  - Content: "Correct answer:" with the differing tokens bold and underlined. Typed answers also get a muted "Your answer:" line above, with the wrong token underlined. Then "Meaning:".
  - Buttons: the Flush Mahogany `Got it`, plus the outline button `Why?`, which expands a 1–3 line explanation inside the sheet.
  - Options: the wrong one gets the Flush Mahogany tint, a Flush Mahogany border and ✕. The right one gets a green border and ✓.
- **Typed and tile exercises**: the first miss shows "Not quite" with `Try again` (primary) and the text button `Show answer`. Only the second miss shows the full incorrect sheet.
- Missed items come back later in the same lesson, labelled with a `REVIEW` chip (ink text on Golden Yellow).
- Copy: "Correct!" and "Not quite". No exclamation mark on errors, and no guilt.

### 1.8 Lesson complete, review session, checkpoint result
*(Restyled as Finch's celebration field in §13.3: the stats are pills and the checkpoint ring is a score bar.)*
- **Lesson complete**: a brand-hero band with the mascot or illustration, then "Lesson complete!" and "4 new phrases · Groeten".
  - Three stat cells in one bordered row, about 104px each: `Correct 7/8 · New 4 · Time 3:12`.
  - A "Review these" list of missed phrases, each with a speaker.
  - The primary `Continue` (next lesson) and the secondary `Back to course`.
- **Review session**: the same player, with the header "Review · 12 left".
  - Recall card: "How do you say this in Dutch?", tap to reveal (Dutch + audio), then "Did you remember it?" with `No` / `Yes`.
  - Other due items reuse the exercise types.
  - The end screen shows "Strong 9 · Still learning 3" pills, `Done`, and `Review 3 again`.
- **Checkpoint result**: "12/15" in 40px display type with the percentage, plus a two-segment ring (Seaweed Green correct, Flush Mahogany incorrect) with counts.
  - Pass: "Stage 0 complete. Stage 1 is unlocked." with the primary `Continue`.
  - Below threshold: "Almost. You need 12/15." with the primary `Review mistakes (3)` and the secondary `Retake later`.

### 1.9 Progress (one short scroll; no leaderboards, no charts beyond bars)
1. Streak row: seven day-circles, with days studied stamped by a Mango Orange disc and an ink ✓.
2. Words and phrases by state, as three rows (ring, count, label, chevron): **New** (ink-45% ring), **Learning** (Mango Orange ring), **Strong** (Seaweed Green ring). Tapping a row lists its items.
3. Lessons: "14 of 270" with a bar, then four stage rows with bars.
4. Upcoming reviews: four tiles in one row, **Today · Tomorrow · This week · Later**, each with a count.

### 1.10 Settings (grouped cards; label left, control right, 14px muted helper text below; changes apply instantly with no Save button)
- **Browsing prompts**:
  - `Prompts on X` and `Prompts on LinkedIn` (toggles).
  - `Prompt after` (chips: 5 / 8 / 15 / 30 min).
  - `Quiet mode` (toggle, "No prompts until you turn this off").
  - `Snooze`: a row that opens 30 min / 1 hour / Until tomorrow. While a snooze is active, the row reads "Snoozed until 15:30 · Resume".
- **Audio**: `Autoplay audio` (toggle), `Audio speed` (chips: Slow / Normal), `Sound effects` (toggle).
- **Progress**: `Reset progress` (a Flush Mahogany text row) opens a dialog:
  - Title: "Reset all progress?"
  - Body: "Lessons and reviews go back to the start. This can't be undone."
  - Buttons: the primary `Keep my progress` and the text button `Reset everything`.

### 1.11 In-page nudge (x.com, linkedin.com)
- **Trigger**: after about 8 minutes of active browsing (the `Prompt after` setting), only while the tab is visible and the user isn't typing in a composer *(rule)*. The card stays until the user acts; it never auto-dismisses *(rule)*.
- **Placement**: `position: fixed`, 24px from the right edge. Its bottom sits 16px above the host's floating UI in the bottom-right corner: on X, the stacked Grok/Chat buttons; on LinkedIn, the Messaging bar. Measure these at runtime. With no host dock, the bottom offset is 20px.
- **Collision rule** *(rule)*: the card must never intersect the feed column, an open host chat window or X's Spaces dock. If it would, use bottom-left (over the left column, where LinkedIn shows its own toasts). If that also collides, skip this interval. There is no backdrop and the card never takes focus.
- **Collapsed card**: 340px wide (`min(340px, 100vw - 48px)`), 16px radius, 16px padding, soft shadow, 1px light grey border. Brand mark and `Learn now` in Warm Blue, `Not now` in ink.
  - Header: brand mark (20px), "Dutch · 2 min" (12px muted) and `×`.
  - Body: "Ready for a 2-minute Dutch break?" (16px bold), then a preview line "*Goedemorgen* · Good morning" (14px).
  - Action row, left to right: `Learn now` (primary, 40px), `Not now` (text), `⋯` (icon).
- **`⋯` menu**:
  - `Snooze 30 min · until 15:30`
  - `Snooze 1 hour`
  - `Snooze until tomorrow`
  - divider
  - `Quiet mode`
- **`Not now` and `×`** dismiss the card for this interval.
- **Snooze or Quiet mode**: the card shrinks into a one-line toast in the same corner, "Snoozed until 15:30 · `Undo` · ×", which auto-dismisses (engineering default 6s; Mobbin can't show timing). `Undo` restores the card.
- **Learn now**: the card grows upward in place, still 340px wide, to at most `min(520px, viewport height − bottom offset − 24px)`.
  - Header: "Dutch", step progress "1/4" and `×`.
  - Content: one compact learn card plus 2–3 quick exercises (multiple choice, listen-and-choose, 3-pair match). It uses the same feedback colours, shown as a compact sheet inside the card.
  - Finish: "Done · 3/3 correct · next review tomorrow", with `Done` (primary) and `Open side panel` (secondary).

---

## 2. Side panel surfaces

### 2.1 Onboarding
- [Duolingo – Onboarding flow](https://mobbin.com/flows/ac9d2f58-868d-4fd3-a79c-9655ce6b1522): back arrow and progress bar on top. The mascot asks "How much French do you know?" over five rows with signal-bar icons. "Where would you like to start?" offers *Start from scratch* (`RECOMMENDED`) or *Find my level*. `CONTINUE` stays grey until a choice is made.
- [Speak – Select your level](https://mobbin.com/screens/48983641-92b2-40aa-b088-429ed85c39ac): a level picker with an A2 CEFR badge on each card and a one-line can-do description ("A2: Can make plans…").
- [Babbel – Onboarding flow](https://mobbin.com/flows/78aaba88-e477-4ba8-b178-a7c7ac7bf41e): a multilingual greeting splash ("Hello Salut Hej Ciao"), "Why do you want to learn Dutch?" as bordered multi-select rows, an orange `Next`, and a flat grey disabled state.
- [Vocabulary – Get words throughout the day](https://mobbin.com/screens/e992e0e3-bea7-4f37-b9bc-5dd096236d7d): permission priming that shows a mock of the notification, a frequency stepper and a time window, then `Allow and Save`.
- [Duolingo – Reminder priming](https://mobbin.com/screens/817844ed-f7df-4645-b18b-a9803879821f), [Babbel](https://mobbin.com/screens/6822290a-66cc-4897-a4cf-c265bab0f9d2), [Brilliant](https://mobbin.com/screens/c33921fd-b1a6-4f0e-8c59-70b4121a18c7): a benefit line before the system dialog. Babbel adds "You can always turn them off in Settings"; the secondary is `Maybe later` / `No thanks`.
- [Arcade – Chrome extension steps](https://mobbin.com/screens/a460f97f-5faf-49f8-be34-91a3b864b0db): explains an extension with numbered steps, a mock of its popup, and an opt-out line.

**What they share:** one question per screen under a progress bar; level expressed as plain can-do statements; a recommended default start; and, before any permission request, a preview of what the user will receive, a reassurance line and a soft decline.

**Decisions:** three steps as in §1.3. The level rows copy Duolingo's signal-bar rows, with CEFR chips as in Speak. The prompts step uses the Vocabulary/Brilliant "show the thing" mock (our real nudge card) plus Babbel's reassurance line and soft decline. Babbel's greeting splash is the model for "Hallo · Hoi · Dag".

### 2.2 Today and Review
- [Babbel – Today](https://mobbin.com/screens/4362b601-1544-43d7-aa4a-20a178466c8b): greeting, a flame badge on a peach pill, the course label "Newcomer (A1)", a large yellow "Time to review" card with a black `Review now`, then a row of next-lesson cards.
- [Brilliant – Home](https://mobbin.com/screens/9ae00b56-ed93-44fc-9d1f-0e608ce6e78d): course title, then a card with the current lesson row and `Continue course`.
- [Mimo – Practice](https://mobbin.com/screens/0fc493a3-6e4a-4571-ad2c-28e0cbce2908): a `DAILY REVIEW` chip with duration and `Start now`, past-topic cards, and a two-stat row (Activities done · Time on tasks).
- [Speak – Widgets](https://mobbin.com/screens/91ee559c-d53f-4bff-b5cd-f853f38cf4c3): an "UP NEXT" lesson card, and a "4 days" streak with orange check circles.
- [Quizlet – Home](https://mobbin.com/screens/e3067f6b-ea92-4688-a482-22cb28c31b31): a single "Let's keep going!" card with `Keep reviewing` over a squiggle illustration.

**What they share:** one dominant resume card with a single button, review given its own warm card, streak as a small chip top-right, and at most two or three small stats.

**Decisions:** the order in §1.4. The Golden Yellow review card follows Babbel's yellow review card and dark button. The Continue card follows Brilliant and Speak. The stats row follows Mimo. The Review tab and its badge follow Babbel's Review tab (badge "21" on the Learning plan, §2.3). Settings sits behind a gear in the app bar, as on [Uxcel Go – Profile](https://mobbin.com/screens/90071f3f-7e49-4430-9431-475af3dcf00a) and [Headspace – Profile](https://mobbin.com/screens/bb0004ec-e553-4e4d-a10e-1e21e59c8781).

### 2.3 Course path
- [Duolingo – Sections](https://mobbin.com/screens/82371c0c-d233-45af-9fc7-26f96c2cde8f): stacked section cards with a progress bar, unit range, a target-language line, and `JUMP HERE` on future sections.
- [Babbel – Learning plan](https://mobbin.com/screens/832f5742-a189-409a-8bb1-06f5ed82bb60): an A1 badge in a progress ring and "8/12 lessons completed". A done lesson shows ✓ and `Repeat`; a "Time to review" card carries `Review now`; the Review tab badge reads 21.
- [Uxcel Go – Levels](https://mobbin.com/screens/96c930e2-480b-49a1-ba69-5132a1c5b2b2): collapsible "LEVEL 1/2" sections, a `LOCKED` tag, and lesson cards with check circles. A list layout that fits a narrow column.
- [Headspace – Today timeline](https://mobbin.com/screens/c7fcbf0d-0846-43a4-a0b5-89e681b6f4ce): a dashed vertical connector where done is a ✓, current an orange dot and upcoming an empty circle.
- [Alan – Program timeline](https://mobbin.com/screens/6c47d7b0-f8a0-479b-9ea6-6b2f89693d0d): a vertical timeline with a "Checkup" node, the current session ringed, and locked sessions badged.
- [Life Reset – Path](https://mobbin.com/screens/cb3e87ef-1183-486f-bd20-2f465417d486) and [done state](https://mobbin.com/screens/0d8849b9-6253-472b-9067-2b5f40c648b8): an orange ring on the current node, grey locks; done nodes become filled discs with ✓.
- Also: [Speak – unit divider with ↑ button](https://mobbin.com/screens/9ed82b20-9d9d-40ba-8a9b-285b7c94866a), [ElevenReader – "Back to current" pill](https://mobbin.com/screens/5c627524-cd63-4845-885a-77c7dace046c), [Noom – "Goal achieved!" milestone in a stepper](https://mobbin.com/screens/4928d8b8-548f-41b8-a673-e9a5af552657).

**What they share:** stage-level bars; lesson-level icons (done ✓, current ring, locked grey plus lock); milestones as distinct nodes; a way back to the current item.

**Decisions:** §1.5. We use a list stepper (Uxcel Go, Alan, Headspace) rather than Duolingo's zigzag, because 270 lessons need scanning, not decoration. Duolingo's section cards and `JUMP HERE` become the stage level. Alan's "Checkup" and Noom's milestone set the checkpoint node. Speak and ElevenReader give the "↑ Current lesson" pill.

### 2.4 Learn card
- [Babbel – Dutch "Dag."](https://mobbin.com/screens/75cab2bc-d7e2-4d02-9fce-ed9854d12874): speaker beside the boxed Dutch word, English small underneath, an orange left rule, a tinted "Heads up!" tip with ×, and `Continue` pinned.
- [Duolingo – Key phrases](https://mobbin.com/screens/6066d041-8fbf-40ac-83b0-7d6b3607d84d): a `KEY PHRASES` label and bubbles with a speaker. Dotted underlines mark per-word hints, and the translation is grey beneath.
- [Duolingo – Grammar concepts](https://mobbin.com/screens/cfa78fa0-cb96-4d02-9ab3-ab6b7dacca16): collapsible sections, a two-column table (masculine | feminine), and audio examples with the changing part in blue.
- [Duolingo – Tap what you hear](https://mobbin.com/screens/a93fa0d8-0b53-4cec-bb29-2e7838163ea0): a large speaker button paired with a smaller turtle (slow) button.
- [Speak – Phrase card](https://mobbin.com/screens/d9b1330c-32aa-430f-abc4-a9a4a8af1e61): the phrase is highlighted while it plays, the translation sits below, there are replay and play buttons, and the top bar has an `AUTO` toggle.
- [CapWords – Card](https://mobbin.com/screens/6a6db198-c314-44a6-bc3d-8d8beac946b8): IPA plus a speaker above the word, and the meaning in large type.

**What they share:** the target language is the largest text; the translation sits directly beneath it and is muted; audio sits next to the phrase; word hints use dotted underlines; tips sit in a separate tinted box; one pinned CTA.

**Decisions:** §1.6 learn-card order. Play and slow buttons copy Duolingo. Dotted-underline tokens and the mini table copy Duolingo's hints and grammar table. The tip box copies Babbel (Golden Yellow tint in our palette). The Autoplay setting mirrors Speak's `AUTO` toggle.

### 2.5 Exercises
- Choice: [Duolingo web – number-key badges with `SKIP`/`CHECK`](https://mobbin.com/screens/552845c5-4230-454a-a36d-c39c6c4646d2), [Babbel web – "Listen and choose the correct translation" with options 1–5](https://mobbin.com/screens/9607627c-d29f-4ed9-a0af-fdc65e80d670), [Uxcel web – selected row is border plus light fill, number on the right](https://mobbin.com/screens/55d35782-1f23-4609-a59d-6c0fce819924), [Preply – audio bar plus "Choose the word you heard"](https://mobbin.com/screens/e892e35d-7801-46b2-9c3b-935a974e0463).
- Match: [Duolingo – "Tap the matching pairs", two columns of five](https://mobbin.com/screens/8199682b-96e6-4d64-be65-98e3dd309fc2), [Nibble – 3D pair cards](https://mobbin.com/screens/3424c6c1-8d86-457d-9b17-57cdae605466), [Duolingo ABC – correct tile tinted](https://mobbin.com/screens/1c885392-655c-4330-8245-3a1f76f74d5f).
- Build and typed: [Duolingo – "Form the sentence" inside a dialogue](https://mobbin.com/screens/06acbeb1-0adc-4a46-8c88-faa24d106899), [Ahead – tile in the gap, ghost slot left in the bank](https://mobbin.com/screens/12f765b4-92c9-468d-b628-a36845862ace), [Babbel – Dutch tile game with ⌫ and "Attempts 2/3"](https://mobbin.com/screens/22c0a95b-e826-4a3f-b82c-ab18906f8c5b), [Babbel – Dutch dialogue with an inline typed gap and 💡](https://mobbin.com/screens/1bf88b41-50e7-488e-8416-b001ef90a80e), [Quizlet – "Type the answer" plus `Don't know`](https://mobbin.com/screens/de774e83-e886-49f3-836a-744b2df72bae).
- Dialogue and writing: [Duolingo – roleplay with a "Revision" panel](https://mobbin.com/screens/51aeb8a7-4a9a-4f3e-91b4-45a73602fd1f), [Speak – partner bubble with speaker/translate icons; the user's reply joins the chat with ✓](https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e), [Hinge – written answer with a counter and a tip card](https://mobbin.com/screens/378d6555-5f5c-40c6-a568-7883202b86d4), [Cal AI – "Example:" box under the input](https://mobbin.com/screens/526847fc-a336-4fa0-8a71-322f5bfebd79).
- Keyboard: [Heidi – shortcut list with "Dismiss or go back · Escape"](https://mobbin.com/screens/f56b18d3-6984-4261-8430-ec8a75f7b75a), [Copilot – shortcut panel with Submit / Go back (Esc)](https://mobbin.com/screens/3a27eb1a-480b-4207-819c-b8abbe956b19). The tile `⌫` key appears in the Babbel and Duolingo ABC references.
- Speaking: [Duolingo – "Repeat after…" with a big mic and `CAN'T SPEAK NOW`](https://mobbin.com/screens/68634e56-78f8-484d-aedb-a2cb6117d216), [Speak – live waveform with cancel/send](https://mobbin.com/screens/3e01c79e-3175-4df8-9fc6-91966389ffb3), [Hinge – recorded clip with play, `Redo` and `Continue`](https://mobbin.com/screens/cd311622-847b-44b5-9558-3a24e8213d95), [OpenPhone – playback with discard/play/speaker](https://mobbin.com/screens/5413e081-a207-47ef-9565-6b559855faa5), [Babbel – Dutch recall card "Did you remember it correctly?" No/Yes](https://mobbin.com/screens/2be4c469-11ee-4134-be4d-0e8a8d9b1cca).

**What they share:** a bold left-aligned instruction, then the prompt, then the answer area, then one pinned `Check` that is flat grey when disabled. Tiles have borders and a bottom edge, and used tiles leave a ghost. Audio exercises offer a "can't listen/speak now" escape. Self-assessment is a binary choice.

**Decisions:** §1.6. Number badges come from Duolingo, Babbel and Uxcel web. Tile mechanics, ghost slots and ⌫ come from Duolingo ABC, Ahead and Babbel. Speaking is record → compare (Hinge, OpenPhone) → self-rate with two buttons (Babbel). Dictation and writing are *(composed)*: Mobbin has no typed-dictation screen or model-answer screen from a language app.

### 2.6 Answer feedback
- [Duolingo – Incorrect](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124): a bottom sheet with "Correct Answer:" and the differing word bold and underlined, "Meaning:", `EXPLAIN MY MISTAKE` and `GOT IT`.
- [Brilliant – Correct](https://mobbin.com/screens/3c5f9cbd-0ee9-4766-9bd4-578c5c297ab9): a tinted sheet with "Correct! +15 XP", a secondary `Why?` and a primary `Continue`.
- [Brilliant – "Not quite."](https://mobbin.com/screens/82e01d81-cc4a-499f-af8d-90e39937a6ce): a **warm yellow** sheet, `Get help` and a yellow `Try again` with dark text, offering a retry without red.
- [Speak – Incorrect](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035): a compact tinted card above a state-coloured `Continue`.
- [Vocabulary – "That's incorrect"](https://mobbin.com/screens/a3538d35-c422-40ed-b571-121b4b16a4fb): marks both the right option (✓) and the wrong one (✕) in muted tones, plus the correct answer with audio.
- [Elevate – Typed answer](https://mobbin.com/screens/a168a73d-e436-4ac3-a933-ff20b392e038): the attempt is greyed, with "correct answer: **common**" underneath.

**What they share:** feedback replaces the Check zone so the eye stays put; tint, icon and button colour all match the state; the right answer appears with the difference emphasised; the explanation sits behind a secondary button; a retry is offered on build and typed tasks.

**Decisions:** §1.7. Since the palette change (§10), errors use a Flush Mahogany tint with a red button and correct uses a Seaweed Green tint with a green button, as Duolingo and Speak do (before it, the palette had no red or green, so errors used a warm tint like Brilliant's yellow and Quizlet's orange, below). The first-miss retry follows Brilliant's "Not quite" and Babbel's "Attempts 2/3".

### 2.7 Lesson complete, review, checkpoint
- [Mimo – Lesson complete](https://mobbin.com/screens/b96677c5-4f73-40ff-8dee-2bda19aed27e): illustration, title, subtitle, three stats in one bordered row, `Continue`.
- [Duolingo – Lesson complete](https://mobbin.com/screens/31fdc425-1a41-4b78-b4e6-762bff0b9306): mascot, then three stat tiles with coloured headers.
- [Brilliant – Lesson complete](https://mobbin.com/screens/f5881118-ee68-4f94-b0fa-c56e9bffb6f0): glow illustration, "155 TOTAL XP" and "3/3 SCORE".
- [Quizlet – Flashcards done](https://mobbin.com/screens/f0707e72-e036-47fa-8f58-99e2387ba0ff): a 94% ring, Know 64 / Still learning 4 pills, `Practice with questions` and `Keep reviewing 4 terms`.
- [Babbel – Checkpoint result](https://mobbin.com/screens/3f19cfed-6f89-46fc-b1af-188088273652): "Answered correctly: 12/15", a streak row, `Correct my mistakes (3)` and `Continue learning`.
- [Quizlet – Test result](https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014): a 70% ring, Correct 7 and **Incorrect 3 in orange**, then next steps.

**What they share:** a celebratory title and subtitle, two or three headline stats, a list of what to revisit, and one primary button with one quieter alternative.

**Decisions:** §1.8. A score as "n/m" (Babbel, Brilliant). A ring split into correct/incorrect (Quizlet). "Review mistakes (n)" (Babbel). The binary recall card (Babbel).

### 2.8 Progress
- [Quizlet – Your progress](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f): three rows (Not studied / Still learning in orange / Mastered), each with a count ring and an arrow.
- [monday.com – My work](https://mobbin.com/screens/80f1295b-8c7f-4dad-9af2-780c145e2c7f): count tiles bucketed as This Week / Next Week / Later.
- [Vocabulary – Word stats](https://mobbin.com/screens/ab8cfc23-fe79-4778-84ee-ddc2895aab55): a streak card with a week row, plus 2×2 stat tiles. Its percentile chart is deliberately not copied.
- [Headspace – Profile stats](https://mobbin.com/screens/bb0004ec-e553-4e4d-a10e-1e21e59c8781): a short list of icon, bold number and label.

**What they share:** counts by learning state, a small number of plain numbers, and a week-view streak.

**Decisions:** §1.9. States map to New / Learning / Strong in Quizlet's row format. The forecast uses monday.com's bucket tiles. No leaderboard or percentile, as briefed.

### 2.9 Settings
- [Numo – Audio settings](https://mobbin.com/screens/68c3f486-1726-42b0-89f8-4941de90f26a): Sounds toggle, "Audio speed 1x" with the value on the right, slide delay.
- [Speak – Lesson settings](https://mobbin.com/screens/54840f68-a155-46ee-b479-88ddc1939813): icon rows with toggles, including "Slow audio" and "Show translations".
- [Quizlet – Options](https://mobbin.com/screens/bc7163c4-64bc-4469-b379-6c6554dc1fd8): grouped cards (General / Answer with / Question types).
- [TikTok – Screen time breaks](https://mobbin.com/screens/807236a1-1e60-4f94-b398-53fc6f37af71): "Get reminded to take a break after a period of uninterrupted screen time", with interval chips 10m / 20m / 30m / Custom.
- [Instagram – Pause all](https://mobbin.com/screens/30ff275f-29a1-4bc9-a4eb-a484521b89c9): pause durations from shortest to longest (15 min … 8 hours).
- [Greenlight – Are you sure?](https://mobbin.com/screens/c7bc0de7-822a-4787-89a7-a6f70e6e19a8) and [Quizlet – Reset progress](https://mobbin.com/screens/2b99d7a7-9129-49fd-aa93-d6d3589dba5e): reset confirmations. Greenlight makes the safe `Keep going` the primary and leaves "Yes, I'm sure" as text.

**What they share:** grouped rows, controls on the right with the value visible, a one-line helper, time intervals as chips, and destructive actions behind a confirmation.

**Decisions:** §1.10. Interval chips follow TikTok. Snooze durations follow Instagram's order. Reset follows Greenlight's safe-primary dialog with Quizlet's "can't be undone" copy.

### 2.10 Caught-up state
- [Otter – "You're all caught up!"](https://mobbin.com/screens/ed2a964f-6db5-4296-82cd-51c2eaa9b37e): ✓ in a grey disc, title and explanation line.
- [Google Photos – "All caught up!"](https://mobbin.com/screens/970f0fc5-a77c-44d1-89a6-220ecd5fe72b): ✓, then a next-step button (`Go to your Moments`).
- [GitHub – Inbox](https://mobbin.com/screens/1e3cc364-ad46-4cb6-a1a7-e183684cea8a): illustration, "All caught up!" and a light suggestion.

**What they share:** a calm ✓, a short title, one line of context and an optional next step.

**Decisions:** §1.4 caught-up block: the time and size of the next review is the context line, and `Continue course` is the next step.

---

## 3. In-page nudge

### 3.1 Host pages: where X and LinkedIn put their own UI
- [X – Home](https://mobbin.com/screens/6dc0d321-559a-4628-a0f4-21df7a7bec5f): Grok and Chat float as stacked square buttons at the **bottom-right**. X's own toast ("Your post was sent… View") appears at the **bottom of the centre timeline**.
- [X – Spaces dock](https://mobbin.com/screens/680947a4-fe36-4108-b55b-562b522e093c): X docks its own panel **bottom-right, over the right rail** (trends and who-to-follow).
- [LinkedIn – Feed with toast](https://mobbin.com/screens/04e12c77-4d9d-4d91-9695-de9759320240): the Messaging bar is docked **bottom-right**, and LinkedIn's own toast ("We've texted you a link…", ×) appears **bottom-left**.
- [LinkedIn – Scrolled feed](https://mobbin.com/screens/1c190a3f-edd5-4be2-86a8-242e6c1b9465): the right-rail content (news, ad, footer) ends high, leaving empty space above the Messaging bar.

**What they share:** the centre column is the content. Both sites use the bottom-right for their own docks, and the right rail is the lowest-value area. X shows toasts bottom-centre; LinkedIn shows them bottom-left.

**Decisions:** §1.11 placement and collision rule: stack above the host dock over the right rail, fall back to bottom-left, and never touch the centre column.

### 3.2 The card, its actions, snooze
- [GoDaddy – Greeting pop-up](https://mobbin.com/screens/ab81450c-f54e-40db-a416-d0761f6f5753): "After 10 seconds on your website, show a pop-up". A small corner card above the launcher with one line of copy, two stacked buttons and a collapse chevron.
- [Grammarly – Suggestion card](https://mobbin.com/screens/82d0d01f-8aa2-4fe4-a658-1498c92fb1ae) and [its ⋯ menu](https://mobbin.com/screens/b727d76e-6475-4a20-a8bd-d0ad05569b30): the filled `Accept`, the text `Dismiss`, then `⋯`. The menu holds "Turn off suggestions like this" above a divider.
- [Instagram – Pause all](https://mobbin.com/screens/30ff275f-29a1-4bc9-a4eb-a484521b89c9) and [Disney+ – pause shows the resume date](https://mobbin.com/screens/17151813-3f15-487e-90fa-65bf22402a00): relative durations, then the resolved time shown back to the user.
- [Quicken – "Transaction created. Undo ×"](https://mobbin.com/screens/e9042731-b020-4b97-b8b7-b5ad5a97db06), [Asana – corner toast with `Undo`](https://mobbin.com/screens/36cb9092-004d-4cfa-abc7-930e4a7ff931), [Pinterest – "Update removed! Undo"](https://mobbin.com/screens/70234394-ca14-4def-8aa4-e9784fdccae1): one-line toasts with Undo.
- [Chatbase – "Auto show initial messages pop-ups after set duration"](https://mobbin.com/screens/7c41209a-c434-4c02-95d3-94760905f411): a time-triggered prompt as a configurable setting.

**What they share:** a time-delayed corner card with 1–2 lines; one filled action, one quiet dismiss, and the rarer options behind `⋯`; snooze as a short list of durations that echoes the result; Undo in a one-line toast.

**Decisions:** §1.11. Button order copies Grammarly. Snooze copies Instagram plus Disney+. The toast copies Quicken and Asana. The time trigger is backed by GoDaddy, Chatbase and TikTok (§2.9).

### 3.3 Expanding into a micro-lesson
- [Zendesk – Simulating a conversation (flow)](https://mobbin.com/flows/4ee8920d-b6c3-420f-afab-64dfea001b5a): a proactive bubble ("Hi. Need any help?", with its own ×) opens into a panel anchored to the same corner; the launcher turns into a ⌄ chevron.
- [Intercom – Launcher position (flow)](https://mobbin.com/flows/e5d30425-80b3-4fb0-9324-8aa3f5f2a677): side spacing 24px and bottom spacing 20px; the messenger opens above the launcher.
- [Contra – Collapsed assistant card](https://mobbin.com/screens/d524f7f1-7b87-4d16-ad64-46549bd1bfa6): a one-line prompt in a bottom-right card with an expand chevron.
- [Sprig – In-page survey](https://mobbin.com/screens/1d62fcb6-2269-426e-a995-100b1692db89) and [Remote – NPS widget](https://mobbin.com/screens/87d7e757-35f8-4b1f-807a-e6ba5c072e0b): a multi-step question flow inside a ~340px bottom-right card, with ×, option rows, one button and a thin progress bar, all without dimming the page.
- [OKX – Live chat panel](https://mobbin.com/screens/ae43dd2d-3ade-4db4-af87-5b94f72e1ac5): an expanded corner panel with a minimise chevron, scrolling content and a pinned input.

**What they share:** the expanded state grows from the same corner and keeps the same anchor; the header holds close/minimise; content scrolls inside while actions stay pinned; the page is never dimmed.

**Decisions:** §1.11 Learn-now behaviour: a Sprig-style stepped flow inside the card, Zendesk/Intercom-style growth upward from the anchor, and Intercom's 24/20px insets as the no-dock default.

---

## 4. Colour roles (palette → role, WCAG check, evidence)

Since the fifth session (§10) the palette is the Makuteam board. `docs/colour-system.md` is the usage guide: the full role table, the rules, where each colour appears, derived tints and edges with their contrast, and the Mobbin evidence. In short:

| Role | Colour | Type on it | Mobbin support (more in `docs/colour-system.md` §7) |
|---|---|---|---|
| Brand, primary action, links, progress, done | Warm Blue `#445DDB` | white 5.5:1 | [Quizlet `Keep reviewing`](https://mobbin.com/screens/e3067f6b-ea92-4688-a482-22cb28c31b31), [Skillshare](https://mobbin.com/screens/81762058-a358-4516-af84-c5cd091ee1dc), [Speak blue bar](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035) |
| Selected (before Check) | Mid Blue `#366BBB` line on a Denim Blue tint | white 5.3:1 (badge) | [Speak – Translate](https://mobbin.com/screens/9279c96b-3c92-414a-847b-22909ec6309c) |
| Correct, strong, remembered | Seaweed Green `#37AE5C` (tint for sheets) | ink 6.3:1 | [Duolingo correct](https://mobbin.com/screens/a1d54661-39f7-4ae3-a1d5-ec01bf9f5ccb), [Speak correct](https://mobbin.com/screens/9279c96b-3c92-414a-847b-22909ec6309c), ink label: [Spotify](https://mobbin.com/screens/ffdd79c4-84cb-4f10-82c1-91f7190d707c) |
| Wrong, destructive | Flush Mahogany `#C43136` (tint for sheets) | white 5.5:1 | [Duolingo incorrect](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124), [Speak incorrect](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035), [Brilliant red `Quit`](https://mobbin.com/screens/d7d7f00a-f59b-4bf2-acfb-8cb35b147154) |
| Look here: review card, tips, Recommended, badge | Golden Yellow `#FFE60F` | ink 14.1:1 | [Babbel review card and black button](https://mobbin.com/screens/fdaa7267-a4f1-4088-a90a-d1a9611fa63a), [Babbel tip](https://mobbin.com/screens/75cab2bc-d7e2-4d02-9fce-ed9854d12874) |
| Now: streak, current lesson, still learning, due badge | Mango Orange `#FF8037` | ink 7.1:1 | [Speak streak](https://mobbin.com/screens/91ee559c-d53f-4bff-b5cd-f853f38cf4c3), [Life Reset ring](https://mobbin.com/screens/cb3e87ef-1183-486f-bd20-2f465417d486), [Quizlet still learning](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f), [Babbel badge](https://mobbin.com/screens/fdaa7267-a4f1-4088-a90a-d1a9611fa63a) |
| Checkpoints | Butterfly Bush `#603EA2` | white 7.8:1 | [Brilliant Level Review](https://mobbin.com/screens/fd4efbd9-32d7-4abb-b129-dd5d335245ad), [Duolingo "Jump here?"](https://mobbin.com/screens/a13f2a69-17ab-48d1-b6bd-9b64b5cd426e) |
| Dark surfaces: tooltips, bubbles, pill | Dark Cerulean `#064F70` | white 8.9:1 | [Reddit dark tooltip](https://mobbin.com/screens/01dc9c61-113b-44a0-a934-ca154f39e82e) |
| Soft surfaces: avatars, your bubble, info chips | Denim Blue `#73B9FF` (tint) | ink 8.6:1 | carried over from the blue tints in §2.5 |
| Focus | Dodger Blue `#4582FF` | ring 3.6:1 | *(rule)* WCAG focus-indicator contrast |
| Stage bands | Golden Yellow, Seaweed Green, Denim Blue, Mango Orange | ink | [Duolingo unit colours](https://mobbin.com/screens/36ece572-4780-4cec-adac-195753fc86cd) |
| Disabled | ink 8% fill, ink 45% label, no edge | exempt | [Duolingo](https://mobbin.com/screens/8199682b-96e6-4d64-be65-98e3dd309fc2), [Babbel](https://mobbin.com/screens/895e2965-01d5-4727-94b5-f5c67b855a82) |

Rules: type is only ink or white; Golden Yellow, Seaweed Green, Denim Blue and Mango Orange are fills, never text, borders or lone icons on white. States never rely on colour alone, because every state also has an icon (✓/✕) and a title.

## 5. Motion moments (where reference apps show motion; specs are the motion designer's)

Mobbin shows still sequences, so each entry records only *where* a before→after change happens.

1. **Button and tile press**: the 3D bottom edge implies the face drops when pressed (squash, anticipation). [Duolingo](https://mobbin.com/screens/a93fa0d8-0b53-4cec-bb29-2e7838163ea0), [Brilliant](https://mobbin.com/screens/3c5f9cbd-0ee9-4766-9bd4-578c5c297ab9), [Memrise](https://mobbin.com/flows/97215372-5a04-4f1a-a800-7146e6aff4ad). No pressed frame is captured.
2. **Selection appears**: tapping an option adds its border and fill, and the disabled CTA wakes up (timing, slow in/out). [Duolingo onboarding flow](https://mobbin.com/flows/ac9d2f58-868d-4fd3-a79c-9655ce6b1522).
3. **Tiles travel to the answer line** and leave a ghost slot (arcs, follow-through). [Duolingo ABC spelling flow](https://mobbin.com/flows/dc98f60c-1150-4376-a503-d0666280ecbb), [Ahead](https://mobbin.com/screens/12f765b4-92c9-468d-b628-a36845862ace).
4. **Feedback sheet rises** from the bottom in place of Check (staging, slow in/out). [Duolingo lesson flow](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18), [Brilliant](https://mobbin.com/screens/82e01d81-cc4a-499f-af8d-90e39937a6ce).
5. **Combo builds**: the "✓ 0 → ✓ 2" counter and the progress bar changing colour during a run (secondary action, exaggeration). [Duolingo ABC flow](https://mobbin.com/flows/dc98f60c-1150-4376-a503-d0666280ecbb), [Duolingo flow](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18).
6. **Matched pair resolves**: the tile tints and a character pops in (secondary action, appeal). [Duolingo ABC](https://mobbin.com/screens/1c885392-655c-4330-8245-3a1f76f74d5f).
7. **Audio plays**: the phrase highlights as it is spoken and play turns into pause (timing, secondary action). [Speak](https://mobbin.com/screens/d9b1330c-32aa-430f-abc4-a9a4a8af1e61), [ElevenReader](https://mobbin.com/screens/5c627524-cd63-4845-885a-77c7dace046c).
8. **Recording is live**: a waveform or halo pulses around the mic (secondary action). [Speak](https://mobbin.com/screens/3e01c79e-3175-4df8-9fc6-91966389ffb3), [Duolingo ABC](https://mobbin.com/screens/f6fb21c6-fd7d-42c3-9661-b555549584f1).
9. **Lesson complete celebration**: mascot, chest with particles, then stat tiles (exaggeration, staging, follow-through). [Duolingo](https://mobbin.com/screens/31fdc425-1a41-4b78-b4e6-762bff0b9306), ["+5 gems" in the lesson flow](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18), [CapWords confetti](https://mobbin.com/screens/b5fb0f43-642e-49fa-86ba-7d546cbbf4ed), [Brilliant glow](https://mobbin.com/screens/f5881118-ee68-4f94-b0fa-c56e9bffb6f0). This is the only celebration; per-answer feedback stays at the sheet.
10. **Back on the path**: the current node's progress ring fills ([Duolingo lesson flow](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18)) and a "START/CONTINUE" bubble floats above it ([Duolingo story flow](https://mobbin.com/flows/1ff832eb-e370-438f-960e-b19609d66685)) (follow-through, appeal).
11. **Nudge expands**: the bubble grows into a panel from its corner while the launcher morphs into ⌄ (staging, arcs, overlap). [Zendesk flow](https://mobbin.com/flows/4ee8920d-b6c3-420f-afab-64dfea001b5a), [Intercom flow](https://mobbin.com/flows/e5d30425-80b3-4fb0-9324-8aa3f5f2a677).
12. **Snooze toast** enters and leaves its corner. Asana shows a thin bar along the toast's top edge (timing). [Asana](https://mobbin.com/screens/36cb9092-004d-4cfa-abc7-930e4a7ff931), [Quicken](https://mobbin.com/screens/e9042731-b020-4b97-b8b7-b5ad5a97db06).

## 6. Changes from the previous version
- **Dropped** (not re-found on Mobbin this round): the Square timer-bar toast, the Slack/Outlook/ClickUp snooze menus, the Uxcel "Continue ENTER" hotkey, Quizlet's "You said:", the Acorns stepper, the Circle lesson panel, and the Hatch/LARQ/Deezer settings. Instagram, TikTok, Elevate, Uxcel Go, Alan, Headspace, Numo and Speak replace them.
- **Changed**: green success and red danger become Ocean Water and a Sunset tint (the palette has neither green nor red). *Reversed in §10: the Makuteam palette has both.* "No confetti" becomes one celebration at lesson complete. The tab bar gains a Review tab, and Settings moves behind a gear in the app bar. The path becomes a stage → module → lesson stepper with checkpoint nodes.
- **Kept and re-validated**: Grammarly's action order and `⋯`, LinkedIn's bottom-left toast slot, X's bottom-right Grok/Chat stack, the Duolingo/Babbel learn card, and the bottom feedback sheet.

## 7. Decisions added while building (second session, 2026-10-27)

- **Quit lesson sheet** (§1.1 names the "Quit lesson?" question but not its buttons). A bottom sheet over the dimmed lesson: title "Quit lesson?", body "Your answers in this session won't be saved.", the primary `Keep learning` and the text button `Quit`. Esc or `×` opens it. Evidence: [Speak – "Are you sure you want to quit this lesson?" with `Keep Learning` and text `Quit`](https://mobbin.com/screens/5f5cc3f9-ea84-4e93-a3d9-7302ad743002), [Brilliant – "Are you sure?" with dark `Keep learning` and text `Quit`](https://mobbin.com/screens/d7d7f00a-f59b-4bf2-acfb-8cb35b147154), [Preply – "end this practice?" with `Back to practice` and text `End practice`](https://mobbin.com/screens/4229fa4c-fb3f-4aee-a365-460650a65f20), [Uxcel Go – "Hold it right there!" with `Exit lesson` / `Keep learning`](https://mobbin.com/screens/ab29f135-d2a3-4eed-a20f-b4b087dfca68). This search returned the first `ai_usage_notice` (Mobbin AI usage is high this month); it was shown to the owner.
- **Review end pills** read "Remembered n · Still learning m" (Quizlet's Know / Still learning, §2.7), not "Strong n": in this product *Strong* means unaided recall after a gap of a week or more (§1.9), and a single review cannot show that.
- **Recall card** (§1.8) is used for the generated independent-recall drills in reviews, whose prompt is exactly "How do you say … in Dutch?". Other due items keep their exercise types.
- **Short writing** self-rating, after the model answer and the checklist: `Not yet` / `Looks right` *(composed: the binary self-rating of the Babbel recall card)*. The counter shows words against the minimum (the checker counts words), in place of a character count.
- **Speaking** stays learner-led: `Not yet` / `Sounds right` continue the lesson and are not sent to the schedule (the engine does not grade speaking). §1.6 "(feeds scheduling)" is not built.
- **Match pairs** are graded per pair: a mismatch marks only the items involved, so one slip does not send every pair back into review.
- **Today's caught-up block** has no `Continue course` button, because the Continue card directly beneath it starts the course; the Review tab's caught-up block keeps it. *Replaced in §12: on Today, caught up is now a ✓ line in To do today.*
- **Quiet mode toast**: "Quiet mode is on · Undo · ×", the same toast as snooze (§1.11).
- **Audio speed** chips map to playback rates: Slow 0.85×, Normal 1×. The turtle button stays at 0.7×.

## 8. Decisions added during the phase 6 checks (third session, 2026-10-27)

- **Snooze row** (§1.10 says the row "opens" the durations but not how it shows that). The whole row is the button, with a chevron on the right that turns when the row is open; the duration chips appear inline beneath it. Evidence: [Yazio – Fasting times, rows with a ⌄ chevron that expand inline to show their options](https://mobbin.com/screens/2ac84c16-1632-4d24-8b27-6bdc2bc09953), [TIDE – Focus settings, duration rows with a chevron](https://mobbin.com/screens/31193fcc-03e2-44b3-b662-71050f0a18b8). This search returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.
- **Chip rows share the width**, so `Prompt after` (5 · 8 · 15 · 30 min) and the snooze durations sit on one line at 360px, as TikTok's interval chips do (§2.9). They wrap only if a row cannot fit.
- **`Start review (n)`** counts what the session holds (reviews run in batches of 10), not everything due, the way Babbel's `Correct my mistakes (3)` counts what it will practise (§2.7). The due count above it stays the full number.
- **Generated match pairs** leave out items longer than 32 characters (two lines in a 160px tile), keeping §1.6's 48px tiles readable; a lesson with fewer than three short items gets no generated match (30 of 235 lessons; their authored exercises are unchanged). Duolingo's pairs are single words or short chunks ([§2.5](https://mobbin.com/screens/8199682b-96e6-4d64-be65-98e3dd309fc2)).
- **Module rows** have a spoken name ("Module 2: Check, 0 of 1 lessons done"); otherwise screen readers run the number, title, bar value and count together. No visual change.

## 9. How §1.11 is applied in the content script (fourth session, 2026-10-27)

No new UI: these record how the existing placement, collision and trigger rules are carried out on live pages. All are *(rule)*.

- **Measuring.** The feed column is found by known selectors (`data-testid="primaryColumn"` on X; `main` on LinkedIn). Docks and chat windows are measured as fixed-position elements hit by probe points in both bottom corners. Short ones (≤160px) on the bottom edge under the card's column, plus buttons stacked on them, are the host dock (X's Grok/Chat, LinkedIn's Messaging bar, §3.1): the card sits 16px above the highest. Any other fixed element there (an open chat, X's Spaces dock, a toast) must not be covered. Fixed elements that reach the top edge are the page's own frame (X's left navigation) and may be covered, as §1.11 allows over the left column.
- **What must stay clear** is the whole space the card can grow into after `Learn now` (up to `min(520px, viewport height − bottom offset − 24px)`), not only the collapsed card.
- **Whole-page chats.** X's messages (`/messages`, `/i/chat`) and LinkedIn's messaging (`/messaging`) are an open host chat window as a whole, so the card does not appear there.
- **Skipping an interval** resets the active-browsing count without counting a prompt, so the next chance comes after another full interval.
- **Bottom-left fallback.** The expanded card grows from the bottom-left corner there, keeping its anchor as in §3.3.
- **When the page changes** (resize, navigation within the site): an untouched card moves to the other corner or, if neither fits, goes away until the next interval. A card the learner has pressed, focused or typed in stays in its corner and only adjusts its height.
- **One prompt across tabs.** An untouched card also goes away when the learner turns on quiet mode, snoozes or switches the site off elsewhere, or when another tab took the prompt after this tab was in the background past its lease (10 minutes). This is not a timeout: the card still never dismisses itself while its tab is in use.
- **Opening the side panel** from the card uses the click's user gesture through the background worker, as Chrome's own sample does. If Chrome refuses, the panel page opens in a tab rather than the button doing nothing.

## 10. Palette change to the Makuteam board (fifth session, 2026-10-27)

The owner replaced the brand board with the Makuteam palette (Golden Yellow, Seaweed Green, Denim Blue, Mango Orange, Warm Blue; Dodger Blue, Mid Blue, Butterfly Bush, Flush Mahogany, Dark Cerulean) and asked for it to be applied the way the [Makuteam case study](https://www.behance.net/gallery/240631589/Makuteam-Building-a-Creative-System-Through-Characters) applies it, with every decision checked on Mobbin. Layout, type, motion and copy are unchanged; only colour roles moved. The usage guide is `docs/colour-system.md`; §1.2 and §4 above are its summary.

- **One colour, one job**, as each Makuteam character owns one colour. The roles are in §1.2.
- **Correct is green and wrong is red again**, now that the palette has both: tinted sheets with state-coloured buttons, as on [Duolingo](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124) and [Speak](https://mobbin.com/screens/9279c96b-3c92-414a-847b-22909ec6309c). The sheet title is ink beside a coloured disc ([Vocabulary](https://mobbin.com/screens/a3538d35-c422-40ed-b571-121b4b16a4fb), [Alan](https://mobbin.com/screens/49f3790f-ac4e-4436-be11-6c9097aa08ec)). The green button has an ink label because white on Seaweed Green is 2.8:1 ([Spotify](https://mobbin.com/screens/ffdd79c4-84cb-4f10-82c1-91f7190d707c) labels its green buttons in black).
- **The primary colour is Warm Blue** (Makuteam's brand blue), with white labels: [Quizlet](https://mobbin.com/screens/e3067f6b-ea92-4688-a482-22cb28c31b31), [Skillshare](https://mobbin.com/screens/81762058-a358-4516-af84-c5cd091ee1dc). On a Warm Blue hero the main button turns Golden Yellow with an ink label, as Makuteam sets yellow on Warm Blue and as Memrise and Codecademy put yellow buttons on navy (§4 before this session).
- **Stage bands.** Each stage card opens with a band in one light top-row colour, the way each Makuteam character owns a band and each Duolingo unit owns a header colour ([Unit 1](https://mobbin.com/screens/a13f2a69-17ab-48d1-b6bd-9b64b5cd426e), [Unit 22](https://mobbin.com/screens/36ece572-4780-4cec-adac-195753fc86cd), [Unit 9](https://mobbin.com/screens/edb09afd-5b2a-4262-aca1-01d5d6b7e41f)). Lesson nodes keep their state colours, so done, current, locked and checkpoint read the same in every stage.
- **The review card is Golden Yellow with the ink `Review now`**, matching [Babbel's "Time to review"](https://mobbin.com/screens/fdaa7267-a4f1-4088-a90a-d1a9611fa63a) more closely than Mango did. Babbel's review badge and flame are orange, so the due badge and streak are Mango Orange.
- **Word states** follow [Quizlet's progress rings](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f): grey new, orange still learning, green strong. The review end pills follow [Quizlet's Know / Still learning](https://mobbin.com/screens/f0707e72-e036-47fa-8f58-99e2387ba0ff).
- **Checkpoints are Butterfly Bush**: [Brilliant's Level Review](https://mobbin.com/screens/fd4efbd9-32d7-4abb-b129-dd5d335245ad) and Duolingo's "Jump here?" node are purple.
- **Destructive text is Flush Mahogany** under a safe primary: [Brilliant – red `Quit`](https://mobbin.com/screens/d7d7f00a-f59b-4bf2-acfb-8cb35b147154).
- **Dark surfaces are Dark Cerulean** instead of navy: [Reddit's dark tooltip](https://mobbin.com/screens/01dc9c61-113b-44a0-a934-ca154f39e82e).
- **Celebration fields**: [Tolan's "Level 2!" on indigo](https://mobbin.com/screens/434afe5a-4578-4531-a329-54663d478fcc); sparks in palette colours as in [Grab](https://mobbin.com/screens/9174df43-a3fd-4587-9f11-348d9e3609f9).
- *(rule)* Focus rings are Dodger Blue (3.6:1 on white) and white on bands.
- The toolbar icon and the in-page brand mark are Warm Blue; the wordmark is two-tone ("Taal" in the type colour, "Nudge" in Warm Blue, or Golden Yellow on a band).

These searches returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.

## 11. Icons (sixth session, 2026-10-28)

The owner found the hand-drawn set weak: the settings gear read as a sun, Course was a `>`-like curve and Review looked like a reload arrow. This round checked how learning and habit apps draw their tab bars, the settings button and the streak, both at rest and selected. The tab bars and headers below were opened at full size and compared side by side. Busuu again returned no Busuu screens, so it is not cited.

### 11.1 Tab bars
- [Babbel – Home](https://mobbin.com/screens/acf4f27b-af64-4076-b5b9-d763f3449846): Home is a house with a door, Review a target with an arrow (orange count badge at its top right), Explore a pair of binoculars. The selected tab turns orange, glyph and label, in the same outline; the others are grey.
- [Duolingo – Learn](https://mobbin.com/screens/56f6a8cb-cd70-4bec-aab7-96ccbd976fdc): six full-colour illustrations without labels; the selected one sits in a pale blue tile with a blue border.
- [Memrise – Learn](https://mobbin.com/screens/750e896b-3cbc-48a3-b3f6-1dc4a5072809): Home is a filled house; the selected Learn tab puts its glyph on a yellow disc.
- [Speak – Home](https://mobbin.com/screens/f8b0ff0c-4292-4d31-bd59-37fb95f7a1bc): filled glyphs, the selected one blue and the rest grey. Its Review tab is a lightning bolt.
- [Quizlet – Home](https://mobbin.com/screens/2d3bf1c9-33a9-4c85-9fe7-237d44bada63): an outline house with a door; the selected tab is blue on a grey pill.
- [Mimo – Practice](https://mobbin.com/screens/b33e7987-1a4c-4fef-a965-db3eb7359297): the selected Practice tab is a filled bolt; Learn (a graduation cap), Build, Leaderboard and Profile are outlines.
- [Brilliant – Courses](https://mobbin.com/screens/8137c15c-de9a-45b4-be9b-d0528a67bf9f): outline Home (a house with a door), Courses (cards with a tick) and You; the selected tab sits on a grey pill.
- [Liven – Journey](https://mobbin.com/screens/c9d2fcaf-4346-4ec2-86d7-7ea56f9bd04f): the course path, Journey, is an open book, filled when selected. Today, Explore, Companion and Profile (a bar chart) are outlines.
- [Ahead – Journey](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7): the selected Journey tab is a filled purple flag on a pill; the others are outlines.
- Habit apps: [Insight Timer – Home](https://mobbin.com/screens/69ec4729-d290-4b2a-9522-2dee95b4dcb9) fills the selected house and keeps Activity, Library and Teachers (an open book) as outlines. [Atoms – Home](https://mobbin.com/screens/aa924898-11d9-405d-876a-1d2ba12d7ab1) draws Progress as filled bars; the selected tab is dark and the rest light grey. [Me+ – Routine](https://mobbin.com/screens/be193477-7417-4785-aa1b-3912902f4c8f) uses filled glyphs, black when selected and light grey otherwise.
- Also: [Moonly – Learning](https://mobbin.com/screens/1329e4d1-7a9a-470c-bc4d-a12e9702a3da) draws a book for the tab that holds its courses, and [Bloom – today](https://mobbin.com/screens/8732dec7-21e2-4f1f-9a32-67bae72d76b2) draws its stats tab as vertical bars.

**What they share:** a label under every glyph (all of them except Duolingo). The selected tab changes colour, to the brand colour or to full ink, and the rest are muted. Most draw line glyphs at rest; Mimo, Liven, Ahead and Insight Timer also switch the selected glyph to its filled form. The home tab is a house with a door. The course is a book (Liven, Moonly), Babbel's Review is a target, and progress is a bar chart (Liven, Atoms, Bloom). A pill behind the selected tab (Quizlet, Brilliant, Ahead) is the less common treatment.

### 11.2 Settings and the streak
- Settings: [Quizlet – Learn](https://mobbin.com/screens/731be357-54a2-4384-b7d1-043e7b132d87) shows a cog, top right, whose eight teeth are joined to a ring around a hole. Uxcel Go and Headspace put their gear in the same place (§2.2). The old gear had eight separate rays around a dot, which is how a sun is drawn.
- Streak, active: [Duolingo](https://mobbin.com/screens/56f6a8cb-cd70-4bec-aab7-96ccbd976fdc) shows a filled orange flame with a lighter inner flame beside the count. [Speak](https://mobbin.com/screens/f8b0ff0c-4292-4d31-bd59-37fb95f7a1bc), [Ahead](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7) and [Me+](https://mobbin.com/screens/be193477-7417-4785-aa1b-3912902f4c8f) put a filled flame in a pill with an ink count. [Babbel](https://mobbin.com/screens/acf4f27b-af64-4076-b5b9-d763f3449846) is the exception: an outline flame on a peach pill, like the old chip.
- Streak, inactive: [Duolingo – not yet practised today](https://mobbin.com/screens/755e4280-a36a-4b17-899b-0e8f5a644074) shows the same flame and count in grey. [Babbel – streak 0](https://mobbin.com/screens/af715e9f-3b74-4de5-b014-55fa6748aa34) greys the pill, the flame and the count.

### 11.3 Decisions
- **Family: Phosphor Icons 2.1.1 (MIT)** for every icon in the panel, the player and the in-page card. Phosphor draws each glyph in matching outline and fill weights, which the selected-tab pattern needs, and its bold weight (24 of 256 units, 2.25px at 24px) matches the old set's 2.2px rounded stroke. The paths are copied into `src/ui/components/phosphor.ts` and bundled inline, so nothing is fetched; the licence ships as `public/licenses/phosphor-icons.txt`, which the build copies. Phosphor has no turtle, so the slow-audio button uses Lucide's (lucide-static 1.63.0, ISC, `public/licenses/lucide.txt`), stroked at the same weight. Duolingo's slow button is a turtle (§2.4).
- **Tabs.** Today is the house with a door (Babbel, Quizlet, Brilliant, Insight Timer; Babbel's Home tab also opens on "Today"). Course is the open book (Liven's Journey, Moonly). Review is the target with an arrow (Babbel's Review: the same label in the same kind of app). Progress is the bar chart (Liven, Atoms). The flag (Ahead's Journey) is left out because it marks checkpoints (§1.5), and the bolt (Speak's Review) because it is Quick practice on Today.
- **Selected and not.** The selected tab draws the fill weight in Warm Blue with a Warm Blue label: the fill comes from Mimo, Liven, Ahead and Insight Timer, the colour from Babbel, Quizlet and Speak. The other tabs draw the bold outline in muted ink. Because of the fill, selection is not shown by colour alone (`docs/colour-system.md`, rule 4). There is no pill. The Review badge keeps its place at the glyph's top right, as on Babbel. On Settings no tab is selected, so all four are outlines.
- **Settings** is Phosphor's eight-tooth gear, bold, in muted ink like the app bar's other buttons.
- **Streak and combo chips** use the filled flame in Mango Orange on the Mango tint, with the ink count. The tint shows through the inner flame, the way Duolingo's centre is lighter.
- **Not built:** Duolingo's grey flame until today's practice is done, and Babbel's grey chip at 0. The chip still hides at 0 and stays orange, because this change keeps the colours. `summary.week` already records whether today was practised, if the owner wants it later.
- **The rest of the set** moves to the Phosphor glyph with the same meaning: speaker-high, check, x (both ✕ and ×), caret-right and caret-left, lock (the one with a keyhole, which reads better than lock-simple at 16px), star, microphone, play, pause, stop, dots-three, moon, flag, arrow-counter-clockwise (Record again), lightning, lightbulb, translate, backspace, arrow-up, keyboard and plus (a site chip that is off, §14.2). The brand mark and the level signal bars stay as drawn.

These searches returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.

## 12. Today tab redesign (sixth session, 2026-10-28)

The owner asked for a better home page. Before this change, Today stacked five cards of the same weight: the review card or an "All caught up" card, then the Continue card, a New words card and an Ear training card (each with a caps label, a title, a bar and a full-width button), then a full-width `Quick practice · 2 min` button and the stats row. Four buttons of similar size competed. Whenever reviews were done, the top slot went to a card with nothing to press. A brand-new learner was told "All caught up", and a finished word batch showed a disabled `Done for today` button.

### 12.1 What home screens do
- **One main card with one button.** [Babbel – Today](https://mobbin.com/screens/0fed600b-7bf0-4fe7-bcfd-d614d8a27c51) shows a large card for the next lesson with `Start lesson`, and smaller lesson cards in a row beneath it. When reviews are due, the same slot becomes ["Time to review"](https://mobbin.com/screens/acf4f27b-af64-4076-b5b9-d763f3449846) with `Review now`. [Mimo – Practice](https://mobbin.com/screens/b33e7987-1a4c-4fef-a965-db3eb7359297) leads with its Daily Review card and `Start now`, [Duolingo – Up next](https://mobbin.com/screens/345a05d1-9d96-4467-9746-8e87b752f691) with one `Continue`, and [Memrise – Home](https://mobbin.com/screens/0be6671d-056d-49ae-a380-f69c15dab136) with its current-level card and `Continue learning`.
- **The other tasks as a list of short lines.** [Duolingo – Daily quests](https://mobbin.com/screens/0b1b367c-1d8c-493f-8d77-d1d895ae613d) puts a caps "DAILY QUESTS" label over one line per quest: a title that names the task ("Complete your next 2 lessons"), a thin bar with the count, and an icon. [Headway – Your daily mission](https://mobbin.com/screens/e069ee13-99bd-49bd-8d19-4cf8efbf466b) has three lines, each an icon, a title ("Finish 1 summary"), a thin bar and "0/1". [Babbel – Learning plan](https://mobbin.com/screens/832f5742-a189-409a-8bb1-06f5ed82bb60) gives each row a tile, a title and a line of text, with the action at the end. [Atoms – Mindset](https://mobbin.com/screens/709913b3-cb23-4aa0-96b8-26dd73a932c7) uses an icon, a title and a chevron per line. Memrise groups the day's items under "TO DO TODAY" (above).
- **Done is a tick, not a disabled button.** [Duolingo – All daily quests complete](https://mobbin.com/screens/d530dada-6595-4901-8541-1895451c7863) keeps the finished lines with full bars, and habit apps tick them where they stand: [Me+](https://mobbin.com/screens/138585b7-ea1e-43d1-9bdf-3a90118dcaff), [Numo](https://mobbin.com/screens/ce69ef20-ae7a-4f09-85e7-cb7e621f5aae), [QUITTR](https://mobbin.com/screens/ab3e657b-050d-473c-9b85-6fc11a68e364). [Paired – Home](https://mobbin.com/screens/465bdf7a-087e-4a5b-995f-9d18864b66aa) ticks each finished activity and puts "You've completed your first Paired session" after them, not above.

**What they share:** the next step gets the one large card and the one strong button. The rest of the day is a list of short lines, each with a title that says what to do, a count and often a thin bar. A finished line is ticked where it stands.

### 12.2 Decisions
- **Main card first.** The review card (while reviews are due) and the Continue card keep their look. With nothing due, the Continue card is now the first thing on the tab, as Babbel's lesson card is.
- **To do today.** New words, Ear training and Quick practice move from three cards and a full-width button into one white card labelled "To do today" (Memrise's label), built like the Progress tab's cards: a caps label over lines with 1px rules. Each line has a 40px tile on the Denim Blue tint with an ink glyph (Phosphor's Aa, ear and bolt), the action as a bold title (`Learn 5 words`, `Hear a or aa`, `Quick practice`, worded as Duolingo and Headway word their tasks), the count in muted text, a thin bar where there is a count, and a chevron. The whole line is the button; its name is the title and the muted line is its description.
- **Caught up** is a ✓ line at the top of the list ("All caught up · Next review in 4 h · 3 items"), not a card above the course. A learner with nothing in review yet gets no such line. The Review tab keeps its caught-up block with `Continue course`.
- **A finished batch** gets the same tick: `New words` with "Done for today · 8 of 625 met" (or "You have met every basic word.") replaces the disabled `Done for today` button.
- **Kept:** the streak chip and gear in the app bar, the review card, the Continue card and the two-cell stats row (Mimo, §2.2). The colours keep their Makuteam roles: the tick disc is the caught-up block's Seaweed Green with an ink ✓, and the tiles use the soft Denim tint.

These searches returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.

## 13. Finch-style restyle (seventh session, 2026-10-28)

The owner asked for every surface to take the look and feel of [Finch](https://mobbin.com/apps/finch-ios-62797eb5-a84b-44de-8b68-e00178a8bc60/74002971-2ebd-4e9e-a3cd-bd225e19e0e9/screens) (Self-care pet), with no mascots, illustrations or copy of its own. The 27 decisions, the motion table and the phases are in `docs/finch-restyle-plan.md`; this section records what was built in each phase and the Finch screens it follows. Where Finch has no equivalent, the closest learning or habit app is cited and marked *(gap fill)*. Colour roles are in `docs/colour-system.md`.

### 13.1 Shared parts (phase 1)
- **Grounds.** Finch gives each tab its own light ground: teal on [Home](https://mobbin.com/screens/9f5f5f5d-d475-403e-9aa0-902da053bc4b), mint on [Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b) and [Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf). TaalNudge takes one ground per surface from the blues and greys (`--ground-*` in `theme.css`). They are lighter than Finch's because muted text, Warm Blue links and the focus ring must keep their contrast on them (colour-system.md §6).
- **Raised cards.** Finch's goal and quest rows are white cards with no outline, about 20px round, sitting on one soft edge ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b), [Home](https://mobbin.com/screens/9f5f5f5d-d475-403e-9aa0-902da053bc4b)). `.tn-card` is now that card: 22px radius, a 3px edge in translucent ink (so it reads as a deeper shade of any ground) and a short soft shadow (`--raise`). `.tn-press` makes a tappable raised part drop into its edge and spring back.
- **Soft secondary button.** Finch's `Hint` and arrow buttons are a light grey face on a darker grey bottom edge with a dark label and no outline ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b), [Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf)); on a coloured card the same button is white ([pet card, `Unequip`](https://mobbin.com/screens/9c762cfe-a65e-4ef8-beec-568ce9259d3e)). `secondary` replaces the ink outline with that: white on a ground or a tinted sheet, grey (`--soft-face` on `--soft-edge`) inside white cards and dialogs.
- **Thick bars with the count inside.** Finch's quest bars are about 16pt high with "3 / 7" centred inside ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b)); so are the adventure bar ("0 / 15", [Home](https://mobbin.com/screens/9f5f5f5d-d475-403e-9aa0-902da053bc4b)) and the bar in a quest's dialog ("4 / 8", [Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52)). `ProgressBar` takes an optional `count` and grows to 20px. Finch's fill is yellow under dark type; ours stays Warm Blue, so the count is white over the fill and ink over the track (a clipped copy that moves with the fill).
- **Icon tiles.** Each Finch quest starts with a saturated rounded square holding a glyph ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b), [Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf)). `IconTile` draws one per kind of activity (the table in the plan), with a darker bottom edge like the buttons; a `soft` tile is kept for Settings rows. Finch's tiles hold illustrations; ours hold the Phosphor glyphs (§11).
- **Round × and dialog card.** Finch's quest dialog is a white rounded card with a round grey × at the top left, a centred tile, title, bar and hint ([Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52)). `.tn-round-btn` (a 34px grey disc in a 40px target) and `.tn-dialog-card` are ready for the lesson's ×, Quit, Reset and the ⋯ menu (phases 3–5).
- **Toast colour.** `--toast` is Dark Cerulean with white type, for the pills in phase 5.
- **Fixed:** the audio glyphs drew at about 70% of their size (a percentage width inside a grid button); they are now sized from the button.

### 13.2 Shell and the four tabs (phase 2)
- **Grounds and header.** Each tab takes its ground (Today light Denim Blue, Course light Dark Cerulean, Review light Mid Blue, Progress light Dodger Blue, Settings pale blue-grey), set on the shell so the header sits on it with no white fill and no rule. Finch puts its top controls straight on the ground ([Home](https://mobbin.com/screens/9f5f5f5d-d475-403e-9aa0-902da053bc4b)) and its section titles too ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b)).
- **Tab bar.** It stays white and is raised off the ground by a soft upward shadow. The selected tab gets Finch's soft rounded tile behind its glyph and label ([Home](https://mobbin.com/screens/9f5f5f5d-d475-403e-9aa0-902da053bc4b), [Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b)), filled with the tab's ground, and the tile slides to the new tab. The filled Warm Blue glyph and label stay (§11.3); Warm Blue on every ground tile is 4.6:1 or more. No tile shows on Settings.
- **Section titles on the ground.** "To do today", "This week", "Words and phrases", "Basic words", "Ear training", "Articles · de or het", "Lessons", "Upcoming reviews" and "Waiting for correction" move out of their cards and become bold sentence-case titles in Fredoka, as Finch's "Weekly Milestones" and "Special Quests" ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b)) and "Daily Quests" ([Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf)). The caps context line inside the Continue card stays.
- **Raised cards.** The Continue, caught-up, review-count, Progress, stage and stats cards lose their outlines and take the shared raise. The Golden Yellow review card keeps its colour and sits on its own orange-yellow edge, as Finch's coloured `View Event` card does ([Daily Quests with View Event](https://mobbin.com/screens/60c2b3a2-3d78-4fd4-a341-78b26bc99658)). The Upcoming reviews cells become soft grey with no outline.
- **Activity tiles and thick bars.** To do today lines start with their tile (New words Denim Blue `Aa`, Ear training Dark Cerulean ear, Quick practice Mango Orange bolt) and carry a thick bar with the count inside; the Continue card, the stage and module bars, and Progress's words, sound pairs, articles, lessons and stage bars do too. On Progress each count sits beside its tile, as Finch's quest rows put tile, title and bar side by side ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b)). The module rows drop their separate "3/6", which is now inside the bar (the row's name still reads the counts).
- **Course stepper.** The lesson connector is dashed, as Finch strings its daily quests on a dashed line with circles ([Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf)); the nodes keep their state colours. The stage bands keep their colours.
- **Kept:** every tab's content and order, the 7-day row (no calendar or stat pills), the word-state rings and the review card.
- **De/het glyph.** The articles tile uses Phosphor's tag (a label set before a noun). This round also added Phosphor's browser, timer, alarm, gauge, music notes, image and bell-slash for the Settings rows in phase 4, copied from `@phosphor-icons/core` 2.1.1 after checking the tarball against the registry's sha512.

### 13.3 Lesson player and end screens (phase 3)
- **Player ground and raised parts** *(gap fill: Finch has no exercises)*. The player sits on a neutral grey-blue ground (`--ground-player`); answer options, word tiles, prompt cards, sentence and speaking cards, example chunks and the comparison rows become raised white cards with no outline, and options press into their edge. [Speak – Translate](https://mobbin.com/screens/1754842f-604f-46a5-b514-31c49bf645e9) sets its prompt card and options as white cards on a light grey ground; [Vocabulary – quiz](https://mobbin.com/screens/a152f11c-806f-4a46-8a91-c919422c6394) raises its options on a tinted ground with a bottom edge. The selected, correct and wrong states keep their borders and tints; at rest the number badge sits on the soft grey face. Inputs keep their border, as every learning app on Mobbin draws one.
- **Round grey ×.** The lesson's × sits in a round grey disc, as Finch closes its dialogs ([Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52)) and as [Vocabulary](https://mobbin.com/screens/a152f11c-806f-4a46-8a91-c919422c6394) and [Quizlet – Learn](https://mobbin.com/screens/2c70f24d-ad39-4ca6-9c05-2c4c8f9539ec) close a quiz. The top progress bar keeps its style, and the Check zone sits on the ground with no rule.
- **Feedback sheets** keep their Seaweed Green and Flush Mahogany tints and buttons; `Why?` is the soft white button.
- **Celebration fields.** Lesson complete, new words, ear training, review done and the checkpoint result now share Finch's goal-completed layout ([Completing a goal](https://mobbin.com/flows/2d8a4c8a-20d1-4239-b528-c4fbd26742a7), [egg step](https://mobbin.com/screens/68e01b5e-52c9-4691-9923-ee0343b5f2c1)): the whole screen is a Warm Blue field; confetti in the light palette colours and white bursts on parabolic arcs; a thick bar on a white track fills to its new value, with the badge as its cap (Finch ends its bar in a glowing disc): a Golden Yellow star for lessons, words and ear training, a Seaweed Green tick for reviews, a Butterfly Bush flag for checkpoints; then the title, the subtitle, and the stats as translucent pills ("Lee got +139 Rainbow Stones" in Finch). The bar is the module's lessons for a lesson, the basic words met, the sound pairs met, the items remembered in a review, or the checkpoint score.
- **Buttons on the field.** The main button stays Golden Yellow with an ink label; the second action is white text, as Finch sets `Reflect` over its white `Yay!`. "Review these" sits in a raised white card under a white title on the field.
- **Checkpoint result.** The green and red ring (§1.8) gives way to the score bar and pills with a ✓ or ✕ mark ("Correct 13", "Incorrect 2", "87%"), because Flush Mahogany on Warm Blue is about 1:1 and the ring could not be read on the field. A missed checkpoint gets the field without confetti: it is the one end that does not celebrate.
- **Pills** are white on Warm Blue darkened by 20% ink, 7.1:1; their marks are the state colours with their usual glyphs (✓ correct, ✕ wrong, ↺ still learning).

These searches returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.

### 13.4 Onboarding and Settings (phase 4)
- **Settings** follows Finch's settings pages ([Settings](https://mobbin.com/screens/699a521c-9baa-44e8-b473-d431440c0560), [Your data](https://mobbin.com/screens/07d41300-f0eb-4082-8bbd-aa305eac4155), [Profile](https://mobbin.com/screens/ff6cc7d1-5257-48da-8101-4039b2152975)): a pale blue-grey ground with the back chevron and title on it, small grey caps labels over grouped white cards, helper lines under labels and controls on the right. The group cards are now raised (§13.1).
- **A small tile on every row.** Finch puts a small full-colour glyph before each row. TaalNudge puts a 32px soft tile there (the Denim Blue tint with an ink Phosphor glyph), so the saturated tile colours stay with the activities: browser for the two prompt sites, timer for Prompt after, moon for Quiet mode, alarm for Snooze, speaker for Autoplay audio, gauge for Audio speed, music notes for Sound effects, translate for Show translations, image for the het-word image and the picture credits, `Aa` for New words a day, bell-slash for "Prompts are off" and the counter-clockwise arrow for Reset progress. Switches stay Warm Blue and `Reset progress` stays Flush Mahogany text.
- **The reset dialog** is Finch's dialog card ([Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52)): white and rounded, a round grey × at the top left that keeps the progress (as Esc does), a centred title and body, then `Keep my progress` and the red `Reset everything`. It moved here from phase 5 because it belongs to Settings; Quit and the ⋯ menu stay in phase 5.
- **Onboarding** *(gap fill: Finch's onboarding has no level picker)*. The steps sit on the lesson's neutral ground, so a chosen row (the Denim tint with its Mid Blue border) still stands apart from the white rows around it, as on [Speak – Translate](https://mobbin.com/screens/1754842f-604f-46a5-b514-31c49bf645e9). The level rows and start cards are raised white options (§13.3), and the prompt preview sits on a white raised panel. The welcome stays a full Warm Blue field with the Golden Yellow `Get started`.
- **Retired:** the old app background `#F3F4F7` (`--bg`); every surface now names its ground.

These searches returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.

### 13.5 In-page card, toasts and dialogs (phase 5)
- **The card** takes Finch's home layout on the Today ground. Its header and title sit on the ground, as Finch sets "9 goals left for today!" on its teal ground above raised white goal rows ([Home – goals](https://mobbin.com/screens/6e24c2f2-42f4-42da-9450-5c021b7d3678), [Deleted goal](https://mobbin.com/screens/a33a6e25-abb0-4561-9844-37b625bd1d12)). What `Learn now` starts with becomes one of those rows: a raised white row with the activity's tile, the same as on Today (the Warm Blue book for a lesson, the Golden Yellow target for reviews, the Denim Blue `Aa` for new words), then the phrase or the count. The × and the ⋯ are round grey discs, as Finch closes its sheets ([Choose a Self-Care Area](https://mobbin.com/screens/3b19a5cc-9d12-4626-8141-69dcf5d84246)) and puts a round ⋯ on its dark toast ([You're amazing!](https://mobbin.com/screens/41f15881-48b8-4ab4-b675-4a8b41a35483)). `Learn now` stays the Warm Blue 3D button and `Not now` the ink text button, in Grammarly's order (§3.2). The card takes the raised cards' 22px radius and edge (§13.1) and keeps its float shadow over the host page. Where it sits on X and LinkedIn is unchanged *(gap fill: Finch is an app, not an overlay; §1.11, §3.1, §9)*.
- **The ⋯ menu** becomes Finch's option sheet, as a white card just above the prompt and as wide as it: a round grey × at the top left, the menu's existing name, "Prompt options", as a centred muted title, and a small soft tile before each row (the alarm for the three snoozes and the moon for Quiet mode, as on their Settings rows). Finch's sheets set a glyph before each row under a centred title ([How do I relate to this tag?](https://mobbin.com/screens/a9a2a239-5ba9-454e-a97c-e7a353598e0e), [Sort by](https://mobbin.com/screens/c69e0608-d7ce-485a-8acb-7b6991bdbb22), [Choose a Self-Care Area](https://mobbin.com/screens/3b19a5cc-9d12-4626-8141-69dcf5d84246)). The divider before Quiet mode stays (Grammarly, §3.2). Unlike Finch's sheets there is no backdrop, because the card never dims the page (§1.11). A focused row now shows the focus ring as well as the grey face.
- **Toasts** become Finch's dark pills ([Deleted goal](https://mobbin.com/screens/a33a6e25-abb0-4561-9844-37b625bd1d12), [Could not find friend](https://mobbin.com/screens/04a24fa6-1ca2-46dc-b772-69dc16190191), [goal checked](https://mobbin.com/screens/c773fdf3-6f37-45c1-b527-12874802e923)) in Dark Cerulean with white type. Finch's are translucent black; ours stay opaque, so the type keeps 8.9:1 over any host page. `Undo` is white on a translucent white face and the × is a translucent disc, as on Finch's richer dark toast ([You're amazing!](https://mobbin.com/screens/41f15881-48b8-4ab4-b675-4a8b41a35483)), and the focus ring is white, as on a band. The timer is a white line along the pill's bottom edge that runs down while the toast shows (Asana's top bar, §5.12, moved to where a pill has a straight edge). The copy and the 6 seconds are unchanged.
- **Quit lesson and the keyboard shortcuts** become Finch's bottom sheets ([You skipped](https://mobbin.com/screens/ad73f73e-009d-4651-823d-5a64327f97cd) in [Skipping a goal](https://mobbin.com/flows/51fbdd4b-f556-465a-a30c-325ff25cc6a8), [Goal ideas](https://mobbin.com/screens/c06891c0-4b99-408f-b68d-4a46f70fe2e7)): white with 22px top corners, a round grey × at the top left that keeps learning (as Esc does), and a centred title. `Quit` is Flush Mahogany text under the Warm Blue `Keep learning`, like `Reset everything` in the reset dialog (Brilliant's red `Quit`, colour-system.md §7). The shortcuts sheet keeps its soft `Close` button, as Finch's sheet keeps `Done` beside its ×. The side panel and the card show the same sheets.
- **The micro-lesson** keeps the card's Today ground; since phase 3 it had taken the player's grey. It now ends on the Warm Blue celebration field inside the card, as the side panel's sessions do (§13.3, [Completing a goal](https://mobbin.com/flows/2d8a4c8a-20d1-4239-b528-c4fbd26742a7)): confetti, the bar the session moved with its cap (the module's lessons under a star, the reviews remembered under a tick, the basic words met under a star), the title `Done`, and the old line "Done · 3/3 correct · next review tomorrow" split into pills ("3/3 correct" with a ✓ mark, "Next review tomorrow"), then the Golden Yellow `Done` and the white `Open side panel`. No words were added.
- **Previews:** `/nudge.html` shows the card, menu, toast, micro-lesson and Quit sheet; `/complete.html?kind=card` shows the end in the card's own frame.

These searches returned the `ai_usage_notice` again (Mobbin AI usage is high this month); it was shown to the owner.

### 13.6 Motion pass (phase 6)
Mobbin shows stills, so each moment cites the Finch screens whose before and after imply it; the timings are the plan's motion table (the owner chose playful and quick) after Lasseter's principles, and every one was recorded frame by frame and measured with reduced motion on and off.

| Moment | Finch evidence | As built |
|---|---|---|
| Press | 3D buttons and raised rows sitting on a bottom edge ([Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b), [Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf)), as §5.1 | Buttons, answer options, word tiles, To do today lines and tab glyphs drop into their edge and squash in 90ms (ease-out), then spring back past rest in 180ms. Measured: the Start button's face drops 5px in about 50ms and settles back in about 70ms. |
| Tick | A goal's check turns done ([goal checked](https://mobbin.com/screens/c773fdf3-6f37-45c1-b527-12874802e923)) | A disc that turns correct pops 0.6 → 1.12 → 1 in 320ms and its ✓ draws in from the left 140ms later: the option's badge, the Correct sheet's mark, a matched pair, and a To do today line that has turned done since it was last seen open. |
| Tab switch | The soft tile sits under Home on [Home – goals](https://mobbin.com/screens/6e24c2f2-42f4-42da-9450-5c021b7d3678) and under Quests on [Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b) | The tile dips and squashes for 60ms, slides 260ms (ease-in-out) while it hops over a shallow arc, and lands with a small stretch (measured: 3–4px down, then 4px up). The new tab's glyph pops as it fills, and its cards settle in from 8px below, 40ms apart, in 220ms. |
| Sheets and dialogs | An action sheet over a dimmed screen, then a bottom sheet ([Skipping a goal](https://mobbin.com/flows/51fbdd4b-f556-465a-a30c-325ff25cc6a8)); the dialog card ([Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52)) | The backdrop fades in first (160ms). Sheets rise 60ms later past their place and settle (280ms); dialogs and the ⋯ menu dip, then rise with a small overshoot. Leaving takes 180ms with an ease-in: a sheet falls back down, a dialog drops away, the backdrop fades. Parts stay mounted for their exit (`useExit`, which waits for nothing when no animation runs, as in tests). |
| Toast | Dark pills rising above the tab bar ([goal checked](https://mobbin.com/screens/c773fdf3-6f37-45c1-b527-12874802e923), [Deleted goal](https://mobbin.com/screens/a33a6e25-abb0-4561-9844-37b625bd1d12)) | The pill rises from below past its place in 240ms, its white line drains over the 6 seconds, and it leaves with an ease-in drop and fade in 160ms, closed or timed out. |
| Progress and counts | The adventure bar between visits ("0 / 15", "8 / 20": [1st Adventure](https://mobbin.com/screens/13d6c98d-d362-4ae2-971f-d63601dcd598), [10th Adventure](https://mobbin.com/screens/b4c61bff-c543-4c41-a6d1-77c4643b7296)); the bar filling to MAX in [Completing a goal](https://mobbin.com/flows/2d8a4c8a-20d1-4239-b528-c4fbd26742a7) | Bars fill in 400ms with an ease-out that goes 4% past the mark and back (`--ease-fill`); the glint stays. The count inside ticks up with the fill. When the streak has grown since the panel last showed it, the chip bumps to about 1.15× and its flame wobbles once *(gap fill: Finch has no streak; Duolingo's combo counter, §5.5)*. |
| Celebration field | [Completing a goal](https://mobbin.com/flows/2d8a4c8a-20d1-4239-b528-c4fbd26742a7): the field, confetti, the bar filling to its cap, "Woohoo!", the reward pill, then `Continue` | Measured in the panel and the card: the field arrives, the title pops at 120ms, 32 confetti pieces burst on arcs for 900ms, the bar fills from 320ms while its count ticks, the pills arrive 80ms apart from 360ms, and the buttons land last, at about 1s, inside the plan's 1.2s. |

- **Reduced motion.** Every moment above is an opacity fade. Leaving parts fade out on their own (their children do not fade in again). Confetti and the Correct sheet's sparks are hidden rather than left still, and the loops (the current lesson's `Start` bubble, the audio and wave bars, the recording halo) stand still instead of turning into one long fade, which caught the bubble half-transparent.
- **Fixed while here.** Answer options never pressed down: their settle-in animation held its last frame (`transform: none`), which outranks `:active`. Entrances now fill backwards only, which looks the same while they play. The Quit and shortcuts sheets took focus while still below the panel, so the browser scrolled the whole panel up about 150px for the length of the rise; they now take focus without scrolling, as do the reset dialog and the ⋯ menu (which also keeps the host page still).
- **Tokens** (`motion.css`): `--t-release` 180ms, `--t-tick` 320ms, `--t-fill` 400ms, `--t-exit` 180ms, `--ease-fill`, and `--stagger` is now 40ms.
- **Preview:** `?state=streak` seeds a learner who studied yesterday, so a session today grows the streak.

## 14. Prompts on more sites (eighth session, 2026-10-29)

The owner asked for the card on more of the sites where browsing time goes: a fixed list, with each site switched on or off on its own. Time in desktop apps is out of reach for an extension and out of scope.

### 14.1 The list
- **Social and video:** X, LinkedIn, YouTube, Reddit (`www.` and `old.`), Instagram and Facebook. **News:** BBC (`.com` and `.co.uk`), The Guardian, CNN (`edition.` and `www.`), The New York Times, NOS, NU.nl, NL Times, DutchNews.nl and Hacker News. The news picks mix international news, Dutch news, the two English-language Dutch sites expats read, and Hacker News. Hosts were checked where the test browser could open them (`nu.nl` goes to `www.nu.nl`, `dutchnews.nl` to `www.dutchnews.nl`).
- Each site is its own optional host permission, so access stays per site. Browsing time is one count across the sites that are on.

### 14.2 Picking sites
- **Chips, not switches.** Fifteen switch rows would fill a screen of Settings. The sites are tag chips in two groups, Social and video and News, each with **All** or **None**. A chip that is off shows +, one that is on shows ✓ in the selected style. Both glyphs are the same size, so a tap never reflows the rows. The chips keep their own width, as tags do; the single-choice chips elsewhere share a row's width.
- **Onboarding** ticks every site. The learner takes away what they don't want, and **Turn on prompts** asks Chrome for the ticked sites in one dialog.
- **Settings** asks for one site per tap, or for a group's sites that are off with **All**. **None** and unticking remove access. When Chrome's own site access menu has removed a site, Settings shows it as off when it opens.

### 14.3 Where the card goes on other sites *(rule)*
- **Feed column** by known selectors where a site has one: YouTube's watch page (`ytd-watch-flexy #primary`, so the card sits over the related videos), Reddit (`shreddit-feed`), Instagram (the posts on screen) and Facebook (`[role="feed"]`).
- **Reading column** everywhere else. Paragraphs on screen that are at least two lines tall and 240px wide count as body text. When two or more of them span no more than two thirds of the viewport, that span is the column and stays clear. At 1440px, The Guardian's column measured 330–950 and NOS's 400–1040, so the card fits beside them. BBC's measured 359–1081, which leaves 5px too little, so on BBC articles the card waits. A wider spread is a page of stories, and the card may take the corner, as chat widgets do. Only boxes are measured, never text.
- **Videos** on screen are never covered.
- **Dialogs.** A fixed element that covers nine tenths of the viewport both ways is a dialog or a consent wall, such as YouTube's, or Sourcepoint's on BBC and The Guardian. Nothing fits beside it, so the card waits. A fixed element that holds the page's content is the page's own frame and may be covered.
- **Watching.** No new card appears while a video longer than 3 minutes plays with sound, or while the page is in full screen. The browsing time is kept. Shorts and Reels are shorter, so a prompt can still come while scrolling through them.
- **Whole-page chats** now include Instagram's `/direct`, Facebook's `/messages` and Reddit's `/chat`.
- **Not checked live:** Reddit (blocked in the test browser), and Instagram and Facebook (sign-in walls).

## 15. Progress backup (ninth session, 2026-10-29)

The owner lost their progress and streak by removing the extension while reloading it: Chrome deletes an extension's storage when it is removed, and nothing else held a copy. A backup is a file the learner keeps, so nothing leaves the device.

### 15.1 The file
- **One JSON file**, `taalnudge-backup-YYYY-MM-DD.json`. It holds `app: 'taalnudge'`, `format: 1`, `exportedAt`, the extension's version, `data` (every stored record under its `chrome.storage.local` key) and `pictures` (the learner's own pictures from IndexedDB, as data URLs). A picture is about 25 KB, so a backup with pictures stays small.
- **Left out:** `tn.trigger`, the browsing session's state, which means nothing later, and `tn.backup`, this browser's backup times: when the newest backup was made and when the reminder was put off.
- **Checked like stored data.** A file is a backup only if it has `app: 'taalnudge'`, a `format` and `data`. A later `format` gets its own message, to update the extension. Inside a backup, the store's own parsers drop anything malformed, as they do when reading storage, and only raster images are taken as pictures.
- **Saved with a link with `download`.** Chrome treats it as its own download, so the extension needs no `downloads` permission and no new Chrome Web Store justification.

### 15.2 Where it is
- **Settings → Progress**, above Reset progress: **Back up progress** and **Restore from file**, as whole-row actions with row tiles (Phosphor's download-simple and upload-simple) and ink labels. Red stays with Reset, the one destructive row.
- **Back up progress** says why before the first backup: "Saves a file you can restore from if TaalNudge is removed". After that it says when: "Last backup: today, 09:30", or "20 Oct 2026" on another day.
- **Onboarding's first screen** has **Restore from a backup** under Get started, because a reinstall starts there. It is the band's secondary button, white text on the blue.

### 15.3 Restoring
- **Pick, check, confirm.** The file picker shows only `.json` files. A file that isn't a backup gets a line saying so, and that backup files start with "taalnudge-backup": under the Settings rows, or in an ink-tinted box above the welcome buttons, so the buttons don't move. White on that tint is 6.7:1; a white tint measured 4.33:1, below AA for small text.
- **The confirmation** is the existing dialog with the safe choice as the primary button: **Cancel** (focused) and **Restore**. Restore is blue, not red, because a restore removes nothing: `ConfirmDialog` gained `danger`, on by default. The body says which backup it is and what restoring does: "Saved 20 Oct 2026, with 9 lessons done. It's added to your progress here, and your settings come back as they were." If sites that were on in the backup are off here, it adds "Prompts stay off until you turn your sites on again."
- **The dialog sits outside the welcome band.** Inside it, the band's rules would turn its primary button yellow and its focus ring white.
- **After a restore,** Settings says "Progress restored." From onboarding, the learner lands on Today: a restore marks them onboarded, as their progress is past the first-run steps.
- **The restored file counts as the last backup** here, unless this browser saved a newer one. The learner has that file, so Settings shows its date and the reminder doesn't ask for a backup straight after a restore.

### 15.4 Merging *(rule)*
A restore adds the backup to what is here and never wipes anything, so restoring onto a fresh start keeps what was done since.
- **Progress** goes through `mergeProgress`: per item, the more recently practised copy wins; per lesson, the copy completed more times; per day, the higher count. A tie keeps the copy here.
- **Notes:** the one written last wins; a tie keeps the one here.
- **Own pictures, drafts, corrections and "Make it yours" offers:** the backup adds the ones this browser doesn't have, and this browser's copy stays where both have one. A picture here is never swapped for one the learner can't see yet, and corrections keep their permanent ids.
- **Settings** come from the backup, with three exceptions. Sites stay as they are here, because Chrome's site access can't come from a file: after a reinstall every site is off until the learner turns it on, and Settings already checks access when it opens. A snooze stays as it is here, as it belongs to the moment it was set. The het-word image stays as it is here when the backup has none.
- **Known gap:** nothing records deletions, so a note, draft or picture removed since the backup comes back with it.

### 15.5 The reminder to back up
A backup only helps a learner who makes one, so Today reminds them.
- **When:** the learner has practised on 3 days and has no backup, or has practised since a backup that is 14 days old or more. With nothing new since the last backup, there is nothing to remind about. **Not now** puts it off for 14 days. The rule is `backupDue` in `src/storage/backup.ts`. Three days means the learner has some progress to lose and the first-run screens are behind them. Both numbers are starting heuristics, like the schedule's intervals, not tuned values.
- **Where:** a white card after **To do today**, before the stats. The day's learning comes first. In a 600px-tall panel with reviews due, the card is below the fold, as the stats are. A row in the to-do list was the other option, but a row is one button, and the reminder needs a second action, Not now.
- **What it says:** "Back up your progress", then "Removing TaalNudge deletes your progress. A backup file brings it back." for a first backup, or "Your last backup is from 20 Oct 2026." later. **Back up** is the soft secondary button and **Not now** a link, so the card stays quieter than the Start and Review buttons above it.
- **After Back up,** the card turns into "Backup saved" with a tick and the file's name, kept on one line so it can be searched for as written. On the next visit to Today it is gone.
- **Not now and the backup time** are kept in `chrome.storage.local` (`tn.backup`), so they last across panel and browser restarts, but are not part of any backup.
- **Preview:** `/panel.html?state=backup` is the `today` learner with two more days of practice, so the card shows. The `today` seed itself, with two days, doesn't show it.

## 16. Topics tab (tenth session, 2026-10-29)

The owner wanted vocabulary practice by topic, as Dutched offers by chapter (`docs/topics-and-scenario-packs-plan.md`, Phase T1). The tab lists the 21 basic-word themes now; the scenario packs join it later.

### 16.1 References (Mobbin)
- [Duolingo – Words practice](https://mobbin.com/screens/a47d0400-435b-4be7-b1ba-16cc97ad36a9): one START button above the list, each word with a speaker, its meaning and a red dot on weak words.
- [Preply – Vocabulary practice](https://mobbin.com/screens/a839b88a-b538-45da-b6b3-6ea5ae43b30c): a "Practice your vocabulary" card, then count chips "11 new · 15 learning · 0 learned" over word rows with a New pill.
- [Quizlet – Set progress](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f): Not studied / Still learning / Mastered counts above the terms, each term with audio.
- [Monzo – Learn list](https://mobbin.com/screens/3de45a06-2a6b-412c-8d28-c129deeffa68) and [Uxcel Go – Course list](https://mobbin.com/screens/dba87d9e-9955-49be-be73-686477e601ee): a list of topics as rows with a tile, a title and "0 of 4 complete".

### 16.2 Decisions
- **A fifth tab, between Course and Review:** Today · Course · Topics · Review · Progress, with Phosphor's squares-four glyph. Five fits the panel's width with the labels kept; the tile and grid divide by five.
- **The list reuses the To do today row:** tile, title, "12 of 29 met · 3 due" and a thin bar. The count is in the meta line only, so the bar does not repeat it.
- **A theme's page:** "All topics" back, then a card with the title, three strength chips in the Progress tab's colours (new grey, learning orange, strong green), the bar, and the buttons. **Practise** is primary once a word is met ("Practise · 3 due", or "Practise 10 words"); **Learn 5 new words** is secondary then, or primary before anything is met. Below, every word with a speaker, its meaning and its strength as a dot and a label, the dot hollow for new.
- **Why Learn is missing** is said in a line: new words off, today's limit used ("raise the limit in Settings"), or this theme's batch already learned today.
- **Pressing Topics again** goes back to the list, as tab bars return to the root. A session started from a theme comes back to its page.

### 16.3 Motion (Lasseter)
- Staging: the theme's page replaces the list and its cards settle in a beat apart, with the existing `.tn-screen` entrance.
- Overlapping action: list rows settle in one stagger step apart, the first eight only, so a long list does not keep arriving.
- Anticipation, then follow-through: the strength chips rise in after the title with `tn-rise-in` (a small dip, a rise, a slight overshoot). `tn-pop` spins and was too much for text.
- Squash and stretch: All topics squashes on press and springs back; its arrow nudges back on hover before the move.
- Reduced motion turns all of it into fades (`motion.css`).


## 17. Scenario packs on the Topics tab (eleventh session, 2026-10-29)

Phase T2 of `docs/topics-and-scenario-packs-plan.md`: packs are real-life situations in 3–4 scene lessons beside the course, with a mission to do for real. They join the Topics tab under **Situations**, above the word themes.

### 17.1 References (Mobbin)
- [Acorns – Course](https://mobbin.com/screens/c50e439a-6caf-49f2-b34b-028fa4e87eac): a course's lessons as numbered circles joined by a line, a tick in the circle once done, a chevron on each row.
- [Brilliant – Level](https://mobbin.com/screens/8ad69ea6-81ed-4197-863d-ccba9f524a8f): the level's steps listed with ticks, one Start button under them for the next one.
- [Insight Timer – Course](https://mobbin.com/screens/4a38bd44-6c29-41d9-bd65-f4224383eccb): "Start Day 1" names the step the button starts.
- [Speak – Course](https://mobbin.com/screens/54c58cdc-4f98-4999-92ca-a598df8fc335): lessons named after situations ("Order food and drinks", "Get it for here or to go").
- [Uxcel Go – Level list](https://mobbin.com/screens/96c930e2-480b-49a1-ba69-5132a1c5b2b2): a later level marked locked but still listed.
- [Noom – Your challenges](https://mobbin.com/screens/91a378f3-09df-41ee-8366-1311f02b72d3): a real-world challenge as a card with its own "Did it today" button; done ones say so. [Insight Timer – Activities](https://mobbin.com/screens/2a0e04e5-eca9-40de-9d32-619539174579): a tick button at the end of each activity.

### 17.2 Decisions
- **Situations above Word themes,** each pack in the same row as a theme: a Dodger Blue tile with Phosphor's chats-circle glyph, the title, and a line that says where the learner is: "4 scenes · 33 phrases and words" before the start, "Scene 2 of 4 · 8 of 33 met · 3 due" during, "All 4 scenes done" after. The thin bar counts scenes, the pack's real progress.
- **A new tile colour for packs, Dodger Blue with an ink glyph,** the palette's sticker pair, so a pack never looks like a lesson (Warm Blue) or new words (Denim Blue). Tiles stay never green or red (`docs/colour-system.md`).
- **A pack's page:** All topics back, then a card with "Best after: Stage 3 · Service situations" (the latest course module the pack builds on, advice only, never a lock), the title, the situation, a scenes bar and one primary button that names the step: **Start scene 1**, **Continue scene 2** once that scene was opened. **Practise this pack** (with "· 3 due" when it applies) is secondary until every scene is done, then primary. It appears once one of the pack's own items is met.
- **Scenes as numbered steps joined by a line,** as on Acorns: a Warm Blue disc for the next one, a green disc with a tick once done ("Done · play again"), a grey disc with a lock until its turn ("After scene 1"). The line turns green below a done step. Locked steps are disabled but listed, so the learner sees the whole situation.
- **Do it for real:** the mission as a white card with its own **Done it** button, as Noom puts a challenge on a card. The button holds a round box that fills green with a tick, and the card takes a light green tint. It is a toggle (`aria-pressed`), so a mistaken tick can be undone, and it is never scored.
- **Good to know:** the culture note in a quiet card with the soft bulb tile, after the mission.
- **Phrases and words:** the pack's own items in scene order, with audio, meaning and strength dot, the theme page's rows.
- **Today:** "Continue: Gemeente and paperwork" with "Scene 2 of 4 · Forms and a letter about your move" and a scenes bar, under New words, for the pack the learner was in most recently. It starts that scene straight away, like the other rows.
- **Progress:** a Situations meter after Basic words: "1 of 13 started · 40 of 300 phrases and words met".
- **The end of a scene:** "Scene complete!", the pack's scenes bar, then **Next scene** (the next in order) and **Back to the pack**. After the last scene only **Back to the pack**, where the mission waits. Back to the pack opens the pack's page on Topics wherever the scene was started.
- **Examples no longer highlight a bare article.** Every noun item is "de …" or "het …", so each example lit up its articles; only the item's own words are marked now.

### 17.3 Motion (Lasseter)
- Overlapping action: the scene steps settle in one stagger step apart after the head card, as the theme rows do.
- Squash and stretch: a step presses into the card and springs back, its disc squashing more than its row (secondary action). The Done it button squashes like the other buttons.
- Squash and stretch with exaggeration, then overlapping action: a mission ticked here pops its box (`tn-tick-pop`) and the tick draws in after it (`tn-tick-draw`). A tick that was already there just shows.
- Slow in and slow out: the mission card's green tint fades in with `--ease-out`.
- Reduced motion turns all of it into fades (`motion.css`).

## 18. Word sets: false friends (twelfth session, 2026-10-29)

Phase T5 of `docs/topics-and-scenario-packs-plan.md` adds a set beside the situations: the Dutch words that look like English ones but mean something else. It is played like a pack, in short parts, but it is not a situation, so it has no text, listening or writing task, and its page lists the words it shares with the word track and the packs.

### 18.1 References (Mobbin)
- [Vocabulary – Practice](https://mobbin.com/screens/32da9e8a-293b-4797-9b3a-752a60aaf793): separate headed groups for different kinds of practice ("Challenges", "Categories") on one screen.
- [Preply – Collections](https://mobbin.com/screens/0f799a6c-d230-4e54-8016-bae17eaa89e6): word collections as rows with a lead line and "11 words, A1" under each title.
- [Vocabulary – Word cards](https://mobbin.com/screens/fdf0f6c0-6a14-4d49-ad5c-abaa64b1a1a7): a word, its meaning, and a usage line under it in smaller text.
- [Wispr Flow – Dictionary](https://mobbin.com/screens/e5acebf2-50cc-4271-ae9d-f9164a9b799f): one term mapped to another in a list row ("btw → by the way").

### 18.2 Decisions
- **Tricky words, between Situations and Word themes,** under its own heading and lead ("Short sets on the words that trip up English speakers."), as Vocabulary separates kinds of practice. A set is not a situation, so it does not sit in that list, and it is closer to the situations (parts in order, a page) than to a theme.
- **The same row, a different glyph:** the packs' Dodger Blue tile with Phosphor's translate glyph instead of the chats bubble, so a set reads as part of the packs family and as being about two languages. "4 parts · 25 phrases and words", then "Part 2 of 4 · 8 of 25 met", then "All 4 parts done".
- **Parts, not scenes:** a set has no story, so its page, its steps, the Today row and the end screen say part and set ("Start part 1", "After part 1", "Practise this set", "Part complete!", "Next part", "Back to the set"). Everything else is the pack's page.
- **The words show their note:** each word's meaning is followed by what to use for the English look-alike ("cheeky, rude · not "brutal": that is wreed"), the line the lesson's key phrases already show. Words the set shares with the word track or a pack (slim, kind, worst, solliciteren) are listed with its own, after the part that first practises them.
- **No "Best after" line and no situations count:** a set builds on no course module, and the Progress tab's Situations meter counts situations only. A mission is optional for a set; this one has a light noticing task, so Do it for real stays.
- **Today:** a set in progress gets the Continue row like a pack ("Part 2 of 4 · Food and shops"); it reads naturally with "part".

### 18.3 Motion (Lasseter)
- No new animation. Overlapping action: the set's row settles in with the list's stagger, one step after the last situation, so the three groups arrive in reading order (`tn-settle-in`, capped at eight steps).
- The set's page reuses the pack page's motion (§17.3): staging for the page, overlapping action for the steps, squash and stretch on press, the mission tick's pop.
- Reduced motion turns all of it into fades (`motion.css`).
