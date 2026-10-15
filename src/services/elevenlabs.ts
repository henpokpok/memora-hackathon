export interface VoicePreset {
  id: string;
  name: string;
  label: string;
  description: string;
  gender: 'female' | 'male';
  lang: 'th' | 'en';
}

export const THAI_VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'B4NdgwdU97lHqA8Udh2D',
    name: 'Kanya (กัญญา)',
    label: 'เสียงอบอุ่น อ่อนโยน (แนะนำสูงสุดสำหรับคุณยาย)',
    description: 'น้ำเสียงคุณป้า/คุณน้าใจดี สำเนียงไทยแท้ นุ่มนวล จังหวะช้า ไม่เร่งรีบ',
    gender: 'female',
    lang: 'th'
  },
  {
    id: 'v2NF9R77fF8wZRdbGYTg',
    name: 'Siriporn (ศิริพร)',
    label: 'เสียงสุขุม นุ่มนวล ชัดเจน',
    description: 'น้ำเสียงหญิงไทยวัยกลางคน สุภาพ อบอุ่น ฟังสบาย',
    gender: 'female',
    lang: 'th'
  },
  {
    id: 'nealpwJT5tCyJFKDzEq8',
    name: 'Aom (ออม)',
    label: 'เสียงหวาน ละมุน เป็นกันเอง',
    description: 'น้ำเสียงลูกหลาน อ่อนหวาน น่ารัก เป็นกันเอง',
    gender: 'female',
    lang: 'th'
  },
  {
    id: 'H9eYlNHpm1vah6PPgYAk',
    name: 'Ekkarat (เอกราช)',
    label: 'เสียงผู้ชาย อบอุ่น เป็นกันเอง',
    description: 'น้ำเสียงผู้ชายไทยสบายๆ เป็นมิตร ชัดถ้อยชัดคำ',
    gender: 'male',
    lang: 'th'
  },
  {
    id: 'XLXcyPK1jTjw1pYLLcM9',
    name: 'Somchai (สมชาย)',
    label: 'เสียงคุณหมอ ทุ้ม สุขุม น่าเชื่อถือ',
    description: 'น้ำเสียงผู้เชี่ยวชาญ/คุณหมอผู้ดูแล อบอุ่น ให้ความมั่นใจ',
    gender: 'male',
    lang: 'th'
  }
];

export const ENGLISH_VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    label: 'Gentle & Warm Companion',
    description: 'Soothing, gentle female voice, perfect for calm listening',
    gender: 'female',
    lang: 'en'
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    label: 'Clear & Natural Narrator',
    description: 'Professional, articulate American English voice',
    gender: 'female',
    lang: 'en'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    label: 'Friendly & Cheerful',
    description: 'Warm and expressive, like a daughter or grandchild',
    gender: 'female',
    lang: 'en'
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    label: 'Comforting Male Voice',
    description: 'Gentle, reassuring tone suitable for caregiving',
    gender: 'male',
    lang: 'en'
  }
];

// Unified list for backward compatibility
export const VOICE_PRESETS: VoicePreset[] = [
  ...THAI_VOICE_PRESETS,
  ...ENGLISH_VOICE_PRESETS
];

export const DEFAULT_THAI_VOICE_ID = 'v2NF9R77fF8wZRdbGYTg'; // Siriporn by default
export const DEFAULT_ENGLISH_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku'; // Lily by default
export const DEFAULT_VOICE_ID = DEFAULT_THAI_VOICE_ID;

const STORAGE_KEYS = {
  API_KEY: 'memora_elevenlabs_api_key',
  THAI_VOICE_ID: 'memora_elevenlabs_thai_voice_id',
  ENGLISH_VOICE_ID: 'memora_elevenlabs_english_voice_id',
  VOICE_ID: 'memora_elevenlabs_voice_id',
  ALLOW_SIRI_FALLBACK: 'memora_elevenlabs_allow_siri_fallback',
  SPEECH_MUTED: 'memora_speech_muted',
};

