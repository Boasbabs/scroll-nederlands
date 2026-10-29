# Dutch audio: voices, model and settings

Research for TaalNudge's pre-generated Dutch clips (A0 to A2, standard Netherlands Dutch, nl-NL): ElevenLabs on 27 October 2026, Google on 29 October 2026.

**Status: Google Chirp 3: HD; every clip remade on 29 October.** 5,365 of the course's 5,366 texts have a clip; the one left, "ja", goes to the browser's voice. Main voice (a): Erinome. Dialogue voice (b): Algieba. Pace 1. The first 1,270 clips came from ElevenLabs (Serge de Beer and Roos on `eleven_v4`) until its monthly quota ran out; they were replaced and deleted, and the ElevenLabs research is kept below as history. `scripts/generate-audio.ts` produces the clips; `docs/audio-qa.md` lists the clips its check flags.

## Decision (29 October)

- **Provider: Google Cloud Text-to-Speech, Chirp 3: HD.** On the course's own texts the best Google voices are as accurate as ElevenLabs (see "Google Chirp 3: HD test" below). The whole course, about 152,000 characters, fits in Chirp 3: HD's free million characters a month, where ElevenLabs needed about 125,000 credits, two months of the Starter plan. Chirp 3: HD also has a pace setting and custom pronunciations, which `eleven_v4` lacks.
- **Main voice (a): Erinome, `nl-NL-Chirp3-HD-Erinome` (female).** She reads everything except the second speaker of a dialogue. On the 20 texts both providers have, she matched ElevenLabs: 13 of 14 short texts back exactly, 6 of 6 sentences, no silent take. In the screen of bare short words, she tied with Achird for the most exact takes, 35 of 38 spoken.
- **Dialogue voice (b): Algieba, `nl-NL-Chirp3-HD-Algieba` (male).** He reads the second speaker in a conversation (378 texts), so dialogues keep a female and a male voice. He also matched ElevenLabs on the shared texts, went 64 takes in the tests without a silent one, and his pace is the closest to Serge de Beer's (11.6 letters a second against 11.5).
- The screen had suggested the reverse, Algieba for the main voice. The owner chose Erinome for the main part.
- **Settings:** `speakingRate` 1. At 0.9 the check heard every voice worse. Chirp 3: HD has no model setting (the voice name picks it), so `chirp3-hd` names it in the manifest and the cache keys.
- **Silent takes.** For a one-word text, Google sometimes returns about 0.28 s of near silence (-43 to -61 dB), at random. Some takes peak just above -50 dB, survive the trimming, and loudness normalisation would turn them into noise. The pipeline measures each raw take's peak before post-processing. Under -30 dB it asks again, five tries in all; then it leaves the text to the browser's voice and lists it in `docs/audio-qa.md`.
- **Spelling.** Every Google voice reads letters joined by hyphens ("Smith. S-M-I-T-H.") as the word, but spells letters set apart by commas. The course's three hyphen-spelled names are sent as "S, M, I, T, H."; the learner sees, and the manifest keys, the text as written. The other spelling lines already use commas ("Ik spel het: E, V, A.").
- **Output:** Google returns LINEAR16 WAV at 24 kHz. The master is that take converted losslessly to FLAC. Then comes the ffmpeg chain the ElevenLabs clips had:
  - trim silence to 50 ms before and 150 ms after;
  - two-pass `loudnorm` to -18 LUFS, -1.5 dBTP;
  - encode mono Opus at 32 kbps and 48 kHz in Ogg (about 4 KB per second), bitexact, so the same master always makes the same file.
- **One voice per part.** A run keeps a part's clips from before only if the same model and voice made them. The ElevenLabs clips left the manifest when the Google run began, so no part ever mixed the two providers, and `--prune` deleted their MP3s afterwards.
- **Slow replay:** `playbackRate` (`SLOW_RATE` 0.7 in `src/audio/speech.ts`, pitch preserved). There are no separate slow clips.

## Generation pipeline (`scripts/generate-audio.ts`)

