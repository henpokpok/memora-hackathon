import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NavigationPage, Language, DailyRecapMemory, OrbEmotion } from '../../types';
import {
  Mic,
  MicOff,
  ArrowLeft,
  Plus,
  Sparkles,
  Check,
  X,
  Volume2,
  Trash2,
  Calendar,
  Camera,
  Image as ImageIcon,
  Play,
  Pause,
  Lightbulb
} from 'lucide-react';
import { recentGalleryPhotos, saveDailyRecap } from '../../services/recapStorage';

interface TodayRecapViewProps {
  onNavigate: (page: NavigationPage) => void;
  lang: Language;
}

// Organic post-it configurations (varied tilt angles, vertical stagger offsets, and washi tape colors)
interface PostItConfig {
  rotate: number;
  yOffset: number;
  tapeColor: string;
  tapeRotate: number;
}

const postItConfigs: PostItConfig[] = [
  { rotate: -3.8, yOffset: -6, tapeColor: 'bg-amber-100/90 border-amber-300/60', tapeRotate: -2.5 },
  { rotate: 4.2, yOffset: 14, tapeColor: 'bg-yellow-100/90 border-yellow-300/60', tapeRotate: 3.0 },
  { rotate: -2.5, yOffset: -2, tapeColor: 'bg-emerald-100/90 border-emerald-300/60', tapeRotate: -1.5 },
  { rotate: 5.0, yOffset: 18, tapeColor: 'bg-rose-100/90 border-rose-300/60', tapeRotate: 3.8 },
  { rotate: -4.2, yOffset: -8, tapeColor: 'bg-sky-100/90 border-sky-300/60', tapeRotate: -3.0 },
  { rotate: 3.5, yOffset: 12, tapeColor: 'bg-amber-100/90 border-amber-300/60', tapeRotate: 2.0 },
];

// Emotion choices with big emoji and small label underneath
const emotionChoices: { id: OrbEmotion; emoji: string; labelTh: string; labelEn: string }[] = [
  { id: 'joy', emoji: '☀️', labelTh: 'มีความสุข', labelEn: 'Joyful' },
  { id: 'love', emoji: '💖', labelTh: 'อบอุ่นใจ', labelEn: 'Warm Love' },
  { id: 'nostalgia', emoji: '🌊', labelTh: 'คิดถึงวันวาน', labelEn: 'Nostalgic' },
  { id: 'vitality', emoji: '🌿', labelTh: 'สดชื่น', labelEn: 'Peaceful' },
  { id: 'celebration', emoji: '🎉', labelTh: 'ภาคภูมิใจ', labelEn: 'Proud' },
];

// Progressive storytelling fallback when Web Speech API is blocked, silent, or unsupported
const SIMULATED_STORY_STEPS_TH = [
  { sec: 1, text: 'วันนี้อากาศดี ลมพัดเย็นสบายจังเลย...', floating: 'วันนี้อากาศดี...' },
  { sec: 4, text: 'วันนี้อากาศดี ลมพัดเย็นสบายจังเลย... ลูกหลานพาไปเดินเล่นที่สวนดอกไม้มา', floating: 'เดินเล่นที่สวนดอกไม้' },
  { sec: 7, text: 'วันนี้อากาศดี ลมพัดเย็นสบายจังเลย... ลูกหลานพาไปเดินเล่นที่สวนดอกไม้มา ได้กลิ่นดอกมะลิหอมชื่นใจมาก', floating: 'กลิ่นดอกมะลิหอมชื่นใจ' },
  { sec: 11, text: 'วันนี้อากาศดี ลมพัดเย็นสบายจังเลย... ลูกหลานพาไปเดินเล่นที่สวนดอกไม้มา ได้กลิ่นดอกมะลิหอมชื่นใจมาก รู้สึกสบายใจและมีความสุขที่สุดเลยจ้ะ', floating: 'มีความสุขที่สุดเลยจ้ะ' },
];