export function isSpeechGloballyMuted(): boolean {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.SPEECH_MUTED);
    if (local !== null) return local === 'true';
  }
  // Default to true (Muted) to save ElevenLabs API credits during prototyping
  return true;
}

export function setSpeechGloballyMuted(muted: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SPEECH_MUTED, muted ? 'true' : 'false');
  }
}

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let currentAbortController: AbortController | null = null;

// In-memory cache for generated audio blobs
const audioCache = new Map<string, Blob>();

export function clearAudioCache(): void {
  audioCache.clear();
}

export function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (local && local.trim()) return local.trim();
  }
  return (import.meta.env.VITE_ELEVENLABS_API_KEY || '').trim();
}

export function setApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  }
}

export function getThaiVoiceId(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.THAI_VOICE_ID);
    if (local && local.trim()) return local.trim();
  }
  return (import.meta.env.VITE_ELEVENLABS_THAI_VOICE_ID || import.meta.env.VITE_ELEVENLABS_VOICE_ID || DEFAULT_THAI_VOICE_ID).trim();
}

export function setThaiVoiceId(id: string): void {
  if (typeof window !== 'undefined') {
    if (id.trim()) {
      localStorage.setItem(STORAGE_KEYS.THAI_VOICE_ID, id.trim());
      localStorage.setItem(STORAGE_KEYS.VOICE_ID, id.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.THAI_VOICE_ID);
    }
  }
}

export function getEnglishVoiceId(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.ENGLISH_VOICE_ID);
    if (local && local.trim()) return local.trim();
  }
  return (import.meta.env.VITE_ELEVENLABS_ENGLISH_VOICE_ID || DEFAULT_ENGLISH_VOICE_ID).trim();
}

export function setEnglishVoiceId(id: string): void {
  if (typeof window !== 'undefined') {
    if (id.trim()) {
      localStorage.setItem(STORAGE_KEYS.ENGLISH_VOICE_ID, id.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.ENGLISH_VOICE_ID);
    }
  }
}

// Backward compatible aliases
export function getVoiceId(): string {
  return getThaiVoiceId();
}

export function setVoiceId(id: string): void {
  setThaiVoiceId(id);
}

export function getAllowSiriFallback(): boolean {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEYS.ALLOW_SIRI_FALLBACK);
    if (local !== null) return local === 'true';
  }
  return false;
}

export function setAllowSiriFallback(allow: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ALLOW_SIRI_FALLBACK, allow ? 'true' : 'false');
  }
}

/**
 * Separate optimized models and settings per language:
 * - Thai: eleven_v4 (ElevenLabs flagship model natively supporting Thai - eliminates Khmer accent warping)
 * - English: eleven_v4 / eleven_turbo_v2_5 for clear natural English
 */
export function getVoiceConfigForLanguage(lang: 'th' | 'en') {
  if (lang === 'th') {
    return {
      model_id: 'eleven_v4', // Native Thai support in Eleven v4
      voice_settings: {
        stability: 0.60,
        similarity_boost: 0.85,
        style: 0.0, // Critical: style must be 0.0 for Asian/Thai tonal languages to prevent foreign/Khmer accent warping
        use_speaker_boost: false,
      }
    };
  } else {
    return {
      model_id: 'eleven_v4',
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.80,
        style: 0.20,
        use_speaker_boost: true,
      }
    };
  }
}