1. **Texts.** The script builds the course from `structure.ts` and `content/**`, then the scenario packs' scenes, plus the word track and the minimal pairs, in this priority order: lesson `targetPhrase`, `items`, the word track's new words and their sentences, the pairs' words, exercise `audioText`, exercise `context`, lesson `dialogue`, `examples`, then model answers. Model answers are the cloze sentence with `answers[0]` filled in, the `order` words joined, the `type` `answers[0]`, the `write` `modelAnswer`, and the Dutch side of `match` pairs. A text used in several places belongs to its first group. In a conversation, the second speaker reads with voice b (`clipsB`); further speakers alternate.
2. **Masters, cache keys and file names.** Every take that speaks is kept as a master, `audio-masters/<16 hex>.flac` (gitignored; `AUDIO_MASTERS_DIR` moves it), keyed by `sha1(spoken text, voice, model, settings)`. Google's takes differ each time, so the master is the take the check heard, and a retake replaces it. A clip's key adds the post-processing version: `audio/<16 hex>.ogg`. A clip missing from `public/` is made from its master when there is one; only a text with neither calls the API. A text keeps the clip it has until the run makes its own, as long as the same model and voice made it. The manifest `src/audio/clips.json` holds `{ voices, model, settings, clips, clipsB }`, keyed by `clipKey(text)`. It is rebuilt from the current course on every run, so stale entries drop out, and it is saved after every clip.
3. **Requests** (`scripts/google-cloud.ts`).
   - Three in parallel. The key goes only in the `X-Goog-Api-Key` header. `GOOGLE_TTS_ENDPOINT` (the EU endpoint, set in `.env.local`) and `GOOGLE_STT_ENDPOINT` pick regional endpoints.
   - A per-minute limit (429) or a server error is retried with backoff, for about a minute in all.
   - A refused key or project, a spent daily or monthly quota, or a limit that outlasts the retries stops the run cleanly. Running the same command again resumes.
   - `--plan` counts texts and characters without calling the API; `--encode` makes clips from the masters only, also without the API; `--until <group>` and `--max-chars N` cap a run; `--report` rewrites `docs/audio-qa.md` from the stored checks; `--prune` deletes clips the manifest no longer uses.
4. **Verification, group by group.** Google Speech-to-Text v1 (FLAC at 16 kHz, Dutch (nl-NL) forced) checks every text of up to 3 words plus a fixed 10% sample of longer ones. It scores as the ElevenLabs check did: lower case, no punctuation or accents, numbers and clock times spelled out, "ij" equal to "ei". A clip is flagged when a short text is not exact, when a longer one has WER > 0.2, or when its length does not fit the text. A flagged clip is made again once (another take) and checked again. Clips still flagged go to `docs/audio-qa.md` as a listening list, together with any text that has no clip. If Speech-to-Text refuses its calls, the run goes on making clips, unchecked.

## Generation status, size and cost (29 October)

- **The run.** `pnpm audio:generate` voiced 5,365 of the 5,366 texts in 34 minutes: 4,987 with Erinome, 378 with Algieba. 16 takes came back silent and were asked for again. Only "ja" never spoke: Erinome returned silence on all five tries, and on five more in the `--prune` run, so the browser's voice reads it.
- **Characters billed:** 153,562 in the run, retakes and silent takes included, plus 10 in the `--prune` run and 325 in a trial run beforehand. With the voice tests (about 6,100), the month has used about 16% of Chirp 3: HD's free million, so there is no charge.
- **The check.** Speech-to-Text checked 2,463 clips (2,159 short, 304 longer). 203 were flagged on the first take and made again; 118 are still flagged and listed in `docs/audio-qa.md` as a listening list. Most are one-syllable words heard as nothing or as a near word (24 came back empty, isolated "maan" among them; "man" passed this time), clock times written as digits ("tien over drie" as "3:10"), and names ("Sharma" heard as "shoarma", its letters right). A spot check of 12 clips the run had not checked, from both voices, heard 11 within one word in five; the twelfth was the street name "Lindelaan", heard as "Lindenlaan".
- **Speech-to-Text cost.** 2,666 calls with about 53 minutes of audio, billed by the second. The first 60 minutes a month are free (the voice tests used some of them), then $0.016 to $0.024 a minute: under a dollar of the trial credit.
- **Size.** The clips take 42.5 MB in the built extension (`dist/chrome-mv3/audio`), against the 50 MB estimated; the whole build is 47.8 MB. The FLAC masters take 310 MB in `audio-masters/`, with the checks in `checks.json` beside them: back that folder up.
- **ElevenLabs clips.** The 1,270 MP3s left the manifest when the run began, and `pnpm audio:generate --prune` deleted them afterwards. Among them was the "Dank je wel!" clip that the launch video's soundtrack fetches; it stays in git history (commit 0eb8821) for a re-render.

