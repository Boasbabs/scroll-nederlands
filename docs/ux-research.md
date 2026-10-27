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
- Flow screens (onboarding, lesson, review) have one primary button: full width (328×48px) and pinned in a bottom action zone with 16px padding. A secondary action goes directly beneath it as a 44px outline or text button. Cards on Today can each carry their own button.
- Type: a chunky, rounded display face, used only for screen titles (22px), the target Dutch phrase (28px) and large numbers. Body text is 16px, secondary text 14px, and labels are 12px caps.
- Tactile controls: buttons have a 12px radius and a 4px bottom edge in a darker tone. Option rows and tiles have a 2–3px edge. When pressed, the face drops by the height of the edge. Disabled controls are flat.
- Keyboard: `1`–`4` pick an option (each option shows its number badge). `Enter` checks, then continues *(rule: standard form submit; no lesson screen on Mobbin shows this hint)*. `Backspace` removes the last placed tile. `Esc` closes a sheet or menu; in a lesson it asks "Quit lesson?". `?` lists the shortcuts. The nudge card only handles keys while focus is inside it *(rule: X and LinkedIn use single-key shortcuts)*.

### 1.2 Colour roles (full table and evidence in §4)
- Text is Oiler Navy `#19244e` on white (15:1). Muted text is navy at 70% (≈`#5E6683`, 5.7:1). Never set text in Sunset Orange or Mango on white (3.0:1 and 2.2:1).
- **Primary CTA**: Sunset Orange fill, navy label (4.95:1), navy bottom edge. **Secondary**: white with a 2px navy border and navy label. **Links**: Brilliant Blue (9.7:1).
- **Selected** (before Check): white fill, 2px Brilliant Blue border, and the number badge filled Brilliant Blue with a white digit.
- **Correct**: Ocean Water surface with navy text (11.3:1), ✓ in a Brilliant Blue disc, and a Brilliant Blue `Continue` with a white label (9.7:1).
- **Incorrect**: Sunset Orange 12% tint (≈`#FEEDE6`) with navy text (13:1). The ✕ disc is Sunset Orange. The differing token is bold with a 2px Sunset Orange underline. The button is navy with a white label. There is no red anywhere.
- **Review / tip / checkpoint** (the "come back to this" family): Mango. Review hero card: Mango fill, navy text (6.8:1). Tip callout: Mango 20% tint (≈`#FDEBD2`). Checkpoint node: Mango disc with a navy glyph.
- **Progress** bars are Brilliant Blue on a navy-8% track. **Streak/combo**: Sunset Orange flame with a navy count. **Disabled**: navy-8% fill, navy-45% label, no edge.
- **Brand hero** surfaces (welcome, lesson complete): Brilliant Blue with the blue-on-blue squiggle pattern and white text.

### 1.3 Onboarding (three steps, then lesson 1)
- Every step has a back arrow, a 3-segment progress bar and one question. The primary button stays disabled until a choice is made.
- **Welcome**: full-bleed brand hero with the greeting "Hallo · Hoi · Dag" in display type, one line ("Learn Dutch in 2-minute breaks while you browse") and `Get started`.
- **Level + start point**: "How much Dutch do you know?" offers three rows with signal-bar icons: *I'm new to Dutch* (A0), *I know some words* (A1), *I can handle basic conversations* (A2). Below it, "Where should we start?" offers two cards: **Start from scratch** (with a `Recommended` badge) and **Take the Stage N checkpoint** (to jump ahead).
- **Browsing prompts**: shows a live mock of the nudge card, checkboxes **X** and **LinkedIn** (both on), interval chips (5 · **8** · 15 · 30 min) and "You can change or pause this anytime in Settings". The primary `Turn on prompts` opens Chrome's permission dialog. The text button `Not now` skips. If the user skips or denies, onboarding continues and Settings shows "Prompts are off · Turn on".
- The last CTA is `Start lesson 1`.

