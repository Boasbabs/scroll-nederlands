# TaalNudge curriculum plan (A0 → A2)

This is the lesson-by-lesson plan for the bundled curriculum. Every lesson below
is authored in `src/curriculum/content/<stage>/<module-id>.ts`. Lesson ids are
fixed here so lessons in different modules can reference each other
(`revisits`, `prerequisites`, checkpoint `testsLesson`).

Kinds: **C** = core (one new phrase/pattern), **P** = practice (recombines
earlier lessons in a new situation), **K** = checkpoint (cumulative, scored,
focused practice only).

## Assumptions

- Target variety: standard Netherlands Dutch (nl-NL). Vocabulary and customs
  are those of the Netherlands (pinnen, OV-chipkaart, huisarts, gemeente).
- The learner is an English-speaking adult living in the Netherlands, so
  situations are adult, practical and local (work, landlord, GP, train).
- CEFR labels describe intended outcomes. Stage boundaries (pre-A1, A1,
  A1→A2, A2) are our own grouping, informed by CEFR descriptors, the NT2
  TaalMenu A1 topics and the Naar Nederland exam topics. No textbook material
  is copied; all sentences and exercises are original.
- `je` (informal) is the default in examples; `u` is taught early and used in
  service situations (shops, GP, gemeente, formal email).
- Grammar is introduced only when a situation needs it, then recycled.

## Stage 0 · Foundations (pre-A1)

### s0-sounds — Sounds and spelling
- C `s0-sounds-alphabet` — letter names, spelling a name ("Hoe schrijf je dat?"); a, e, g, h, j, ij, v, w, y.
- C `s0-sounds-long-short` — short vs long vowels and the spelling rule (man/maan, bot/boot, vel/veel).
- C `s0-sounds-oe-ie-eu` — oe (goed), ie (lief), eu (leuk).
- C `s0-sounds-ui-ij-ou` — ui (huis), ij/ei (fijn/klein — same sound), ou/au (oud/blauw — same sound).
- C `s0-sounds-g-ch` — g/ch throat sound, sch (Scheveningen, school); goedemorgen, acht, gracht.
- C `s0-sounds-r-w-v-j` — r, w (softer than English w), v (close to f), j (= English y).
- P `s0-sounds-practice` — hear a word, choose its spelling; minimal pairs; spell a street name.

### s0-greet — Greetings and politeness
- C `s0-greet-hello` — Hallo / Hoi / Goedemorgen / Goedemiddag / Goedenavond.
- C `s0-greet-goodbye` — Doei / Dag / Tot ziens / Tot morgen / Fijne dag!
- C `s0-greet-thanks` — Dank je wel / Dank u wel / Bedankt / Graag gedaan.
- C `s0-greet-please` — Alsjeblieft / Alstublieft (asking and handing something over).
- C `s0-greet-how-are-you` — Hoe gaat het? Goed, dank je. En met jou?
- C `s0-greet-sorry` — Sorry / Pardon / Mag ik even langs?
- C `s0-greet-je-u` — je vs u: Hoe gaat het met u?
- C `s0-greet-yes-no` — Ja / Nee / Graag / Nee, dank je / Prima / Oké.
- P `s0-greet-practice` — greeting a neighbour and a shop assistant (dialogue).

### s0-intro — Introducing yourself
- C `s0-intro-ik-heet` — Ik heet … / Mijn naam is …
- C `s0-intro-hoe-heet-je` — Hoe heet je? / Hoe heet u? / Wat is je naam?
- C `s0-intro-ik-kom-uit` — Ik kom uit … / Waar kom je vandaan?
- C `s0-intro-ik-woon-in` — Ik woon in … / Waar woon je?
- C `s0-intro-languages` — Ik spreek Engels en een beetje Nederlands. / Spreek je Engels?
- C `s0-intro-nice-to-meet` — Leuk je te ontmoeten. / Aangenaam.
- P `s0-intro-practice` — a full self-introduction at a neighbourhood event.

### s0-pron — Pronouns, zijn and hebben
- C `s0-pron-singular` — ik, jij/je, u, hij, zij/ze, het.
- C `s0-pron-plural` — wij/we, jullie, zij/ze.
- C `s0-pron-zijn-singular` — ik ben, jij bent, u bent, hij/zij is (Ik ben moe. Ben je thuis?).
- C `s0-pron-zijn-plural` — wij zijn, jullie zijn, zij zijn.
- C `s0-pron-hebben` — ik heb, jij hebt, hij heeft, wij hebben (Ik heb een vraag. Heb je tijd?).
- C `s0-pron-hebben-expressions` — honger, dorst, tijd, haast: Ik heb honger.
- P `s0-pron-practice` — zijn or hebben? in short everyday sentences.