## Google Chirp 3: HD test (29 October)

Google's Chirp 3: HD voices cost about $30 per million characters, with the first million each month free, so the whole course (152,000 characters) would cost nothing to voice. They include nl-NL voices, a pace setting (0.25 to 2.0) and custom IPA pronunciations, none of which `eleven_v4` has. Before any switch, `pnpm voice:test` hears them on the course's own texts:

- **Texts.** 25: 13 short words, where the ElevenLabs voices differed (ui, eu, ij, the soft g, sch, a minimal pair); sentences with a time, a number and spelling; four dialogue lines for voice b. 20 of them have an ElevenLabs clip to compare with.
- **Voices.** Charon and Iapetus (male) for the main voice and Erinome (female) for the dialogues, at pace 1 and 0.9. `--voices` and `--rates` change them; `--list` shows all of them.
- **Check.** Every clip, Google's and the course's, goes through the ffmpeg chain, then Google Speech-to-Text (v1, Dutch forced). Google's recogniser may hear Google's voices more easily, so the table of shared texts compares like with like, but a Dutch listener decides.
- **Setup.** A Google Cloud project with billing linked, the Cloud Text-to-Speech and Cloud Speech-to-Text APIs enabled, and an API key restricted to those two, in `.env.local` as `GOOGLE_CLOUD_API_KEY`. `GOOGLE_TTS_ENDPOINT=https://eu-texttospeech.googleapis.com` keeps the calls in the EU, if the voices are offered there: check with `--list`.
- **Output.** `voice-test/` (gitignored): Google's takes, the clips, `results.json`, `report.md`, and `index.html`, a page to listen across each text. A default run sends 2,274 characters; a second run reuses takes and transcripts.
- **Outcome.** Google won: every clip was remade with it on 29 October, one voice per part, and `scripts/generate-audio.ts` now uses Google. The ElevenLabs run planned for 1 November is off.

### Results (29 October, EU endpoint)

On the 20 texts that both have, at pace 1 (14 short texts, 6 sentences):

| Voice | Short texts back exactly | Sentences heard | Silent takes |
|---|---|---|---|
| ElevenLabs (Serge de Beer, Roos) | 13 of 14 | 6 of 6 | 0 |
| Google Erinome (female) | 13 of 14 | 6 of 6 | 0 |
| Google Charon (male) | 12 of 14 | 6 of 6 | 1 |
| Google Iapetus (male) | 11 of 14 | 6 of 6 | 2 |