### 1.4 Today, Review tab, caught-up state
- Today, from top to bottom:
  1. App bar: "Today", streak chip, gear.
  2. **Review card**: Mango fill; "12 reviews due" in 20px navy display type; the navy button `Review now` (white label).
  3. **Continue card**: white with a 1px navy-10% border. Shows "Stage 1 · Food, drinks and cafés", the lesson title, a progress bar and the primary `Continue`.
  4. **Quick practice** row: outline button "Quick practice · 2 min".
  5. Stats row: two cells in one bordered row, "Lessons 14/270" and "Strong words 86".
- Review tab: a due count in 40px display type, `Start review (12)` and the secondary `Practice anyway`.
- Caught up (no reviews due): replaces the review card on Today and the body of the Review tab. Shows a 48px ✓ in an Ocean Water disc, "All caught up" (18px), "Next review in 3 h · 8 items" in muted text, and the secondary `Continue course`.

### 1.5 Course path (4 stages → ~56 modules → ~270 lessons)
- The Course tab is a vertical list of four **stage cards**: "Stage 0 · Foundations" plus a CEFR chip, a progress bar and "5/8 modules". The current stage is expanded and the others collapsed. Future stages carry a `Jump here` link that opens that stage's checkpoint.
- Inside a stage are **module rows** (accordions, 56px): number, title, "3/6", a thin bar and a chevron. An expanded module shows a **lesson stepper**: a 2px vertical connector with 32px nodes.
  - Done: Brilliant Blue disc with a white ✓. Tapping it replays the lesson.
  - Current: white disc with a 3px Sunset Orange ring, a navy "Start" label bubble above it, and an inline primary `Start` or `Continue`.
  - Locked: navy-8% disc with a navy-45% lock. Not tappable.
  - Checkpoint: Mango disc with a navy flag, labelled "Checkpoint". Placed wherever the curriculum defines one (`s0-check`, `s1-check`, …).
- On open, scroll so the current lesson is in view. When it scrolls out of view, a floating pill `↑ Current lesson` appears.

### 1.6 Lesson player
- Top bar (48px): `×` on the left (40px target), a 10px rounded progress bar, and a combo chip on the right (flame + count) that appears after three correct answers in a row.
- Below the bar, 16px down: the instruction (18px bold, left-aligned), then the prompt, then the answer area. `Check` is pinned at the bottom and stays disabled until there is an answer. It is never hidden.
- **Learn card**, top to bottom:
  1. Label `NEW PHRASE`.
  2. Dutch phrase (28px display).
  3. Audio row: play (48px, Brilliant Blue) and slow/turtle (40px).
  4. Translation (16px muted).
  5. Word breakdown: tokens with dotted underlines; tapping or hovering shows the meaning. For multi-word phrases, add a 2-column mini table (Dutch | English).
  6. 1–2 examples: speaker, Dutch with the target word in bold Brilliant Blue, English muted.
  7. Tip callout.
  8. `Continue`.

  If Autoplay is on, the phrase audio plays when the card opens.
