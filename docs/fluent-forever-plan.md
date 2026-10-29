# Fluent Forever features: implementation plan

Adds the methods from Gabriel Wyner's *Fluent Forever* that TaalNudge lacked, as layers beside the course. Agreed with the owner on 2026-10-28.

## Ground rules

- **Leave the 272 lessons alone.** No edits to `src/curriculum/content/**`, to lesson order in `src/curriculum/structure.ts`, or to lesson and item ids. The path in `src/engine/selection.ts` unlocks a lesson only when every earlier one is done, so inserting lessons would pull existing learners back.
- **Local only.** No network at runtime, no new host permissions, no analytics. Learner data lives in `chrome.storage.local` (and IndexedDB for pictures).
- **Permanent ids.** Progress is stored by item id. New ids are namespaced (`w-…`, `p-…`, `…#article`, `c-…`) and never renamed or reused.
- **Audio:** the browser's nl-NL voice reads anything without a clip until the ElevenLabs quota resets (see "Audio plan").
- **Every phase:** unit and UI tests, `pnpm compile`, `pnpm test`, `pnpm build`, and a look in the preview harness (`preview/`). Update the status table below when a phase lands.
- **Git:** commit only when the owner asks.
- **Handoff:** when a session's context reaches 55%, update this file's status and start a new session at max effort that continues from here.

## Status