### s0-questions — Question words
- C `s0-questions-wat-wie-waar` — Wat is dat? Wie is dat? Waar is de wc?
- C `s0-questions-wanneer-hoe-waarom` — Wanneer? Hoe? Waarom?
- C `s0-questions-hoeveel-welke` — Hoeveel? Welke? Hoe laat?
- P `s0-questions-practice` — match questions to answers in a short chat.

### s0-numbers — Numbers, days and time
- C `s0-numbers-0-10`
- C `s0-numbers-11-20`
- C `s0-numbers-21-100` — eenentwintig: units before tens. Ik ben vijfendertig.
- C `s0-numbers-days` — maandag … zondag; vandaag, morgen, gisteren.
- C `s0-numbers-months-dates` — months, ordinals for dates: op drie mei; Mijn verjaardag is op …
- C `s0-numbers-time-hours` — Het is drie uur. Het is half vier (= 3:30).
- C `s0-numbers-time-quarters` — kwart over, kwart voor, tien over; Hoe laat is het?
- P `s0-numbers-practice` — phone numbers, house numbers, dates and times in context.

### s0-class — Clarification phrases
- C `s0-class-dont-understand` — Ik begrijp het niet. / Ik snap het niet.
- C `s0-class-repeat` — Kunt u dat herhalen? / Nog een keer, alstublieft.
- C `s0-class-slower` — Kunt u langzamer praten? / Ik leer Nederlands.
- C `s0-class-what-means` — Wat betekent …? / Hoe zeg je … in het Nederlands?
- P `s0-class-practice` — rescuing a conversation you don't follow.

### s0-check — Stage 0 checkpoint
- K `s0-check-sounds-greetings` — sounds, greetings, introductions.
- K `s0-check-foundations` — pronouns, zijn/hebben, questions, numbers, time, clarification.

## Stage 1 · Everyday A1

### s1-me — Family and personal details
- C `s1-me-family` — Dit is mijn vader/moeder/broer/zus.
- C `s1-me-relationships` — Ik ben getrouwd. Ik heb een vriend/vriendin. Ik heb twee kinderen.
- C `s1-me-age` — Hoe oud ben je? Ik ben … jaar.
- C `s1-me-possessives` — mijn, jouw/je, uw, zijn, haar, ons/onze, jullie, hun.
- C `s1-me-details` — adres, postcode, telefoonnummer, geboortedatum: Wat is je adres?
- P `s1-me-practice` — reading and filling in a simple form (voornaam, achternaam, woonplaats).

### s1-countries — Countries and languages
- C `s1-countries-nationality` — Ik ben Brits/Amerikaans/Nederlands/Indiaas …
- C `s1-countries-languages` — Welke talen spreek je? Ik spreek een beetje Nederlands.
- C `s1-countries-how-long` — Ik woon al twee jaar in Nederland. Hoe lang woon je hier al?
- P `s1-countries-practice` — small talk with a new colleague.

### s1-verbs — Present tense
- C `s1-verbs-regular` — ik werk, jij werkt, hij werkt, wij werken.
- C `s1-verbs-inversion-jij` — Werk jij? Woon je hier? (no -t after inverted jij/je).
- C `s1-verbs-spelling` — wonen → ik woon, maken → ik maak, zitten → ik zit.
- C `s1-verbs-irregular` — gaan, doen, staan, komen, zien: Wat doe je? Ik ga naar huis.
- P `s1-verbs-practice` — talking about what people do (mixed persons).

### s1-order — Word order and questions
- C `s1-order-verb-second` — Vandaag werk ik thuis. (verb in second place)
- C `s1-order-yes-no` — Woon je in Amsterdam? Heb je een fiets?
- C `s1-order-question-words` — Waar werk je? Wat eet je?
- C `s1-order-answers` — Ja, dat klopt. / Nee, dat klopt niet. / Ik weet het niet.
- P `s1-order-practice` — interviewing a new neighbour.