- **Multiple choice**: a prompt card (Dutch + speaker), then 2–4 option rows (52px, 8px gaps, number badge on the left).
- **Listen-and-choose**: a centred 64px play button and 48px slow button, then option rows. The text link `Can't listen now` skips audio-only items for the rest of the session *(duration is a rule)*.
- **Match pairs**: two 160px columns of 4–5 rows of 48px tiles, Dutch on the left and English on the right, both shuffled. Tap one tile in each column. A match turns both tiles Ocean Water with a ✓, after which they go disabled. A mismatch shows the incorrect style on both, then resets *(rule: no mismatch frame on Mobbin)*. `Continue` enables once every pair is matched.
- **Fill the gap (typed)**: the sentence card has an inline input in the gap (2px underline, Sunset Orange when focused) with the translation underneath. A 💡 hint button reveals the first letter *(what it reveals is a rule)*.
- **Word tiles / sentence builder**: two ruled answer lines on top and the tile bank below (wrapping, 8px gaps, 40px tiles). Tapping a tile moves it to the end of the answer and leaves a ghost slot in the bank. Tapping a placed tile sends it back. `⌫` removes the last tile.
- **Type the Dutch**: an English prompt card, then a multi-line input that is auto-focused, then the text link `Don't know`. Answers typed without diacritics are accepted, and feedback shows the accented form *(rule)*.
- **Dictation**: an audio header (play + slow), then an input, then `Check` *(composed)*.
- **Dialogue**: the partner's bubble sits on the left (32px avatar, Dutch text, speaker, and a translate icon that reveals the English). Below it, "Choose the reply" offers 2–3 numbered options. On Check, the chosen reply joins the chat as a right-aligned bubble with ✓ or ✕.
- **Short writing**: a situation card with an English cue, then a 3-line input with a character count, then `Check`. Check reveals a "Model answer" box (navy-4% fill) and a checklist ("Did you use *ik woon*?"), followed by the self-rating buttons *(composed)*.
- **Speaking** (never auto-assessed):
  1. Phrase card with play and slow buttons.
  2. A 72px Brilliant Blue mic button labelled "Tap to record". While recording it becomes a stop button with a live waveform and a timer.
  3. Review state: two rows, **Native ▶** and **You ▶**, plus `Record again` *(composed)*.
  4. "How close was it?" with `Not yet` / `Sounds right` (feeds scheduling).

  The text link `Can't speak now` skips speaking items for the session.

### 1.7 Answer feedback
- On Check, the answer locks and a sheet slides up over the action zone: full width, 16px top radius, 16px padding.
- **Correct**: Ocean Water sheet, ✓ disc, "Correct!" (20px bold), an optional "Meaning: …" line, and the Brilliant Blue `Continue`. The chosen option turns Ocean Water with a blue border and a ✓ badge.
- **Incorrect**: Sunset-tint sheet, ✕ disc and "Not quite".
  - Content: "Correct answer:" with the differing tokens bold and underlined. Typed answers also get a muted "Your answer:" line above, with the wrong token underlined. Then "Meaning:".
  - Buttons: the navy `Got it`, plus the outline button `Why?`, which expands a 1–3 line explanation inside the sheet.
  - Options: the wrong one gets the Sunset tint, a Sunset border and ✕. The right one gets a blue border and ✓.
- **Typed and tile exercises**: the first miss shows "Not quite" with `Try again` (primary) and the text button `Show answer`. Only the second miss shows the full incorrect sheet.
- Missed items come back later in the same lesson, labelled with a `REVIEW` chip (navy text on Mango).
- Copy: "Correct!" and "Not quite". No exclamation mark on errors, and no guilt.

### 1.8 Lesson complete, review session, checkpoint result
- **Lesson complete**: a brand-hero band with the mascot or illustration, then "Lesson complete!" and "4 new phrases · Groeten".
  - Three stat cells in one bordered row, about 104px each: `Correct 7/8 · New 4 · Time 3:12`.
  - A "Review these" list of missed phrases, each with a speaker.
  - The primary `Continue` (next lesson) and the secondary `Back to course`.
- **Review session**: the same player, with the header "Review · 12 left".
  - Recall card: "How do you say this in Dutch?", tap to reveal (Dutch + audio), then "Did you remember it?" with `No` / `Yes`.
  - Other due items reuse the exercise types.
  - The end screen shows "Strong 9 · Still learning 3" pills, `Done`, and `Review 3 again`.
- **Checkpoint result**: "12/15" in 40px display type with the percentage, plus a two-segment ring (blue correct, Sunset incorrect) with counts.
  - Pass: "Stage 0 complete. Stage 1 is unlocked." with the primary `Continue`.
  - Below threshold: "Almost. You need 12/15." with the primary `Review mistakes (3)` and the secondary `Retake later`.

