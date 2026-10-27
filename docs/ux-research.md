# TaalNudge UX research (Mobbin)

Product rule: we do not invent UI/UX; every decision below cites Mobbin screens. Targets are the Chrome **side panel** (360–420px wide) and the **in-page nudge card** (~340px) on X and LinkedIn. Mobbin search results were reviewed by looking at the screenshots themselves. None of the searches returned an `ai_usage_notice`.

## Decisions (implement directly)

**Shared tokens**
- Colour roles. `selected` uses a blue tint fill plus a blue border, and appears before Check. `success` is a light green surface with dark-green text/icon and a green filled button. `danger` is a light red/pink surface with dark-red text/icon and a red filled button. `disabled` is a neutral grey fill with grey label. `tip` is a warm tinted callout (peach/amber). Do not reuse green for "selected"; Speak and Duolingo keep selection blue and only show green after checking.
- Side panel layout. Use 16px horizontal padding. The top bar holds a close/back control on the left and a thin progress bar. Content scrolls; the primary action is a **full-width 48px button pinned to the bottom** of the panel.
- Keyboard (desktop). `Enter` = Check/Continue, `1`–`4` pick options (Duolingo web shows the number keys on options; Uxcel lists `Continue ENTER` under Hotkeys).

**In-page nudge (~340px)**
- Anchor it in a bottom corner with 16–24px insets, never over the feed column. Default to **bottom-right, raised above host docks** (LinkedIn Messaging bar, X Grok/Chat buttons). Fall back to **bottom-left**, where LinkedIn shows its own toasts, when the right side is occupied.
- Structure: a header row with app mark, a small label ("Dutch · 1 min") and an `×` top-right. The body is the Dutch phrase in bold with the English gloss muted below. The action row is `⋯` (left), then `Not now` (ghost) and `Learn now` (filled primary, rightmost).
- `⋯` opens a menu: Snooze 30 min / 1 hour / Until tomorrow, divider, Quiet mode.
- After Snooze or Quiet, swap the card for a one-line toast: "Snoozed for 1 hour · Undo ×". It auto-dismisses with a thin timer bar. The nudge itself never auto-dismisses.
- Light surface, 12px radius, soft shadow, 16px padding, 32–36px compact buttons with 8px gap.

**Side panel screens**
- Learn card, top to bottom: label, then Dutch phrase (24–28px bold) with audio button and slow-audio button, then English translation (muted), then word breakdown tokens, then 1–2 example sentences (audio + Dutch with target word highlighted + English muted), then a tinted Tip callout, then a pinned `Continue`.
- Exercise: bold instruction title, then prompt card, then answer area, then a pinned `Check` that stays **disabled grey until an answer exists**.
- Feedback: a bottom sheet replaces the Check zone. It has an icon and title ("Correct!" / "Incorrect"), "Correct answer:" with the differing word bold/underlined, "Meaning:", and a full-width `Continue` tinted to the state. Add an optional secondary "Why?" (explanation) or "Try again".
- Roadmap: a summary strip (Reviews due with `Review now`, and lessons done x/y with a bar), then Stage cards (A0/A1/A2 + bar), then Module rows, then a lesson stepper. Lesson states: completed = green check, current = accent ring + `Continue`, locked = grey + lock.
- Settings: sectioned rows, label left and control right, helper text below in grey. Use a discrete slider for the prompt interval and show the current value on the right.
- Lesson complete: success icon, "Lesson complete!" and a one-line subtitle, 3 stat tiles in one row, a missed-phrases list with audio, primary `Continue` and secondary `Back to roadmap`.

---

## 1. In-page nudge / toast

