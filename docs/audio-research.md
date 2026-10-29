# Dutch audio: ElevenLabs voice, model and settings

Research for TaalNudge's pre-generated Dutch clips (A0 to A2, standard Netherlands Dutch, nl-NL). Date: 27 October 2026.

**Status: decided; generation 24% done (1,265 of 5,366 clips; stopped by the monthly quota, and the course has grown since).** Main voice: Serge de Beer. Dialogue voice: Roos. Model: `eleven_v4` with `language_code: "nl"`. The choice rests on a measured speech-to-text (STT) round trip, measured cost, and library metadata. `scripts/generate-audio.ts` produces the clips; `docs/audio-qa.md` lists the clips it flags.

## Method

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

## Results

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

## Decision

- **Main voice (a): Serge de Beer, `UNBIyLbtFB9k7FKW8wJv`.** Among the 1×-cost voices he has the strongest v4 results: 3/4 short words, the g/sch sentence exact, and "eu"/"ui" kept apart. His use case is instructional voice-over, and the 2-year notice period protects a course that will be extended.
- **Dialogue voice (b): Roos, `7qdUFMklKPaaAVMsBTBt`.** She is female for contrast and has a 2-year notice period. Voice b only reads the second speaker's sentences, where Roos is exact. Her isolated-word score (2/4) does not matter there. Melanie scored better on isolated words but has only a 30-day notice period.
- **Ruth is out.** She bills 2× per character, and her 4/4 short-word score with context does not justify doubling a course that already exceeds a Starter month.
- **Model: `eleven_v4`, `language_code: "nl"`, `voice_settings: { stability: 0.5, similarity_boost: 0.75 }`.** It costs the same as v2. It enforces Dutch on short items and matches or beats v2 on the short words. It speaks at a learner-friendly pace without a speed control (v4 has none, and no Style or SSML either).
- **Output:** source `mp3_44100_128`, kept as the master, then ffmpeg:
  - trim silence to 50 ms before and 150 ms after;
  - two-pass `loudnorm` to -18 LUFS, -1.5 dBTP;
  - encode mono Opus at 32 kbps and 48 kHz in Ogg (about 4 KB per second), bitexact, so the same master always makes the same file. Measured on 150 clips, Opus holds the same speech in 57% of the space of the first run's MP3; MP3 at 32 kbps saves as much but smears the s, sch and g. The first run's clips are mono MP3 at 64 kbps and 44.1 kHz (about 8 KB per second); they stay until a master can remake them.
- **Slow replay:** `playbackRate` (`SLOW_RATE` 0.7 in `src/audio/speech.ts`, pitch preserved). There are no separate slow clips, since v4 has no speed setting and they would double the cost.

## Generation pipeline (`scripts/generate-audio.ts`)

1. **Texts.** The script builds the course from `structure.ts` and `content/**`, in this priority order: lesson `targetPhrase`, `items`, exercise `audioText`, exercise `context`, lesson `dialogue`, `examples`, then model answers. Model answers are the cloze sentence with `answers[0]` filled in, the `order` words joined, the `type` `answers[0]`, the `write` `modelAnswer`, and the Dutch side of `match` pairs. A text used in several places belongs to its first group. In a conversation, the second speaker reads with voice b (`clipsB`); further speakers alternate.
2. **Masters, cache keys and file names.** Every take the API returns is kept as a master, `audio-masters/<16 hex>.mp3` (gitignored; `AUDIO_MASTERS_DIR` moves it), keyed by `sha1(text, voice, model, settings)`. A clip's key adds the post-processing version: `audio/<16 hex>.ogg` for version 2, `.mp3` for version 1 (the first run). A clip missing from `public/` is made from its master when there is one; failing that, a version-1 clip of the same take is kept; only a text with neither calls the API. A text keeps the clip it has until the run makes its own. The manifest `src/audio/clips.json` holds `{ voices, model, settings, clips, clipsB }`, keyed by `clipKey(text)`. It is rebuilt from the current course on every run, so stale entries drop out, and it is saved after every clip.
3. **Requests.**
   - Three in parallel, with a `seed` derived from the key.
   - 429 and 5xx: retried with `retry-after` or exponential backoff and jitter.
   - 401, 402, 403, quota and permission errors: stop the run cleanly. Running the same command again resumes.
   - `--plan` counts texts and characters without calling the API; `--encode` makes clips from the masters only, also without the API; `--until <group>` and `--max-chars N` cap a run; `--prune` deletes unused files.
4. **Verification, group by group.** Scribe v2 (Dutch forced) checks every text of up to 3 words plus a fixed 10% sample of longer ones. A clip is flagged when a short text is not exact, when a longer one has WER > 0.2, or when its length does not fit the text. A flagged clip is regenerated once with another seed and checked again. Clips still flagged go to `docs/audio-qa.md` as a listening list.

## Quota and generation status