### s1-articles — De, het, een and plurals
- C `s1-articles-de-het` — de man, de vrouw, het huis, het kind; diminutives are het.
- C `s1-articles-een` — een fiets, een huis; Ik heb een vraag.
- C `s1-articles-plural` — -en / -s plurals; plurals always take de.
- C `s1-articles-deze-dit` — deze/dit (this), die/dat (that).
- P `s1-articles-practice` — labelling and asking for things in a shop.

### s1-home — Home and everyday objects
- C `s1-home-rooms` — de keuken, de woonkamer, de slaapkamer, de badkamer, de wc.
- C `s1-home-er-is` — Er is een balkon. Er zijn twee slaapkamers.
- C `s1-home-prepositions` — in, op, onder, naast, achter, voor: De sleutels liggen op de tafel.
- C `s1-home-objects` — common objects; Waar is mijn telefoon?
- C `s1-home-where-live` — Ik woon in een appartement / een huis met een tuin.
- P `s1-home-practice` — describing your home to a friend.

### s1-food — Food, drinks and cafés
- C `s1-food-ik-wil-graag` — Ik wil graag een koffie. (Ik wil graag water / betalen.)
- C `s1-food-mag-ik` — Mag ik …? / Doe maar een cappuccino.
- C `s1-food-waiter` — Wat wilt u drinken? Verder nog iets? Nee, dat was het.
- C `s1-food-meals` — ontbijt, lunch, avondeten: Ik eet brood met kaas.
- C `s1-food-bill` — De rekening, alstublieft. Kan ik pinnen?
- C `s1-food-expressions` — Lekker! Eet smakelijk! Proost!
- P `s1-food-practice` — a full café dialogue.

### s1-shop — Shopping and payment
- C `s1-shop-how-much` — Hoeveel kost dit? Dat kost … euro.
- C `s1-shop-prices` — €2,50 = twee euro vijftig; prijzen lezen.
- C `s1-shop-quantities` — een kilo, een pak, een fles, een stuk: Een kilo appels, alstublieft.
- C `s1-shop-looking-for` — Ik zoek … / Heeft u …? / Waar vind ik …?
- C `s1-shop-paying` — Pinnen of contant? Wilt u de bon? Wilt u een tasje?
- P `s1-shop-practice` — at the market and the supermarket checkout.

### s1-neg — Saying no: niet and geen
- C `s1-neg-niet` — Ik werk niet. Het is niet duur.
- C `s1-neg-geen` — Ik heb geen auto. Ik drink geen koffie.
- C `s1-neg-niet-or-geen` — choosing between them.
- P `s1-neg-practice` — correcting wrong information politely.

### s1-time — Time and appointments
- C `s1-time-what-time` — Hoe laat is het? Hoe laat begint …? Om acht uur. ("Om hoe laat …?" is accepted but less standard in the Netherlands.)
- C `s1-time-parts-of-day` — 's ochtends, 's middags, 's avonds, 's nachts.
- C `s1-time-appointment` — Ik heb een afspraak om … op maandag.
- C `s1-time-opening-hours` — De winkel is open van negen tot zes.
- P `s1-time-practice` — planning a week from a short agenda.

### s1-routine — Daily routine
- C `s1-routine-day` — Ik ontbijt om zeven uur. Ik ga om elf uur naar bed.
- C `s1-routine-going` — Ik ga naar mijn werk / naar de supermarkt / naar huis.
- C `s1-routine-frequency` — altijd, vaak, soms, nooit.
- C `s1-routine-weekend` — In het weekend … / Op zaterdag …
- P `s1-routine-practice` — describe a typical day.

### s1-work — Work and occupations
- C `s1-work-what-job` — Wat doe je voor werk? Wat is je beroep?
- C `s1-work-i-am` — Ik ben ontwikkelaar (no article). / Ik werk als …
- C `s1-work-where` — Ik werk bij … / op kantoor / thuis.
- C `s1-work-colleagues` — Mijn collega … / Ik heb een vergadering.
- P `s1-work-practice` — networking small talk.

### s1-transport — Transport and directions
- C `s1-transport-modes` — met de trein, de fiets, de bus, de auto; lopend.
- C `s1-transport-where-is` — Waar is het station? Is het ver?
- C `s1-transport-directions` — links, rechts, rechtdoor: Ga hier links.
- C `s1-transport-how-do-i-get` — Hoe kom ik bij …? Neem de tweede straat rechts.
- C `s1-transport-train` — Een enkeltje Utrecht. Van welk spoor vertrekt de trein? inchecken.
- P `s1-transport-practice` — asking the way to an appointment.