function cleanupAudioUrl(): void {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

export function playWebSpeechFallback(
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

function playBlob(blob: Blob, onEnd?: () => void): void {
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

  currentAudio.play().catch((err) => {
    console.warn("Audio play error:", err);
    cleanupAudioUrl();
    currentAudio = null;
    if (onEnd) onEnd();
  });
}

/**
 * Diagnostic tool to verify ElevenLabs API key and voice ID with full error explanation
 */
export async function testElevenLabsConnection(
  customApiKey?: string,
  customVoiceId?: string,
  lang: 'th' | 'en' = 'th'
): Promise<{ success: boolean; message: string; details?: any }> {
  const apiKey = (customApiKey !== undefined ? customApiKey : getApiKey()).trim();
  const defaultId = lang === 'en' ? getEnglishVoiceId() : getThaiVoiceId();
  const voiceId = (customVoiceId !== undefined ? customVoiceId : defaultId).trim();
  const config = getVoiceConfigForLanguage(lang);

  if (!apiKey) {
    return {
      success: false,
      message: 'ยังไม่ได้ระบุ ElevenLabs API Key ในระบบ'
    };
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: lang === 'en' ? 'Hello from ElevenLabs' : 'สวัสดีค่ะคุณยาย',
        model_id: config.model_id,
        voice_settings: config.voice_settings,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const rawMessage = errJson.detail?.message || errJson.detail?.status || response.statusText;
      let userFriendlyMessage = rawMessage;

      if (rawMessage.includes('missing the permission text_to_speech')) {
        userFriendlyMessage = 'API Key นี้ไม่มีสิทธิ์ "text_to_speech" (กรุณาเปิดสิทธิ์ Text to Speech บนแดชบอร์ด ElevenLabs)';
      } else if (rawMessage.includes('API key ID used as API key') || errJson.detail?.status === 'api_key_id_used_as_api_key') {
        userFriendlyMessage = 'ค่าที่ระบุคือ "Key ID" ไม่ใช่ API Key ตัวจริง (API Key ตัวจริงจะขึ้นต้นด้วย sk_...)';
      } else if (response.status === 401) {
        userFriendlyMessage = 'API Key ไม่ถูกต้องหรือหมดอายุ (401 Unauthorized)';
      } else if (response.status === 429) {
        userFriendlyMessage = 'โควต้าการใช้งาน ElevenLabs เต็มแล้ว (429 Rate Limit)';
      }

      return {
        success: false,
        message: userFriendlyMessage,
        details: errJson
      };
    }

    return {
      success: true,
      message: 'เชื่อมต่อ ElevenLabs สำเร็จ! พร้อมใช้งาน'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || String(err)}`
    };
  }
}

/**
 * Main speech synthesizer function with automated native voice routing by language
 */
export async function speakWithElevenLabs(
  text: string, 
  voiceId?: string,
  onEnd?: () => void,
  lang: 'th' | 'en' = 'th'
): Promise<void> {
  stopSpeech();

  // Guard: If speech system is muted to conserve ElevenLabs API credits, return immediately
  if (isSpeechGloballyMuted()) {
    if (onEnd) onEnd();
    return;
  }

  const apiKey = getApiKey();
  // Automatically route to appropriate language voice if not explicitly overridden
  const activeVoiceId = (voiceId || (lang === 'en' ? getEnglishVoiceId() : getThaiVoiceId())).trim();
  const allowSiri = getAllowSiriFallback();
  const config = getVoiceConfigForLanguage(lang);

  // If no API key is set
  if (!apiKey) {
    console.warn("ElevenLabs: No API key configured.");
    if (allowSiri) {
      playWebSpeechFallback(text, lang, onEnd);
    } else {
      if (onEnd) onEnd();
    }
    return;
  }

  // Check in-memory audio cache for instant playback
  const cacheKey = `${activeVoiceId}:${config.model_id}:${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    const cachedBlob = audioCache.get(cacheKey)!;
    playBlob(cachedBlob, onEnd);
    return;
  }

  const abortController = new AbortController();
  currentAbortController = abortController;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${activeVoiceId}`, {
      method: "POST",
      signal: abortController.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: config.model_id,
        voice_settings: config.voice_settings
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

    // Save to audio cache
    audioCache.set(cacheKey, blob);

    playBlob(blob, onEnd);
  } catch (error: any) {
    if (error?.name === 'AbortError' || abortController.signal.aborted) {
      cleanupAudioUrl();
      return;
    }

    console.warn("ElevenLabs TTS failed:", error);

    if (allowSiri) {
      console.warn("Falling back to Web Speech (Siri).");
      playWebSpeechFallback(text, lang, onEnd);
    } else {
      if (onEnd) onEnd();
    }
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
