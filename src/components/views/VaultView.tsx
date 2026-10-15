import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryOrb, OrbEmotion, Language, DailyRecapMemory, NavigationPage } from '../../types';
import {
  Sparkles,
  Heart,
  Play,
  Pause,
  X,
  Volume2,
  ArrowRight,
  BookOpen,
  Calendar,
  Mic,
  Trash2,
  ChevronRight,
  Smile
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';
import { getDailyRecaps, deleteDailyRecap } from '../../services/recapStorage';

interface VaultViewProps {
  orbs: MemoryOrb[];
  onSelectOrbForTest: (orbId: string) => void;
  lang: Language;
  onNavigate?: (page: NavigationPage) => void;
}

const emotionFilters: { id: OrbEmotion | 'all'; labelTh: string; labelEn: string; color: string }[] = [
  { id: 'all', labelTh: 'ลูกแก้วทั้งหมด 🔮', labelEn: 'All Orbs 🔮', color: 'from-amber-400 to-indigo-500' },
  { id: 'joy', labelTh: 'ความสุข ☀️', labelEn: 'Joy ☀️', color: 'from-amber-400 to-yellow-500' },
  { id: 'nostalgia', labelTh: 'คิดถึงวันวาน 🌊', labelEn: 'Nostalgia 🌊', color: 'from-sky-400 to-blue-600' },
  { id: 'love', labelTh: 'ความรัก 💖', labelEn: 'Love 💖', color: 'from-rose-400 to-pink-600' },
  { id: 'vitality', labelTh: 'สดชื่น 🌿', labelEn: 'Vitality 🌿', color: 'from-emerald-400 to-teal-600' },
  { id: 'celebration', labelTh: 'ภาคภูมิใจ 🎉', labelEn: 'Pride 🎉', color: 'from-purple-400 to-indigo-600' },
];

export const VaultView: React.FC<VaultViewProps> = ({
  orbs,
  onSelectOrbForTest,
  lang,
  onNavigate,
}) => {
  // Main view segment: 'recaps' (Daily Stories) or 'orbs' (Inside Out Orbs)
  const [activeTab, setActiveTab] = useState<'recaps' | 'orbs'>('recaps');

  // Daily recaps state
  const [recaps, setRecaps] = useState<DailyRecapMemory[]>([]);
  const [selectedRecap, setSelectedRecap] = useState<DailyRecapMemory | null>(null);

  // Orbs filtering state
  const [activeFilter, setActiveFilter] = useState<OrbEmotion | 'all'>('all');
  const [expandedOrb, setExpandedOrb] = useState<MemoryOrb | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playingRecapId, setPlayingRecapId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load recaps from storage
  useEffect(() => {
    setRecaps(getDailyRecaps());
  }, []);

  const filteredOrbs =
    activeFilter === 'all' ? orbs : orbs.filter((o) => o.emotion === activeFilter);

  // Stop any playing voice
  const stopAllAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    stopSpeech();
    setIsPlayingAudio(false);
    setPlayingRecapId(null);
  };

  // Audio speech for expanded orb
  useEffect(() => {
    if (expandedOrb) {
      const textToSpeak =
        lang === 'en'
          ? expandedOrb.voicePromptEn || expandedOrb.voicePrompt
          : expandedOrb.voicePrompt;

      stopAllAudio();
      setIsPlayingAudio(true);
      speakWithElevenLabs(
        textToSpeak,
        undefined,
        () => {
          setIsPlayingAudio(false);
        },
        lang
      );
    } else {
      stopAllAudio();
    }

    return () => {
      stopAllAudio();
    };
  }, [expandedOrb, lang]);

  // Audio playback for daily recaps (Prioritizes real voice recording `audioUrl`, fallbacks to ElevenLabs)
  const handleToggleRecapAudio = (recap: DailyRecapMemory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (playingRecapId === recap.id) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    setPlayingRecapId(recap.id);
    setIsPlayingAudio(true);

    if (recap.audioUrl) {
      const audio = new Audio(recap.audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        setIsPlayingAudio(false);
        setPlayingRecapId(null);
      };
      audio.onerror = () => {
        // Fallback to ElevenLabs TTS
        speakWithElevenLabs(
          recap.transcript,
          undefined,
          () => {
            setIsPlayingAudio(false);
            setPlayingRecapId(null);
          },
          lang
        );
      };
      audio.play().catch(() => {
        // Fallback to ElevenLabs TTS
        speakWithElevenLabs(
          recap.transcript,
          undefined,
          () => {
            setIsPlayingAudio(false);
            setPlayingRecapId(null);
          },
          lang
        );
      });
    } else {
      speakWithElevenLabs(
        recap.transcript,
        undefined,
        () => {
          setIsPlayingAudio(false);
          setPlayingRecapId(null);
        },
        lang
      );
    }
  };

  // Handle delete recap
  const handleDeleteRecap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteDailyRecap(id);
    setRecaps(updated);
    if (selectedRecap?.id === id) {
      setSelectedRecap(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-2">
      {/* 1. WARM HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
        <div className="text-left space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>🖼️ {lang === 'en' ? 'Family Photo Vault' : 'รูปครอบครัวและความทรงจำ'}</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {lang === 'en'
              ? 'View daily storytelling recaps and interactive family memory orbs.'
              : 'ชมบันทึกเรื่องราวในแต่ละวัน และลูกแก้วความทรงจำของครอบครัว'}
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('today-recap')}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 cursor-pointer border border-amber-300/80"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? '+ New Story' : '+ เล่าเรื่องราววันนี้'}</span>
          </button>
        )}
      </div>

      {/* 2. TAB SWITCHER (DAILY RECAPS vs MEMORY ORBS) */}
      <div className="flex items-center bg-slate-200/80 p-1.5 rounded-full max-w-md mx-auto shadow-inner">
        <button
          onClick={() => {
            stopAllAudio();
            setActiveTab('recaps');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'recaps'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>{lang === 'en' ? 'Daily Stories' : 'บันทึกเรื่องราวประจำวัน'}</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
            {recaps.length}
          </span>
        </button>

        <button
          onClick={() => {
            stopAllAudio();
            setActiveTab('orbs');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'orbs'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{lang === 'en' ? 'Memory Orbs' : 'ลูกแก้วความทรงจำ'}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">
            {orbs.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DAILY STORIES (TODAY'S RECAPS LIST)
         ========================================================================= */}
      {activeTab === 'recaps' && (
        <div className="space-y-4">
          {recaps.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/70 rounded-3xl border border-slate-200 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700">
                {lang === 'en' ? 'No daily stories recorded yet' : 'ยังไม่มีบันทึกเรื่องราวประจำวัน'}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {lang === 'en'
                  ? 'Start your first daily recap today by tapping the record button.'
                  : 'เริ่มต้นบันทึกความรู้สึกและรูปภาพของวันนี้ได้ง่ายๆ เพียงแตะปุ่มด้านล่าง'}
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('today-recap')}
                  className="mt-2 inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-transform active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Tell Today’s Story' : 'เริ่มเล่าเรื่องราววันนี้'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recaps.map((recap, index) => {
                const dateLabel = lang === 'en' ? recap.displayDateEn : recap.displayDateTh;
                return (
                  <motion.div
                    key={recap.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => setSelectedRecap(recap)}
                    className="group bg-white rounded-3xl border border-slate-200/90 hover:border-amber-300/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          <Calendar className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          {dateLabel}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold capitalize">
                          {recap.emotion === 'joy' && (lang === 'en' ? 'Joy ☀️' : 'ความสุข ☀️')}
                          {recap.emotion === 'love' && (lang === 'en' ? 'Love 💖' : 'ความรัก 💖')}
                          {recap.emotion === 'nostalgia' && (lang === 'en' ? 'Nostalgia 🌊' : 'คิดถึงวันวาน 🌊')}
                          {recap.emotion === 'vitality' && (lang === 'en' ? 'Vitality 🌿' : 'สดชื่น 🌿')}
                          {recap.emotion === 'celebration' && (lang === 'en' ? 'Pride 🎉' : 'ภาคภูมิใจ 🎉')}
                        </span>
                        <button
                          onClick={(e) => handleDeleteRecap(recap.id, e)}
                          title={lang === 'en' ? 'Delete' : 'ลบบันทึก'}
                          aria-label={lang === 'en' ? 'Delete story recap' : 'ลบบันทึกเรื่องราว'}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Mini Scrapbook Photos Thumbnail */}
                      {recap.photos && recap.photos.length > 0 && (
                        <div className="flex items-center space-x-1.5 shrink-0 py-1">
                          {recap.photos.slice(0, 3).map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                transform: `rotate(${pIdx === 0 ? '-3deg' : pIdx === 1 ? '2.5deg' : '-1.5deg'})`,
                              }}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                            >
                              <img
                                src={photoUrl}
                                alt="Memory thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {recap.photos.length > 3 && (
                            <span className="text-xs font-bold text-slate-400 pl-1">
                              +{recap.photos.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Story Transcript Snippet */}
                      <div className="flex-1 space-y-2">
                        <p className="text-slate-700 text-sm sm:text-base font-medium line-clamp-2 leading-relaxed">
                          "{recap.transcript}"
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                          {/* Audio playback button for grandchildren */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleRecapAudio(recap, e)}
                            aria-label={
                              playingRecapId === recap.id
                                ? (lang === 'en' ? 'Pause story voice' : 'พักเสียงเล่า')
                                : (lang === 'en' ? 'Play story voice' : 'เปิดฟังเสียงเล่า')
                            }
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                              playingRecapId === recap.id
                                ? 'bg-rose-500 text-white animate-pulse'
                                : recap.audioUrl
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {playingRecapId === recap.id ? (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
                            )}
                            <span>
                              {playingRecapId === recap.id
                                ? (lang === 'en' ? 'Playing Voice...' : 'กำลังเล่นเสียง...')
                                : recap.audioUrl
                                ? (lang === 'en' ? '🎙️ Grandma’s Voice' : '🎙️ ฟังเสียงเล่าคุณยาย')
                                : (lang === 'en' ? '🔊 Read Aloud' : '🔊 ฟังเสียงอ่าน')}
                            </span>
                            {recap.audioDurationSec ? (
                              <span className="opacity-75 text-[10px]">({recap.audioDurationSec}s)</span>
                            ) : null}
                          </button>

                          <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
                            <span>{lang === 'en' ? 'Full Story' : 'ดูบันทึกฉบับเต็ม'}</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* DETAIL MODAL FOR DAILY RECAP */}
          <AnimatePresence>
            {selectedRecap && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[32px] border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 text-left relative overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                  <button
                    onClick={() => {
                      stopAllAudio();
                      setSelectedRecap(null);
                    }}
                    aria-label={lang === 'en' ? 'Close story details' : 'ปิดรายละเอียดบันทึก'}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>{lang === 'en' ? selectedRecap.displayDateEn : selectedRecap.displayDateTh}</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {lang === 'en' ? "Today's Family Story" : 'เรื่องราวความทรงจำประจำวัน'}
                    </h3>
                  </div>

                  {/* Polaroid Scrapbook Gallery Grid inside Detail */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2">
                    {selectedRecap.photos.map((photoUrl, pIndex) => (
                      <div
                        key={pIndex}
                        style={{
                          transform: `rotate(${pIndex % 2 === 0 ? '-2deg' : '2deg'})`,
                        }}
                        className="bg-white p-2 rounded-2xl border border-slate-200 shadow-md"
                      >
                        <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100">
                          <img
                            src={photoUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Full Story Text & Voice Player */}
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-amber-950 block">
                            {selectedRecap.audioUrl
                              ? (lang === 'en' ? 'Grandma’s Real Recorded Voice' : 'เสียงบันทึกจริงของคุณยาย (สำหรับลูกหลาน)')
                              : (lang === 'en' ? 'Story Voice & Words' : 'เรื่องเล่าจากใจคุณ')}
                          </span>
                          <span className="text-[11px] text-amber-800 font-medium">
                            {selectedRecap.audioDurationSec
                              ? (lang === 'en' ? `Audio length: ${selectedRecap.audioDurationSec}s` : `ความยาวเสียง ${selectedRecap.audioDurationSec} วินาที`)
                              : (lang === 'en' ? 'Tap to listen to the story' : 'แตะเพื่อเปิดฟังเสียงเรื่องเล่า')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleRecapAudio(selectedRecap)}
                        aria-label={
                          playingRecapId === selectedRecap.id
                            ? (lang === 'en' ? 'Pause voice' : 'พักเสียง')
                            : (lang === 'en' ? 'Play voice' : 'เปิดฟังเสียง')
                        }
                        className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                          playingRecapId === selectedRecap.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-white hover:bg-amber-100 text-amber-950 border border-amber-300'
                        }`}
                      >
                        {playingRecapId === selectedRecap.id ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>{lang === 'en' ? 'Pause' : 'พักเสียง'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
                            <span>{lang === 'en' ? 'Listen Voice' : 'ฟังเสียงเล่า'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed bg-white/70 p-4 rounded-xl border border-amber-200/60">
                      "{selectedRecap.transcript}"
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        stopAllAudio();
                        setSelectedRecap(null);
                      }}
                      className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-transform active:scale-95 cursor-pointer"
                    >
                      {lang === 'en' ? 'Close' : 'ปิด'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INSIDE OUT MEMORY ORBS
         ========================================================================= */}
      {activeTab === 'orbs' && (
        <div className="space-y-6">
          {/* Emotion Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {emotionFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all active:scale-95 shadow-2xs cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{lang === 'en' ? f.labelEn : f.labelTh}</span>
              </button>
            ))}
          </div>

          {/* Expanded Memory Orb Stage */}
          <AnimatePresence>
            {expandedOrb && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 280, damping: 25 }}
                className="relative w-full max-w-xl mx-auto bg-white rounded-[32px] border border-slate-200/90 shadow-xl overflow-hidden my-2 text-left"
              >
                <div className="absolute top-3.5 right-3.5 z-20">
                  <button
                    onClick={() => setExpandedOrb(null)}
                    aria-label={lang === 'en' ? 'Close expanded memory orb' : 'ปิดลูกแก้วความทรงจำ'}
                    className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                    title="Close / ปิด"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative w-full aspect-16/10 bg-slate-950 overflow-hidden">
                  <img
                    src={expandedOrb.photoUrl}
                    alt={expandedOrb.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                  <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm border border-white/60 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {expandedOrb.emotion === 'joy' && (lang === 'en' ? 'Joy ☀️' : 'ความสุข ☀️')}
                      {expandedOrb.emotion === 'nostalgia' && (lang === 'en' ? 'Nostalgia 🌊' : 'คิดถึงวันวาน 🌊')}
                      {expandedOrb.emotion === 'love' && (lang === 'en' ? 'Love 💖' : 'ความรัก 💖')}
                      {expandedOrb.emotion === 'vitality' && (lang === 'en' ? 'Vitality 🌿' : 'สดชื่น 🌿')}
                      {expandedOrb.emotion === 'celebration' && (lang === 'en' ? 'Pride 🎉' : 'ภาคภูมิใจ 🎉')}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                        {lang === 'en' && expandedOrb.titleEn ? expandedOrb.titleEn : expandedOrb.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {lang === 'en' && expandedOrb.memoryYearEn ? expandedOrb.memoryYearEn : expandedOrb.memoryYear}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (isPlayingAudio) {
                          stopSpeech();
                          setIsPlayingAudio(false);
                        } else {
                          const textToSpeak = lang === 'en'
                            ? (expandedOrb.voicePromptEn || expandedOrb.voicePrompt)
                            : expandedOrb.voicePrompt;
                          setIsPlayingAudio(true);
                          speakWithElevenLabs(textToSpeak, undefined, () => {
                            setIsPlayingAudio(false);
                          }, lang);
                        }
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        isPlayingAudio
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isPlayingAudio ? (lang === 'en' ? 'Playing' : 'กำลังอ่าน') : (lang === 'en' ? 'Listen' : 'ฟังเสียง')}</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                    {lang === 'en' && expandedOrb.descriptionEn ? expandedOrb.descriptionEn : (expandedOrb.description || expandedOrb.voicePrompt)}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      {lang === 'en' ? 'Uploaded by: ' : 'บันทึกโดย: '}
                      <strong className="text-slate-700 font-semibold">{lang === 'en' && expandedOrb.uploadedByEn ? expandedOrb.uploadedByEn : (expandedOrb.uploadedBy || 'ครอบครัว')}</strong>
                    </span>

                    <button
                      onClick={() => onSelectOrbForTest(expandedOrb.id)}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{lang === 'en' ? 'Play this Memory' : 'เล่นทบทวนความทรงจำนี้'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shelves of Memory Orbs */}
          <div className="bg-gradient-to-b from-slate-100/70 via-slate-50/50 to-white/90 rounded-[36px] border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-10 sm:gap-y-12 gap-x-4 sm:gap-x-6 justify-items-center">
              {filteredOrbs.map((orb) => {
                const isSelected = expandedOrb?.id === orb.id;
                const orbTitle = lang === 'en' && orb.titleEn ? orb.titleEn : orb.title;
                const orbYear = lang === 'en' && orb.memoryYearEn ? orb.memoryYearEn : orb.memoryYear;

                const gradient = orb.emotion === 'joy'
                  ? 'from-amber-200 via-amber-400 to-yellow-600'
                  : orb.emotion === 'nostalgia'
                  ? 'from-sky-200 via-sky-400 to-blue-700'
                  : orb.emotion === 'love'
                  ? 'from-rose-200 via-pink-400 to-rose-700'
                  : orb.emotion === 'vitality'
                  ? 'from-emerald-200 via-emerald-400 to-teal-700'
                  : 'from-purple-300 via-violet-500 to-indigo-800';

                return (
                  <button
                    key={orb.id}
                    onClick={() => {
                      if (expandedOrb?.id === orb.id) {
                        setExpandedOrb(null);
                      } else {
                        setExpandedOrb(orb);
                      }
                    }}
                    className={`group relative flex flex-col items-center focus:outline-none transition-transform duration-300 cursor-pointer ${
                      isSelected ? 'scale-115' : 'hover:scale-108 active:scale-95'
                    }`}
                    title={`${orbTitle} - แตะเพื่อเปิดลูกแก้ว`}
                  >
                    {/* Glowing Gradient Aura radiating around every orb */}
                    <div
                      className={`absolute -inset-3 sm:-inset-4 rounded-full bg-gradient-to-tr ${gradient} ${
                        isSelected ? 'opacity-90 scale-125' : 'opacity-50 group-hover:opacity-90 group-hover:scale-120'
                      } filter blur-md transition-all duration-500 pointer-events-none`}
                    />
                    <div
                      className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${gradient} opacity-40 filter blur-xs pointer-events-none`}
                    />

                    {/* Spherical Glowing Glass Memory Orb (Round, Small, Inside Out Style) */}
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-full shrink-0 relative glass-memory-orb-light flex items-center justify-center shadow-lg p-1.5 transition-all duration-300 overflow-hidden ${
                      isSelected ? 'ring-3 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.8)]' : 'group-hover:shadow-[0_0_24px_rgba(251,191,36,0.5)]'
                    }`}>
                      <div
                        className={`w-full h-full aspect-square rounded-full bg-gradient-to-tr ${gradient} animate-mist-swirl opacity-90 filter blur-[0.8px] shadow-inner`}
                      />

                      <div className="absolute inset-1.5 aspect-square rounded-full overflow-hidden opacity-35 mix-blend-overlay pointer-events-none">
                        <img
                          src={orb.photoUrl}
                          alt=""
                          className="w-full h-full aspect-square rounded-full object-cover"
                        />
                      </div>

                      <div className="orb-shine-light" />
                      <div className="orb-bottom-rim-light" />

                      {orb.isUnlocked && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-amber-300/80 shadow-[0_0_14px_rgba(251,191,36,0.7)] pointer-events-none" />
                      )}
                    </div>

                    <div className="w-14 sm:w-16 h-2 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-200 border border-slate-300/60 shadow-xs -mt-1 z-10" />

                    <span className="mt-2.5 text-xs sm:text-sm font-bold text-slate-800 text-center line-clamp-1 max-w-[120px] group-hover:text-amber-600 transition-colors">
                      {orbTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {orbYear.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