### s1-weather — Weather and descriptions
- C `s1-weather-weather` — Het regent. Het waait. Het is koud / mooi weer.
- C `s1-weather-adjectives` — Het huis is groot. (adjective after the verb)
- C `s1-weather-adjective-e` — een grote stad, het grote huis, een groot huis.
- C `s1-weather-people` — Hij is lang. Zij heeft bruin haar.
- C `s1-weather-places` — Amsterdam is een drukke stad.
- P `s1-weather-practice` — weather chat and describing a city.

### s1-free — Hobbies and free time
- C `s1-free-graag` — Ik fiets graag. Ik lees graag.
- C `s1-free-hou-van` — Ik hou van muziek.
- C `s1-free-free-time` — Wat doe je in je vrije tijd? Ik sport twee keer per week.
- P `s1-free-practice` — getting to know someone's hobbies.

### s1-modals — Want, can, must, may
- C `s1-modals-willen` — Ik wil Nederlands leren. (infinitive at the end)
- C `s1-modals-kunnen` — Kun je me helpen? Ik kan niet komen.
- C `s1-modals-moeten` — Ik moet werken.
- C `s1-modals-mogen` — Mag ik hier zitten? Je mag hier niet roken.
- P `s1-modals-practice` — rules and requests at work.

### s1-requests — Requests and questions
- C `s1-requests-can-you` — Kunt u me helpen? Kun je … ?
- C `s1-requests-ask-stranger` — Mag ik u iets vragen? Weet u waar … is?
- C `s1-requests-offer` — Zal ik je helpen? Wil je iets drinken?
- P `s1-requests-practice` — asking for help in a station.

### s1-connect — Joining ideas
- C `s1-connect-en-maar` — en, maar.
- C `s1-connect-of-want` — of, want.
- P `s1-connect-practice` — joining short sentences about your week.

### s1-texts — Short texts and messages
- C `s1-texts-read-message` — reading an app message: Hoi! Ik ben om zes uur thuis. Groetjes.
- C `s1-texts-write-message` — Ik ben te laat. Ik ben er om …
- C `s1-texts-signs` — Open, Gesloten, Ingang, Uitgang, Duwen, Trekken.
- C `s1-texts-listen-voicemail` — understanding a short voicemail.
- P `s1-texts-practice` — reply to a message from a friend.

### s1-check — A1 checkpoints
- K `s1-check-people-places` — personal details, family, home, countries.
- K `s1-check-food-shopping-time` — café, shop, payment, time, appointments.
- K `s1-check-grammar` — present tense, word order, de/het, plurals, niet/geen, modals.
- K `s1-check-a1-final` — integrated listening, reading and writing across A1.

## Stage 2 · Towards A2

### s2-plans — Plans and the future
- C `s2-plans-gaan` — Ik ga morgen zwemmen.
- C `s2-plans-zullen-we` — Zullen we koffie drinken?
- C `s2-plans-zin` — Heb je zin om … ? / Heb je zin in …?
- C `s2-plans-when` — Wanneer heb je tijd? Past dinsdag? Dat komt goed uit.
- P `s2-plans-practice` — arranging a meeting by message.

### s2-invite — Invitations
- C `s2-invite-inviting` — Kom je zaterdag ook? Ik geef een feestje.
- C `s2-invite-responding` — Ja, leuk! / Helaas kan ik niet, ik moet werken.
- C `s2-invite-congratulate` — Gefeliciteerd! Van harte! (also congratulating relatives).
- P `s2-invite-practice` — a birthday invitation dialogue.

### s2-separable — Separable verbs
- C `s2-separable-opstaan` — Ik sta om zeven uur op.
- C `s2-separable-bellen` — Ik bel je morgen op. Kunt u mij terugbellen?
- C `s2-separable-afspreken` — afspreken, meenemen, aankomen.
- C `s2-separable-with-modal` — Ik moet vroeg opstaan. (verb joins again)
- P `s2-separable-practice` — planning a day trip.

### s2-perfect — The perfect tense
- C `s2-perfect-hebben` — Ik heb gewerkt. (heb + ge- … -t/-d)
- C `s2-perfect-kofschip` — gewerkt vs gewoond: choosing -t or -d.
- C `s2-perfect-irregular` — gegeten, gedronken, gezien, gedaan, gehad.
- C `s2-perfect-zijn` — Ik ben naar Utrecht gegaan. gekomen, gebleven, geweest.
- C `s2-perfect-separable` — Ik heb hem opgebeld. Ik ben vroeg opgestaan.
- C `s2-perfect-time-words` — gisteren, vorige week, net, al.
- P `s2-perfect-practice` — Wat heb je dit weekend gedaan?

