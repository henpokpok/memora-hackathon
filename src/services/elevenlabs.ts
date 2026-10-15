const DEFAULT_API_KEY = 'sk_7c7917152a1c7d76ab51086c56d7a17c07888c69dd30c5b5';
const DEFAULT_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel / Multilingual

let currentAudio: HTMLAudioElement | null = null;

function getApiKey(): string {
  return DEFAULT_API_KEY;
}

export async function speakWithElevenLabs(
  text: string, 
  voiceId: string = DEFAULT_VOICE_ID,
  onEnd?: () => void,
  lang: 'th' | 'en' = 'th'
): Promise<void> {
  // Stop any currently playing audio
  stopSpeech();

  const apiKey = getApiKey();

  try {
    if (!apiKey) {
      throw new Error("No ElevenLabs API Key provided");
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
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
    const url = URL.createObjectURL(blob);
    currentAudio = new Audio(url);

    currentAudio.onended = () => {
      currentAudio = null;
      if (onEnd) onEnd();
    };

    currentAudio.onerror = () => {
      currentAudio = null;
      if (onEnd) onEnd();
    };

    await currentAudio.play();
  } catch (error) {
    console.warn("ElevenLabs TTS fallback to Web Speech:", error);
    
    // Natural fallback so the app NEVER stops working on stage
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
}

export function stopSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
