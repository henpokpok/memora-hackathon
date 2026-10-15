import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import { recentGalleryPhotos, saveDailyRecap } from '../../services/recapStorage';

interface TodayRecapViewProps {
  onNavigate: (page: NavigationPage) => void;
  lang: Language;
}

// Organic post-it rotations
const postItRotations = [-2.8, 2.5, -1.8, 3.2, -2.2, 1.9, -3.0, 2.7];

// Emotion choices with big emoji and small label underneath
const emotionChoices: { id: OrbEmotion; emoji: string; labelTh: string; labelEn: string }[] = [
  { id: 'joy', emoji: '☀️', labelTh: 'มีความสุข', labelEn: 'Joyful' },
  { id: 'love', emoji: '💖', labelTh: 'อบอุ่นใจ', labelEn: 'Warm Love' },
  { id: 'nostalgia', emoji: '🌊', labelTh: 'คิดถึงวันวาน', labelEn: 'Nostalgic' },
  { id: 'vitality', emoji: '🌿', labelTh: 'สดชื่น', labelEn: 'Peaceful' },
  { id: 'celebration', emoji: '🎉', labelTh: 'ภาคภูมิใจ', labelEn: 'Proud' },
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

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

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

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang === 'en' ? 'en-US' : 'th-TH';

        recognition.onresult = (event: any) => {
          let currentSentence = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const part = event.results[i][0].transcript;
            currentSentence += part;
            if (event.results[i].isFinal) {
              setTranscript((prev) => (prev ? `${prev} ${part.trim()}` : part.trim()));
              setFloatingWord(part.trim());
              setFloatingKey((k) => k + 1);
            }
          }
          if (currentSentence && !event.results[event.results.length - 1].isFinal) {
            setFloatingWord(currentSentence);
            setFloatingKey((k) => k + 1);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e.error);
        };

        recognition.onend = () => {
          if (isRecording) {
            try {
              recognition.start();
            } catch (err) {
              // Ignore restart error
            }
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Web Speech API not initialized:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [lang, isRecording]);

  // Handle Toggle Mic
  const handleToggleMic = () => {
    if (!isRecording) {
      setIsRecording(true);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang === 'en' ? 'en-US' : 'th-TH';
          recognitionRef.current.start();
        }
      } catch (e) {
        console.warn('Error starting speech recognition:', e);
      }
      if (!transcript) {
        const sampleText =
          lang === 'en'
            ? 'Today was peaceful and filled with joy...'
            : 'วันนี้ไปเดินเล่นที่สวนดอกไม้มา บรรยากาศร่มรื่น สบายใจมากเลยจ้ะ...';
        setFloatingWord(sampleText);
        setFloatingKey((k) => k + 1);
      }
    } else {
      setIsRecording(false);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
    }
  };

  // Handle File Upload from Local Device Gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setPhotos((prev) => [...prev, uploadEvent.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Quick Add from Recent Gallery Photos
  const handleQuickAddPhoto = (url: string) => {
    if (!photos.includes(url)) {
      setPhotos((prev) => [...prev, url]);
    }
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
      audioDurationSec: Math.floor(Math.random() * 30) + 20,
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

        {/* Mic Status Label */}
        <div className="mt-4 text-center">
          <p
            className={`text-sm sm:text-base font-extrabold transition-colors ${
              isRecording ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {isRecording
              ? (lang === 'en' ? '🎙️ Listening... Tap again to pause' : '🎙️ กำลังฟังคุณเล่า... แตะอีกครั้งเพื่อพักการเล่า')
              : (lang === 'en' ? 'Tap the microphone to start speaking' : 'แตะที่ปุ่มไมค์เพื่อเริ่มเล่า')}
          </p>
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

          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            {photos.length} {lang === 'en' ? 'Photos' : 'รูปภาพ'}
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

        {/* 3 RECENT GALLERY PHOTOS PREVIEW (QUICK ADD) */}
        <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/90 space-y-2">
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

          <div className="grid grid-cols-3 gap-3">
            {recentGalleryPhotos.map((item) => {
              const isAdded = photos.includes(item.url);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickAddPhoto(item.url)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all p-1 text-left flex flex-col cursor-pointer ${
                    isAdded
                      ? 'border-amber-400 bg-amber-50/80 shadow-xs'
                      : 'border-white bg-white hover:border-amber-300 hover:shadow-md'
                  }`}
                >
                  <div className="aspect-4/3 w-full rounded-lg overflow-hidden relative bg-slate-100">
                    <img
                      src={item.url}
                      alt={lang === 'en' ? item.titleEn : item.titleTh}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div
                      className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs transition-transform ${
                        isAdded
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-black/50 text-white group-hover:bg-amber-500 group-hover:text-slate-950'
                      }`}
                    >
                      {isAdded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="pt-1.5 px-0.5">
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                      {lang === 'en' ? item.titleEn : item.titleTh}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'en' ? item.timeEn : item.timeTh}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ORGANIC POST-IT / SCRAPBOOK PHOTO GRID */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-4 pb-4">
            {photos.map((photoUrl, index) => {
              const rotation = postItRotations[index % postItRotations.length];
              return (
                <motion.div
                  key={`${photoUrl}-${index}`}
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.04, rotate: 0 }}
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="relative group bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg border border-slate-200/80 transition-all select-none"
                >
                  {/* Decorative Washi Tape on top */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4.5 bg-amber-200/80 rounded-xs border border-white/60 shadow-2xs rotate-1 pointer-events-none backdrop-blur-2xs" />

                  {/* Photo Container */}
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                    <img
                      src={photoUrl}
                      alt={`Memory ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Polaroid Bottom Note */}
                  <div className="pt-2 flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      #{index + 1} {lang === 'en' ? 'Memory' : 'ความทรงจำ'}
                    </span>
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      title={lang === 'en' ? 'Remove' : 'ลบรูป'}
                      className="w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. PROMINENT & SATISFYING SAVE MEMORY BUTTON */}
      <div className="pt-5 pb-10">
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xl sm:text-2xl shadow-[0_12px_28px_-6px_rgba(245,158,11,0.55)] hover:shadow-[0_16px_36px_-6px_rgba(245,158,11,0.7)] hover:scale-[1.01] active:scale-[0.98] active:translate-y-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 border-amber-300/90 relative overflow-hidden group"
        >
          {/* Subtle light sheen effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

          <div className="flex items-center space-x-3 relative z-10">
            <Sparkles className="w-6 h-6 text-slate-950 fill-amber-300 animate-pulse" />
            <span>{lang === 'en' ? 'Save Today’s Memory ✨' : 'บันทึกความทรงจำ ✨'}</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-amber-950/80 mt-0.5 relative z-10">
            {lang === 'en' ? 'Tap to preview and confirm saving' : 'แตะเพื่อตรวจสอบและยืนยันการบันทึก'}
          </span>
        </button>
      </div>

      {/* 7. PREVIEW & CONFIRMATION MODAL WITH ORGANIC TILTED PHOTOS & EMOJI SELECTOR */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 text-left relative overflow-hidden max-h-[92vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsPreviewOpen(false)}
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

                <div className="flex items-center justify-center gap-3 sm:gap-4 py-2 overflow-x-auto no-scrollbar">
                  {photos.map((p, idx) => {
                    // Non-uniform tilts and vertical displacements for realistic scrapbook look
                    const tilt = [-3.5, 3.2, -2.2, 4.0, -1.8][idx % 5];
                    const yOffset = [3, -3, 2, -4, 2][idx % 5];

                    return (
                      <motion.div
                        key={idx}
                        style={{
                          transform: `rotate(${tilt}deg) translateY(${yOffset}px)`,
                        }}
                        className="bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-md shrink-0 relative hover:scale-105 hover:rotate-0 transition-transform select-none"
                      >
                        {/* Little Tape on Polaroid corner */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-amber-200/90 rounded-2xs border border-white/50 shadow-2xs rotate-2 pointer-events-none" />

                        <div className="w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-lg overflow-hidden bg-slate-100">
                          <img
                            src={p}
                            alt="Preview thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
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
      </AnimatePresence>
    </div>
  );
};
