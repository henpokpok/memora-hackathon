const DEFAULT_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel / Multilingual

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let currentAbortController: AbortController | null = null;

function getApiKey(): string {
  return (import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_7c7917152a1c7d76ab51086c56d7a17c07888c69dd30c5b5').trim();
}

function cleanupAudioUrl(): void {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

function playWebSpeechFallback(
  text: string,
  lang: 'th' | 'en',
  onEnd?: () => void
): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'th-TH';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnd) onEnd();
  }
}

export async function speakWithElevenLabs(
  text: string, 
  voiceId: string = DEFAULT_VOICE_ID,
  onEnd?: () => void,
  lang: 'th' | 'en' = 'th'
): Promise<void> {
  // Stop any currently playing audio and cancel pending requests
  stopSpeech();

  const apiKey = getApiKey();

  // Gracefully fall back to Web Speech synthesis if no API key is set
  if (!apiKey) {
    playWebSpeechFallback(text, lang, onEnd);
    return;
  }

  const abortController = new AbortController();
  currentAbortController = abortController;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      signal: abortController.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API Error: ${errJson.detail?.message || response.statusText}`);
    }

    const blob = await response.blob();

    if (abortController.signal.aborted) {
      return;
    }

    const url = URL.createObjectURL(blob);
    cleanupAudioUrl();
    currentAudioUrl = url;
    currentAudio = new Audio(url);

    currentAudio.onended = () => {
      cleanupAudioUrl();
      currentAudio = null;
      if (onEnd) onEnd();
    };

    currentAudio.onerror = () => {
      cleanupAudioUrl();
      currentAudio = null;
      if (onEnd) onEnd();
    };

    await currentAudio.play();
  } catch (error: any) {
    // If request was aborted by stopSpeech(), exit cleanly without fallback
    if (error?.name === 'AbortError' || abortController.signal.aborted) {
      cleanupAudioUrl();
      return;
    }

    console.warn("ElevenLabs TTS fallback to Web Speech:", error);
    playWebSpeechFallback(text, lang, onEnd);
  } finally {
    if (currentAbortController === abortController) {
      currentAbortController = null;
    }
  }
}

export function stopSpeech(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  cleanupAudioUrl();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
