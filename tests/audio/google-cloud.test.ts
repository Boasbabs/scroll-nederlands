import { googleCloud, GoogleApiError } from '../../scripts/google-cloud.ts';

/** Answers each call with the next response, and keeps what was sent. */
function fakeFetch(responses: Array<Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const send = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return responses.shift()!;
  }) as typeof fetch;
  return { calls, send };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const header = (init: RequestInit, name: string) => (init.headers as Record<string, string>)[name];

describe('the Google Cloud client', () => {
  it('asks for a Chirp 3: HD take as 24 kHz WAV at the given pace, with the key in a header only', async () => {
    const { calls, send } = fakeFetch([json({ audioContent: Buffer.from('RIFF take').toString('base64') })]);
    const audio = await googleCloud({ key: 'secret-key', fetch: send }).synthesize('Hoe schrijf je dat?', 'nl-NL-Chirp3-HD-Charon', 0.9);

    expect(audio.toString()).toBe('RIFF take');
    expect(calls[0]!.url).toBe('https://texttospeech.googleapis.com/v1/text:synthesize');
    expect(calls[0]!.init.method).toBe('POST');
    expect(header(calls[0]!.init, 'X-Goog-Api-Key')).toBe('secret-key');
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      input: { text: 'Hoe schrijf je dat?' },
      voice: { languageCode: 'nl-NL', name: 'nl-NL-Chirp3-HD-Charon' },
      audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: 0.9 },
    });
  });

  it('lists a locale’s voices, from a regional endpoint when one is set', async () => {
    const { calls, send } = fakeFetch([json({ voices: [{ name: 'nl-NL-Chirp3-HD-Kore', ssmlGender: 'FEMALE', naturalSampleRateHertz: 24000 }] })]);
    const voices = await googleCloud({ key: 'k', fetch: send, ttsEndpoint: 'https://eu-texttospeech.googleapis.com' }).voices('nl-NL');

    expect(voices).toEqual([{ name: 'nl-NL-Chirp3-HD-Kore', gender: 'FEMALE', sampleRate: 24000 }]);
    expect(calls[0]!.url).toBe('https://eu-texttospeech.googleapis.com/v1/voices?languageCode=nl-NL');
    expect(calls[0]!.init.method).toBe('GET');
    expect(calls[0]!.init.body).toBeUndefined();
  });

  it('sends FLAC to Speech-to-Text with Dutch forced, and joins what it heard', async () => {
    const { calls, send } = fakeFetch([json({ results: [{ alternatives: [{ transcript: ' Hoe schrijf je ' }] }, { alternatives: [{ transcript: 'dat' }] }] }), json({})]);
    const google = googleCloud({ key: 'k', fetch: send });

    expect(await google.transcribe(Buffer.from('fLaC'))).toBe('Hoe schrijf je dat');
    // Silence, or nothing it could make out, comes back without results.
    expect(await google.transcribe(Buffer.from('fLaC'))).toBe('');
    expect(calls[0]!.url).toBe('https://speech.googleapis.com/v1/speech:recognize');
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ config: { encoding: 'FLAC', languageCode: 'nl-NL' }, audio: { content: Buffer.from('fLaC').toString('base64') } });
  });

  it('retries a busy server and a per-minute limit', async () => {
    const { calls, send } = fakeFetch([
      new Response('busy', { status: 503 }),
      new Response("Quota exceeded for quota metric 'Requests' and limit 'Requests per minute'", { status: 429 }),
      json({ audioContent: '' }),
    ]);
    await googleCloud({ key: 'k', fetch: send, retryDelay: 0 }).synthesize('ja', 'nl-NL-Chirp3-HD-Kore');
    expect(calls).toHaveLength(3);
  });

  it('stops on a disabled API or a spent quota without echoing the key, and only skips a bad text', async () => {
    const attempt = async (response: Response) => {
      const { send } = fakeFetch([response]);
      return googleCloud({ key: 'secret', fetch: send, retryDelay: 0 })
        .synthesize('ja', 'nl-NL-Chirp3-HD-Kore')
        .catch((error: unknown) => error as GoogleApiError);
    };
    const disabled = await attempt(new Response('Cloud Text-to-Speech API has not been used in project 1 or it is disabled (key secret)', { status: 403 }));
    expect(disabled).toBeInstanceOf(GoogleApiError);
    expect(disabled).toMatchObject({ fatal: true });
    expect((disabled as GoogleApiError).message).not.toContain('secret');
    expect(await attempt(new Response("Quota exceeded for quota metric 'Characters' and limit 'Characters per month'", { status: 429 }))).toMatchObject({ fatal: true });
    const badKey = { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } };
    expect(await attempt(json(badKey, 400))).toMatchObject({ fatal: true, message: '400 INVALID_ARGUMENT: API key not valid. Please pass a valid API key.' });
    expect(await attempt(new Response('Invalid input text', { status: 400 }))).toMatchObject({ fatal: false });
  });
});
