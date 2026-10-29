// Google Cloud Text-to-Speech (Chirp 3: HD voices) and Speech-to-Text, for the voice test
// (scripts/voice-test.ts). The API key is only ever sent in the X-Goog-Api-Key header.
// GOOGLE_TTS_ENDPOINT and GOOGLE_STT_ENDPOINT pick a regional endpoint, such as
// https://eu-texttospeech.googleapis.com.

export type GoogleVoice = { name: string; gender: string; sampleRate: number };

/** fatal: the key, the project or the quota is wrong, so further calls would fail the same way. */
export class GoogleApiError extends Error {
  readonly fatal: boolean;
  constructor(message: string, fatal: boolean) {
    super(message);
    this.fatal = fatal;
  }
}

/** Google's JSON error as "STATUS: message"; any other body as it came, cut short. */
function explain(body: string): string {
  try {
    const { error } = JSON.parse(body) as { error?: { status?: string; message?: string } };
    if (error?.message) return `${error.status ?? 'ERROR'}: ${error.message}`;
  } catch {
    // Not JSON.
  }
  return body.slice(0, 300);
}

type Options = {
  key: string;
  ttsEndpoint?: string;
  sttEndpoint?: string;
  fetch?: typeof fetch;
  /** The first retry's wait in ms; it doubles each time. */
  retryDelay?: number;
};

export function googleCloud({ key, ttsEndpoint = 'https://texttospeech.googleapis.com', sttEndpoint = 'https://speech.googleapis.com', fetch: send = fetch, retryDelay = 500 }: Options) {
  async function call<T>(url: string, json?: unknown): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      const response = await send(url, {
        method: json ? 'POST' : 'GET',
        headers: { 'X-Goog-Api-Key': key, ...(json ? { 'Content-Type': 'application/json' } : {}) },
        ...(json ? { body: JSON.stringify(json) } : {}),
      });
      if (response.ok) return (await response.json()) as T;
      const body = (await response.text()).split(key).join('<key>');
      // Rate limits ("… per minute") and server errors pass; a spent daily or monthly quota does not.
      const spent = response.status === 429 && /quota/i.test(body) && !/per minute|rate limit/i.test(body);
      if ((response.status === 429 && !spent) || response.status >= 500) {
        if (attempt < 6) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * 2 ** (attempt - 1)));
          continue;
        }
      }
      const fatal = response.status === 401 || response.status === 403 || spent || /API key not valid/i.test(body);
      throw new GoogleApiError(`${response.status} ${explain(body)}`, fatal);
    }
  }

  return {
    /** The voices for a locale, such as nl-NL. */
    async voices(languageCode: string): Promise<Array<GoogleVoice>> {
      const body = await call<{ voices?: Array<{ name: string; ssmlGender: string; naturalSampleRateHertz: number }> }>(
        `${ttsEndpoint}/v1/voices?languageCode=${encodeURIComponent(languageCode)}`,
      );
      return (body.voices ?? []).map((voice) => ({ name: voice.name, gender: voice.ssmlGender, sampleRate: voice.naturalSampleRateHertz }));
    },

    /** One take as a WAV file (LINEAR16 with its header) at 24 kHz, the Chirp 3: HD voices' own rate. */
    async synthesize(text: string, voice: string, speakingRate = 1): Promise<Buffer> {
      const languageCode = voice.split('-').slice(0, 2).join('-');
      const body = await call<{ audioContent: string }>(`${ttsEndpoint}/v1/text:synthesize`, {
        input: { text },
        voice: { languageCode, name: voice },
        audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate },
      });
      return Buffer.from(body.audioContent, 'base64');
    },

    /** What Speech-to-Text hears in a FLAC file, with the language forced, as the ElevenLabs check forces it. */
    async transcribe(flac: Buffer, languageCode = 'nl-NL'): Promise<string> {
      const body = await call<{ results?: Array<{ alternatives?: Array<{ transcript?: string }> }> }>(`${sttEndpoint}/v1/speech:recognize`, {
        config: { encoding: 'FLAC', languageCode },
        audio: { content: flac.toString('base64') },
      });
      return (body.results ?? [])
        .map((result) => result.alternatives?.[0]?.transcript?.trim() ?? '')
        .filter(Boolean)
        .join(' ');
    },
  };
}