| Phase | What | Status |
|---|---|---|
| 0 | de/het typo fix | Done |
| A1 | Basic-word track: engine, selection, UI | Done |
| A2 | Basic-word track: the 625-word list | Done (needs NT2 review) |
| 1 | Minimal-pair ear training | Done (pairs need a Dutch speaker's check) |
| 2 | Pictures and situation cues | Done (6-picture pilot; the owner curates the full set) |
| 3 | het mnemonic and de/het drill | Done |
| 4 | Personal notes and leech prompts | Done |
| 6 | Corrections loop for writing | Done |
| 7 | Audio for new items (plan + script wiring) | Done (generation waits for the quota reset; the code for human takes is built, recordings not started) |

Phase 5 (saving words from X and LinkedIn) is out of scope: it would change the privacy promise.

**All phases in scope are done.** The third session (2026-10-28) built Phases 3, 4, 6 and 7, fixed the three known issues and updated the README, then built the code for Phase 7's step 4 (human takes of the pairs). Everything is still uncommitted on `main`. What is left needs people or the quota: the NT2 review of the word list, a Dutch speaker's check of the pairs, the full picture set, the ElevenLabs run after the reset, and human recordings of the pairs (see "Audio plan").

## Phase 0: de/het typo fix (done)

`checkTyped` in `src/engine/answers.ts` tolerated two edits in answers of 14+ letters, and swapping de and het is exactly two, so "De kopje is in de keuken." passed as a typo. A swap between two determiners (de, het, die, dat, deze, dit, een, geen) is now always incorrect, and the retry sheet says which word to check. Tests: `tests/engine/answers.test.ts`, `tests/ui/player.test.tsx`.

Not fixed, for a later decision: inflection endings still pass as typos ("Werkt jij?" for "Werk jij?", "een grote huis" in longer sentences), which the s1-verbs and s1-weather lessons test. Since 2026-10-29 a slip that spells another word the app teaches is a mistake (`docs/topics-and-scenario-packs-plan.md`, "Slips that spell another word"), which covers the one-word gaps where the wrong form is itself taught (nieuw for nieuwe, fiets for fietst), but not sentences.

## Phase A1: basic-word track engine

A list of 625 basic words (the book's idea) that runs beside the course. Words the course already teaches count toward the 625 by reference; the rest are new items.

- **Data:** `src/words/types.ts`, `src/words/content/<theme>.ts`, `src/words/index.ts`.
  - A new word: `{ key, dutch, english, pos: 'noun' | 'verb' | 'adjective' | 'other', plural?, note? }`. Nouns carry their article (`de fiets`, `het mes`).
  - A reference to a course item: `{ ref: 'de keuken' }`, matched by normalised Dutch against course items.
  - Themes have an order; introduction order interleaves themes round-robin, so a day's batch mixes them (ten fruits learned together blur).
- **Index:** `indexCurriculum` (`src/curriculum/assemble.ts`) takes the word items too. `items` and `item()` cover course items plus new word items, so reviews, `getDueItemIds` and generated drills work unchanged. `lessons` stays course-only. A new `words` array lists all 625 (new items and resolved references). New word items get `lessonId` and `moduleId` = `w-<theme>`, `stageId` = `words`, `primary` = false. Generated drills draw wrong options from the same theme because pools go by `moduleId`.
- **Ids:** `w-<theme>/<key>`.
- **Selection:** new words never pre-empt due reviews.
  - `prefs.newWordsPerDay` (0 = off, 3, 5 default, 10). Today's count = word items whose `introducedAt` is today.
  - Focused: Today gets a "New words" row that starts a batch of 5 (or what is left today).
  - Micro: when nothing is due, alternate between the next lesson and a batch of 3 words, while today's cap allows (the most recent of today's lesson completion and word introduction decides). If the path waits on a checkpoint (micro mode cannot run it), offer words.
- **Session:** `planWords` builds intro steps (`{ type: 'word'; itemId }`: Dutch with article, audio, meaning, note), then a recognition drill per word, then a supported-recall drill per word (micro: recognition only). Plan kind `words`.
- **Finish:** `completeNewItems` (built as `completeWords`, renamed in Phase 1) introduces each word with its in-session evidence (same rules as `introduceItem` in `completeLesson`) and counts answers for the day strip. `SessionOutcome.newItemIds` lists them.
- **Summary:** `summary.items` stays course-only (1,024). A new `summary.words = { new, learning, strong, total: 625 }` over the 625 list. Progress shows "Basic words: N of 625". `itemsByStrength` stays course-only.
- **Validator** (`tests/curriculum/words.test.ts` or the curriculum validator): exactly 625 entries; unique ids; every `ref` resolves to one course item; no new word duplicates a course item or another word, ignoring the article; nouns start with de or het (plurals with de); every theme has at least 4 items; English is unique within a theme.

### As built (2026-10-28)

- `src/words/types.ts`, `assemble.ts` (`placeWords`, `bareWord`, `WORDS_STAGE`), `build.ts` (`noun`, `verb`, `adj`, `other`, `course` helpers; keys come from the bare word), `content/*.ts` (21 themes), `content/index.ts` (theme order).
- `indexCurriculum(source, wordThemes)` adds `words`; `src/curriculum/index.ts` passes `wordThemes`. Test fixture: `makeCourse(overrides, testWordThemes)`.
- Selection (`src/engine/selection.ts`): `WORD_BATCH` (micro 3, focused 5), `wordsIntroducedToday`, `wordsLeftToday`, `getNewWordIds`, `NextActivity` type `words`, `getNextActivity` option `newWordsPerDay`. The daily limit counts every basic word met today, in a lesson or a batch. The track also introduces course words it references, when the learner meets them there first.
- Plan and progress: `planWords`, `introStepIds` (was `wordStepIds`), step `word`, kind `words`; `completeNewItems` (was `completeWords`); `completeLesson` now shares `introduceAll`.
- Bridge: `learning.startWords(mode)`, `Snapshot.wordsLeftToday`, `finish` handles `words`.
- UI: `WordCard` (steps.tsx), Today "New words" card, Progress "Basic words" card, Settings "New words a day" (Off/3/5/10, default 5), "New words learned!" end screen, nudge preview.
- Tests: `tests/engine/words.test.ts`, `tests/curriculum/words.test.ts`, panel UI tests. 167 tests pass; build passes; checked in the preview harness (Today card, word card, no console errors).

## Phase A2: the 625-word list

- Our own list, built from the book's themes and ranked with a Dutch frequency list such as SUBTLEX-NL. Wyner's published list is a checklist only; it stays out of the repo.
- Roughly: people and family, body, clothing, home, kitchen, food, fruit and vegetables, drinks, animals, nature and weather, town, transport, work and school, technology, time and seasons, hobbies and sport, colours and materials, adjectives (~70), verbs (~90), positions and directions.
- Course items that fit (de fiets, de keuken, het huis, de jas, mooi, werken …) are references.
- Check every article and spelling against woordenlijst.org; the NT2 review in the README covers this list too.
- **As built:** 625 entries, 21 themes: 469 new words and 156 references to course items (recounted from the index in session 3; this line used to say 460 and 165). Days are bare words (`maandag`, pos `other`). Words dropped because their bare form clashes with a course item: verb `fietsen` (course has "de fietsen"), noun `de weg` (course "weg"), `het meer` (course "meer"), noun `het eten` (kept the verb).

## Phase 1: minimal-pair ear training

- **Data:** `src/sounds/pairs.ts`: contrasts, each with an id, label, tip and 3 to 5 real word pairs with glosses. Contrasts: a/aa (man/maan, zak/zaak, lat/laat), e/ee (pen/peen, hel/heel, ben/been), o/oo (bot/boot, pot/poot, kop/koop), o/oe (bok/boek, kok/koek, hok/hoek, mos/moes), i/ie (vis/vies, lip/liep, zit/ziet, rit/riet), uu/oe (vuur/voer, muur/moer, buur/boer, stuur/stoer), eu/uu (deur/duur, zeur/zuur, geur/guur), ui/ij (ruim/rijm, zuil/zeil, kuit/keit, luid/leid), ui/ou (buit/bout, huid/houd), ie/ij (wie/wij, lief/lijf, die/dij, bijt/biet), g/h (goed/hoed, geel/heel, gaan/haan, geld/held), w/v (wol/vol, wet/vet, wal/val, wind/vind). Avoid obscure members; check each with a Dutch speaker.
- **Items:** one item per contrast, `p-<contrast>` (kind `sound`, recognition only, `stageId` = `sounds`).
- **Drill:** the existing choice exercise with `audioText` + `listenOnly`: "Listen. Which word did you hear?", options = the pair, explanation = both meanings. `chooseReviewExercise` special-cases contrast items: random pair, random member, at every stage.
- **Introduction:** Today row "Ear training": one new contrast per session (intro card: the two sounds, the tip, play both words), then 6 trials; then the contrast is scheduled like any item.
- Browser voices may blur vowel length; Phase 7 replaces these with human recordings.

### As built (2026-10-28)

- `src/sounds/types.ts`, `pairs.ts` (12 contrasts, 3 or 4 pairs each), `assemble.ts` (`SOUNDS_STAGE`, `contrastItemId`, `contrastLabel`, `placeContrasts`).
- Changes to the word list above: added tak/taak, vel/veel, zon/zoon, beurt/buurt and zuid/zout (ui/ou had only two pairs); puin/pijn replaces kuit/keit (keit is informal); biet/bijt is written first-sound-first like the others. Every pair still needs a Dutch speaker's check.
- Item `p-<id>`: kind `sound`, `recognitionOnly`, stage, lesson and module id `sounds`. Its Dutch is the first pair ("man · maan"), so "Review these" plays real words, not letters; its English is "Ear training: a or aa". Contrast items are kept out of other drills' wrong options.
- `indexCurriculum(source, wordThemes, contrasts)` adds `sounds` and `contrast(itemId)`.
- Drill: `pairDrill` (exercises.ts). `generateExercise` returns it for a contrast at whatever stage the item needs, so contrasts climb the stages and can become strong by ear alone.
- Session: `planSounds`, kind `sounds`: step `contrast` (`ContrastCard`: both sounds, the tip, every pair with a play button per word), then `CONTRAST_TRIALS` = 6 recognition trials; each sound is heard three times and the pairs take turns. `introStepIds` and `completeNewItems` serve word and sound sessions alike, so one slip in the trials brings the contrast back in 10 minutes, as for any new item.
- `learning.startSounds()`: the next contrast not met (`getNewContrastId`), one per session, no daily cap. Once all 12 are met, a round over the least secure ones.
- Micro breaks never start ear training, and it takes no turn in the lesson/word alternation; due contrasts come up as ordinary listen-only reviews ("Can't listen now" skips them).
- Summary: `summary.sounds`; `summary.items` now counts the lessons' items directly (it used to mean "not a basic word").
- UI: Today "Ear training" card ("Hear a or aa" / "Train your ear", then "Practise the sounds"), Progress "Ear training" card, "Ear training done!" end screen.
- Tests: `tests/engine/sounds.test.ts`, `tests/curriculum/sounds.test.ts` (each pair differs only in its two sounds), a panel UI test. 182 tests pass; build passes; checked in the preview harness (Today card, intro card, six trials, feedback, end screen, no console errors).
- For Phase 4: leech prompts should skip contrast items (a note about "man · maan" makes no sense).

## Phase 2: pictures and situation cues

- **Manifest:** `src/images/images.json` maps normalised Dutch ("de fiets") to `{ file, author, source, license, licenseUrl }`; files in `public/images/`. No lesson file changes. A `pictureFor(itemId)` resolver: learner's picture, then bundled, then none.
- **Sourcing:** the owner's own photos first, then Wikimedia Commons and Openverse. CC0, public domain or CC BY only (no NC, no ND: we crop). One clear subject, no logos, no identifiable faces, Dutch versions (omafiets, Dutch sliced bread), several objects for plurals. No AI images for words that are signs (ingang, uitgang, openingstijden).
- **Script:** `scripts/fetch-images.ts` (dev only) reads the owner's picks (word → source URL + credit), downloads, crops 4:3, resizes to about 480×360, writes WebP (~25 KB) and the manifest. Curating picks is the owner's job; ship the pipeline with a small pilot set.
- **Credits:** an "Image credits" list in Settings (CC BY needs it).
- **In-page card:** `wxt.config.ts` exposes only fonts to X and LinkedIn. Keep images private: the content script asks the background for a data URL, as audio goes through the offscreen document.
- **Learner pictures:** "Change picture" opens a Dutch Google Images search for the word in a new tab; the learner pastes an image; it is downscaled to WebP and stored in IndexedDB by item id.
- **Drills with pictures:** recognition = "Listen. Which picture?" (choice with picture options), supported recall = picture + letter hint → type, independent recall = picture → type, transfer = dictation. `RecallCard` shows the picture as the cue.
- **Situation cues:** for a lesson's primary phrase, generated recall prompts use the lesson's `situation` ("A colleague says she's off to Paris. React.") instead of the English. Other phrases get a fill-the-gap from a lesson example that contains them, else the English.
- **Dutch first:** `prefs.showTranslations` (default false): learn, chunk and word cards show the Dutch and audio, with the English behind "Show meaning".
- About 96 of the 142 course nouns photograph well, 26 need a scene, 20 are abstract and keep the situation or sentence cue.

### As built (2026-10-28)

- `src/images/`: `picks.json` (the owner's picks, input to the script), `images.json` (the manifest: normalised Dutch → `{ file, author, source, license, licenseUrl }`), `manifest.ts` (`bundledImages`, `imageFor`), `crop.ts` (`coverCrop`, 480×360), `own.ts` (learner pictures: IndexedDB database `taalnudge`, store `pictures`, keyed by item id), `downscale.ts` (canvas → 480×360 WebP), `pictures.ts`.
- Resolver: `pictureFor(itemId)` is `PictureSource.pictureFor`: the learner's own (IndexedDB) → bundled (`/images/<file>`) → none. `tn.pictures` in storage lists the items with an own picture (`store.readPictures`, `store.setPicture`), so drills are planned without opening IndexedDB.
- In-page card: `createRemotePictures` sends `tn:picture`; the background worker answers with a data URL (`answerPicture`: own blob, else the bundled file; only plain `*.webp` names). `web_accessible_resources` is still fonts only (checked in the built manifest).
- Script: `pnpm images:fetch [--plan] [--prune]`. A pick is a Commons title (author and license read from the Commons API and checked: CC0, public domain or CC BY only; SA, NC, ND, GFDL, files with personality or trademark restrictions, and CC BY without an author are refused), an own photo (`file`, credited "Own photo"), or a URL with a hand-written credit. ffprobe and cwebp crop 4:3 (optional `focus`), scale to 480×360 and aim at 25 KB. Changed from the plan: cwebp instead of ffmpeg, because Homebrew's ffmpeg has no WebP encoder. Files are `<word>-<hash>.webp`; Commons rate limits get a backoff.
- Pilot set: de appel, de fiets (a transportfiets), de kat, de lepel, de vork, het mes. Four CC0 and two public domain, each license read from the Commons API; 14 to 27 KB each. The fork is thin on a busy tablecloth: a good one to replace.
- Drills: `DrillContext.hasPicture` goes through `planReview`, `planWords`, `chooseReviewExercise` and `generateExercise`; `createLearning({ images })` builds it from the manifest and `tn.pictures`. Recognition is a picture choice ("Listen. Which picture?" or "Which picture is "de vork"?"); supported recall is "What is this in Dutch?" with the picture and a letter hint; independent recall shows the picture (a recall card in reviews); transfer stays dictation. Changed from the plan: up to four pictures in a 2×2 grid (three at least, else the text choice), because three in a row were about 85 px wide in the panel.
- Situation cues: a lesson's main phrase gets `situation` on its recall drills ("What do you say?", "Build what you would say."), and the recall card shows the scene; a picture wins over the situation. Other phrases get a cloze from the lesson's first example of three or more words that contains them (281 of 763), with the example's English only at supported recall. Everything else keeps the English.
- Exercise types gained `situation`, `picture` and `ChoiceExercise.optionPictures` (no content changes).
- Dutch first: `prefs.showTranslations` (default false). The learn card (meaning, breakdown table, the examples' English), key phrases and word cards keep the English behind "Show meaning". Settings → Learning → Show translations.
- Learner pictures: side-panel word cards have "Add a picture" / "Change picture" (`PicturePicker`: a link to a Dutch Google Images search in a new tab, then paste anywhere in the panel or choose a file) and "Remove my picture". Not in the in-page card. Phase 4's "Make it yours" step can reuse `PicturePicker`.
- Credits: Settings → Image credits (hidden with no bundled pictures).
- Preview harness: `?state=pictures` puts the pictured kitchen words up for review and makes de appel and de kat the next new words.
- Tests: `tests/engine/cues.test.ts`, `tests/images/pictures.test.ts`, `tests/images/manifest.test.ts` (keys are taught words, licenses allowed, no stray files), `tests/images/fetch-images.test.ts`, `tests/ui/pictures.test.tsx`. 225 tests pass; build passes.
- Checked in the preview harness: picture choice, picture with hint, picture recall card, a word card with its bundled picture, a pasted picture (cropped, stored in IndexedDB as a 480×360 WebP, shown, removed again), Settings (toggle and credits), and the in-page card receiving data URLs. No console errors. Not checked: the background worker's `tn:picture` handler in real Chrome (the preview answers the message in the page).

### Known issues found during Phases 1 and 2

- Fixed in session 3 (Phase 7): `pnpm audio:generate --plan` failed because `src/curriculum/assemble.ts` imports `../words/assemble` and `../sounds/assemble` at runtime, and Node's type stripping needs explicit `.ts` extensions. `scripts/ts-resolve.mjs` (loaded with `--import`) retries such imports with `.ts`, then `/index.ts`.
- Fixed in session 3: the in-page prompt's preview line showed a due review's English ("de vork · the fork"), which gave away the drill that follows. `previewFor` now shows only a count for reviews and word batches ("3 quick reviews", "3 new words"); a new lesson still shows its phrase.
- Fixed in session 3: Settings "New words a day" wrapped its four chips to a second line in the 380 px panel. It is now a stacked row (label and helper above, chips on one line below), like "Prompt after".

### Notes for Phase 3

- Article items (`<itemId>#article`) should show their noun's picture: strip `#article` in `bundledFile`, `createPictureSource`, `answerPicture` and `pictureCheck` (`src/images/pictures.ts`).
- Word-track nouns: `pos` and `plural` are not copied onto the `LearningItem` in `placeWords` (`src/words/assemble.ts`); Phase 3 needs them, or a de/het prefix check plus the plural list.

## Phase 3: het mnemonic and de/het drill

- `prefs.hetImage`: the learner's image for het-words, picked once (presets like "made of gold", "frozen in ice", "glowing hot", or their own words), in Settings and the first time a het-noun appears.
- Learn, word and feedback cards show a het badge and the line "Picture it made of gold" for het-nouns.
- **Article items:** `<itemId>#article` for every singular noun (word track nouns, and course nouns except the plural items: de fietsen, de huizen, de meisjes, de kinderen, de sleutels, de ouders, de buren, de boodschappen, de bewoners, de klachten, de openingstijden). Introduced with their noun; for nouns learned before this phase, introduce at most 10 a day.
- **Drill:** choice "de or het?" with the bare noun (and picture), options de and het, explanation with the mnemonic. Scheduled apart from the meaning.
- Progress: "Articles: N strong of M".

### As built (2026-10-28)

- `src/articles/assemble.ts`: `ARTICLES_STAGE`, `articleItemId`, `isArticleItemId`, `nounIdOf`, `articleOf`, `withoutArticle`, `COURSE_PLURALS` (the 11 plural course words), `isCourseNoun`, `placeArticles`. `placeWords` now also returns `nouns` (new words with pos `noun`, not plural).
- Article items: `<noun id>#article`, kind `word`, `recognitionOnly`, stage, lesson and module id `articles` (so `wordsTurn` ignores them), Dutch = the noun's ("het mes", for "Review these" lists), English = "the knife (de or het)". 485 in all: 131 course nouns and 354 word-track nouns. `indexCurriculum` adds them to `items` and lists them as `articles`.
- Drill: `articleDrill` (exercises.ts), what `generateExercise` returns for an article item at every stage: prompt "De or het?", the bare noun in the new `ChoiceExercise.noun` field, the noun's picture if it has one, options de and het in that order (not shuffled, so key 1 is always de), no audio before answering. Once answered the gap fills in ("het mes") with a play button. Article items are kept out of other drills' wrong options.
- Scheduling (`src/engine/articles.ts`): `introduceArticles` starts a new noun's article item when a lesson or word batch introduces the noun (stage `introduced`, first "de or het?" a day later); it is not listed in `SessionOutcome.newItemIds`. `catchUpArticles` lets nouns met before this phase catch up: up to `ARTICLES_PER_DAY` (10) article items a day, longest-known noun first, due at once. Article items started with a new noun count toward the 10. It runs in `learning.snapshot()` (a write only when there is something to add), so opening the panel or a prompt is enough.
- `prefs.hetImage` (parsed, trimmed, at most 40 characters; unset by default). `HET_IMAGES`: made of gold, frozen in ice, glowing hot; the first stands in until the learner picks. `src/ui/player/het.tsx`: `isHetNoun`, `HetLine` ("het · Picture it made of gold."), `HetImageChoice` (chips plus "My own" words), `HetIntro`. Learn, key-phrase and word cards show the line for het-nouns, or the first time the choice of image. The feedback sheet (new `children` slot) shows the line under the answer of any single-item drill on a het-noun, meaning or article. De-words get no image.
- Settings → Learning → "Het-word image". Progress → "Articles · de or het": "N of 485 nouns · S strong" (same pattern as Basic words; the plan said "N strong of M").
- Pictures: `nounIdOf` strips `#article` in `bundledFile`, `pictureCheck`, `createPictureSource`, `createRemotePictures` and `answerPicture`.
- Also changed: `.tn-chips` and `.tn-choice-chip` moved from panel.css to components.css (the in-page card uses them now); Enter in a field inside its own form submits the form instead of the player's primary button (`keepsNativeEnter`).
- Preview harness: `?state=articles` (every basic word met but het glas and de kat; de or het for the pictured knife and fork due first; ten more nouns catch up on load).
- Tests: `tests/engine/articles.test.ts`, `tests/curriculum/articles.test.ts`, `tests/ui/articles.test.tsx`, preview-line tests in `tests/ui/nudge.test.tsx`. 257 tests pass; build passes.
- Checked in the preview harness: the article drill with the knife picture (panel and in-page card), the het line on the correct sheet, the image choice on a new het-noun (a chip, and own words saved with Enter), Settings (het image chips; New words a day on one line), Progress (12 of 485 nouns after the catch-up), the prompt preview ("3 quick reviews"). No console errors.
- For Phase 4: leech prompts should skip article items as well as contrast items (a note on "het mes#article" belongs on the noun); the notes cue for an article drill could be the noun's note.

## Phase 4: personal notes and leech prompts

- `tn.notes` in storage: `Record<itemId, { text, at }>`, parsed with defaults, merged per item (newest wins).
- "Make it yours": an optional step after the learn card (focused lessons) and word intros: one line about the learner's life using the word.
- Reviews show the note as a cue; when the note contains the Dutch word, a personal fill-the-gap blanks it.
- **Leeches:** after a wrong review answer on an item with 4+ lapses and no note or own picture, the feedback sheet offers "This one keeps slipping. Make it yours." Prompt once per item (remember when).

### As built (2026-10-28)

- Storage: `tn.notes` (`NoteIndex`: item id → `{ text, at }`, one line of at most `NOTE_MAX` = 160 characters, parsed with defaults). `store.setNote(itemId, text, at)` re-reads first and keeps a copy written later elsewhere (newest wins per item); empty text removes the note. `tn.leeches` (item id → when "Make it yours" was offered), `store.markLeech`.
- Bridge: `learning.readNotes()`, `learning.saveNote(itemId, text)`, `learning.offerLeech(itemId)`. `drillContext(progress)` now also gives drills `noteFor` and `leech`.
- Cues (exercises.ts): `personalGap(note, dutch)` blanks the item in the learner's line when the line uses it word for word (the whole Dutch, else a noun without its article; three words or more, like `exampleGap`). At supported and independent recall such a note gives a cloze, "Fill the gap in your note.", ahead of the picture, the situation and even a lesson's own exercise (`chooseReviewExercise`). A note that does not use the word rides along as a cue (`Exercise.note`) on the type and word-tile drills and on the recall card. Recognition and dictation are unchanged; contrast and article items ignore notes.
- Leeches (`src/engine/notes.ts`): `leechCheck` marks a review item when missing it now would be lapse `LEECH_LAPSES` (4) or more, it has no note and no own picture, and it was not offered before; contrast and article items are left out. `planReview` sets `PlannedExercise.leech`. A miss on such an item shows `LeechPrompt` in the feedback sheet ("This one keeps slipping. Make it yours.") or, on the recall card, after "No" and before moving on; showing it records the offer.
- "Make it yours" (`src/ui/player/notes.tsx`): built as an optional section at the foot of the card rather than a separate step, so learners who skip it see no extra screen. A "Make it yours" link on the learn card (side panel only, not the in-page card) and on word cards opens a one-line field ("One line about your own life with …", Enter saves); a saved note shows as "Your note" with Edit (and "Remove note" when emptied). The word card's picture tools from Phase 2 stay beside it.
- Preview harness: `?state=notes` (due first: the fork with three earlier lapses, the spoon with a note that uses it, the knife with a note that does not).
- Tests: `tests/engine/notes.test.ts`, `tests/ui/notes.test.tsx`. 276 tests pass; build passes.
- Checked in the preview harness: the leech offer after a wrong picture choice (note saved with Enter, "Saved." shown), the spoon's personal fill-the-gap, the knife's recall card with the note under its picture, the Make it yours field on a word card. Fixed on the way: the field's label broke into three lines. No console errors.

## Phase 6: corrections loop for writing

- In a write exercise's compare step: "Copy for correction" (the learner's text plus a one-line request, to the clipboard) and "Add the corrected version".
- Pending texts wait in `tn.drafts` with the exercise and date, listed on the Review screen, because a tutor takes time.
- Pasting the correction diffs word tokens (LCS). Each changed span becomes a custom item: a fill-the-gap on the corrected sentence, answers = corrected words, hint = what the learner wrote.
- Custom items in `tn.custom` (ids `c-<time36>`); `createLearning` merges them into the index at runtime; their drill is the stored fill-the-gap at every stage, dictation at transfer.

### As built (2026-10-28)

- `src/corrections/`: `types.ts` (`Draft`, `Correction`), `diff.ts` (`findCorrections`: an LCS diff over words, ignoring case and punctuation), `assemble.ts` (`CORRECTIONS_STAGE`, `placeCorrections`, `withCorrections`). `CurriculumIndex.correction(itemId)` is new (undefined for the bundled course).
- A correction: each run of words the corrector added or replaced. Its fill-the-gap is the corrected sentence (the text is split at `.`, `!`, `?`) with the run as "___", the answer is the corrected words, and `wrote` is what the learner had there ("" if they left it out). Runs that only remove words leave nothing to fill in and are skipped; so is a text with no changes. Ids `c-<time36>`, one millisecond apart for several changes in one text.
- Storage: `tn.drafts` (draft id `d-<time36>` → `{ text, prompt, exerciseId, at }`), `tn.custom` (correction id → correction; ids are never replaced). Both parsed with defaults.
- Bridge: `createLearning` merges the stored corrections into its index before each call (`sync`), so due counts, reviews and the summary include them. `learning.saveDraft`, `learning.removeDraft`, `learning.correctDraft(draftId, corrected)` (stores the corrections, starts each item with its first review a day later, removes the draft). `Snapshot.drafts`, newest first.
- Drill: `correctionDrill` (exercises.ts): "Fill the gap the way it was corrected." at recognition, supported and independent recall, with the hint "You first wrote "ben"."; dictation of the corrected sentence at transfer. Corrections are kept out of other drills' wrong options.
- UI (`src/ui/player/corrections.tsx`): under a writing exercise's model answer, side panel only, "Get it corrected": "Copy for correction" (the request "Kun je mijn Nederlands verbeteren? (Could you correct my Dutch? I'm learning.)", a blank line, the text) saves a draft; if the clipboard refuses, the request shows in a selectable box. "Add the corrected version" takes the correction straight away. The Review tab lists "Waiting for correction" with Add correction, Copy again and Remove; the result ("1 correction added to your reviews.") stays after the draft leaves the list.
- Known gap: the side panel's `UiEnv.course` is still the bundled index, so a missed correction is not listed under "Review these" on the end screen (the drill itself is self-contained).
- Preview harness: `?state=corrections` (one draft waiting, one correction due first).
- Tests: `tests/engine/corrections.test.ts`, `tests/ui/corrections.test.tsx`. 292 tests pass; build passes.
- Checked in the preview harness: the Review tab list and adding a correction there (de → het found), the correction's fill-the-gap with its hint, and "Get it corrected" under a writing exercise in `s2-write-formal`. The preview browser refused the clipboard, so the copy-by-hand box showed (and was then added); a real clipboard copy from the side panel was not checked. No console errors.

## Phase 7: audio plan

Until the ElevenLabs quota resets, `src/audio/speech.ts` falls back to the browser's nl-NL voice for new words and pairs; nothing is blocked.

1. Add `words` and `pairs` groups to `GROUPS` in `scripts/generate-audio.ts`, right after `items`, collected from the word track and `src/sounds/pairs.ts`. The script rebuilds `clips.json` from what it collects and `--prune` deletes unlisted files, so anything not collected is lost.
2. Count with no API calls: `pnpm audio:generate --plan`. Expect ~5,000 characters for single words, a few hundred for pairs.
3. After the reset (date in the ElevenLabs dashboard; the key cannot read the subscription), run `pnpm audio:generate --until answers`. Finishing the course needs 64,473 characters plus ~1,000 for checks, so course + words ≈ 70,000 of 90,000 credits. Example sentences for words, if added, wait a month. (29 October: the scenario packs and the tier-2 sentences have since raised the total to about 125,000 credits, two months' worth, so run plain `pnpm audio:generate` after each reset; `docs/audio-research.md` has the current count.)
4. Minimal pairs get human recordings: a Dutch (Netherlands) speaker, ideally two or three (more voices help learners generalise), with written permission. Put takes in `public/audio/recorded/`, process them with the script's ffmpeg chain (silenceremove + two-pass loudnorm, mono 44.1 kHz, 64 kbps MP3), list them in `src/audio/recorded.json`, have `speech.ts` prefer them, and keep `--prune` away from that folder.
5. Speech-to-text cannot verify one-syllable words; listen to pairs by ear.

### As built (2026-10-28)

- `scripts/ts-resolve.mjs`: a `module.registerHooks` resolve hook (Node 22.15 or later) that retries an extensionless relative import as `<path>.ts`, then `<path>/index.ts`. `pnpm audio:generate` loads it with `--import`. This fixed `--plan` (known issue above). Fixed later the same day: the first version missed imports of a folder, which Node reports as `ERR_UNSUPPORTED_DIR_IMPORT` rather than as not found, and when nothing matched it threw an error naming `<path>/index.ts` instead of the import. `tests/audio/ts-resolve.test.ts` runs Node with the hook to check both.
- `GROUPS` is now target, items, **words**, **pairs**, audio, context, dialogue, examples, answers. `besideTexts(wordThemes, contrasts)` collects the word track's own words (its references to course words are lesson items already) and every word of the minimal pairs; `collectClipTexts(lessons, beside)` adds them as groups. A text keeps its first group only, and clip file names do not depend on the group, so texts that moved groups keep their clips and `--prune` leaves them alone.
- `pnpm audio:generate --plan` (no API calls), 2026-10-28: 3,660 texts, 98,428 characters in all. Still to generate: words 468 texts, 3,750 characters; pairs 78 texts, 289 characters; context 7,850; dialogue 16,490; examples 17,773; answers 22,351. Course plus words plus pairs: 68,503 characters, plus about 1,000 for the speech-to-text checks: within the 90,000 monthly credits. Run `pnpm audio:generate --until answers` after the reset, then the answers group the month after if it does not fit.
- Learner content (notes, corrections) has no clips: the browser's nl-NL voice reads it.
- Tests: `tests/audio/clips.test.ts` (group order, first group wins, references stay out of words; the stale-entry check now covers words and pairs). 295 tests pass; build passes.

### As built: step 4, human takes (2026-10-28)

Built before any recording exists, so the owner only has to record and run one command.

- Raw takes go in `recordings/<speaker>/`, one file per text, named after what it says: `maan.wav` (WAV, AIFF, FLAC, M4A, CAF, MP3, OGG, Opus or WebM). The name must be a text the course plays, exactly or ignoring case and punctuation when only one text fits; `_` stands for a space. `recordings/` is not bundled, and the raw takes need not be committed.
- `pnpm audio:generate --recorded` (`scripts/recordings.ts`; no API calls, needs ffmpeg) runs every take through the same `postProcess()` chain as the generated clips into `public/audio/recorded/<speaker>/<text>.mp3`, then writes `src/audio/recorded.json`: `{ "takes": { "<text>": [one file per speaker, sorted] } }`. It names takes that fit no text and exits 1. Two takes of one text by one speaker stop the run before anything is processed. Earlier takes stay listed while their MP3 exists, so a fresh clone without `recordings/` keeps them; to drop a take, delete its MP3 and run again. `--plan` prints how many of the 93 pair words have a take.
- `postProcess()` now refuses output with no audio and never leaves its temporary file. A take entirely under the -50 dB silence threshold used to come out as an MP3 with no frames, listed and shipped; now the take is reported and any earlier version stays. Record in a quiet room with a moment of silence before and after each word: the chain only trims silence below -50 dB, so louder room noise stays in.
- `src/extension/clips.ts` merges the takes into the clip manifest, so the side panel and the in-page card (through the offscreen document) both get them. `speech.ts` plays a human take first, then the generated clip, then the browser's voice; a source that cannot play falls through to the next, and the result says `engine: 'recording'`.
- Takes rotate per text, from one starting speaker picked at random each time the panel or a page loads. Both words of a pair start in the same voice, so the contrast is heard within one speaker, and each replay of a word brings the next speaker.
- `--prune` only looks at files directly in `public/audio/` (`unusedClips()`), so the takes folder is out of its reach.
- Checked end to end with a temporary test tone named `maan.wav` and the API key blanked: the command processed it to a 6.9 KB MP3, listed it, named a misspelled copy and exited 1; `--plan` counted 1 of 93 pair words; `pnpm build` shipped the MP3 with its path in both the side panel chunk and the content script. The temporary files are gone and `recorded.json` is empty again, which also checked that a deleted MP3 leaves the manifest.
- Not checked: a real recording, and a take playing in Chrome (the preview harness has no clip playback). Step 4's recording and step 5's listening are the owner's.
- Tests: `tests/audio/recordings.test.ts` (names, matching, processing, keeping and dropping takes, and the real ffmpeg chain on a test tone: mono, 44.1 kHz, 64 kbps, silence trimmed, -18 LUFS, and a silent take refused), `tests/audio/speech.test.ts` (takes first, rotation, fallback), `tests/audio/clips.test.ts` (the takes manifest's files and keys, prune). 309 tests pass; build passes. With the resolve hook's test added after it, 311 pass.