### 1.9 Progress (one short scroll; no leaderboards, no charts beyond bars)
1. Streak row: seven day-circles, with days studied stamped by a Sunset Orange ✓.
2. Words and phrases by state, as three rows (ring, count, label, chevron): **New** (navy-45% ring), **Learning** (Mango ring), **Strong** (Brilliant Blue ring). Tapping a row lists its items.
3. Lessons: "14 of 270" with a bar, then four stage rows with bars.
4. Upcoming reviews: four tiles in one row, **Today · Tomorrow · This week · Later**, each with a count.

### 1.10 Settings (grouped cards; label left, control right, 14px muted helper text below; changes apply instantly with no Save button)
- **Browsing prompts**:
  - `Prompts on X` and `Prompts on LinkedIn` (toggles).
  - `Prompt after` (chips: 5 / 8 / 15 / 30 min).
  - `Quiet mode` (toggle, "No prompts until you turn this off").
  - `Snooze`: a row that opens 30 min / 1 hour / Until tomorrow. While a snooze is active, the row reads "Snoozed until 15:30 · Resume".
- **Audio**: `Autoplay audio` (toggle), `Audio speed` (chips: Slow / Normal), `Sound effects` (toggle).
- **Progress**: `Reset progress` (a navy text row) opens a dialog:
  - Title: "Reset all progress?"
  - Body: "Lessons and reviews go back to the start. This can't be undone."
  - Buttons: the primary `Keep my progress` and the text button `Reset everything`.

### 1.11 In-page nudge (x.com, linkedin.com)
- **Trigger**: after about 8 minutes of active browsing (the `Prompt after` setting), only while the tab is visible and the user isn't typing in a composer *(rule)*. The card stays until the user acts; it never auto-dismisses *(rule)*.
- **Placement**: `position: fixed`, 24px from the right edge. Its bottom sits 16px above the host's floating UI in the bottom-right corner: on X, the stacked Grok/Chat buttons; on LinkedIn, the Messaging bar. Measure these at runtime. With no host dock, the bottom offset is 20px.
- **Collision rule** *(rule)*: the card must never intersect the feed column, an open host chat window or X's Spaces dock. If it would, use bottom-left (over the left column, where LinkedIn shows its own toasts). If that also collides, skip this interval. There is no backdrop and the card never takes focus.
- **Collapsed card**: 340px wide (`min(340px, 100vw - 48px)`), 16px radius, 16px padding, soft shadow, 1px navy-10% border.
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