### s2-simplepast — Common past forms
- C `s2-simplepast-was` — Het was leuk. We waren in Utrecht.
- C `s2-simplepast-had-ging` — had, ging, kwam, zei.
- P `s2-simplepast-practice` — telling a friend about last night.

### s2-work — Work schedules
- C `s2-work-hours` — Ik werk parttime / vier dagen per week.
- C `s2-work-meetings` — Ik heb om tien uur een vergadering. Ik moet een presentatie geven.
- C `s2-work-days-off` — Ik ben vrij op vrijdag. Ik neem een vrije dag.
- P `s2-work-practice` — explaining your week to a new manager.

### s2-home — Home and neighbourhood
- C `s2-home-nearby` — Er is een supermarkt in de buurt / dichtbij.
- C `s2-home-neighbourhood` — Mijn buurt is rustig / gezellig.
- C `s2-home-problem` — De verwarming doet het niet. Er is een lekkage.
- P `s2-home-practice` — message to your landlord (verhuurder).

### s2-travel — Travel problems
- C `s2-travel-delay` — De trein heeft vertraging / rijdt niet.
- C `s2-travel-transfer` — Waar moet ik overstappen? Ik heb mijn trein gemist.
- C `s2-travel-lost` — Ik ben mijn portemonnee kwijt.
- P `s2-travel-practice` — sorting out a disrupted journey.

### s2-health — Health and help
- C `s2-health-ill` — Ik ben ziek. Ik voel me niet lekker.
- C `s2-health-pain` — Ik heb hoofdpijn. Mijn rug doet pijn.
- C `s2-health-gp` — Ik wil graag een afspraak maken met de huisarts.
- C `s2-health-pharmacy` — Hoe vaak moet ik dit innemen? Drie keer per dag.
- C `s2-health-emergency` — Help! Bel 112! Er is een ongeluk gebeurd.
- P `s2-health-practice` — calling the GP practice (doktersassistent).

### s2-shopissues — Shopping problems
- C `s2-shopissues-size` — Heeft u dit in een andere maat? Het is te klein.
- C `s2-shopissues-return` — Ik wil dit graag ruilen. Heeft u de bon?
- P `s2-shopissues-practice` — returning a broken item.

### s2-pref — Preferences and reasons
- C `s2-pref-liever` — Ik drink liever thee. Het liefst …
- C `s2-pref-vinden` — Ik vind het leuk. Wat vind je van …?
- C `s2-pref-omdat` — Ik blijf thuis, omdat ik ziek ben. (verb to the end)
- C `s2-pref-want-omdat` — want vs omdat.
- P `s2-pref-practice` — choosing a restaurant together.

### s2-compare — Comparing
- C `s2-compare-er-dan` — groter dan, duurder dan.
- C `s2-compare-superlative` — het grootst, beter, best, meer, meest.
- C `s2-compare-even` — even groot als / net zo duur als.
- P `s2-compare-practice` — comparing two apartments.

### s2-connect — Connected sentences
- C `s2-connect-dat` — Ik denk dat het gaat regenen.
- C `s2-connect-als` — Als het regent, neem ik de bus.
- C `s2-connect-sequence` — eerst, dan, daarna, tot slot.
- P `s2-connect-practice` — explaining a plan step by step.

### s2-info — Asking for information
- C `s2-info-indirect` — Weet u hoe laat de winkel opengaat?
- C `s2-info-polite` — Kunt u mij vertellen …? Ik heb een vraag over …
- P `s2-info-practice` — calling to ask about a course.

### s2-notices — Notices and instructions
- C `s2-notices-imperative` — Druk op de knop. Vul het formulier in.
- C `s2-notices-signs` — Verboden te roken. Niet parkeren. Buiten gebruik. Let op!
- P `s2-notices-practice` — reading a building notice.

### s2-write — Messages and emails
- C `s2-write-informal` — Hoi Sanne, … Groetjes.
- C `s2-write-formal` — Geachte heer/mevrouw, Beste …, Met vriendelijke groet.
- C `s2-write-reschedule` — emailing to cancel or move an appointment.
- P `s2-write-practice` — writing a short email to a colleague.

