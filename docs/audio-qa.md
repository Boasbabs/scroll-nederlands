# Audio QA

Speech-to-text check of the clips made by `pnpm audio:generate` (Google Speech-to-Text v1, Dutch (nl-NL) forced, last run 2026-10-29). Checked: every text of up to 3 words and a fixed 10% sample of longer ones. A clip is flagged when a short text does not round-trip exactly (after lower-casing, removing punctuation and accents, spelling out numbers and clock times, and treating "ij" and "ei" as the same sound), when a longer text has a word error rate above 0.2, or when its length does not fit its text. A flagged clip is regenerated once (Google's takes differ each time) and checked again. STT cannot judge accent, and it often mishears isolated sounds and one-syllable words (isolated "man" and "maan" for every voice), so the list below is a listening list, not a list of errors.

- Clips checked: 2464 (2160 short, 304 longer)
- Flagged on the first take and regenerated: 203
- Still flagged after the retake (need a human listen): 118
- Clips in the manifest: 4988 for voice a and 378 for voice b, of 5366 course texts
- Course texts with no clip (the browser's voice reads them): 0

## Still flagged

| Text | Voice | Group | Transcript | WER | File |
|---|---|---|---|---|---|
| Ik ben Brits. | a | target | Ik ben Britt | 0.33 | `audio/6b2a4e36632375b7.ogg` |
| Griekse ij | a | items | Griekse y | 0.50 | `audio/a3552a6c47b86ac0.ogg` |
| al | a | items | ou | 1.00 | `audio/da93f1b9307d6447.ogg` |
| u | a | items |  | 1.00 | `audio/1ea51127a169f562.ogg` |
| Zeg maar je. | a | items | zeg maar ja | 0.33 | `audio/76bc4f71f91c37c7.ogg` |
| hij | a | items |  | 1.00 | `audio/6c665dd6a6447a4c.ogg` |
| zij | a | items |  | 1.00 | `audio/b3552857d2f0c31d.ogg` |
| juli | a | items | jullie | 1.00 | `audio/0e661cfcc7b5ef06.ogg` |
| tien over drie | a | items | 3:10 | 1.00 | `audio/708d23b0a503b383.ogg` |
| uw | a | items | iew | 1.00 | `audio/015bc8c4082db094.ogg` |
| hun | a | items |  | 1.00 | `audio/1ec6cd5e2a820401.ogg` |
| een | a | items | en | 1.00 | `audio/c1405cd3305a6207.ogg` |
| 's nachts | a | items | nacht | 1.00 | `audio/8d1427cf976a935d.ogg` |
| ik douche | a | items | ik douchen | 0.50 | `audio/b80cedbc068aff21.ogg` |
| Past dinsdag? | a | items | pas dinsdag | 0.50 | `audio/7a28e98e6f66992c.ogg` |
| 't kofschip | a | items | deze Kofschip | 0.50 | `audio/ce25f3f61e186b1f.ogg` |
| de buren | a | items | de burr | 0.50 | `audio/586fa4265e4306aa.ogg` |
| als | a | items |  | 1.00 | `audio/d238319762de5cb3.ogg` |
| de hal | a | items | de | 0.50 | `audio/0c30fdf0ce91142c.ogg` |
| een lekke band | a | items | een lekker bent | 0.67 | `audio/c63430cebef9d709.ogg` |
| de zorgpas | a | items | te zorgpas | 0.50 | `audio/97caa5c536d0e4e5.ogg` |
| Is er een tolk? | a | items | is er een tal | 0.25 | `audio/655a4953b17702ed.ogg` |
| in behandeling | a | items | een behandeling | 0.50 | `audio/c9d2daa507c629f7.ogg` |
| de griep | a | items | de gr | 0.50 | `audio/71427672d4248cc3.ogg` |
| een vast contract | a | items | ben vast contract | 0.33 | `audio/7d71a5f101b4d90c.ogg` |
| Zonder ui, graag. | a | items | zonder uit graag | 0.33 | `audio/f4c8e19667d22ba4.ogg` |
| toetsen | a | items | toet | 1.00 | `audio/4212fa11bbf2406a.ogg` |
| laten repareren | a | items | late repareren | 0.50 | `audio/3a82d6728c98d25b.ogg` |
| Oud en Nieuw | a | items | oud en | 0.33 | `audio/9263d17ce771ef2b.ogg` |
| de room | a | items | de roem | 0.50 | `audio/4027502037cf2a44.ogg` |
| slap | a | items | slaap | 1.00 | `audio/7ec9c2774f25a8f8.ogg` |
| proper | a | items | propper | 1.00 | `audio/d075a02d82e4f421.ogg` |
| de jongen | a | words | de Jonge | 0.50 | `audio/948e55a54bee94c1.ogg` |
| de oom | a | words | de o | 0.50 | `audio/838f4521336a0732.ogg` |
| jong | a | words |  | 1.00 | `audio/3da7759d3b35bb60.ogg` |
| moe | a | words |  | 1.00 | `audio/ced989de277b2715.ogg` |
| vol | a | words |  | 1.00 | `audio/2c575d135962a7b1.ogg` |
| nat | a | words |  | 1.00 | `audio/50865f10023ace40.ogg` |
| dik | a | words |  | 1.00 | `audio/92236246d05a5fa3.ogg` |
| dun | a | words | dan | 1.00 | `audio/2d9b955fc7022639.ogg` |
| de jam | a | words | The Jam | 0.50 | `audio/d648270a28afcf50.ogg` |
| de worst | a | words | the Worst | 0.50 | `audio/0a440fd1706b3fd5.ogg` |
| de saus | a | words | The South | 1.00 | `audio/485fdeee2ba4569f.ogg` |
| het been | a | words | het be | 0.50 | `audio/6adadb1e2992747b.ogg` |
| de tand | a | words | de tandt | 0.50 | `audio/d843dc65b5e50d81.ogg` |
| de knie | a | words | de kn | 0.50 | `audio/b343878c04d1d42a.ogg` |
| de duim | a | words | de du | 0.50 | `audio/751200313b726747.ogg` |
| de thee | a | words | de t | 0.50 | `audio/f3a76e17e6e1404b.ogg` |
| de sok | a | words | Het is sok | 1.00 | `audio/8f52f13e92b41c44.ogg` |
| de koe | a | words | de | 0.50 | `audio/b3447f683238e451.ogg` |
| de rat | a | words | de r | 0.50 | `audio/5aa26795255411e0.ogg` |
| de groente | a | words | de groenten | 0.50 | `audio/ae270b056a1bdf3e.ogg` |
| de ui | a | words | de ei | 0.50 | `audio/be2f6fb31c8de462.ogg` |
| de boon | a | words | de boom | 0.50 | `audio/ca678f13672053ad.ogg` |
| ver | a | words |  | 1.00 | `audio/92454fd2ec30243f.ogg` |
| de kam | a | words | de Kamp | 0.50 | `audio/56a34b6f5c277fa1.ogg` |
| de cent | a | words | The scent | 1.00 | `audio/84863f96342b0869.ogg` |
| de dans | a | words | de | 0.50 | `audio/5514e62785756a88.ogg` |
| de reden | a | words | de re | 0.50 | `audio/642e2ae834f113e4.ogg` |
| het voordeel | a | words | het voor | 0.50 | `audio/fa9dc0c73266d1b7.ogg` |
| smal | a | words | small | 1.00 | `audio/05a50cae4c4d7d81.ogg` |
| vriendelijk | a | words | vriendelijke | 1.00 | `audio/2c00f7654ad9b19c.ogg` |
| lui | a | words | Louis | 1.00 | `audio/f3a213f8ce27d476.ogg` |
| zodra | a | words | zod | 1.00 | `audio/6986c1931670f3fd.ogg` |
| sinds | a | words | Sind | 1.00 | `audio/70f049f8f825f492.ogg` |
| pas | a | words |  | 1.00 | `audio/60170ffb6a45062a.ogg` |
| slechts | a | words | slecht | 1.00 | `audio/c42d04823cab9972.ogg` |
| elk | a | words |  | 1.00 | `audio/90626a3145f25804.ogg` |
| gestrest | a | words | gestresst | 1.00 | `audio/d623f93ab4f7a012.ogg` |
| het heimwee | a | words | het hè We | 1.00 | `audio/bd8ba77a820cad1a.ogg` |
| maan | a | pairs |  | 1.00 | `audio/2c9042f6427d0747.ogg` |
| tak | a | pairs | taak | 1.00 | `audio/ec0185b467e4e9ff.ogg` |
| lat | a | pairs |  | 1.00 | `audio/f3ef970b93a44c5c.ogg` |
| peen | a | pairs | Pain | 1.00 | `audio/a79ff0ec617b804e.ogg` |
| been | a | pairs | ben | 1.00 | `audio/0c642832e2486edd.ogg` |
| hel | a | pairs | Hell | 1.00 | `audio/7fe56e88ef27891a.ogg` |
| heel | a | pairs |  | 1.00 | `audio/69b6e1bd33840272.ogg` |
| vel | a | pairs | fel | 1.00 | `audio/355955ad20e06910.ogg` |
| pot | a | pairs |  | 1.00 | `audio/a6b9e6a31057d9a7.ogg` |
| poot | a | pairs | boot | 1.00 | `audio/426eca4ef34b65fe.ogg` |
| zon | a | pairs | zijn | 1.00 | `audio/74f80970dfd30aba.ogg` |
| zoon | a | pairs |  | 1.00 | `audio/cfc36e206cbafc46.ogg` |
| hok | a | pairs |  | 1.00 | `audio/95353655d16d451e.ogg` |
| hoek | a | pairs | Hoe | 1.00 | `audio/f333b9de116a85d5.ogg` |
| moes | a | pairs | mousse | 1.00 | `audio/f573f1a79e265e92.ogg` |
| liep | a | pairs | Leap | 1.00 | `audio/4480025693462c26.ogg` |
| ziet | a | pairs | je ziet | 1.00 | `audio/6d6383dadf603948.ogg` |
| moer | a | pairs |  | 1.00 | `audio/eb0af15041feb5ce.ogg` |
| buurt | a | pairs | Weert | 1.00 | `audio/ee45bf683fc7ba4b.ogg` |
| zeil | a | pairs | ze | 1.00 | `audio/e69dd128f304ade4.ogg` |
| leid | a | pairs | leidt | 1.00 | `audio/49edd62f2e12380a.ogg` |
| puin | a | pairs |  | 1.00 | `audio/f2f880baa7b55808.ogg` |
| buit | a | pairs | buiten | 1.00 | `audio/465e1471c309a3e3.ogg` |
| houd | a | pairs | hout | 1.00 | `audio/2531b8ef8ef3c91d.ogg` |
| lijf | a | pairs | live | 1.00 | `audio/6aad7125a7e69230.ogg` |
| dij | a | pairs |  | 1.00 | `audio/fcdc730018f63ea0.ogg` |
| biet | a | pairs | be | 1.00 | `audio/3c9af1d9f55c6f90.ogg` |
| hoed | a | pairs | goed | 1.00 | `audio/1f084720a5d62c22.ogg` |
| haan | a | pairs | ha | 1.00 | `audio/119be36cf47f9459.ogg` |
| vet | a | pairs |  | 1.00 | `audio/3bbadfb205b49934.ogg` |
| wal | a | pairs | wel | 1.00 | `audio/5b2667f02cf16d14.ogg` |
| U kunt morgenochtend om tien over half negen komen. | a | audio | U kunt morgenochtend om 8:40 komen | 0.44 | `audio/f73dd4d88dcaefea.ogg` |
| O, geen probleem! | a | context | ook geen probleem | 0.33 | `audio/85fc493a4837fc29.ogg` |
| Goedemiddag, met Jansen. | a | context | Goedemiddag met Janssen | 0.33 | `audio/a15f59fbe5c2813d.ogg` |
| O, jammer! Waarom? | a | context | Oh jammer waarom | 0.33 | `audio/e098ad0a3489ee44.ogg` |
| O? Waarom? | a | context | waarom | 0.50 | `audio/5ba24155435f70a4.ogg` |
| O, leuk! Werkt hij nog goed? | b | context | Oh leuk werkt ie nog goed | 0.33 | `audio/04e150ee8159bec8.ogg` |
| Priya. | b | dialogue |  | 1.00 | `audio/7fdd9bd2f5367306.ogg` |
| Sharma. S-H-A-R-M-A. | b | dialogue | shoarma s h a r m a | 0.14 | `audio/927c07a5f1df2f27.ogg` |
| Past donderdag? | a | dialogue | pas donderdag | 0.50 | `audio/96577a8c6b793a4e.ogg` |
| Jones. J-O-N-E-S. | b | dialogue | Jones j o n e s | 0.00 | `audio/f3c24c4433650f60.ogg` |
| Twaalf maart negentienhonderdnegentig. | b | dialogue | 12 maart 1990 | 0.33 | `audio/9ebfadaf23e3b688.ogg` |
| Zesendertig euro. | a | dialogue | 36 | 0.50 | `audio/69f20eba08981c1c.ogg` |
| man, maan | a | examples | maan ma | 1.00 | `audio/63967e65457d59b3.ogg` |
| vel, veel | a | examples | veel veel | 0.50 | `audio/41ad7f6d36a9a302.ogg` |
| Zij drinken thee. | a | examples | zij drinken The | 0.33 | `audio/9c449287b9b3e619.ogg` |
| Geachte heer/mevrouw, | a | answers | Geachte heer slash mevrouw | 0.33 | `audio/4b08a25d2a0447cd.ogg` |
| Gewenste functie: kok | a | answers | gewenste functie Co | 0.33 | `audio/9867b4125cea8839.ogg` |

## Fixed by the retake

- "laat" (a, items)
- "veel" (a, items)
- "wij" (a, items)
- "om" (a, items)
- "Ik leer Nederlands." (a, items)
- "zijn" (a, items)
- "Werkt u hier?" (a, items)
- "pinnen" (a, items)
- "Smaakt het?" (a, items)
- "kosten" (a, items)
- "geen" (a, items)
- "'s middags" (a, items)
- "vaak" (a, items)
- "de kok" (a, items)
- "rechts" (a, items)
- "rustig" (a, items)
- "en" (a, items)
- "een biertje" (a, items)
- "met wie" (a, items)
- "de bon" (a, items)
- "tot slot" (a, items)
- "toets 1" (a, items)
- "eerlijk" (a, items)
- "een soort" (a, items)
- "de termijn" (a, items)
- "kaal" (a, items)
- "de sollicitatiebrief" (a, items)
- "instappen" (a, items)
- "de file" (a, items)
- "te gebruiken tot" (a, items)
- "de zelfscankassa" (a, items)
- "de elektricien" (a, items)
- "de groep" (a, items)
- "de nieuwsbrief" (a, items)
- "eng" (a, items)
- "mogen" (a, words)
- "kennen" (a, words)
- "lezen" (a, words)
- "zetten" (a, words)
- "de gast" (a, words)
- "vies" (a, words)
- "heet" (a, words)
- "sterk" (a, words)
- "de rug" (a, words)
- "de nek" (a, words)
- "de school" (a, words)
- "de knoop" (a, words)
- "de meeuw" (a, words)
- "de mug" (a, words)
- "de aap" (a, words)
- "het gras" (a, words)
- "de heuvel" (a, words)
- "de steen" (a, words)
- "de citroen" (a, words)
- "de erwt" (a, words)
- "wit" (a, words)
- "de stof" (a, words)
- "de film" (a, words)
- "lijken" (a, words)
- "weigeren" (a, words)
- "openen" (a, words)
- "meten" (a, words)
- "verdwijnen" (a, words)
- "de droom" (a, words)
- "de rust" (a, words)
- "diep" (a, words)
- "laatst" (a, words)
- "beleefd" (a, words)
- "tijdens" (a, words)
- "bezorgd" (a, words)
- "kwaad" (a, words)
- "de vrachtwagenchauffeur" (a, words)
- "ben" (a, pairs)
- "kop" (a, pairs)
- "bok" (a, pairs)
- "riet" (a, pairs)
- "buur" (a, pairs)
- "beurt" (a, pairs)
- "zuil" (a, pairs)
- "bout" (a, pairs)
- "die" (a, pairs)
- "held" (a, pairs)
- "wel" (a, audio)
- "Hoi Noor!" (b, context)
- "Ravi Patel." (b, dialogue)

## No clip

None: every course text has a clip.