**Examples**
- [Grammarly – suggestion card](https://mobbin.com/screens/5fb58d62-0fff-43de-9686-2cfbfe5c5ed3): compact card with a filled green `Accept`, a text `Dismiss` and a `⋯` overflow. Two visible actions, the rest hidden.
- [Grammarly – feature popover](https://mobbin.com/screens/8c941f2c-6b73-4841-9c75-cf9a5ed70cc1): ~300px dark card with `×` top-right, 2-line copy, `Skip for now` (muted) left of `Add a rule` (accent) on the right.
- [Quicken – popover + undo toast](https://mobbin.com/screens/e9042731-b020-4b97-b8b7-b5ad5a97db06): popover with `Don't show again` (text) then `OK` (filled, right). Separately, a bottom-left dark toast "Transaction created. Undo ×".
- [LinkedIn – feed](https://mobbin.com/screens/fd766351-5179-4b3e-9b3f-4beabfabd0af): LinkedIn's own toast ("Post successful. View Post ×") sits **bottom-left**; the Messaging dock occupies **bottom-right**. [X – home](https://mobbin.com/screens/fc04d864-4483-460a-bc35-0cdc61af6c89) has Grok/Chat floating buttons stacked **bottom-right**, and the right rail (trends, who to follow) is the lowest-value column.
- Supporting: [Gorgias toast](https://mobbin.com/screens/6c590e83-4434-467e-ad4a-5bf202e11459) (top-right, `×`). [Square toast](https://mobbin.com/screens/33520ce1-1c8b-4e94-8f45-946f785b8b23) has a thin timer bar under the message (auto-dismiss cue).
- Snooze menus: [Slack – Pause notifications](https://mobbin.com/screens/fcec9b98-df68-459e-8eda-0c48d5887377) (30 min / 1 h / 2 h / 4 h / Until tomorrow / Custom). [Outlook – Snooze](https://mobbin.com/screens/946c0a3b-6b40-4070-8e80-805f3303c02d) and [ClickUp – Snooze](https://mobbin.com/screens/05508dd8-4e90-4871-bba7-6151c342a847) show the resolved time right-aligned.

**What they share**
- One filled primary. The dismissive action is a text/ghost button, and extra actions live behind `⋯`.
- `×` always sits top-right. Copy is 1–2 lines.
- Corner placement, chosen to avoid each host's own docks.
- Snooze is a short list of relative durations, ordered shortest first, with "Until tomorrow" near the end.

**Decisions**
- Placement: `position: fixed; right: 24px; bottom: <host dock height + 16px>`. Detect the LinkedIn Messaging bar and the X Grok/Chat buttons at runtime. If an open chat window covers the right side, use `left: 24px; bottom: 24px` (LinkedIn's native toast slot). Width 340px, max height ~200px.
- Hierarchy: the phrase is the only bold text. Label 12px muted, phrase 16px bold, gloss 14px muted.
- Button order: `⋯` far left. `Not now` (ghost) then `Learn now` (filled) right-aligned, primary rightmost as in Grammarly's popover and Quicken.
- `Not now` and `×` both dismiss for this cycle. Snooze/Quiet are in `⋯`, with labels "Snooze 30 min", "Snooze 1 hour", "Snooze until tomorrow", divider, "Quiet mode (pause all nudges)".
- Confirmation: replace the card with a Quicken/LinkedIn-style one-line toast "Snoozed until 15:30 · Undo ×", auto-dismissed with a Square-style timer bar.
- Tone: short and neutral, e.g. "2-minute Dutch: *Goedemorgen*". No guilt copy.

## 2. Learn card (target phrase)

**Examples**
- [Babbel – Dutch "Dag."](https://mobbin.com/screens/75cab2bc-d7e2-4d02-9fce-ed9854d12874): speaker icon left of the boxed Dutch word, English below in small muted text, an orange left rule per phrase. A peach "Heads up! *Hoi* is less formal…" tip banner with `×`. Full-width `Continue` pinned bottom.
- [Duolingo – Key phrases](https://mobbin.com/screens/6066d041-8fbf-40ac-83b0-7d6b3607d84d): speech-bubble rows with a blue speaker icon. Dutch-side words have a dotted underline (tap for per-word hints = word breakdown). Translation grey beneath.
- [CapWords – examples](https://mobbin.com/screens/2aace411-2808-4ce8-9385-5cba88ae2a0c): the target word is coloured in the sentence and underlined in the translation. The active example has a speaker icon; others are faded.
- [Speak – phrase card](https://mobbin.com/screens/cef4ab1d-b8b0-4080-96b3-616f466e86ac): a large phrase with translation below, plus replay and play controls. [Duolingo ABC](https://mobbin.com/screens/dae6e046-2591-4033-bbfc-6ddae8d59872) pairs a normal speaker with a **turtle (slow)** button. [Duolingo – Grammar concepts](https://mobbin.com/screens/cfa78fa0-cb96-4d02-9ab3-ab6b7dacca16) uses collapsible sections and a 2-column table (masculine/feminine), with speaker examples.

**What they share:** the target language is the biggest text, translation is always directly beneath and muted, audio sits left of the phrase, tips are a tinted callout separate from content, and there's one pinned CTA.

**Decisions**
- Phrase block: `[🔊][🐢] Goedemorgen!` 24–28px bold. Translation 14–15px muted directly below, 4px gap.
- Word breakdown: tokens with dotted underline. Hover or click shows a small popover with the meaning (Duolingo hint pattern). In the side panel, also render a 2-column mini-table (token | meaning). For de/het pairs, use Duolingo's 2-column table.
- Examples: 1–2 rows, each with a speaker, Dutch with the target word in accent colour, and English muted with the target underlined (CapWords).
- Tip: a peach/amber tinted box titled "Tip", 14px, after the examples (Babbel).
- Spacing: 24px between blocks, 8px inside. CTA `Continue` pinned bottom, full width.

## 3. Exercise screens

**Examples**
- [Speak – Translate (multiple choice)](https://mobbin.com/screens/1754842f-604f-46a5-b514-31c49bf645e9) and [Duolingo – Select the correct translation](https://mobbin.com/screens/faf99c88-e9a5-44ef-8e7d-3335018c4781): stacked full-width option buttons. Selected = blue tint + blue border. Full-width `Check` pinned bottom.
- [Duolingo – word tiles](https://mobbin.com/screens/bb075437-bdb1-4c18-ab7b-fdeb460bf3dd): the answer sits on ruled lines, with the tile bank below. Used tiles leave **grey placeholder slots** in the bank. Tiles have a 1px border and a 2px bottom shadow.
- [Speak – Fill in the blank](https://mobbin.com/screens/2c36516e-5c7c-4ceb-8bd1-a3f104323bcf): the sentence card has a tinted blank, and the translation below has the matching word in blue. Options are stacked beneath.
- [Duolingo – typed "Complete the translation"](https://mobbin.com/screens/7d1dd9c2-c0e2-4e41-9b8f-e243643d005b) and [Preply – choose the word](https://mobbin.com/screens/e9025377-f65b-4f5e-968a-d0b7d5a1ed3a): the bottom `Check` is **disabled grey** until there is input.
- [Duolingo web](https://mobbin.com/screens/cfc0505e-5e75-4714-8d80-fcb7e5b1e9b6): options show number-key badges `1 2 3`.
- Flow: [Duolingo – Completing a lesson](https://mobbin.com/flows/706ba483-579e-4628-9903-ba0809870d18). `CHECK` turns from grey to green once tiles are placed, and a "N IN A ROW" micro-label appears above the progress bar.

**What they share:** a top bar with `×` and progress, a bold left-aligned instruction ("Fill in the blank"), the prompt then the answer area, one pinned full-width `Check`, and a disabled state that is visually flat grey.

**Decisions**
- Instruction title 18–20px bold, left-aligned, 16px under the top bar.
- Multiple choice: 48–52px option rows, 8–12px gap, number badge on the left for keys 1–4.
- Tiles: wrap in rows with 8px gaps. Tap moves a tile to the answer line and leaves a grey ghost slot. Tap again returns it.
- Fill gap / typed: tinted blank inside the sentence. A single-line input for short answers, auto-focused. `Enter` submits.
- `Check` stays disabled until there's a selection, a full tile sentence or non-empty input. It is never hidden.

## 4. Feedback after answering

**Examples**
- [Duolingo – Incorrect](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124): a pink full-width bottom sheet with ⊗ "Incorrect", "Correct Answer:" with the differing word **bold + underlined**, "Meaning:", a secondary outlined `Explain my mistake` and a red `Got it`. [Duolingo – Correct](https://mobbin.com/screens/1da712f3-69e0-4ca7-bd5b-e32e5b544949): a green sheet with "Great job!", "Meaning:" and a green `Continue`. The chosen option also turns green.
- [Speak – Incorrect](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035) / [Correct](https://mobbin.com/screens/9279c96b-3c92-414a-847b-22909ec6309c): a compact tinted card above the button ("Correct Answer: êtes"). The button colour switches to red or green.
- [Quizlet – Study this one](https://mobbin.com/screens/609a3ede-102a-42c0-bf90-c216edda5713): "Correct answer:" (green label) above "You said:" (red label).
- Web footers: [Babbel web](https://mobbin.com/screens/841e26d1-6a43-4234-b291-ed56dc350f63) ("Challenges help us grow!", `Continue` outlined + `Try again` filled), [Brilliant web](https://mobbin.com/screens/1b1f55e7-1791-448f-ace3-82b727c63586) ("Correct! +15 XP", `Why?` secondary + `Continue` primary), [Uxcel web](https://mobbin.com/screens/fea48598-872d-48de-be75-89b104adfc06) (`View theory` text + `Continue`).

**What they share:** feedback lives where the Check button was, so the eye doesn't move. The surface tint, icon and button colour all match the state. The right answer is shown with the difference highlighted, the explanation sits behind a secondary action, and titles are 1–2 words.

**Decisions**
- On Check, slide a sheet up from the bottom (~200ms) replacing the Check zone. Lock the answer area. Colour the chosen option green or red.
- Correct sheet: success tint, ✓ "Correct!", optional "Meaning: …", green `Continue`.
- Incorrect sheet: danger tint, ✕ "Incorrect", "Correct answer:" with the differing token bold+underlined, "You wrote:" (Quizlet) for typed answers, "Meaning:". Red `Continue`, plus a secondary `Why?` that expands a 1–2 line explanation inline. Show `Try again` (Babbel) only on typed/tile exercises where a retry is meaningful.
- Copy: "Correct!" / "Incorrect". Neutral, no exclamation on errors. A streak label "3 in a row" above the progress bar (Duolingo flow) and nothing louder.

## 5. Course roadmap and progress summary

**Examples**
- [Babbel – Learning plan](https://mobbin.com/screens/832f5742-a189-409a-8bb1-06f5ed82bb60): a course header with an A1 level badge in a progress ring and "8/12 lessons completed". Lesson cards: a completed one with ✓ and `Repeat`, a "Time to review" card with a dark `Review now`. [Babbel – Today](https://mobbin.com/screens/176965ed-84bd-427a-93ca-4d2b95f1660c) has an "Activity tracker 1/7" bar and the Review tab shows a due-count badge.
- [Duolingo – Sections](https://mobbin.com/screens/82371c0c-d233-45af-9fc7-26f96c2cde8f): stage cards with a progress bar each, unit ranges, and a `Jump here` link on later stages.
- [Mimo – path](https://mobbin.com/screens/27a887e2-e968-4117-997f-4ce126f12fef): the current node has an accent progress ring "1/2"; locked nodes are grey with a lock icon. Duolingo's path (flow above) puts a `Continue` label over the current node.
- [Acorns – course](https://mobbin.com/screens/c50e439a-6caf-49f2-b34b-028fa4e87eac): a vertical numbered stepper with a connector line, a ✓ badge on done steps and chevron rows. [Circle web – Lessons side panel](https://mobbin.com/screens/6e6d81bc-8d87-4ff3-81e8-9955d81d0a00) shows a narrow right panel with a collapsible module and green ✓ per lesson.

**What they share:** a compact "x/y done" summary on top, review as its own card with one CTA, progress shown as bars at stage level and as icons at lesson level, the current item highlighted with an accent ring/label, and locked items greyed with a lock.

**Decisions**
- Summary strip (2 tiles, side by side at 360px): **Reviews due** (number + `Review now`, primary when > 0) and **Lessons** "12/40" + bar.
- Stage cards A0 / A1 / A2: title, CEFR tag, progress bar. The current stage is expanded, the others collapsed.
- Module rows (accordion): title, "3/6", thin bar. Expanding one shows an Acorns-style stepper. Completed = green ✓ circle. Current = accent ring + inline `Continue` button. Locked = grey text + 🔒, not clickable.
- Auto-scroll to the current lesson on open.

## 6. Compact settings

**Examples**
- [X – Display and sound](https://mobbin.com/screens/f356eed8-d437-488f-81a2-4b08d12983aa): bold section headers, label left and toggle right, a slider with end labels (Aa … Aa), no Save button.
- [Hatch – Clock and Display](https://mobbin.com/screens/e3d60776-066b-4bc1-bfe1-ab6dd27b63e6): a slider inside a row card, label left, **current value right** ("60%"), helper text under the toggle.
- [Deezer – Audio](https://mobbin.com/screens/097c27f2-2583-4bc0-93fc-0bff3bdb1f52): grey helper paragraph under each group, slider with min/max labels "0 s … 10 s".
- [LARQ – Power settings](https://mobbin.com/screens/9bcb5d7d-fda0-4971-875b-3c8a5a8762ea): a discrete 3-stop slider with labels under the stops. Toggles carry a one-line description.
- Snooze choices: [Slack](https://mobbin.com/screens/fcec9b98-df68-459e-8eda-0c48d5887377), [Atoms](https://mobbin.com/screens/f51cb078-371c-42dd-9e78-fd5d656a47af) (radio list + `Confirm`).

**What they share:** grouped rows with headers, the control right-aligned, a one-line grey description under the label, the current slider value always visible, and changes applied instantly.

**Decisions**
- Group "Nudges": `Quiet mode` toggle ("Pause all in-page nudges"). `Prompt interval` discrete slider with stops (e.g. 10 / 20 / 30 / 60 min), value shown right, min/max labels under it. Per-site toggles `X` and `LinkedIn`.
- Group "Snooze": while active, show "Snoozed until 15:30" + `Resume now`. Otherwise show a Slack-style list (30 min / 1 hour / Until tomorrow).
- Group "Lessons": `Sound effects` toggle and `Autoplay audio` toggle.
- Apply instantly with no Save button (X, Hatch). Rows are 44–48px, with 24px between groups.

## 7. Lesson complete / session summary

**Examples**
- [Mimo – Lesson complete](https://mobbin.com/screens/b5772854-5c51-4fca-b828-0df669bfa4d4): illustration, "Lesson complete!", a one-line subtitle, **3 stat tiles in one row** (Exercises 12 · XP 120 · Accuracy 100%), daily-goal bar, `Continue`.
- [Uxcel Go](https://mobbin.com/screens/b133afa4-f09c-4997-8dee-4cb2114f9b58): a green ✓ circle, "Lesson complete", stat rows (Accuracy 75%, Time 01:47), primary `Continue` + secondary `Share lesson`.
- [Babbel – review summary](https://mobbin.com/screens/8a2cc965-df95-4fc9-86f6-0cf612efb167): "Answered correctly: 3/4", then **Incorrect** and **Correct** groups of phrase chips, each with a speaker. `Close`.
- [Quizlet – progress](https://mobbin.com/screens/f0707e72-e036-47fa-8f58-99e2387ba0ff): a 94% donut with Know/Still learning pills, primary `Practice with questions`, secondary `Keep reviewing 4 terms`, tertiary text link. [Duolingo](https://mobbin.com/screens/31fdc425-1a41-4b78-b4e6-762bff0b9306) uses 3 coloured stat tiles too.

**What they share:** a celebratory icon and 2–4 word title, exactly three headline stats, a list of what to revisit, and one primary next step plus one quieter alternative.

**Decisions**
- Layout at 360px: success icon (48px), "Lesson complete!", subtitle (e.g. "4 new phrases"). Then 3 tiles (~104px each): `Correct 7/8`, `New phrases 4`, `Time 3:12`. Then "Review these" with missed phrases as audio chips (Babbel). Then pinned `Continue` (next lesson) and a ghost `Back to roadmap` below it.
- In the in-page card, compress to the title, one stat line, and `Done` / `Next lesson`.
- Motion: one entrance animation of the icon/tiles at most. Skip confetti and reward chests (Duolingo/CapWords) to fit the low-intrusion brief.
