import { besideTexts, collectClipTexts, isShort } from '../../scripts/generate-audio.ts';
import { DEFAULT_VOICES, heard, listeningPage, report, summarize, TEST_TEXTS, voiceName, type TestResult } from '../../scripts/voice-test.ts';
import { clipKey } from '../../src/audio/speech';
import { course } from '../../src/curriculum';
import { contrasts } from '../../src/sounds/pairs';
import { wordThemes } from '../../src/words/content';

describe('the voice test set', () => {
  it('tests texts the course plays, in the voice that plays them', () => {
    const played = collectClipTexts([...course.lessons, ...course.packs.flatMap((pack) => pack.scenes)], besideTexts(wordThemes, contrasts));
    const plays = new Set(played.map((clip) => `${clip.voice} ${clip.text}`));
    expect(TEST_TEXTS.filter((text) => text.from === 'course' && !plays.has(`${text.voice} ${clipKey(text.text)}`))).toEqual([]);
  });

  it('weighs short words most, where voices differ, and has lines for the dialogue voice', () => {
    expect(TEST_TEXTS.filter((text) => isShort(text.text)).length).toBeGreaterThanOrEqual(12);
    expect(TEST_TEXTS.filter((text) => text.voice === 'b').length).toBeGreaterThanOrEqual(3);
    expect(new Set(TEST_TEXTS.map((text) => text.text)).size).toBe(TEST_TEXTS.length);
  });

  it('names a voice in full, two male candidates for the main voice and a female one for dialogues', () => {
    expect(DEFAULT_VOICES.map(voiceName)).toEqual(['nl-NL-Chirp3-HD-Charon', 'nl-NL-Chirp3-HD-Iapetus', 'nl-NL-Chirp3-HD-Erinome']);
    expect(voiceName('en-US-Chirp3-HD-Kore')).toBe('en-US-Chirp3-HD-Kore');
  });
});

describe('scoring and laying out the voice test', () => {
  const results: Array<TestResult> = [
    { source: 'ElevenLabs Serge de Beer', text: 'deur', file: '../public/audio/a.mp3', seconds: 0.6, transcript: 'deur', wer: 0 },
    { source: 'ElevenLabs Serge de Beer', text: 'wel', file: '../public/audio/b.mp3', seconds: 0.5, transcript: 'well', wer: 1 },
    { source: 'ElevenLabs Serge de Beer', text: 'Hoe schrijf je dat?', file: '../public/audio/c.mp3', seconds: 1.2, transcript: 'hoe schrijf je dat', wer: 0 },
    { source: 'Charon (pace 1)', text: 'deur', file: 'clips/Charon/1/x.ogg', seconds: 0.6, transcript: 'deur', wer: 0 },
    { source: 'Charon (pace 1)', text: 'wel', file: 'clips/Charon/1/y.ogg', seconds: 0.5, transcript: 'wel', wer: 0 },
    { source: 'Charon (pace 1)', text: 'Hoe schrijf je dat?', file: 'clips/Charon/1/z.ogg', seconds: 1.4, transcript: 'hoe schrijf je', wer: 0.25 },
    // Nine seconds for 24 letters: a repeat, whatever the transcript says.
    { source: 'Charon (pace 1)', text: 'De g van goed, de sch van school.', file: 'clips/Charon/1/w.ogg', seconds: 9, transcript: 'de g van goed de sch van school', wer: 0 },
  ];

  it('scores each source: short texts back exactly, sentences within one word in five, pace, and length', () => {
    const [eleven, charon] = summarize(results);
    expect(eleven).toMatchObject({ source: 'ElevenLabs Serge de Beer', short: { exact: 1, total: 2 }, sentences: { close: 1, total: 1 }, lengthFlags: 0 });
    // "Hoe schrijf je dat?" has 15 letters.
    expect(eleven!.pace).toBeCloseTo(15 / 1.2);
    expect(charon).toMatchObject({ source: 'Charon (pace 1)', short: { exact: 2, total: 2 }, sentences: { close: 1, total: 2 }, lengthFlags: 1 });
  });

  it('counts a clip as heard only once checked', () => {
    expect(heard(results[0]!)).toBe(true);
    expect(heard(results[1]!)).toBe(false);
    expect(heard(results[5]!)).toBe(false);
    expect(heard({ ...results[0]!, transcript: undefined, wer: undefined })).toBeUndefined();
    expect(summarize([{ ...results[0]!, wer: undefined }])[0]).toMatchObject({ short: { exact: 0, total: 0 } });
  });

  it('lays every clip out to listen to, with what the check heard, and escapes the text', () => {
    const texts = [{ text: 'A & <i>', probes: 'escaping', voice: 'a' as const, from: 'research' as const }, ...TEST_TEXTS.slice(0, 2)];
    const page = listeningPage(texts, ['ElevenLabs', 'Charon (pace 1)'], results.map((result) => (result.source.startsWith('ElevenLabs') ? { ...result, source: 'ElevenLabs' } : result)), '2026-10-29 16:00');
    expect(page).toContain('A &amp; &lt;i&gt;');
    expect(page).not.toContain('<i>');
    expect(page).toContain('<audio controls preload="none" src="../public/audio/b.mp3"></audio><span class="miss">heard “well”</span>');
    expect(page).toContain('<audio controls preload="none" src="clips/Charon/1/y.ogg"></audio><span class="ok">heard</span>');
    // A text with no clip from a source gets an empty cell, not a broken player.
    expect(page).toContain('<td class="none">–</td>');
  });

  it('reports the texts both providers have apart, and lists what the check missed', () => {
    const text = report(TEST_TEXTS, results, '2026-10-29 16:00', 120);
    expect(text).toContain('3 of them with an ElevenLabs clip in the course. 120 characters went to Text-to-Speech');
    expect(text).toContain('| ElevenLabs Serge de Beer | 1 of 2 | 1 of 1 | 12.5 | 0 |');
    expect(text).toContain('| Charon (pace 1) | 2 of 2 | 0 of 1 | 10.7 | 0 |');
    expect(text).toContain('| wel | ElevenLabs Serge de Beer | well | 1.00 |');
    expect(text).toContain('| Hoe schrijf je dat? | Charon (pace 1) | hoe schrijf je | 0.25 |');
  });
});