### s2-check — Stage 2 checkpoints
- K `s2-check-past-plans` — perfect tense, past forms, plans and invitations.
- K `s2-check-daily-problems` — health, travel, home and shopping problems.
- K `s2-check-connected` — omdat, dat, als, comparisons and an email.

## Stage 3 · A2 communication

### s3-listen — Announcements and conversations
- C `s3-listen-station` — De trein naar Utrecht Centraal vertrekt van spoor 7.
- C `s3-listen-shop` — De winkel sluit over tien minuten.
- C `s3-listen-phone` — U spreekt met … / Kunt u een bericht achterlaten?
- C `s3-listen-conversation` — overhearing colleagues making plans.
- P `s3-listen-practice` — a series of short announcements with questions.

### s3-read — Everyday texts
- C `s3-read-timetable` — reading a dienstregeling and openingstijden.
- C `s3-read-advert` — Te huur / Te koop adverts.
- C `s3-read-notice` — a gemeente notice about waste collection (afvalinzameling).
- C `s3-read-email` — an email from work or school.
- P `s3-read-practice` — finding key information fast.

### s3-describe — Describing in more detail
- C `s3-describe-character` — aardig, grappig, behulpzaam, eerlijk.
- C `s3-describe-town` — describing your town in connected sentences.
- C `s3-describe-routine` — a routine with eerst, daarna, meestal.
- P `s3-describe-practice` — introduce a friend or family member in detail.

### s3-experience — Experiences and plans
- C `s3-experience-holiday` — Vorige zomer ben ik naar Spanje gegaan.
- C `s3-experience-ever` — Ben je ooit in … geweest? Ik heb nog nooit … gegeten.
- C `s3-experience-toen` — Toen ik in Nederland aankwam, sprak ik geen Nederlands.
- C `s3-experience-future` — Volgend jaar wil ik … / Ik ben van plan om …
- P `s3-experience-practice` — tell a short story in order.

### s3-service — Service situations
- C `s3-service-gemeente` — Ik wil me inschrijven. BSN, afspraak bij de gemeente.
- C `s3-service-post` — Ik wil een pakket versturen.
- C `s3-service-phone-appointment` — making an appointment by phone, spelling your name.
- C `s3-service-reservation` — Ik wil graag reserveren voor vier personen.
- C `s3-service-doctor` — Sinds wanneer heeft u last van …?
- P `s3-service-practice` — a full gemeente appointment role play.

### s3-problems — Problems and requests
- C `s3-problems-not-working` — Het werkt niet meer sinds …
- C `s3-problems-complaint` — Ik heb een klacht. Ik wil graag mijn geld terug.
- C `s3-problems-zou` — Zou u … kunnen …? (polite requests)
- P `s3-problems-practice` — sorting out a wrong delivery.

### s3-opinion — Opinions and reasons
- C `s3-opinion-ik-vind-dat` — Ik vind dat … / Volgens mij …
- C `s3-opinion-agree` — Ik ben het (niet) met je eens. Dat klopt.
- C `s3-opinion-daarom` — daarom + inversion.
- P `s3-opinion-practice` — discussing a plan with a flatmate.

### s3-work — Work and social life
- C `s3-work-small-talk` — Heb je een leuk weekend gehad?
- C `s3-work-meetings` — Kun je dat uitleggen? Ik stel voor om …
- C `s3-work-sick` — Ik meld me ziek.
- C `s3-work-borrel` — Wat ga je deze vakantie doen?
- P `s3-work-practice` — a stand-up meeting and coffee-machine chat.

### s3-write — Practical writing
- C `s3-write-neighbours` — Beste buren, … (a note to neighbours)
- C `s3-write-landlord` — email to a landlord: problem, since when, request.
- C `s3-write-reply-invite` — reply to an invitation with a reason and an alternative.
- C `s3-write-form` — filling in a form with a short description.
- P `s3-write-practice` — writing an email about a weekend with sequence and reasons.

### s3-convo — Conversation strategies
- C `s3-convo-check` — Bedoelt u dat …? Klopt het dat …?
- C `s3-convo-repair` — Hoe zeg je dat ook alweer? Ik weet het woord niet, maar …
- C `s3-convo-roleplay` — a service conversation with minimal support.
- P `s3-convo-practice` — a phone call with a sequence of responses.

### s3-check — A2 checkpoints
- K `s3-check-listening`
- K `s3-check-reading`
- K `s3-check-writing`
- K `s3-check-conversation`
- K `s3-check-a2-final`