- **Sentences are a tie.** Every voice was heard on every shared sentence.
- **Google drops single words.** 9 of Google's 150 takes came back silent, a quarter second of nothing, all of one-word texts ("goed" 4 times, "wel" and "man" twice, "leuk" once), 8 of them from the two male voices. A probe of 72 more takes showed it is random: 8 of 27 bare one-word takes came back silent, against 3 of 45 written "goed.", "Goed." or "de man". Serge de Beer read all 13 shared short words right. A silence check with retries would catch these, but Google cannot voice the word track as it comes.
- **Spelling.** At pace 1, every Google voice read "S-M-I-T-H." as the word "Smith"; letters with commas ("S, A, N, N, E.") came back spelled out.
- **Pace.** At pace 1 Google speaks 10.5 to 11.0 letters a second on the shared texts, against 10.3 to 11.5 for ElevenLabs. Pace 0.9 made the check miss more, so it buys nothing.
- **Not measured.** Speech-to-Text also heard nothing in a few spoken single words ("man" from every voice), a known weakness of recognisers on isolated words, so those count against a voice without proving it wrong. Accent and naturalness need a Dutch listener on `voice-test/index.html`.
- **Cost.** 2,580 characters and 170 Speech-to-Text calls, inside the free allowance.

### Screen of the male voices (29 October)

Charon and Iapetus went silent most, so every nl-NL male voice went through a one-off screen of the word track's riskiest form: the 13 short words above, written bare, three takes each, checked for silence and then by Speech-to-Text. Erinome, Charon and Iapetus went through it too, to compare.

| Voice | Silent takes | Heard exactly, of the spoken takes |
|---|---|---|
| Algenib (male) | 0 of 39 | 34 of 39 |
| Algieba (male) | 0 of 39 | 34 of 39 |
| Achird (male) | 1 of 39 | 35 of 38 |
| Erinome (female) | 1 of 39 | 35 of 38 |
| Iapetus (male) | 4 of 39 | 32 of 35 |
| Charon (male) | 5 of 39 | 29 of 34 |
| Orus, Alnilam (male) | 6 of 39 each | 31 of 33, 29 of 33 |

The other ten male voices fell between 1 and 5 silent takes. Across all 17 voices most misheard takes were "maan" (30) and "man" (26): Speech-to-Text hears an isolated minimal pair badly, so those count against every voice alike. Algenib and Algieba missed nothing else. Once Algenib's "man" came back as "maan", which a listener should check for vowel length.

The three best male voices then took the full test at pace 1. On the 20 texts both have, Algenib and Algieba matched ElevenLabs and Erinome (13 of 14 short texts, 6 of 6 sentences, no silent take), Achird scored 12 of 14 with one silent "wel", and Algieba's pace (11.6 letters a second) is closest to Serge de Beer's (11.5). Each of Algenib and Algieba went 64 takes without a silent one, which puts their silent rate low but not at zero: a Google run still needs a silence check and retries. Every Google voice still read "S-M-I-T-H." as "Smith".

The screen suggested Algieba for the main voice and Erinome for the dialogues; the owner chose the reverse (see Decision). The screen cost about 2,400 characters and 610 Speech-to-Text calls, the full test of the three 1,137 characters.

## ElevenLabs research and first run (27 October, history)

The course's first voices, kept as a record. None of their clips ship any more.

### Method

1. **API access.** The working `sk_` key may call Text to Speech and Speech to Text. Voices read, Models read and User read return `401 missing_permissions`. As a result, quota and tier come only from response headers: `maximum-concurrent-requests` is 3 for TTS (6 for Flash, 12 for STT), which matches the Starter tier. Library voices work by id without being added to My Voices.
2. **Voice discovery.** The public `GET /v1/shared-voices?language=nl` endpoint returns at most 3 voices per anonymous request. Sorting by usage, clones, trending and newest found 10 Dutch voices. For each one I recorded the `locale`, `accent` and the `verified_languages` entries for `nl`, plus use case, usage, `notice_period` and the `character-cost` of a 2-character request. The premade voices were checked too: they are all English-native.
3. **Test set (205 clips, 4,780 characters billed).** The set:
   - the brief's 8 stress sentences;
   - "De ui in huis, de eu in neus, de ij in tijd." and "De g van goed, de sch van school.";
   - "ui", "Ik spel het: S, A, N, N, E." and "Het is kwart over drie.";
   - the course's risky short items "deur", "wel", "Pardon?" and "man, maan".

   Models and settings:
   - `eleven_multilingual_v2`: stability 0.6, similarity 0.75, style 0, speaker boost, speed 0.9;
   - `eleven_v4`: stability 0.5, similarity 0.75, `language_code: "nl"`;
   - A/B checks: v4 and Flash with and without `language_code`; v2 with a Dutch `previous_text` context ("Luister en herhaal:", which is neither spoken nor billed); v2 at speed 0.75.