- **Quota.** The plan allows 90,000 credits a month; that figure comes from the quota error, because the key cannot read `/v1/user/subscription`. STT costs about 0.6 credits per second of audio, with a minimum of 1 per request.
- **First run (27 October)** billed 30,309 characters, retakes included, then stopped cleanly on `quota_exceeded` (0 credits left). The research before it cost about 5k. The course then had 3,115 clips (94,398 characters), and the run made 1,270 of them: every target phrase, learning item and listening exercise, and 39 context lines. The manifest holds 1,256 clips for voice a and 14 for voice b.
- **The course has grown since (29 October).** The word track (with a sentence for each tier-2 word), the minimal pairs and the scenario packs now have texts too: 5,366 clips (4,988 voice a, 378 voice b), 151,933 characters. A few lines that already had a clip were corrected in the Dutch reviews and need a new one. `pnpm audio:generate --plan` counts what is left:

  | Group | Clips done | Of | Characters left |
  |---|---|---|---|
  | target | 271 | 328 | 1,579 |
  | items | 764 | 1,116 | 4,989 |
  | words | 1 | 1,219 | 23,004 |
  | pairs | 3 | 81 | 289 |
  | audio | 188 | 216 | 3,518 |
  | context | 38 | 344 | 10,952 |
  | dialogue | 0 | 538 | 21,677 |
  | examples | 0 | 833 | 28,126 |
  | answers | 0 | 691 | 28,032 |

- **To finish:** 4,101 clips and 122,166 characters, plus about 2k for STT checks and 1k for retakes: about 125,000 credits, so two months. The groups run in the order above, so the first month's 90,000 credits should run out about three-quarters of the way through `examples`, leaving about 35,000 for the next month: the rest of the examples and all the model answers. That assumes nothing else uses the month's credits. After each reset, run `pnpm audio:generate`; it resumes and skips existing clips. Until a text has a clip, the browser's nl-NL voice reads it.
- **Size and masters (29 October).** New clips are Opus, so the remaining 4,101 take about 43 MB and the course's audio comes to about 61 MB in the extension, against about 94 MB as MP3. Every take is kept as a master in `audio-masters/` (about 150 MB for the remaining clips), with the speech-to-text results in `checks.json` beside it, so a new encoding is one `pnpm audio:generate --encode` at no cost. Back that folder up: it holds what the clips cost. The first run's 1,270 takes were not kept, so their MP3s stay as they are.
- **v1 clips:** the 463 v1 files were moved out of `public/audio/`, to the session scratchpad next to the v1 manifest.

## Google Chirp 3: HD test (set up 29 October)

Google's Chirp 3: HD voices cost about $30 per million characters, with the first million each month free, so the whole course (152,000 characters) would cost nothing to voice. They include nl-NL voices, a pace setting (0.25 to 2.0) and custom IPA pronunciations, none of which `eleven_v4` has. Before any switch, `pnpm voice:test` hears them on the course's own texts:

- **Texts.** 25: 13 short words, where the ElevenLabs voices differed (ui, eu, ij, the soft g, sch, a minimal pair); sentences with a time, a number and spelling; four dialogue lines for voice b. 20 of them have an ElevenLabs clip to compare with.
- **Voices.** Charon and Iapetus (male) for the main voice and Erinome (female) for the dialogues, at pace 1 and 0.9. `--voices` and `--rates` change them; `--list` shows all of them.
- **Check.** Every clip, Google's and the course's, goes through the ffmpeg chain, then Google Speech-to-Text (v1, Dutch forced). Google's recogniser may hear Google's voices more easily, so the table of shared texts compares like with like, but a Dutch listener decides.
- **Setup.** A Google Cloud project with billing linked, the Cloud Text-to-Speech and Cloud Speech-to-Text APIs enabled, and an API key restricted to those two, in `.env.local` as `GOOGLE_CLOUD_API_KEY`. `GOOGLE_TTS_ENDPOINT=https://eu-texttospeech.googleapis.com` keeps the calls in the EU, if the voices are offered there: check with `--list`.
- **Output.** `voice-test/` (gitignored): Google's takes, the clips, `results.json`, `report.md`, and `index.html`, a page to listen across each text. A default run sends 2,274 characters; a second run reuses takes and transcripts.
- **Not decided yet.** If Google wins, every clip is remade with it (one voice per part, never two providers for the same part), and `scripts/generate-audio.ts` gets Google as its provider. Until then, the ElevenLabs run on 1 November goes ahead as planned.

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

If the course moves to Google, the candidates are Algieba for the main voice and Erinome for the dialogues. The screen cost about 2,400 characters and 610 Speech-to-Text calls, the full test of the three 1,137 characters.

## Limitations

- **STT measures intelligibility, not accent.** It cannot tell nl-NL from nl-BE, and it mishears isolated sounds and one-syllable words, so the QA list is a listening list. The Netherlands accent rests on library metadata (all 6 voices are labelled nl-NL, standard), not on a native listener. A Dutch speaker should spot-check about 20 clips per voice: the hard g/sch, ui/eu/ij, w, v/z devoicing and r.
- **Limited voice search:** without Voices read, only the top 3 library voices per sort could be compared.
- **`eleven_v4` is new (September 2026):** clips made in later months may differ slightly in delivery.