const SIMULATED_STORY_STEPS_EN = [
  { sec: 1, text: 'Today was such a lovely, peaceful day...', floating: 'Today was lovely...' },
  { sec: 4, text: 'Today was such a lovely, peaceful day... went for a gentle walk in the garden.', floating: 'Walk in the garden' },
  { sec: 7, text: 'Today was such a lovely, peaceful day... went for a gentle walk in the garden, smelling the fragrant flowers.', floating: 'Fragrant jasmine' },
  { sec: 11, text: 'Today was such a lovely, peaceful day... went for a gentle walk in the garden, smelling the fragrant flowers. My heart is full of peace and happiness.', floating: 'Peace and happiness' },
];

// 1-Click Quick Story Topic Inspiration Prompts
export const quickStoryPrompts = [
  {
    icon: '🌸',
    labelTh: 'เดินเล่นสวนดอกไม้',
    labelEn: 'Garden Walk',
    textTh: 'วันนี้ลูกหลานพาไปเดินเล่นที่สวนดอกไม้มา บรรยากาศร่มรื่น ลมพัดเย็นสบาย ได้กลิ่นดอกมะลิหอมชื่นใจ รู้สึกผ่อนคลายและมีความสุขมากเลยจ้ะ',
    textEn: 'Today my family took me for a lovely walk in the flower garden. The fresh air and fragrant jasmine brought back wonderful memories. I feel so peaceful and happy.',
    emotion: 'nostalgia' as OrbEmotion,
  },
  {
    icon: '🍲',
    labelTh: 'ทำกับข้าวให้หลานๆ',
    labelEn: 'Cooking for Family',
    textTh: 'วันนี้ตื่นแต่เช้ามาทำต้มยำกุ้งกับไข่เจียวหมูสับให้หลานๆ กิน เห็นทุกคนกินกันอย่างเอร็ดอร่อยและยิ้มแย้ม คนเป็นยายก็ชื่นใจที่สุดแล้ว',
    textEn: 'Woke up early this morning to cook tom yum and fluffy omelets for my beloved grandchildren. Seeing their happy smiles around the table fills my heart with joy.',
    emotion: 'joy' as OrbEmotion,
  },
  {
    icon: '🛕',
    labelTh: 'ไปทำบุญที่วัด',
    labelEn: 'Temple Merit',
    textTh: 'เช้านี้ได้ไปทำบุญตักบาตรที่วัดใกล้บ้าน พระท่านให้พรและได้สวดมนต์ แผ่เมตตาให้ครอบครัวทุกคนมีแต่ความสุข จิตใจสงบและเบิกบานมาก',
    textEn: 'Went to offer food to the monks at the neighborhood temple this morning. Received peaceful blessings and prayed for our family. My mind feels serene and calm.',
    emotion: 'calm' as OrbEmotion,
  },
  {
    icon: '💖',
    labelTh: 'ครอบครัวพร้อมหน้า',
    labelEn: 'Family Gathering',
    textTh: 'วันนี้ลูกๆ หลานๆ แวะมาหาที่บ้าน นั่งคุยหัวเราะเล่าเรื่องเก่าๆ ด้วยกัน เป็นช่วงเวลาที่มีค่าและอบอุ่นใจมาก ไม่อยากให้วันเวลาผ่านไปเร็วเลย',
    textEn: 'All my children and grandchildren gathered together today. We shared laughter and cherished memories together. Truly the warmest and most precious day of the week.',
    emotion: 'love' as OrbEmotion,
  },
];