4. **Verification.** Every clip went through Scribe v2 twice: once with the language auto-detected, then the short and sound items again with Dutch forced (`language_code=nld`). Scoring uses a normalised WER: lower case, no punctuation or accents, Dutch number words, so "€18,50" equals "achttien euro vijftig". `ffprobe` and `ffmpeg` measured duration, silence, loudness and pace. The same check ran on 8 seeded random v1 clips and 5 suspect ones.

### Results

| Voice id | Name | Gender, age | Locale evidence | Cost | Notice | 8 sentences exact (v2 / v4) | Short words, forced Dutch (v2 / v2 + context / v4) | Pace v2 0.9 / v4 (letters/s) |
|---|---|---|---|---|---|---|---|---|
| `UNBIyLbtFB9k7FKW8wJv` | **Serge de Beer** | M, middle-aged | nl-NL / standard; instructional voice-over | 1× | 730 d | 8/8 / 8/8 | 2/4 / 2/4 / **3/4** | 16.4 / 14.1 |
| `7qdUFMklKPaaAVMsBTBt` | **Roos** | F, young | nl-NL / standard; educational; v4 only | 1× | 730 d | – / 8/8 | – / – / 2/4 | – / 13.9 |
| `SXBL9NbvTrjsJQYay2kT` | Melanie | F, young | nl-NL / standard; narrator | 1× | 30 d | 8/8 / 8/8 | 2/4 / 3/4 / 3/4 | 15.7 / 15.2 |
| `60CwgZt94Yf7yYIXMDDe` | Peter | M, middle-aged | nl-NL / standard; narrator; v4 only | 1× | 730 d | – / 8/8 | – / – / 3/4 | – / 13.8 |
| `YUdpWWny7k5yb4QCeweX` | Ruth | F, young | nl-NL / standard; educational | **2×** (custom rate) | 730 d | 8/8 / – | 1/4 / **4/4** / – | 16.1 / – |
| `jfwdd64Nlhnj6vcFqRHZ` | Koen (v1 voice) | M, young | nl-NL / standard (`nl-standard`); conversational | 1× | none | 8/8 / 8/8 | 3/4 / 3/4 / 3/4 | 18.7 / 14.8 |

The short words are "deur", "wel", "Pardon?" and "man, maan". The 4/4 for Ruth is with context. "ui" on its own never round-trips for any voice or model: STT hears "Oui", "Why?" or "Ei", so it measures nothing.

- **Sentences do not separate the voices.** Every voice and both models round-trip all 8 stress sentences with no word error, and every one spells "S A N N E" back.
- **Remaining STT differences are STT conventions, not voice errors.** "ij" comes back as "ei" (they sound the same), letter names are written as "G" or "sh", and "kwart over drie" comes back as "3.15 uur". The scorer now accepts all three.
- **"eu" heard as "ui"** in "neus": Melanie and Serge on v2, but not on v4.
- **`language_code` matters on v4.** Without it, v4 read "ui" as the letters "Ü, I" (1.0 s instead of 0.4 s). v2 accepts the parameter without an error.
- **Flash is out.** Its "ui" came back silent (-70 LUFS), with and without `language_code`.
- **Pace.** v4 at its default speed is slower (13.8–15.2 letters/s) than v2 at speed 0.9 (15.7–18.7). Koen is the fastest voice.
- **Loudness varies by voice:** raw output ranges from -13 (Ruth) to -32 LUFS (Roos), so loudness normalisation is required.
- **v1 clips (Koen, v2, default settings):** 8/8 random sentences exact. Of the 5 suspects, "Pardon?" and "Wim: W, I, M." were exact; with auto-detect, "deur" came back as "There", "wel" as "Well" and "man, maan" as "Mom. Mom". The v1 clips are not reused: the new set has another voice, model and post-processing. They were moved out of `public/audio/`.

