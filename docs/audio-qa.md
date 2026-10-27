# Audio QA

Speech-to-text check of the clips made by `pnpm audio:generate` (Scribe v2, Dutch forced, last run 2026-10-27). Checked: every text of up to 3 words and a fixed 10% sample of longer ones. A clip is flagged when a short text does not round-trip exactly (after lower-casing, removing punctuation and accents, spelling out numbers and clock times, and treating "ij" and "ei" as the same sound), when a longer text has a word error rate above 0.2, or when its length does not fit its text. A flagged clip is regenerated once with another seed and checked again. STT cannot judge accent, and it often mishears isolated sounds and one-syllable words, so the list below is a listening list, not a list of errors.

- Clips checked: 761 (703 short, 58 longer)
- Flagged on the first take and regenerated: 66
- Still flagged after the retake (need a human listen): 42
- Clips in the manifest: 1256 for voice a and 14 for voice b, of 3115 course texts

## Still flagged

| Text | Voice | Group | Transcript | WER | File |
|---|---|---|---|---|---|
| al | a | items | Oh | 1.00 | `audio/dafbc2540774fffb.mp3` |
| veel | a | items | Vil | 1.00 | `audio/29e9b627b6c4cbef.mp3` |
| oud | a | items | Out | 1.00 | `audio/26cf2f919f89f8ce.mp3` |
| hij | a | items | Hey | 1.00 | `audio/58a442439be33521.mp3` |
| jij | a | items | Yay! | 1.00 | `audio/f51dec8d4026d60a.mp3` |
| wie | a | items | V | 1.00 | `audio/3faf20175727ac0a.mp3` |
| hoe | a | items | Who? | 1.00 | `audio/57ca1ca7d966b661.mp3` |
| één | a | items | Eng | 1.00 | `audio/23f3d1af5460b960.mp3` |
| uw | a | items | Oeh. | 1.00 | `audio/ff82b14a57a0fd78.mp3` |
| nul zes | a | items | Nils S. | 1.00 | `audio/cd728be200ac1245.mp3` |
| mijn man | a | items | Mijn mam | 0.50 | `audio/63368ce52ca5268f.mp3` |
| Spaans | a | items | Spans | 1.00 | `audio/62a1d05588f86f5c.mp3` |
| vloeiend | a | items | Fluënt | 1.00 | `audio/d7e5430f7a38dac3.mp3` |
| gaan | a | items | Ham | 1.00 | `audio/e59115f02b7de745.mp3` |
| staan | a | items | Stam | 1.00 | `audio/ac7e79592828d11e.mp3` |
| een | a | items | En | 1.00 | `audio/a93f8afcf25bd7c2.mp3` |
| ook | a | items | Oak | 1.00 | `audio/b34d95f3fb1d4961.mp3` |
| voor | a | items | 4 | 1.00 | `audio/14ac8abc5194d2b8.mp3` |
| pinnen | a | items | Binnen | 1.00 | `audio/b4cafd6961ea9b99.mp3` |
| dan | a | items | Dom | 1.00 | `audio/9dbeabeb3b2905d4.mp3` |
| vaak | a | items | Vac | 1.00 | `audio/ce2251d9e44b0157.mp3` |
| soms | a | items | Songs | 1.00 | `audio/b73b2cb3a736a6f4.mp3` |
| Nee hoor. | a | items | Mayor | 1.00 | `audio/fc498517848115c6.mp3` |
| klein | a | items | Kleng | 1.00 | `audio/cef8e65f1b9ae515.mp3` |
| lang | a | items | Lung | 1.00 | `audio/6150a4b54a59212e.mp3` |
| zonnig | a | items | Zomerg | 1.00 | `audio/eb499cb1376f6bf3.mp3` |
| ik sport | a | items | Export | 1.00 | `audio/ff45e16e674a04a6.mp3` |
| komen | a | items | Kom maar | 2.00 | `audio/88a672a1cbc59ab9.mp3` |
| Liefs | a | items | Leafs | 1.00 | `audio/29cc40c00b0be0df.mp3` |
| te laat | a | items | De lat | 1.00 | `audio/c865069a0782b12b.mp3` |
| duwen | a | items | Doe | 1.00 | `audio/c2e6bbb87af7ba89.mp3` |
| de baan | a | items | De BAM | 0.50 | `audio/0f95b20504d1c299.mp3` |
| de bon | a | items | De boom | 0.50 | `audio/a812611620eeb3ba.mp3` |
| saai | a | items | Sigh | 1.00 | `audio/9a9c44f462cdcc19.mp3` |
| groter | a | items | Grooter | 1.00 | `audio/12e9aa561ba106c6.mp3` |
| de hal | a | items | The Hull | 1.00 | `audio/c3e3fe9d2d6709be.mp3` |
| de balie | a | items | De Bali | 0.50 | `audio/8122e0ac3ec3a7c0.mp3` |
| lekken | a | items | Lekker | 1.00 | `audio/7cffcc4cbee09162.mp3` |
| maan | a | audio | Man | 1.00 | `audio/20cef8394f22fb4a.mp3` |
| tuin | a | audio | Turn | 1.00 | `audio/f19a9aa3751f76be.mp3` |
| geel | a | audio | Heel | 1.00 | `audio/42a4cbbacfee6f1d.mp3` |
| zoon | a | audio | Zone | 1.00 | `audio/4440fc66f45f1e4e.mp3` |

## Fixed by the retake

- "vier" (a, items)
- "wij" (a, items)
- "kun je" (a, items)
- "hun" (a, items)
- "Duits" (a, items)
- "de taal" (a, items)
- "hier" (a, items)
- "de kok" (a, items)
- "Is het ver?" (a, items)
- "Succes!" (a, items)
- "opengaan" (a, items)
- "morgen vroeg" (a, items)
- "gekookt" (a, items)
- "'t kofschip" (a, items)
- "vrijnemen" (a, items)
- "rijdt niet" (a, items)
- "graden" (a, items)
- "dichter bij" (a, items)
- "het centrum" (a, items)
- "weleens" (a, items)
- "de bestelling" (a, items)
- "te ver" (a, items)
- "aanbellen" (a, items)
- "kaas" (a, audio)