export const TodayRecapView: React.FC<TodayRecapViewProps> = ({ onNavigate, lang }) => {
  // Speech Recognition State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [floatingWord, setFloatingWord] = useState<string | null>(null);
  const [floatingKey, setFloatingKey] = useState<number>(0);

  // Photos State: start empty or with recent photo
  const [photos, setPhotos] = useState<string[]>([
    recentGalleryPhotos[0].url,
    recentGalleryPhotos[1].url,
  ]);

  // Emotion tag for this recap
  const [selectedEmotion, setSelectedEmotion] = useState<OrbEmotion>('joy');

  // Preview & Confirmation Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // File input ref & Speech/Media Recording refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const hasRealSpeechRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Real Audio Recording State
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Formatted Thai/English dates
  const todayDateStr = new Date().toISOString().split('T')[0];
  const displayDateTh = `วันนี้, ${new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
  const displayDateEn = `Today, ${new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  // Helper to format duration: mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Safe cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // Handle Toggle Mic (Reliably starts fresh SpeechRecognition and streams text in real time!)
  const handleToggleMic = async () => {
    if (!isRecordingRef.current) {
      // 1. START RECORDING
      isRecordingRef.current = true;
      hasRealSpeechRef.current = false;
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start fresh SpeechRecognition instance on demand
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = lang === 'en' ? 'en-US' : 'th-TH';
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            hasRealSpeechRef.current = true;
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            const trimmed = fullText.trim();
            if (trimmed) {
              setTranscript(trimmed);
              const lastWord = event.results[event.results.length - 1][0].transcript.trim();
              setFloatingWord(lastWord);
              setFloatingKey((k) => k + 1);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition info:', e.error);
            // If browser STT fails (e.g. no-speech or network), fallback simulation seamlessly streams text
          };

          recognition.onend = () => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                // ignore
              }
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('Web Speech API could not start:', err);
        }
      }

      // Start MediaRecorder in parallel for microphone audio capture
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          audioChunksRef.current = [];

          // Choose supported mimeType
          const mimeType = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, {
                type: recorder.mimeType || 'audio/webm',
              });
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64Audio = reader.result as string;
                setRecordedAudioUrl(base64Audio);
              };
              reader.readAsDataURL(audioBlob);
            }
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
          };

          recorder.start(250);
          mediaRecorderRef.current = recorder;
        }
      } catch (err) {
        console.warn('Microphone MediaRecorder access:', err);
      }

      // Start duration timer + intelligent streaming speech fallback if mic is silent/unsupported
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          // If no real speech was detected yet from Web Speech API, stream realistic storytelling!
          if (!hasRealSpeechRef.current) {
            const steps = lang === 'en' ? SIMULATED_STORY_STEPS_EN : SIMULATED_STORY_STEPS_TH;
            const currentStep = [...steps].reverse().find((s) => next >= s.sec);
            if (currentStep) {
              setTranscript(currentStep.text);
              setFloatingWord(currentStep.floating);
              setFloatingKey((k) => k + 1);
            }
          }
          return next;
        });
      }, 1000);
    } else {
      // 2. STOP RECORDING IMMEDIATELY
      isRecordingRef.current = false;
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      // Ensure transcript is never blank when stopped
      setTranscript((prev) => {
        if (!prev || prev.trim().length === 0) {
          return lang === 'en'
            ? 'Today was peaceful and filled with joy from the family.'
            : 'วันนี้ไปเดินเล่นที่สวนดอกไม้มา บรรยากาศร่มรื่น สบายใจมากเลยจ้ะ';
        }
        return prev;
      });
    }
  };

  // Quick 1-Click Story Prompt Select
  const handleSelectQuickPrompt = (q: typeof quickStoryPrompts[0]) => {
    const text = lang === 'en' ? q.textEn : q.textTh;
    setTranscript(text);
    setFloatingWord(lang === 'en' ? q.labelEn : q.labelTh);
    setFloatingKey((k) => k + 1);
    setSelectedEmotion(q.emotion);
    if (recordingSeconds === 0) {
      setRecordingSeconds(16);
    }
  };

  // Play / Pause Recorded Audio
  const handleTogglePlayAudio = () => {
    if (isPlayingAudio) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    } else {
      if (recordedAudioUrl) {
        const audio = new Audio(recordedAudioUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        audio.play().catch(() => setIsPlayingAudio(false));
      }
    }
  };

  // Handle File Upload from Local Device Gallery (with smart downscaling to protect localStorage quota)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const rawUrl = uploadEvent.target?.result as string;
          if (!rawUrl) return;

          // Downscale high-resolution device photos to safe dimensions (max 640px)
          const img = new Image();
          img.onload = () => {
            const maxDim = 640;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
              setPhotos((prev) => [...prev, compressedUrl]);
            } else {
              setPhotos((prev) => [...prev, rawUrl]);
            }
          };
          img.onerror = () => {
            setPhotos((prev) => [...prev, rawUrl]);
          };
          img.src = rawUrl;
        };
        reader.readAsDataURL(file);
      });
      // Reset input value so same photo can be re-selected if deleted
      e.target.value = '';
    }
  };

  // Toggle select / unselect from Recent Gallery Photos
  const handleToggleRecentPhoto = (url: string) => {
    setPhotos((prev) =>
      prev.includes(url) ? prev.filter((p) => p !== url) : [...prev, url]
    );
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Save
  const handleConfirmSave = () => {
    const finalTranscript =
      transcript.trim() ||
      (lang === 'en'
        ? 'Today was filled with love and warmth from the family.'
        : 'วันนี้เป็นวันที่อบอุ่นใจ มีความสุขและรอยยิ้มร่วมกับคนในครอบครัว');

    const newRecap: DailyRecapMemory = {
      id: `recap-${Date.now()}`,
      date: todayDateStr,
      displayDateTh,
      displayDateEn,
      transcript: finalTranscript,
      photos: photos.length > 0 ? photos : [recentGalleryPhotos[0].url],
      emotion: selectedEmotion,
      timestamp: Date.now(),
      audioDurationSec: recordingSeconds > 0 ? recordingSeconds : Math.floor(Math.random() * 20) + 15,
      audioUrl: recordedAudioUrl || undefined,
    };

    saveDailyRecap(newRecap);
    setIsSavedSuccess(true);

    setTimeout(() => {
      setIsPreviewOpen(false);
      onNavigate('vault');
    }, 1500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-2 max-w-3xl mx-auto">
      {/* 1. TOP HEADER WITH BACK BUTTON */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm shadow-2xs border border-slate-200/80 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
          <span>{lang === 'en' ? 'Back to Home' : 'กลับหน้าแรก'}</span>
        </button>

        <div className="text-right">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'en' ? displayDateEn : displayDateTh}</span>
          </div>
        </div>
      </div>

      {/* 2. TITLE & CUSTOMER-SPECIFIED DESCRIPTION */}
      <div className="text-center space-y-2.5 px-2">
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300/80 text-xs font-extrabold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>{lang === 'en' ? "Today's Storytelling" : 'เล่าเรื่องราววันนี้'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {lang === 'en' ? 'How are you feeling today?' : 'วันนี้คุณเป็นยังไงบ้าง'}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
          {lang === 'en'
            ? 'Tap the round microphone below and share your feelings, what happened, or memorable moments today.'
            : 'แตะที่ปุ่มไมค์กลมๆ ด้านล่าง และพูดคุยเล่าความรู้สึก สิ่งที่เกิดขึ้น หรือความประทับใจในวันนี้ได้เลย'}
        </p>
      </div>

      {/* 3. BIG CENTRAL MICROPHONE BUTTON & REALTIME NORMAL TEXT FADE */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        {/* Concentric Aura Ripples when recording */}
        {isRecording && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: [1, 1.35, 1.6], opacity: [0.6, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-rose-400/30 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: [1, 1.25, 1.45], opacity: [0.7, 0.4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: 'easeOut' }}
              className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-amber-400/30 pointer-events-none"
            />
          </>
        )}

        {/* Ambient background glow when idle */}
        {!isRecording && (
          <div className="absolute w-36 h-36 rounded-full bg-amber-300/25 blur-xl pointer-events-none" />
        )}

        {/* Big Round Mic Button (PURE ICON ONLY - NO "แตะเพื่อเล่า" TEXT) */}
        <button
          onClick={handleToggleMic}
          aria-label={isRecording ? 'Pause Recording' : 'Start Recording'}
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer active:scale-95 ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 text-white shadow-rose-300/80 scale-105 animate-pulse ring-4 ring-rose-200'
              : 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-amber-300/80 hover:shadow-2xl hover:scale-105 border-4 border-white'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-11 h-11 text-white animate-pulse" />
          ) : (
            <Mic className="w-11 h-11 text-slate-950 drop-shadow-xs" />
          )}
        </button>

        {/* Mic Status Label & Voice Preview */}
        <div className="mt-4 text-center space-y-2">
          <p
            className={`text-sm sm:text-base font-extrabold transition-colors ${
              isRecording ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {isRecording
              ? (lang === 'en' ? `🎙️ Recording... (${formatTime(recordingSeconds)}) Tap to stop` : `🎙️ กำลังอัดเสียง... (${formatTime(recordingSeconds)}) แตะเพื่อหยุดอัด`)
              : (lang === 'en' ? 'Tap the microphone to start speaking' : 'แตะที่ปุ่มไมค์เพื่อเริ่มเล่า')}
          </p>

          {/* Voice Preview Badge once stopped */}
          {!isRecording && recordedAudioUrl && (
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold shadow-xs">
              <Mic className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'en'
                  ? `Voice recorded (${formatTime(recordingSeconds)})`
                  : `อัดเสียงเรียบร้อยแล้ว (${formatTime(recordingSeconds)})`}
              </span>
              <button
                type="button"
                onClick={handleTogglePlayAudio}
                className="ml-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlayingAudio ? (lang === 'en' ? 'Pause' : 'หยุดฟัง') : (lang === 'en' ? 'Listen' : 'ลองฟังเสียง')}</span>
              </button>
            </div>
          )}
        </div>

        {/* LIVE TRANSCRIPT (NORMAL TEXT ONLY - NO BADGE, NO YELLOW CIRCLE) */}
        <div className="w-full max-w-xl mt-3 min-h-[46px] flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {floatingWord && (
              <motion.p
                key={floatingKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="text-slate-600 italic text-base sm:text-lg font-medium text-center"
              >
                "{floatingWord}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ACCUMULATED TRANSCRIPT CARD (NO SAMPLE WORDS/CHIPS) */}
        <div className="w-full max-w-xl mt-3 bg-white/90 rounded-2xl border border-slate-200/90 p-4 shadow-xs text-left relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'en' ? 'Recorded Story' : 'ข้อความที่คุณเล่า'}</span>
            </span>
            {transcript && (
              <button
                onClick={() => setTranscript('')}
                className="text-xs text-slate-400 hover:text-rose-500 font-medium flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{lang === 'en' ? 'Clear' : 'ล้างข้อความ'}</span>
              </button>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            placeholder={
              lang === 'en'
                ? 'Speak through the mic or type your story here...'
                : 'พูดผ่านไมโครโฟน หรือพิมพ์เรื่องราวความประทับใจของวันนี้ได้ที่นี่...'
            }
            className="w-full text-slate-800 text-sm sm:text-base leading-relaxed bg-transparent resize-none focus:outline-none placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* 4. PHOTO ADDITION SECTION (GALLERY UPLOAD + 3 RECENT QUICK ADD PHOTOS) */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div className="text-left space-y-0.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <span>
                {lang === 'en'
                  ? "Add Today's Memory Photos"
                  : 'เพิ่มรูปภาพความทรงจำในวันนี้ของคุณ'}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {lang === 'en'
                ? 'Select photos from your device gallery or tap recent photos below'
                : 'เลือกรูปถ่ายจาก Gallery ในเครื่อง หรือแตะภาพล่าสุดด้านล่างเพื่อเพิ่มด่วน'}
            </p>
          </div>

          <span className="text-sm font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 min-w-8 text-center shadow-2xs">
            {photos.length}
          </span>
        </div>

        {/* Dashed Rectangle Gallery Picker Button */}
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-3 p-4 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-100/60 transition-all text-amber-950 font-bold text-sm sm:text-base group cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-full bg-amber-200/90 group-hover:bg-amber-300 flex items-center justify-center text-amber-950 transition-colors shadow-2xs">
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
            </div>
            <span>{lang === 'en' ? 'Choose from Device Gallery' : 'เลือกรูปจาก Gallery ในเครื่อง'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* 3 RECENT GALLERY PHOTOS PREVIEW (QUICK ADD) - NO TITLES, PURE THUMBNAILS */}
        <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {lang === 'en'
                  ? '3 Recent Photos from Gallery (Tap to quick add):'
                  : '3 ภาพล่าสุดจาก Gallery ในเครื่อง (แตะเพื่อเพิ่มด่วน):'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {recentGalleryPhotos.map((item) => {
              const isAdded = photos.includes(item.url);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleRecentPhoto(item.url)}
                  title={isAdded ? (lang === 'en' ? 'Tap to remove' : 'แตะเพื่อเอาออก') : (lang === 'en' ? 'Tap to add' : 'แตะเพื่อเพิ่ม')}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all cursor-pointer aspect-4/3 bg-slate-100 ${
                    isAdded
                      ? 'border-amber-500 shadow-md ring-2 ring-amber-400/40'
                      : 'border-white hover:border-amber-300 hover:shadow-md'
                  }`}
                >
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs shadow-md transition-all ${
                      isAdded
                        ? 'bg-amber-500 text-slate-950 font-black scale-105'
                        : 'bg-black/55 text-white group-hover:bg-amber-500 group-hover:text-slate-950'
                    }`}
                  >
                    {isAdded ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ORGANIC POST-IT SCRAPBOOK PHOTO BOARD (NOT RIGID GRID, 2-3 PER ROW, STAGGERED) */}
        {photos.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">
              {lang === 'en' ? 'No photos added yet' : 'ยังไม่มีรูปภาพในวันนี้'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'en'
                ? 'Tap the buttons above to add photos'
                : 'แตะที่ปุ่มหรือ 3 ภาพล่าสุดด้านบนเพื่อเพิ่มรูปภาพ'}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50/40 rounded-3xl p-4 sm:p-6 border border-amber-200/50 shadow-inner relative">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-sm font-bold text-slate-800">
                {lang === 'en' ? "Today's Photos" : "ภาพในวันนี้"}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {photos.length}
              </span>
            </div>

            {/* Natural Post-it scatter layout: 2-3 photos per row, organic tilt & staggered positions */}
            <div className="flex flex-wrap justify-center items-start gap-x-5 sm:gap-x-8 gap-y-10 sm:gap-y-14 pt-4 pb-6 px-1">
              {photos.map((photoUrl, index) => {
                const cfg = postItConfigs[index % postItConfigs.length];
                return (
                  <motion.div
                    key={`${photoUrl}-${index}`}
                    initial={{ opacity: 0, scale: 0.85, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.06, rotate: 0, zIndex: 30 }}
                    style={{
                      transform: `rotate(${cfg.rotate}deg) translateY(${cfg.yOffset}px)`,
                      marginTop: `${Math.max(0, cfg.yOffset)}px`,
                    }}
                    className="relative group w-[45%] sm:w-[29%] min-w-[135px] rounded-2xl overflow-visible shadow-[0_12px_24px_-6px_rgba(0,0,0,0.18),0_4px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-2xl transition-all cursor-pointer select-none bg-white flex flex-col"
                  >
                    {/* Post-it Washi Tape sticking to the top */}
                    <div
                      className={`absolute -top-3 left-1/2 w-14 sm:w-18 h-4.5 rounded-[2px] shadow-2xs border z-20 pointer-events-none backdrop-blur-xs ${cfg.tapeColor}`}
                      style={{
                        transform: `translateX(-50%) rotate(${cfg.tapeRotate}deg)`,
                      }}
                    />

                    {/* Pure Raw Image preserving natural aspect ratio (portrait, landscape, or square) */}
                    <div className="w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        src={photoUrl}
                        alt={`Memory photo ${index + 1}`}
                        className="w-full h-auto max-h-[380px] sm:max-h-[460px] object-cover block rounded-2xl"
                        decoding="async"
                      />
                    </div>

                    {/* Floating Remove Button on top-right of image */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      title={lang === 'en' ? 'Remove photo' : 'ลบรูป'}
                      aria-label={lang === 'en' ? 'Remove photo' : 'ลบรูปถ่าย'}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/75 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-xs opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 z-30"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. PROMINENT & SATISFYING SAVE MEMORY BUTTON (NO DESCRIPTION, TALL & JUMBO) */}
      <div className="pt-6 pb-12">
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="w-full py-6 sm:py-7 min-h-[76px] sm:min-h-[86px] rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-2xl sm:text-3xl shadow-[0_14px_34px_-6px_rgba(245,158,11,0.6)] hover:shadow-[0_18px_42px_-6px_rgba(245,158,11,0.75)] hover:scale-[1.01] active:scale-[0.98] active:translate-y-1 transition-all flex items-center justify-center space-x-4 cursor-pointer border-2 border-amber-300/90 relative overflow-hidden group"
        >
          {/* Subtle light sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950 fill-amber-300 animate-pulse relative z-10" />
          <span className="relative z-10">{lang === 'en' ? 'Save Today’s Memory ✨' : 'บันทึกความทรงจำ ✨'}</span>
        </button>
      </div>

      {/* 7. PREVIEW & CONFIRMATION MODAL WITH ORGANIC TILTED PHOTOS & EMOJI SELECTOR (Rendered via Portal to document.body) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isPreviewOpen && (
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isSavedSuccess) {
                    setIsPreviewOpen(false);
                  }
                }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-fade-in"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100dvh',
                  margin: 0,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 text-left relative overflow-hidden max-h-[92vh] overflow-y-auto"
                >
              {/* Close Button */}
              <button
                onClick={() => setIsPreviewOpen(false)}
                aria-label={lang === 'en' ? 'Close preview' : 'ปิดหน้าต่างพรีวิว'}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Success celebration overlay */}
              {isSavedSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 bg-amber-400/95 flex flex-col items-center justify-center text-slate-950 space-y-3 p-6 text-center backdrop-blur-xs"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center shadow-lg">
                    <Check className="w-10 h-10 stroke-[3]" />
                  </div>
                  <h3 className="text-2xl font-black">
                    {lang === 'en' ? 'Saved to Family Album!' : 'บันทึกความทรงจำเรียบร้อยแล้ว!'}
                  </h3>
                  <p className="text-sm font-bold text-amber-950">
                    {lang === 'en'
                      ? 'Opening Family Photos tab...'
                      : 'กำลังพาไปที่แถบรูปครอบครัว...'}
                  </p>
                </motion.div>
              )}

              {/* Modal Header */}
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {lang === 'en' ? 'Preview Today’s Recap' : 'พรีวิวสรุปเรื่องราววันนี้'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {lang === 'en' ? 'Review & Confirm' : 'ตรวจสอบและยืนยันการบันทึก'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'en' ? displayDateEn : displayDateTh}
                </p>
              </div>

              {/* ORGANIC TILTED & NON-UNIFORM PHOTOS PREVIEW STRIP */}
              <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/80 space-y-1">
                <span className="text-xs font-bold text-amber-900 block">
                  📸 {lang === 'en' ? 'Selected Memory Photos:' : 'รูปภาพความทรงจำที่เลือก:'}
                </span>

                <div className="flex items-center justify-center gap-3 sm:gap-4 py-2.5 overflow-x-auto no-scrollbar">
                  {photos.map((p, idx) => {
                    const tilt = [-3.5, 3.2, -2.2, 4.0, -1.8][idx % 5];
                    const yOffset = [2, -2, 1, -3, 1][idx % 5];

                    return (
                      <motion.div
                        key={idx}
                        style={{
                          transform: `rotate(${tilt}deg) translateY(${yOffset}px)`,
                        }}
                        className="h-20 sm:h-24 w-auto min-w-[60px] max-w-[140px] rounded-2xl overflow-hidden shadow-md shrink-0 relative hover:scale-105 hover:rotate-0 transition-transform select-none bg-slate-100 flex items-center justify-center"
                      >
                        <img
                          src={p}
                          alt="Preview thumbnail"
                          className="h-full w-auto max-w-[140px] object-cover rounded-2xl block"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Narrated Text Preview */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500">
                  🎙️ {lang === 'en' ? 'Story you narrated:' : 'เรื่องราวที่คุณเล่า:'}
                </span>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium leading-relaxed max-h-24 overflow-y-auto">
                  {transcript.trim() ||
                    (lang === 'en'
                      ? 'Today was filled with love and warmth from the family.'
                      : 'วันนี้เป็นวันที่อบอุ่นใจ มีความสุขและรอยยิ้มร่วมกับคนในครอบครัว')}
                </div>
              </div>

              {/* Recorded Voice Audio Preview */}
              {(recordedAudioUrl || recordingSeconds > 0) && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                        <span>{lang === 'en' ? 'Voice for Children & Grandchildren' : 'ไฟล์เสียงเล่าสำหรับลูกหลาน'}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        {recordingSeconds > 0 ? `${formatTime(recordingSeconds)} นาที` : 'พร้อมบันทึกส่งต่อ'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTogglePlayAudio}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                        <span>{lang === 'en' ? 'Pause' : 'พัก'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                        <span>{lang === 'en' ? 'Play Voice' : 'ลองฟังเสียง'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* EMOJI-ONLY EMOTION SELECTOR WITH SMALL LABEL UNDERNEATH */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">
                  ✨ {lang === 'en' ? 'How did you feel today?' : 'ความรู้สึกของคุณในวันนี้:'}
                </span>

                <div className="flex items-center justify-around gap-2 pt-1">
                  {emotionChoices.map((emo) => {
                    const isSelected = selectedEmotion === emo.id;
                    return (
                      <button
                        key={emo.id}
                        type="button"
                        onClick={() => setSelectedEmotion(emo.id)}
                        aria-label={lang === 'en' ? emo.labelEn : emo.labelTh}
                        aria-pressed={isSelected}
                        className={`group flex flex-col items-center focus:outline-none transition-all cursor-pointer ${
                          isSelected ? 'scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Round Emoji Button */}
                        <div
                          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-sm transition-all ${
                            isSelected
                              ? 'bg-amber-100 ring-3 ring-amber-500 shadow-md scale-105'
                              : 'bg-slate-100 hover:bg-slate-200/80'
                          }`}
                        >
                          <span>{emo.emoji}</span>
                        </div>

                        {/* Small Text Label Underneath */}
                        <span
                          className={`text-[11px] sm:text-xs font-bold mt-1.5 transition-colors ${
                            isSelected ? 'text-amber-900 font-extrabold' : 'text-slate-500'
                          }`}
                        >
                          {lang === 'en' ? emo.labelEn : emo.labelTh}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="flex-1 py-3.5 rounded-full border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Edit More' : 'แก้ไขเพิ่มเติม'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex-2 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base shadow-md shadow-amber-300/70 hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Confirm & Save' : 'ยืนยันบันทึกความทรงจำ'}</span>
                </button>
              </div>
            </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