### Decision (27 October)

- **Main voice (a): Serge de Beer, `UNBIyLbtFB9k7FKW8wJv`.** Among the 1×-cost voices he has the strongest v4 results: 3/4 short words, the g/sch sentence exact, and "eu"/"ui" kept apart. His use case is instructional voice-over, and the 2-year notice period protects a course that will be extended.
- **Dialogue voice (b): Roos, `7qdUFMklKPaaAVMsBTBt`.** She is female for contrast and has a 2-year notice period. Voice b only reads the second speaker's sentences, where Roos is exact. Her isolated-word score (2/4) does not matter there. Melanie scored better on isolated words but has only a 30-day notice period.
- **Ruth is out.** She bills 2× per character, and her 4/4 short-word score with context does not justify doubling a course that already exceeds a Starter month.
- **Model: `eleven_v4`, `language_code: "nl"`, `voice_settings: { stability: 0.5, similarity_boost: 0.75 }`.** It costs the same as v2. It enforces Dutch on short items and matches or beats v2 on the short words. It speaks at a learner-friendly pace without a speed control (v4 has none, and no Style or SSML either).
- **Output:** source `mp3_44100_128`, kept as the master, then ffmpeg:
  - trim silence to 50 ms before and 150 ms after;
  - two-pass `loudnorm` to -18 LUFS, -1.5 dBTP;
  - encode mono Opus at 32 kbps and 48 kHz in Ogg (about 4 KB per second), bitexact, so the same master always makes the same file. Measured on 150 clips, Opus holds the same speech in 57% of the space of the first run's MP3; MP3 at 32 kbps saves as much but smears the s, sch and g. The first run's clips were mono MP3 at 64 kbps and 44.1 kHz (about 8 KB per second).
- **Slow replay:** `playbackRate` (`SLOW_RATE` 0.7 in `src/audio/speech.ts`, pitch preserved). There are no separate slow clips, since v4 has no speed setting and they would double the cost.

### Quota and the first run

- **Quota.** The Starter plan allows 90,000 credits a month; that figure comes from the quota error, because the key could not read `/v1/user/subscription`. Speech-to-text cost about 0.6 credits per second of audio, with a minimum of 1 per request.
- **First run (27 October).** It billed 30,309 characters, retakes included, and stopped cleanly on `quota_exceeded`; the research before it cost about 5,000. The course then had 3,115 clips (94,398 characters), and the run made 1,270 of them: every target phrase, learning item and listening exercise, and 39 context lines (1,256 for voice a, 14 for voice b). Its takes were not kept, only their MP3s (64 kbps, 44.1 kHz).
- **What was left (29 October).** The course had grown to 5,366 clips and 151,933 characters. Finishing it would have taken 4,101 more clips and about 125,000 credits, two months of the plan. That cost, beside the voice test's results, led to the switch.

### Limitations of that research

- **Limited voice search:** without Voices read, only the top 3 library voices per sort could be compared.
- **`eleven_v4` was new (September 2026):** clips made in later months might have differed slightly in delivery.

## Limitations

- **STT measures intelligibility, not accent.** It cannot tell nl-NL from nl-BE, and it mishears isolated sounds and one-syllable words (isolated "man" and "maan" for every voice), so the QA list is a listening list. Google's recogniser may also hear Google's own voices more easily. The Netherlands accent rests on Google's labels (both voices are nl-NL), not on a native listener. A Dutch speaker should spot-check about 20 clips per voice: the hard g/sch, ui/eu/ij, w, v/z devoicing and r.
- **Google's takes cannot be made again.** The same text gives a slightly different take each time, so `audio-masters/` holds the only copy of the checked takes. A lost master is voiced again, as a new take, only when its clip has to be remade, and is then checked like any new take.
- **Chirp 3: HD may change.** Google can update its voices, so clips made in later months may differ slightly in delivery.