**Decisions:** the order in §1.4. The Mango review card follows Babbel's yellow review card and dark button. The Continue card follows Brilliant and Speak. The stats row follows Mimo. The Review tab and its badge follow Babbel's Review tab (badge "21" on the Learning plan, §2.3). Settings sits behind a gear in the app bar, as on [Uxcel Go – Profile](https://mobbin.com/screens/90071f3f-7e49-4430-9431-475af3dcf00a) and [Headspace – Profile](https://mobbin.com/screens/bb0004ec-e553-4e4d-a10e-1e21e59c8781).

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

**Decisions:** §1.6 learn-card order. Play and slow buttons copy Duolingo. Dotted-underline tokens and the mini table copy Duolingo's hints and grammar table. The tip box copies Babbel (Mango tint in our palette). The Autoplay setting mirrors Speak's `AUTO` toggle.

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

**Decisions:** §1.7. Errors use our warm Sunset tint with a navy button (Brilliant uses warm yellow, Quizlet orange, below). Correct uses Ocean Water and blue. The first-miss retry follows Brilliant's "Not quite" and Babbel's "Attempts 2/3".

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

| Role | Assignment | Text contrast | Mobbin support |
|---|---|---|---|
| Body text | Oiler Navy `#19244e` on white; muted = navy 70% | 15:1; 5.7:1 | Memrise navy type ([flow](https://mobbin.com/flows/97215372-5a04-4f1a-a800-7146e6aff4ad)) |
| Primary CTA | Sunset Orange `#f36b2e` fill, **navy** label, navy 4px bottom edge | 4.95:1 | Orange CTAs: [Babbel](https://mobbin.com/flows/78aaba88-e477-4ba8-b178-a7c7ac7bf41e) pairs orange with white, which on our Sunset Orange is ~3.0:1, so we use navy. Dark labels on warm buttons: [Memrise paywall](https://mobbin.com/flows/97215372-5a04-4f1a-a800-7146e6aff4ad), [Codecademy](https://mobbin.com/screens/e5f9212c-2708-49ec-99ba-8ddb434b673b), [Greenlight](https://mobbin.com/screens/c7bc0de7-822a-4787-89a7-a6f70e6e19a8). Tactile edge: [Duolingo](https://mobbin.com/screens/a93fa0d8-0b53-4cec-bb29-2e7838163ea0), [Life Reset](https://mobbin.com/screens/104bab06-a01d-47aa-bc08-1de4360322ce), [Vocabulary](https://mobbin.com/screens/f6ba1a9b-3999-4272-9e43-40dcd1cea5e9) |
| Secondary / link | White + 2px navy border, navy label / Brilliant Blue `#253c96` text | 15:1 / 9.7:1 | [Babbel outline `Correct my mistakes`](https://mobbin.com/screens/3f19cfed-6f89-46fc-b1af-188088273652) |
| Selected | White fill, 2px Brilliant Blue border, blue number badge (white digit) | 9.7:1 | Blue selection: [Duolingo onboarding](https://mobbin.com/flows/ac9d2f58-868d-4fd3-a79c-9655ce6b1522), [Speak](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035). Border-led: [Uxcel](https://mobbin.com/screens/55d35782-1f23-4609-a59d-6c0fce819924) |
| Correct | Ocean Water `#c4e7e5` sheet, navy text, blue ✓ disc, Brilliant Blue button with white label | 11.3:1; 9.7:1 | Tinted success sheet + state button: [Brilliant](https://mobbin.com/screens/3c5f9cbd-0ee9-4766-9bd4-578c5c297ab9). Teal success tick: [Speak](https://mobbin.com/screens/d9b1330c-32aa-430f-abc4-a9a4a8af1e61) |
| Incorrect | Sunset 12% tint `#FEEDE6`, navy text, Sunset ✕ disc and diff underline, navy button with white label | 13:1; 15:1 | Warm, red-free errors: [Brilliant "Not quite"](https://mobbin.com/screens/82e01d81-cc4a-499f-af8d-90e39937a6ce), [Quizlet orange "Incorrect"](https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014), [Coinbase ⚠ "Incorrect. Let's try again"](https://mobbin.com/screens/90d03299-7194-44df-bba1-cb1430f7a192). Dark button on an error sheet: [Brilliant](https://mobbin.com/screens/b8267636-47cb-40a3-8a65-af103494ea60) |
| Review / "come back" | Mango `#f59a1e` card with navy text and a navy button; `REVIEW` chip | 6.8:1 | [Babbel yellow review card](https://mobbin.com/screens/4362b601-1544-43d7-aa4a-20a178466c8b), [Uxcel orange "Time to review"](https://mobbin.com/screens/2c40de62-214d-410c-81bb-a6a8cce4c42b), [Duolingo "PREVIOUS MISTAKE"](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18) |
| Tip callout | Mango 20% tint `#FDEBD2`, navy text, 💡 + "Tip" | 12.8:1 | [Babbel tinted "Heads up!" tip](https://mobbin.com/screens/75cab2bc-d7e2-4d02-9fce-ed9854d12874) |
| Disabled | Navy 8% fill, navy 45% label, no edge | exempt | [Duolingo](https://mobbin.com/screens/8199682b-96e6-4d64-be65-98e3dd309fc2), [Babbel](https://mobbin.com/screens/895e2965-01d5-4727-94b5-f5c67b855a82) flat grey disabled |
| Progress | Brilliant Blue bar on a navy-8% track; done nodes are blue ✓ discs | non-text ≥3:1 | [Speak blue bar](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035), [Noom dark ✓ stepper](https://mobbin.com/screens/4928d8b8-548f-41b8-a673-e9a5af552657) |
| Streak / current | Sunset Orange flame, ✓ stamps, current-node ring; navy numerals | 4.95:1 | [Speak orange streak](https://mobbin.com/screens/91ee559c-d53f-4bff-b5cd-f853f38cf4c3), [Headspace orange current dot](https://mobbin.com/screens/1cba404f-413c-4a8b-be36-d791e9ca4fed), [Life Reset orange ring](https://mobbin.com/screens/cb3e87ef-1183-486f-bd20-2f465417d486) |
| Brand hero | Brilliant Blue + blue-on-blue squiggle, white text | 9.7:1 | Navy/blue full-bleed brand steps: [Memrise](https://mobbin.com/flows/97215372-5a04-4f1a-a800-7146e6aff4ad). Squiggle art: [Quizlet](https://mobbin.com/screens/e3067f6b-ea92-4688-a482-22cb28c31b31) |

Closest palette analogues: **Memrise** (navy + mango-yellow + light blue, chunky rounded logo, navy 3D buttons, navy-on-yellow CTA) and **Codecademy** (navy surface, yellow CTA with dark text, yellow progress). Rules: orange and mango are fills and icons only, never text on white. States never rely on colour alone, because every state also has an icon (✓/✕) and a title.

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
- **Changed**: green success and red danger become Ocean Water and a Sunset tint (the palette has neither green nor red). "No confetti" becomes one celebration at lesson complete. The tab bar gains a Review tab, and Settings moves behind a gear in the app bar. The path becomes a stage → module → lesson stepper with checkpoint nodes.
- **Kept and re-validated**: Grammarly's action order and `⋯`, LinkedIn's bottom-left toast slot, X's bottom-right Grok/Chat stack, the Duolingo/Babbel learn card, and the bottom feedback sheet.

## 7. Decisions added while building (second session, 2026-10-27)

- **Quit lesson sheet** (§1.1 names the "Quit lesson?" question but not its buttons). A bottom sheet over the dimmed lesson: title "Quit lesson?", body "Your answers in this session won't be saved.", the primary `Keep learning` and the text button `Quit`. Esc or `×` opens it. Evidence: [Speak – "Are you sure you want to quit this lesson?" with `Keep Learning` and text `Quit`](https://mobbin.com/screens/5f5cc3f9-ea84-4e93-a3d9-7302ad743002), [Brilliant – "Are you sure?" with dark `Keep learning` and text `Quit`](https://mobbin.com/screens/d7d7f00a-f59b-4bf2-acfb-8cb35b147154), [Preply – "end this practice?" with `Back to practice` and text `End practice`](https://mobbin.com/screens/4229fa4c-fb3f-4aee-a365-460650a65f20), [Uxcel Go – "Hold it right there!" with `Exit lesson` / `Keep learning`](https://mobbin.com/screens/ab29f135-d2a3-4eed-a20f-b4b087dfca68). This search returned the first `ai_usage_notice` (Mobbin AI usage is high this month); it was shown to the owner.
- **Review end pills** read "Remembered n · Still learning m" (Quizlet's Know / Still learning, §2.7), not "Strong n": in this product *Strong* means unaided recall after a gap of a week or more (§1.9), and a single review cannot show that.
- **Recall card** (§1.8) is used for the generated independent-recall drills in reviews, whose prompt is exactly "How do you say … in Dutch?". Other due items keep their exercise types.
- **Short writing** self-rating, after the model answer and the checklist: `Not yet` / `Looks right` *(composed: the binary self-rating of the Babbel recall card)*. The counter shows words against the minimum (the checker counts words), in place of a character count.
- **Speaking** stays learner-led: `Not yet` / `Sounds right` continue the lesson and are not sent to the schedule (the engine does not grade speaking). §1.6 "(feeds scheduling)" is not built.
- **Match pairs** are graded per pair: a mismatch marks only the items involved, so one slip does not send every pair back into review.
- **Today's caught-up block** has no `Continue course` button, because the Continue card directly beneath it starts the course; the Review tab's caught-up block keeps it.
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
