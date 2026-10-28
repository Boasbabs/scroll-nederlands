# TaalNudge colour system

The palette is the Makuteam board (ten colours, below). It is applied the way the [Makuteam case study](https://www.behance.net/gallery/240631589/Makuteam-Building-a-Creative-System-Through-Characters) applies it, and every role was checked against Mobbin on 2026-10-27, as the product rule requires ("we do not invent UI/UX"; see `docs/ux-research.md`).

- Source of truth: `src/ui/theme.css` (palette, derived tints and edges, roles).
- To see every colour and state together, run the preview harness and open the style tile at http://localhost:5199 (`preview/style-tile.tsx`).
- This file is the usage guide. `docs/ux-research.md` §1.2 and §4 summarise it and point here.

## 1. The palette

The board has two rows. The top row (large swatches) is used for big fields; the bottom row supports.

| Colour | Hex | Row | Job in the UI (role token) | Type on it |
|---|---|---|---|---|
| Golden Yellow | `#FFE60F` | top | Look here: reviews due, tips, Recommended, the lesson-complete badge, the button on a band (`--highlight`) · stage 1 band | ink, 14.1:1 |
| Seaweed Green | `#37AE5C` | top | Correct, matched, remembered, strong (`--correct`) · stage 2 band | ink, 6.3:1 |
| Denim Blue | `#73B9FF` | top | Soft surfaces: avatars, your chat bubble, info chips, the selected fill (`--soft`) · stage 3 band | ink, 8.6:1 |
| Mango Orange | `#FF8037` | top | Now and ongoing: streak, current lesson, the line playing, still learning, due counts (`--now`) · stage 4 band | ink, 7.1:1 |
| Warm Blue | `#445DDB` | top | The brand and every action: main buttons, links, audio, progress, done lessons, heroes, the toolbar icon (`--primary`) | white, 5.5:1 |
| Dodger Blue | `#4582FF` | bottom | Keyboard focus (`--focus`); the squiggle on Warm Blue heroes | ink, 5.0:1 |
| Mid Blue | `#366BBB` | bottom | The answer or choice you picked, before Check (`--selected`); the squiggle on dark bands | white, 5.3:1 |
| Butterfly Bush | `#603EA2` | bottom | Checkpoints (`--checkpoint`) | white, 7.8:1 |
| Flush Mahogany | `#C43136` | bottom | Wrong answers and destructive actions (`--wrong`) | white, 5.5:1 |
| Dark Cerulean | `#064F70` | bottom | Dark surfaces: tooltips, label bubbles, the floating pill, the dark band (`--dark`) | white, 8.9:1 |

Neutrals come from the board's black type on white: ink `#16171D` (17.9:1 on white), muted `#5A5D69` (6.5:1), faint `#8A8D98` (3.3:1, placeholders and chevrons only), lines `#E2E4EA` / `#CBCFD8`, app background `#F3F4F7`.

## 2. How Makuteam applies it, and what the UI takes

What the case study does (viewed in full on 2026-10-27):

- **One colour per character.** Each of the five characters gets a full-bleed band in a top-row colour that contrasts with the character itself: blue Talu on Mango Orange, orange Pipo on Seaweed Green, white Cloo on Denim Blue, green Garn on Golden Yellow, yellow Lemo on Warm Blue. Its tagline is "Different characters. Different roles. One shared rhythm."
- **Flat fields, black and white.** No gradients or shadows; white space and thin grey rules around the turnaround sheets, black backgrounds for the sticker showcase, black line art.
- **Type is black or white**, with one poster move: Golden Yellow display type on Warm Blue ("We Draw Stories") and on green.
- **Golden Yellow is the cover** (the opening animation, the main poster); **Warm Blue carries the brand** (the billboard field, the logo mark).
- **The bottom row supports**: sticker tiles (black type on Dodger Blue), the sticker grid's backgrounds.

What the UI takes from that:

| Makuteam | In TaalNudge |
|---|---|
| One colour per character, never swapped | One colour per job (§1). A colour keeps its meaning on every surface. |
| Full-bleed character bands | Full-bleed fields for the big moments: the welcome and lesson-complete heroes (Warm Blue, like the billboard), the review card (Golden Yellow), and one band per stage on the Course tab (the four light top-row colours, in board order). |
| Yellow Lemo on the Warm Blue band; yellow type on Warm Blue posters | The lesson-complete badge, the main button and the "Nudge" half of the wordmark are Golden Yellow on Warm Blue heroes. |
| Black type, black outlines, white ground | Ink type; white raised cards on a light blue or grey ground per surface, and soft grey secondary buttons (the Finch restyle, `docs/ux-research.md` §13). |

What the UI changes, and why:

- **No white type on Mango Orange, Seaweed Green or Denim Blue.** Makuteam does it on posters at display sizes, but it measures 2.1–2.8:1. In the UI those colours (and Golden Yellow and Dodger Blue) carry ink type.
- **Golden Yellow type on Warm Blue is 4.3:1**, so it is kept for large type only (the 26px wordmark) and for fills (the button, the badge).
- **Tints.** Answer sheets, chips and pills use a tint of their role colour with ink type, as the learning apps on Mobbin do (§7). Makuteam has no states, so it never needs them.

## 3. Roles and tokens

Components use the role tokens, never the palette names. The only exceptions are decorations (the squiggle pattern and the sparks), which draw straight from the palette.

| Role | Tokens | Used for |
|---|---|---|
| Text | `--ink`, `--ink-muted`, `--ink-faint`, `--ink-soft` | Body and titles; secondary text; placeholders, chevrons; disabled labels and locked glyphs |
| Surfaces | `--bg`, `--surface`, `--surface-sunken`, `--line`, `--line-strong`, `--track` | Panel background, cards, hover and chips, borders, progress tracks and disabled fills |
| Primary (Warm Blue) | `--primary`, `--primary-edge`, `--on-primary`, `--progress` | Main buttons, ghost and link text, audio and mic buttons, progress bars, switches and checkboxes, done lesson nodes, active tab, target words, passage rule, typed answers, toast timer, heroes, brand mark |
| Selected (Mid Blue on Denim tint) | `--selected`, `--selected-fill`, `--on-selected` | Picked option (border, badge, fill), picked match tile, picked choice chip (Mid Blue text, 4.5:1), toggled icon buttons |
| Focus (Dodger Blue) | `--focus` | 3px focus ring (3.6:1 on white), focused input border, focused gap underline. White on bands. |
| Soft (Denim Blue) | `--soft`, `--soft-fill` | Dialogue avatars, your chat bubble, info chips (CEFR level), onboarding result note, input focus halo |
| Correct (Seaweed Green) | `--correct`, `--correct-edge`, `--correct-fill`, `--on-correct` | Correct sheet (tint), ✓ discs with an ink tick, green `Continue` with an ink label, correct and revealed options, matched tiles, checklist ticks (edge, 4.7:1), Strong ring, Remembered pill, caught-up and review-done ticks, the correct part of the score ring |
| Wrong (Flush Mahogany) | `--wrong`, `--wrong-edge`, `--wrong-fill`, `--on-wrong` | Wrong sheet (tint), ✕ discs, red `Got it` / `Try again` with a white label, wrong options and mismatched tiles, the diff underline, checklist misses, the incorrect part of the score ring, `Reset progress` and `Reset everything` (5.5:1) |
| Highlight (Golden Yellow) | `--highlight`, `--highlight-edge`, `--highlight-fill`, `--on-highlight` | Review card (with the `ink` button), `REVIEW` and `Recommended` chips, tip callouts and the notice row (tint), lesson-complete badge, the main button on a band |
| Now (Mango Orange) | `--now`, `--now-fill`, `--on-now` | Streak and combo chips (tint, orange flame, ink count), studied-day circles, current lesson ring, the dialogue line playing, Learning ring, Still learning pill, Review tab badge (ink count) |
| Checkpoint (Butterfly Bush) | `--checkpoint`, `--checkpoint-edge`, `--on-checkpoint` | Checkpoint nodes (white flag), the `CHECKPOINT` label (7.8:1) |
| Dark (Dark Cerulean) | `--dark`, `--on-dark` | Word-hint tooltips, the `Start` bubble over the current lesson, the `Current lesson` pill, the dark band |
| Stage identity | `--stage-1` … `--stage-4` | The head band of each stage card on the Course tab, with ink type and a white level chip |
| Grounds (blues and greys) | `--ground-today`, `--ground-course`, `--ground-review`, `--ground-progress`, `--ground-settings`, `--ground-player` | One light ground per surface, as Finch gives each tab its own (Today light Denim Blue, Course light Dark Cerulean, Review light Mid Blue, Progress light Dodger Blue, Settings pale blue-grey, the lesson a neutral grey-blue; the in-page card takes Today's). Blues and greys only, so a ground never carries a state |
| Activity tiles | `--tile-lessons`, `--tile-reviews`, `--tile-practice`, `--tile-words`, `--tile-ear`, `--tile-articles`, `--tile-checkpoint` and their `--on-tile-*` | One saturated tile per kind of activity, the same everywhere: Warm Blue lessons (white glyph), Golden Yellow reviews (ink), Mango Orange quick practice (ink), Denim Blue new words (ink), Dark Cerulean ear training (white), Mid Blue de/het (white), Butterfly Bush checkpoints (white). Never green or red. Settings rows take the soft Denim tint tile |
| Soft parts | `--soft-face`, `--soft-edge`, `--raise-edge` | The grey face and edge of secondary buttons inside white cards and dialogs, the round grey ×, and the translucent edge under raised cards (a deeper shade of whatever ground is below) |
| Toast | `--toast`, `--on-toast` | Dark Cerulean pills with white type and Undo |

Button variants follow the roles: `primary` (Warm Blue), `secondary` (a soft face on a grey edge with an ink label and no outline: white on a ground or tinted sheet, `--soft-face` inside white cards and dialogs), `ink` (the dark button on a Golden Yellow card), `ghost` (Warm Blue text; ink in the in-page card and on sheets; Mahogany for destructive rows), `correct` (Seaweed Green, ink label), `wrong` (Flush Mahogany, white label). Inside a band, `primary` turns Golden Yellow with an ink label.

## 4. Rules

1. **One colour, one job.** Don't borrow a colour for its looks: green is only ever correct or strong, red only wrong or destructive, purple only checkpoints. The stage bands are the one place a colour is identity rather than meaning, and they appear only as the band.
2. **Type is ink or white.** Ink on Golden Yellow, Seaweed Green, Denim Blue, Mango Orange, Dodger Blue and every tint; white on Warm Blue, Mid Blue, Butterfly Bush, Flush Mahogany and Dark Cerulean. Coloured text on white is allowed only in Warm Blue (links), Mid Blue (selected chip), Butterfly Bush (`CHECKPOINT`) and Flush Mahogany (destructive), all 4.5:1 or more.
3. **The light four are fills.** Golden Yellow, Seaweed Green, Denim Blue and Mango Orange are under 3:1 on white, so they are never text, borders or lone icons there. A line or icon in one of them must sit beside a label that says the same thing (the streak flame next to its count, the current-lesson ring under its `Start` bubble, the word-state rings next to their counts). Where a green line has to stand alone, use `--correct-edge`.
4. **States never rely on colour alone.** Every state also has an icon (✓, ✕, lock, flag) and a title or label.
5. **Tints and edges are derived, not new colours.** Tints are the role colour mixed with white (12–30%); edges are the role colour with 25% black, except Golden Yellow, whose edge is half Mango Orange because darkened yellow turns olive. Both use `color-mix()` in `theme.css`.
6. **Bands invert the details.** On Warm Blue and Dark Cerulean bands, the main button is Golden Yellow with an ink label, the focus ring is white, and the wordmark's "Nudge" is Golden Yellow.
7. **Adding or changing a colour.** Add a role token in `theme.css` (never a raw hex in a component), find Mobbin evidence for the use, add it to §3, §6 and §7 here, and show it in the style tile.

## 5. Where each colour appears

| Surface | Colours |
|---|---|
| Side panel shell | White app bar and tab bar on a `#F3F4F7` ground; active tab Warm Blue; streak chip Mango tint; Review tab badge Mango with an ink count |
| Today | Golden Yellow review card with the ink `Review now`; white Continue card with a Warm Blue bar and `Start`; caught-up tick in a Seaweed disc |
| Course | One band per stage (Golden Yellow, Seaweed Green, Denim Blue, Mango Orange); done nodes Warm Blue; current node Mango ring with a Dark Cerulean `Start` bubble; locked nodes grey; checkpoints Butterfly Bush; `Current lesson` pill Dark Cerulean |
| Review, Progress | Warm Blue `Start review`; studied days Mango; New / Learning / Strong rings grey / Mango / Seaweed; stage bars Warm Blue |
| Settings | Warm Blue switches; Mid Blue chosen chips; `Reset progress` and `Reset everything` in Flush Mahogany under a Warm Blue `Keep my progress`; notice row Golden tint |
| Onboarding | Warm Blue hero with Dodger Blue squiggles, two-tone wordmark and a Golden Yellow `Get started`; level and start rows turn Mid Blue on a Denim tint when chosen; `Recommended` chip Golden Yellow |
| Lesson player | Warm Blue progress, audio and mic; learn-card tips Golden tint; picked option Mid Blue; `REVIEW` chip Golden Yellow; combo chip Mango tint |
| Answer feedback | Correct: Seaweed tint sheet, green disc with an ink tick, green `Continue`. Wrong: Mahogany tint sheet, red disc with a white cross, red `Got it` or `Try again`, red diff underline; the right answer outlined green |
| End screens | Lesson complete: Warm Blue hero, Golden Yellow star badge, palette sparks. Review done: green tick, Remembered (green) and Still learning (orange) pills. Checkpoint: green and red score ring |
| In-page card | White card on the host page, Warm Blue brand mark and `Learn now`, ink `Not now`; the compact player uses the same roles inside the shadow root |
| Toolbar icon | Warm Blue tile with a white speech bubble (`scripts/make-icons.mjs`) |

## 6. Derived tokens and contrast

Values are what `color-mix()` produces from the palette.

| Token | Value | Ink on it | White on it | Against white |
|---|---|---|---|---|
| `--seaweed-green-tint` (20%) | `#D7EFDE` | 14.7:1 | n/a | 1.2:1 |
| `--seaweed-green-edge` | `#298345` | n/a | 4.7:1 | 4.7:1 (ticks, borders) |
| `--flush-mahogany-tint` (12%) | `#F8E6E7` | 14.9:1 | n/a | 1.2:1 |
| `--flush-mahogany-edge` | `#932529` | n/a | 8.3:1 | 8.3:1 |
| `--golden-yellow-tint` (30%) | `#FFF8B7` | 16.5:1 | n/a | 1.1:1 |
| `--golden-yellow-edge` | `#FFB323` | 10.0:1 | n/a | 1.8:1 (button edge only) |
| `--mango-orange-tint` (18%) | `#FFE8DB` | 15.2:1 | n/a | 1.2:1 |
| `--denim-blue-tint` (22%) | `#E0F0FF` | 15.4:1 | n/a | 1.2:1 |
| `--warm-blue-edge` | `#3346A4` | n/a | 8.2:1 | 8.2:1 |
| `--butterfly-bush-edge` | `#482F7A` | n/a | 10.7:1 | 10.7:1 |

Grounds and soft parts (ink, muted, Warm Blue text and the Dodger Blue focus ring on each; the last column is how far a white card stands out):

| Token | Value | Ink | Muted | Warm Blue | Focus ring | White on it |
|---|---|---|---|---|---|---|
| `--ground-today` (Denim Blue 24%) | `#DDEEFF` | 15.1:1 | 5.5:1 | 4.6:1 | 3.0:1 | 1.18:1 |
| `--ground-course` (Dark Cerulean 10%) | `#E6EDF1` | 15.2:1 | 5.6:1 | 4.6:1 | 3.0:1 | 1.18:1 |
| `--ground-review` (Mid Blue 12%) | `#E7EDF7` | 15.2:1 | 5.6:1 | 4.7:1 | 3.0:1 | 1.17:1 |
| `--ground-progress` (Dodger Blue 14%) | `#E5EEFF` | 15.3:1 | 5.6:1 | 4.7:1 | 3.0:1 | 1.17:1 |
| `--ground-settings` (Mid Blue 6% on ink 4%) | `#EAEDF2` | 15.3:1 | 5.6:1 | 4.7:1 | 3.0:1 | 1.17:1 |
| `--ground-player` (Mid Blue 4% on ink 4%) | `#EEF0F4` | 15.7:1 | 5.7:1 | 4.8:1 | 3.1:1 | 1.14:1 |
| `--soft-face` (ink 7%) | `#EFEFEF` | 15.5:1 | 5.7:1 | n/a | n/a | 1.15:1 |
| `--soft-edge` (ink 18%) | `#D5D5D6` | n/a | n/a | n/a | n/a | 1.46:1 (edge only) |

The grounds are lighter than Finch's because Warm Blue text (4.5:1) and the focus ring (3:1) must still pass on them; Finch's mint and teal would take muted text under 4.5:1. Activity tiles use the palette's own pairs (§1): white on Warm Blue 5.5:1, Mid Blue 5.3:1, Butterfly Bush 7.8:1 and Dark Cerulean 8.9:1; ink on Golden Yellow 14.1:1, Mango Orange 7.1:1 and Denim Blue 8.6:1. The count inside a bar is white over the Warm Blue fill (5.5:1) and ink over the track.

Other pairings in use: muted text on every tint 5.4:1 or more; Mid Blue on the Denim tint 4.5:1; Flush Mahogany on its tint 4.6:1; Warm Blue on the app ground 5.0:1; Dodger Blue focus ring 3.6:1 on white and 3.2:1 on the app ground.

## 7. Mobbin evidence

All screens were opened and checked by eye on 2026-10-27. Earlier citations from `docs/ux-research.md` that still apply are marked *(kept)*.

- **Correct green, wrong red, state-coloured button on a tinted sheet.** [Duolingo – Incorrect, red sheet and red `GOT IT`](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124), [Duolingo – correct, green sheet and green `CONTINUE`](https://mobbin.com/screens/a1d54661-39f7-4ae3-a1d5-ec01bf9f5ccb), [Speak – Incorrect, red card and button](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035), [Speak – Correct, green card and button](https://mobbin.com/screens/9279c96b-3c92-414a-847b-22909ec6309c), [Babbel – checkpoint, Incorrect in red and Correct in green](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e).
- **Ink title beside a coloured disc; green and red option tints.** [Vocabulary – "That's incorrect" with a red ✕ disc](https://mobbin.com/screens/a3538d35-c422-40ed-b571-121b4b16a4fb), [Alan – "Incorrect!" with green and red option tints](https://mobbin.com/screens/49f3790f-ac4e-4436-be11-6c9097aa08ec).
- **Ink label on a green button** (white on Seaweed Green is 2.8:1). [Spotify – "Let's go"](https://mobbin.com/screens/ffdd79c4-84cb-4f10-82c1-91f7190d707c), [Spotify – "Sign up for free"](https://mobbin.com/screens/f4f60cac-2462-4fc9-a931-aa44e727d693).
- **Blue as the action colour, with a white label.** [Quizlet – `Keep reviewing`](https://mobbin.com/screens/e3067f6b-ea92-4688-a482-22cb28c31b31), [Skillshare – indigo `View My Achievements`](https://mobbin.com/screens/81762058-a358-4516-af84-c5cd091ee1dc), [Duolingo – blue `PLAY`](https://mobbin.com/screens/dd8b6b31-0668-4f27-9cb4-830914b79ea3).
- **Selected = light blue fill and a blue border.** [Speak – Translate](https://mobbin.com/screens/9279c96b-3c92-414a-847b-22909ec6309c); [Duolingo onboarding](https://mobbin.com/flows/ac9d2f58-868d-4fd3-a79c-9655ce6b1522) *(kept)*.
- **A colour per course unit, as a full-colour header band** (the Makuteam character bands, in a learning app). [Duolingo – Section 1, Unit 1 in green](https://mobbin.com/screens/a13f2a69-17ab-48d1-b6bd-9b64b5cd426e), [Unit 22 in teal](https://mobbin.com/screens/36ece572-4780-4cec-adac-195753fc86cd), [Unit 9 in red](https://mobbin.com/screens/edb09afd-5b2a-4262-aca1-01d5d6b7e41f), [Unit 10 in green](https://mobbin.com/screens/fd077091-e8e9-413f-9aff-bb68984e5b04). One action colour across differently coloured cards: [Ahead – categories](https://mobbin.com/screens/0f68e10e-aa7d-47ff-98fc-5d1f9235f9fd).
- **Yellow review card with a black button; orange due badge and flame.** [Babbel – Learning plan, "Time to review" and the Review badge](https://mobbin.com/screens/fdaa7267-a4f1-4088-a90a-d1a9611fa63a), [Babbel – Today](https://mobbin.com/screens/e05215ed-73df-442c-95fa-66e88b5c0c0a); [Babbel – Today](https://mobbin.com/screens/4362b601-1544-43d7-aa4a-20a178466c8b) and [Babbel – tinted tip](https://mobbin.com/screens/75cab2bc-d7e2-4d02-9fce-ed9854d12874) *(kept)*.
- **Orange for streaks and the current step.** [Speak – streak](https://mobbin.com/screens/91ee559c-d53f-4bff-b5cd-f853f38cf4c3), [Life Reset – orange ring on the current node](https://mobbin.com/screens/cb3e87ef-1183-486f-bd20-2f465417d486), [Headspace – orange current dot](https://mobbin.com/screens/1cba404f-413c-4a8b-be36-d791e9ca4fed) *(kept)*.
- **Word states: grey new, orange still learning, green mastered.** [Quizlet – Your progress rings](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f), [Quizlet – Know (green) and Still learning (orange) pills](https://mobbin.com/screens/f0707e72-e036-47fa-8f58-99e2387ba0ff). The score ring keeps green for correct but uses Flush Mahogany for incorrect so it matches the feedback sheets; [Quizlet's test result](https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014) uses orange there.
- **Purple for checkpoints.** [Brilliant – Level Review milestone in purple](https://mobbin.com/screens/fd4efbd9-32d7-4abb-b129-dd5d335245ad), and Duolingo's purple "Jump here?" test-out node on the [Unit 1 path](https://mobbin.com/screens/a13f2a69-17ab-48d1-b6bd-9b64b5cd426e).
- **Full-colour celebration and welcome fields.** [Tolan – "Level 2!" in white on indigo](https://mobbin.com/screens/434afe5a-4578-4531-a329-54663d478fcc), [pillowtalk – black type and button on orange](https://mobbin.com/screens/5ce02d34-d76e-4d12-9aba-d80d1a8aca84); [Memrise](https://mobbin.com/flows/97215372-5a04-4f1a-a800-7146e6aff4ad) and [Codecademy](https://mobbin.com/screens/e5f9212c-2708-49ec-99ba-8ddb434b673b) yellow buttons with dark labels on navy *(kept)*.
- **Confetti in the palette.** [Grab](https://mobbin.com/screens/9174df43-a3fd-4587-9f11-348d9e3609f9), [Google Pay](https://mobbin.com/screens/79da0eb5-7b45-4667-8534-6d6ba3169c48).
- **Dark tooltip.** [Reddit – "Rule insights"](https://mobbin.com/screens/01dc9c61-113b-44a0-a934-ca154f39e82e).
- **Red destructive text under a safe primary.** [Brilliant – "Are you sure?" with red `Quit`](https://mobbin.com/screens/d7d7f00a-f59b-4bf2-acfb-8cb35b147154), [Notion – red `Restore`](https://mobbin.com/screens/364a1fa7-332c-42bc-a5ab-fe686fbf82f2).
- **Kept as before:** flat grey disabled ([Duolingo](https://mobbin.com/screens/8199682b-96e6-4d64-be65-98e3dd309fc2), [Babbel](https://mobbin.com/screens/895e2965-01d5-4727-94b5-f5c67b855a82)), tactile bottom edges ([Duolingo](https://mobbin.com/screens/a93fa0d8-0b53-4cec-bb29-2e7838163ea0)). The ink-outlined secondary ([Babbel](https://mobbin.com/screens/3f19cfed-6f89-46fc-b1af-188088273652)) gave way to Finch's soft grey button in the restyle; blue progress ([Speak](https://mobbin.com/screens/c785de2a-9f85-41b8-a093-f862f26fb035)), filled ✓ done nodes ([Noom](https://mobbin.com/screens/4928d8b8-548f-41b8-a673-e9a5af552657)).
- *(rule)* Focus rings are not visible in Mobbin captures; Dodger Blue at 3.6:1 meets WCAG's 3:1 for focus indicators, and white replaces it on bands.

- **Finch restyle (2026-10-28, `docs/ux-research.md` §13).** One light ground per tab: teal [Home](https://mobbin.com/screens/9f5f5f5d-d475-403e-9aa0-902da053bc4b), mint [Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b). Saturated quest tiles, grey 3D `Hint` buttons and thick bars with the count inside on [Quests](https://mobbin.com/screens/2180f7a4-b1a4-4615-8e1d-4d97d458de9b) and [Daily Quests](https://mobbin.com/screens/24390f69-5bd2-4f90-b2f9-eae6fa3acfdf). A white button on a coloured card: [pet card](https://mobbin.com/screens/9c762cfe-a65e-4ef8-beec-568ce9259d3e). Round grey × on a white dialog: [Quest detail](https://mobbin.com/screens/fc1239aa-1337-4395-bbe3-3a2525d86e52).

Mobbin returned its `ai_usage_notice` (AI usage is high this month) with these searches; it was shown to the owner.

## 8. What changed from the previous palette

| Before (brand board) | Now |
|---|---|
| Sunset Orange primary with a navy label | Warm Blue primary with a white label |
| Oiler Navy text, secondary outline, dark buttons, tooltips | Ink for text and outlines; the `ink` button; Dark Cerulean for tooltips, bubbles and the pill |
| Ocean Water correct sheet with a blue button | Seaweed Green tint, green disc and green button (the palette now has a green) |
| Sunset tint miss with a navy button ("no red anywhere") | Flush Mahogany tint, red disc and red button (the palette now has a red) |
| Mango for reviews, tips and checkpoints | Golden Yellow for reviews and tips; Butterfly Bush for checkpoints |
| Sunset Orange streak, current ring, studied days | Mango Orange |
| Brilliant Blue selection, links, progress, done nodes | Mid Blue selection; Warm Blue links, progress and done nodes |
| Brilliant Blue hero with a blue squiggle | Warm Blue hero with a Dodger Blue squiggle and a Golden Yellow button |
| Three-colour wordmark (Sunset, Mango, Ocean) | Two-tone: "Taal" in the type colour, "Nudge" in Warm Blue or Golden Yellow |
| Sunset Orange toolbar icon and brand mark | Warm Blue |
| White stage cards | A colour band per stage |
