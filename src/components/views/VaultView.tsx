import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryOrb, OrbEmotion, Language, DailyRecapMemory, NavigationPage } from '../../types';
import { MemoryOrb as MemoryOrbView } from '../common/MemoryOrb';
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
  ChevronLeft,
  Smile,
  Clock,
  MoreVertical
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';
import { getDailyRecaps, deleteDailyRecap } from '../../services/recapStorage';
import { isImagePreloaded } from '../../services/imagePreloader';

interface VaultViewProps {
  orbs: MemoryOrb[];
  onSelectOrbForTest: (orbId: string) => void;
  lang: Language;
  onNavigate?: (page: NavigationPage) => void;
}

interface CategoryStyle {
  gradient: string;
  auraColor: string;
  glowHex: string;
  radialGradient: string;
  labelTh: string;
  labelEn: string;
  emoji: string;
  descTh: string;
  descEn: string;
}

const emotionStyles: Record<OrbEmotion, CategoryStyle> = {
  joy: {
    gradient: 'from-amber-300 via-amber-500 to-yellow-600',
    auraColor: 'rgba(251, 191, 36, 0.85)',
    glowHex: '#FBBF24',
    radialGradient: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(245,158,11,0.18) 55%, transparent 100%)',
    labelTh: 'ความสุข',
    labelEn: 'Joy',
    emoji: '☀️',
    descTh: 'รอยยิ้มเสียงหัวเราะ',
    descEn: 'Smiles & Laughter',
  },
  nostalgia: {
    gradient: 'from-sky-300 via-cyan-500 to-blue-600',
    auraColor: 'rgba(14, 165, 233, 0.85)',
    glowHex: '#0EA5E9',
    radialGradient: 'radial-gradient(circle, rgba(14,165,233,0.55) 0%, rgba(2,132,199,0.18) 55%, transparent 100%)',
    labelTh: 'วันวาน',
    labelEn: 'Nostalgia',
    emoji: '🌊',
    descTh: 'สถานที่และความหลัง',
    descEn: 'Trips & Places',
  },
  love: {
    gradient: 'from-rose-300 via-pink-500 to-rose-600',
    auraColor: 'rgba(244, 63, 94, 0.85)',
    glowHex: '#F43F5E',
    radialGradient: 'radial-gradient(circle, rgba(244,63,94,0.55) 0%, rgba(225,29,72,0.18) 55%, transparent 100%)',
    labelTh: 'ความรัก',
    labelEn: 'Love',
    emoji: '💖',
    descTh: 'ความอบอุ่นครอบครัว',
    descEn: 'Family Warmth',
  },
  vitality: {
    gradient: 'from-emerald-300 via-teal-500 to-green-600',
    auraColor: 'rgba(16, 185, 129, 0.85)',
    glowHex: '#10B981',
    radialGradient: 'radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(5,150,105,0.18) 55%, transparent 100%)',
    labelTh: 'มีชีวิตชีวา',
    labelEn: 'Vitality',
    emoji: '🌿',
    descTh: 'ธรรมชาติและชีวิตชีวา',
    descEn: 'Nature & Life',
  },
  celebration: {
    gradient: 'from-purple-300 via-violet-500 to-indigo-600',
    auraColor: 'rgba(139, 92, 246, 0.85)',
    glowHex: '#8B5CF6',
    radialGradient: 'radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(124,58,237,0.18) 55%, transparent 100%)',
    labelTh: 'ภาคภูมิใจ',
    labelEn: 'Celebration',
    emoji: '🎉',
    descTh: 'วันสำคัญและความสำเร็จ',
    descEn: 'Milestones',
  },
};

const emotionCategoryList: {
  id: OrbEmotion | 'all';
  labelTh: string;
  labelEn: string;
  emoji: string;
  gradient: string;
  auraColor: string;
  glowHex: string;
  rainbowAura?: string;
  secondaryRainbowAura?: string;
}[] = [
  {
    id: 'all',
    labelTh: 'ทั้งหมด',
    labelEn: 'All',
    emoji: '🔮',
    gradient: 'from-rose-400 via-amber-300 via-emerald-400 via-sky-400 to-purple-500',
    auraColor: 'rgba(236, 72, 153, 0.45)',
    glowHex: '#EC4899',
    rainbowAura: 'conic-gradient(from 0deg, rgba(244,63,94,0.65), rgba(245,158,11,0.65), rgba(16,185,129,0.65), rgba(14,165,233,0.65), rgba(139,92,246,0.65), rgba(236,72,153,0.65), rgba(244,63,94,0.65))',
    secondaryRainbowAura: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(16,185,129,0.2) 35%, rgba(14,165,233,0.2) 60%, rgba(139,92,246,0.18) 80%, transparent 95%)',
  },
  {
    id: 'joy',
    labelTh: 'ความสุข',
    labelEn: 'Joy',
    emoji: '☀️',
    gradient: 'from-amber-300 via-amber-500 to-yellow-600',
    auraColor: 'rgba(251, 191, 36, 0.65)',
    glowHex: '#FBBF24',
  },
  {
    id: 'nostalgia',
    labelTh: 'คิดถึงวันวาน',
    labelEn: 'Nostalgia',
    emoji: '🌊',
    gradient: 'from-sky-300 via-cyan-500 to-blue-600',
    auraColor: 'rgba(14, 165, 233, 0.65)',
    glowHex: '#0EA5E9',
  },
  {
    id: 'love',
    labelTh: 'ความรัก',
    labelEn: 'Love',
    emoji: '💖',
    gradient: 'from-rose-300 via-pink-500 to-rose-600',
    auraColor: 'rgba(244, 63, 94, 0.65)',
    glowHex: '#F43F5E',
  },
  {
    id: 'vitality',
    labelTh: 'สดชื่น',
    labelEn: 'Vitality',
    emoji: '🌿',
    gradient: 'from-emerald-300 via-teal-500 to-green-600',
    auraColor: 'rgba(16, 185, 129, 0.65)',
    glowHex: '#10B981',
  },
  {
    id: 'celebration',
    labelTh: 'ภาคภูมิใจ',
    labelEn: 'Pride',
    emoji: '🎉',
    gradient: 'from-purple-300 via-violet-500 to-indigo-600',
    auraColor: 'rgba(139, 92, 246, 0.65)',
    glowHex: '#8B5CF6',
  },
];

const OrbCardPhoto: React.FC<{
  photoUrl: string;
  title: string;
  style: CategoryStyle;
  emotion: OrbEmotion;
  year?: string;
  lang: Language;
  isPriority?: boolean;
}> = ({ photoUrl, title, style, emotion, lang, isPriority = false }) => {
  const [isLoaded, setIsLoaded] = useState(() => isImagePreloaded(photoUrl));
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Instantly detect preloaded/cached images so they render without any skeleton flash
  useEffect(() => {
    if (isImagePreloaded(photoUrl) || (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0)) {
      setIsLoaded(true);
    }
  }, [photoUrl]);

  return (
    <div className="relative shrink-0 w-full md:w-76 lg:w-84 group/photo">
      {/* 1. Atmospheric Radial Aura Glow behind the photo */}
      <div
        className="absolute -inset-1.5 sm:-inset-2 rounded-2xl pointer-events-none filter blur-md opacity-60 group-hover/photo:opacity-85 transition-all duration-500"
        style={{
          background: style.radialGradient,
        }}
      />

      {/* 2. Secondary Colored Aura Edge */}
      <div
        className="absolute -inset-0.5 rounded-xl pointer-events-none filter blur-xs opacity-40"
        style={{
          backgroundColor: style.auraColor,
        }}
      />

      {/* 3. The Photo Box Container */}
      <div
        className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-900 transition-all duration-300"
        style={{
          boxShadow: `0 0 16px 2px ${style.auraColor}, 0 8px 20px -4px rgba(0,0,0,0.22)`,
          border: `2px solid ${style.auraColor}`,
        }}
      >
        {/* Shimmer Loading Skeleton with smooth cross-fade (no jarring snap-off) */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center space-y-2 z-10 transition-opacity duration-500 pointer-events-none ${
            isLoaded && !hasError ? 'opacity-0' : 'opacity-100 animate-pulse'
          }`}
        >
          <Sparkles className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[11px] font-bold text-amber-200/90 tracking-wide">
            {lang === 'en' ? 'Opening memory...' : 'กำลังเปิดภาพความทรงจำ...'}
          </span>
        </div>

        {/* Fallback if image fails to load */}
        {hasError ? (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 text-center z-10">
            <span className="text-3xl mb-1">{style.emoji}</span>
            <span className="text-xs font-bold text-slate-300">{title}</span>
          </div>
        ) : (
          <img
            ref={imgRef}
            src={photoUrl}
            alt={title}
            decoding="async"
            // @ts-ignore - fetchPriority is supported in modern browsers
            fetchPriority={isPriority ? 'high' : 'auto'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover/photo:scale-105 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-98'
            }`}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

        {/* Top-Right: 3D Glowing Memory Orb Emotion Badge on Photo (Styled to match reference design) */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1.5 backdrop-blur-md z-20 bg-white/90 border border-white/60 text-slate-800">
          <MemoryOrbView emotion={emotion} size="xs" />
          <span className="tracking-normal font-bold">
            {style.labelEn} • {style.labelTh}
          </span>
        </div>
      </div>
    </div>
  );
};

export const VaultView: React.FC<VaultViewProps> = ({
  orbs,
  onSelectOrbForTest,
  lang,
  onNavigate,
}) => {
  // Main view segment: 'recaps' (Daily Stories) or 'orbs' (Inside Out Orbs)
  const [activeTab, setActiveTab] = useState<'recaps' | 'orbs'>('recaps');

  // Daily recaps state (Synchronously initialized to eliminate Frame-0 empty flash)
  const [recaps, setRecaps] = useState<DailyRecapMemory[]>(() => getDailyRecaps());
  const [selectedRecap, setSelectedRecap] = useState<DailyRecapMemory | null>(null);
  const [expandedOrb, setExpandedOrb] = useState<MemoryOrb | null>(null);

  // Orbs filtering state
  const [activeFilter, setActiveFilter] = useState<OrbEmotion | 'all'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playingRecapId, setPlayingRecapId] = useState<string | null>(null);
  const [playingOrbId, setPlayingOrbId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load recaps from storage
  useEffect(() => {
    setRecaps(getDailyRecaps());
  }, []);

  // Kebab menu state for 3-dots dropdown
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setMenuOpenId(null);
    };
    if (menuOpenId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [menuOpenId]);

  // Quick Widget slideshow state (สุ่มลำดับ วันนี้ เมื่อปีที่แล้ว, วันนี้ เมื่อเดือนที่แล้ว, วันนี้ เมื่อ 3 เดือนที่แล้ว)
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const flashbackItems = useMemo(() => {
    const rawItems = [
      {
        id: '1m',
        periodTitleTh: 'วันนี้ เมื่อเดือนที่แล้ว',
        periodTitleEn: 'Today, 1 Month Ago',
        recap: recaps.find((r) => r.id === 'recap-flashback-1m') || recaps[2] || recaps[0],
      },
      {
        id: '3m',
        periodTitleTh: 'วันนี้ เมื่อ 3 เดือนที่แล้ว',
        periodTitleEn: 'Today, 3 Months Ago',
        recap: recaps.find((r) => r.id === 'recap-flashback-3m') || recaps[3] || recaps[0],
      },
      {
        id: '1y',
        periodTitleTh: 'วันนี้ เมื่อปีที่แล้ว',
        periodTitleEn: 'Today, 1 Year Ago',
        recap: recaps.find((r) => r.id === 'recap-flashback-1y') || recaps[4] || recaps[0],
      },
    ].filter((item) => Boolean(item.recap));

    return [...rawItems].sort(() => Math.random() - 0.5);
  }, [recaps]);

  const activeSlide = flashbackItems.length > 0 ? flashbackItems[currentSlideIndex % flashbackItems.length] : null;

  const handleNextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (flashbackItems.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % flashbackItems.length);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (flashbackItems.length === 0) return;
    setCurrentSlideIndex((prev) => (prev - 1 + flashbackItems.length) % flashbackItems.length);
  };

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
    setPlayingOrbId(null);
  };

  // Audio speech for individual memory orb cards
  const handleToggleOrbAudio = (orb: MemoryOrb, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (playingOrbId === orb.id) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    setPlayingOrbId(orb.id);
    setIsPlayingAudio(true);

    const textToSpeak =
      lang === 'en'
        ? (orb.voicePromptEn || orb.descriptionEn || orb.voicePrompt || orb.titleEn || orb.title)
        : (orb.voicePrompt || orb.description || orb.title);

    speakWithElevenLabs(
      textToSpeak,
      undefined,
      () => {
        setIsPlayingAudio(false);
        setPlayingOrbId(null);
      },
      lang
    );
  };

  // Cleanup on unmount or tab switch
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [activeTab]);

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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-normal flex items-center space-x-2">
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
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
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
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {orbs.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DAILY STORIES (TODAY'S RECAPS LIST)
         ========================================================================= */}
      {activeTab === 'recaps' && (
        <div className="space-y-6">
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
            <div className="space-y-6">
              {/* =========================================================================
                  QUICK WIDGET: FLASHBACK MEMORIES SLIDESHOW
                  (สุ่มลำดับ: วันนี้ เมื่อปีที่แล้ว, วันนี้ เมื่อเดือนที่แล้ว, วันนี้ เมื่อ 3 เดือนที่แล้ว)
                 ========================================================================= */}
              {activeSlide && (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/60 to-orange-100/30 rounded-3xl p-4 sm:p-6 border border-amber-200/90 shadow-xs space-y-3.5">
                  {/* Top Header: Title ('วันนี้ เมื่อ...') on Left, Controls on Right */}
                  <div className="flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-normal">
                        {lang === 'en' ? activeSlide.periodTitleEn : activeSlide.periodTitleTh}
                      </h3>
                    </div>

                    {/* Prev / Next Buttons & Dots */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 mr-1">
                        {flashbackItems.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              currentSlideIndex === idx
                                ? 'w-5 bg-amber-500'
                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        aria-label={lang === 'en' ? 'Previous memory' : 'ความทรงจำก่อนหน้า'}
                        className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 flex items-center justify-center transition-all shadow-2xs active:scale-90 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextSlide}
                        aria-label={lang === 'en' ? 'Next memory' : 'ความทรงจำถัดไป'}
                        className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 flex items-center justify-center transition-all shadow-2xs active:scale-90 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Active Slide Card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide.id + '-' + currentSlideIndex}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedRecap(activeSlide.recap)}
                      className="group bg-white rounded-2xl border border-amber-200/90 hover:border-amber-400 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer text-left space-y-3 relative"
                    >
                      {/* Top Row: Date on Left, Emotion badge + ดูบันทึกฉบับเต็ม + 3 จุด on Right (ขวาบน) */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">
                            {lang === 'en' ? activeSlide.recap.displayDateEn : activeSlide.recap.displayDateTh}
                          </span>
                        </div>

                        {/* Right side: Emotion badge + ดูบันทึกฉบับเต็ม + 3 จุดมุมขวาบน */}
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold capitalize">
                            {activeSlide.recap.emotion === 'joy' && (lang === 'en' ? 'Joy ☀️' : 'ความสุข ☀️')}
                            {activeSlide.recap.emotion === 'love' && (lang === 'en' ? 'Love 💖' : 'ความรัก 💖')}
                            {activeSlide.recap.emotion === 'nostalgia' && (lang === 'en' ? 'Nostalgia 🌊' : 'คิดถึงวันวาน 🌊')}
                            {activeSlide.recap.emotion === 'vitality' && (lang === 'en' ? 'Vitality 🌿' : 'สดชื่น 🌿')}
                            {activeSlide.recap.emotion === 'celebration' && (lang === 'en' ? 'Pride 🎉' : 'ภาคภูมิใจ 🎉')}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecap(activeSlide.recap);
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <span>{lang === 'en' ? 'Full Story' : 'ดูบันทึกฉบับเต็ม'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                          </button>

                          {/* 3 จุดมุมขวาบนของ memory widget */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === `qw-${activeSlide.recap.id}` ? null : `qw-${activeSlide.recap.id}`);
                              }}
                              title={lang === 'en' ? 'More options' : 'ตัวเลือกเพิ่มเติม'}
                              aria-label={lang === 'en' ? 'More options' : 'ตัวเลือกเพิ่มเติม'}
                              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {menuOpenId === `qw-${activeSlide.recap.id}` && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    handleDeleteRecap(activeSlide.recap.id, e);
                                    setMenuOpenId(null);
                                  }}
                                  className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>{lang === 'en' ? 'Delete Story' : 'ลบบันทึก'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content: Photos & Story snippet */}
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {activeSlide.recap.photos && activeSlide.recap.photos.length > 0 && (
                          <div className="flex items-center space-x-2 shrink-0 py-1">
                            {activeSlide.recap.photos.slice(0, 3).map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  transform: `rotate(${pIdx === 0 ? '-2.5deg' : pIdx === 1 ? '2deg' : '-1.5deg'})`,
                                }}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                              >
                                <img
                                  src={photoUrl}
                                  alt="Memory thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {activeSlide.recap.photos.length > 3 && (
                              <span className="text-xs font-bold text-slate-400 pl-1">
                                +{activeSlide.recap.photos.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex-1 space-y-3">
                          <p className="text-slate-700 text-sm sm:text-base font-medium line-clamp-3 leading-relaxed">
                            "{activeSlide.recap.transcript}"
                          </p>

                          {/* Prominent Audio Button: Big Speaker Icon & 'ฟังเสียงที่คุณเล่าเรื่องราว' */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={(e) => handleToggleRecapAudio(activeSlide.recap, e)}
                              aria-label={
                                playingRecapId === activeSlide.recap.id
                                  ? (lang === 'en' ? 'Pause story voice' : 'พักเสียงเล่า')
                                  : (lang === 'en' ? 'Listen to your recorded story' : 'ฟังเสียงที่คุณเล่าเรื่องราว')
                              }
                              className={`inline-flex items-center space-x-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer border ${
                                playingRecapId === activeSlide.recap.id
                                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
                                  : 'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 hover:from-amber-200 hover:to-amber-100 text-amber-950 border-amber-300'
                              }`}
                            >
                              {playingRecapId === activeSlide.recap.id ? (
                                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white shrink-0" />
                              ) : (
                                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800 shrink-0 stroke-[2.3]" />
                              )}
                              <span>
                                {playingRecapId === activeSlide.recap.id
                                  ? (lang === 'en' ? 'Playing voice...' : 'กำลังเล่นเสียงที่คุณเล่า...')
                                  : (lang === 'en' ? 'Listen to your recorded story' : 'ฟังเสียงที่คุณเล่าเรื่องราว')}
                              </span>
                              {activeSlide.recap.audioDurationSec ? (
                                <span className="opacity-75 text-[11px] font-semibold">({activeSlide.recap.audioDurationSec}s)</span>
                              ) : null}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* =========================================================================
                  CHRONOLOGICAL RECAPS STREAM (ดูย้อนๆ ไปได้)
                 ========================================================================= */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-normal">
                      {lang === 'en' ? 'All Past Daily Stories' : 'บันทึกเรื่องราวประจำวันทั้งหมด (ย้อนหลัง)'}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {recaps.length} {lang === 'en' ? 'stories' : 'รายการ'}
                  </span>
                </div>

                <div className="space-y-4">
                  {recaps.map((recap) => {
                    const dateLabel = lang === 'en' ? recap.displayDateEn : recap.displayDateTh;
                    const isPlayingThis = playingRecapId === recap.id;

                    return (
                      <div
                        key={recap.id}
                        onClick={() => setSelectedRecap(recap)}
                        className="group bg-white rounded-3xl border border-slate-200/90 hover:border-amber-300/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer text-left relative scroll-card-contained"
                      >
                        {/* Top Bar: Date on Left, Emotion + ดูบันทึกฉบับเต็ม + 3 จุด on Right (ขวาบน) */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                              <Calendar className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm sm:text-base font-extrabold text-slate-900">
                              {dateLabel}
                            </span>
                          </div>

                          {/* Right side (ขวาบน): Emotion badge + ดูบันทึกฉบับเต็ม + 3 จุดเมนู */}
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold capitalize">
                              {recap.emotion === 'joy' && (lang === 'en' ? 'Joy ☀️' : 'ความสุข ☀️')}
                              {recap.emotion === 'love' && (lang === 'en' ? 'Love 💖' : 'ความรัก 💖')}
                              {recap.emotion === 'nostalgia' && (lang === 'en' ? 'Nostalgia 🌊' : 'คิดถึงวันวาน 🌊')}
                              {recap.emotion === 'vitality' && (lang === 'en' ? 'Vitality 🌿' : 'สดชื่น 🌿')}
                              {recap.emotion === 'celebration' && (lang === 'en' ? 'Pride 🎉' : 'ภาคภูมิใจ 🎉')}
                            </span>

                            {/* ดูบันทึกฉบับเต็ม ย้ายไปไว้ขวาบน */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecap(recap);
                              }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <span>{lang === 'en' ? 'Full Story' : 'ดูบันทึกฉบับเต็ม'}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                            </button>

                            {/* 3 จุดซ่อนปุ่มลบ */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(menuOpenId === recap.id ? null : recap.id);
                                }}
                                title={lang === 'en' ? 'More options' : 'ตัวเลือกเพิ่มเติม'}
                                aria-label={lang === 'en' ? 'More options' : 'ตัวเลือกเพิ่มเติม'}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {menuOpenId === recap.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      handleDeleteRecap(recap.id, e);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{lang === 'en' ? 'Delete Story' : 'ลบบันทึก'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
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
                          <div className="flex-1 space-y-3">
                            <p className="text-slate-700 text-sm sm:text-base font-medium line-clamp-2 leading-relaxed">
                              "{recap.transcript}"
                            </p>

                            {/* Prominent Audio Button with BIG SPEAKER ICON & 'ฟังเสียงที่คุณเล่าเรื่องราว' */}
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={(e) => handleToggleRecapAudio(recap, e)}
                                aria-label={
                                  isPlayingThis
                                    ? (lang === 'en' ? 'Pause story voice' : 'พักเสียงเล่า')
                                    : (lang === 'en' ? 'Listen to your recorded story' : 'ฟังเสียงที่คุณเล่าเรื่องราว')
                                }
                                className={`inline-flex items-center space-x-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer border ${
                                  isPlayingThis
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
                                    : 'bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 hover:from-amber-200 hover:to-amber-100 text-amber-950 border-amber-300'
                                }`}
                              >
                                {isPlayingThis ? (
                                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white shrink-0" />
                                ) : (
                                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800 shrink-0 stroke-[2.3]" />
                                )}
                                <span>
                                  {isPlayingThis
                                    ? (lang === 'en' ? 'Playing voice...' : 'กำลังเล่นเสียงที่คุณเล่า...')
                                    : (lang === 'en' ? 'Listen to your recorded story' : 'ฟังเสียงที่คุณเล่าเรื่องราว')}
                                </span>
                                {recap.audioDurationSec ? (
                                  <span className="opacity-75 text-[11px] font-semibold">({recap.audioDurationSec}s)</span>
                                ) : null}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* DETAIL MODAL FOR DAILY RECAP (Rendered via React Portal to document.body to ensure 100vw x 100dvh full coverage) */}
          {typeof document !== 'undefined' &&
            createPortal(
              <AnimatePresence>
                {selectedRecap && (
                  <div
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        stopAllAudio();
                        setSelectedRecap(null);
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
                        <h3 className="text-xl sm:text-2xl font-extrabold tracking-normal text-slate-900">
                          {lang === 'en' ? "Today's Family Story" : 'เรื่องราวความทรงจำประจำวัน'}
                        </h3>
                      </div>

                      {/* Polaroid Scrapbook Gallery Grid inside Detail */}
                      <div className="flex flex-wrap justify-center items-start gap-4 py-2">
                        {selectedRecap.photos.map((photoUrl, pIndex) => (
                          <div
                            key={pIndex}
                            style={{
                              transform: `rotate(${pIndex % 2 === 0 ? '-2deg' : '2deg'})`,
                            }}
                            className="w-[46%] sm:w-[30%] min-w-[130px] bg-white p-2 rounded-2xl border border-slate-200 shadow-md flex flex-col"
                          >
                            <div className="w-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                              <img
                                src={photoUrl}
                                alt=""
                                className="w-full h-auto max-h-[320px] object-cover block rounded-xl"
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
                                ? (lang === 'en' ? 'Pause story voice' : 'พักเสียงเล่า')
                                : (lang === 'en' ? 'Listen to your recorded story' : 'ฟังเสียงที่คุณเล่าเรื่องราว')
                            }
                            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer border ${
                              playingRecapId === selectedRecap.id
                                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
                                : 'bg-white hover:bg-amber-100 text-amber-950 border-amber-300'
                            }`}
                          >
                            {playingRecapId === selectedRecap.id ? (
                              <>
                                <Pause className="w-5 h-5 fill-current text-white shrink-0" />
                                <span>{lang === 'en' ? 'Playing voice...' : 'กำลังเล่นเสียงที่คุณเล่า...'}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-5 h-5 text-amber-800 shrink-0 stroke-[2.3]" />
                                <span>{lang === 'en' ? 'Listen to your recorded story' : 'ฟังเสียงที่คุณเล่าเรื่องราว'}</span>
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
              </AnimatePresence>,
              document.body
            )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: INSIDE OUT MEMORY ORBS
         ========================================================================= */}
      {activeTab === 'orbs' && (
        <div className="space-y-7">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-left">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-normal flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>{lang === 'en' ? 'Memory Orbs Vault' : 'ลูกแก้วความทรงจำ'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {lang === 'en'
                  ? 'Slide horizontally to choose an emotion orb. View family memories with matching aura colors.'
                  : 'เลื่อนเลือกลูกแก้วอารมณ์ความรู้สึก เพื่อเปิดดูความทรงจำอันล้ำค่าพร้อมแสงออร่า'}
              </p>
            </div>
            <div className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              {lang === 'en'
                ? `Showing ${filteredOrbs.length} memories`
                : `แสดง ${filteredOrbs.length} ความทรงจำ`}
            </div>
          </div>

          {/* 3D Glass Memory Orb Category Selector (เลื่อนเพื่อเลือก) */}
          <div
            className="relative bg-gradient-to-b from-slate-100/80 via-slate-50/60 to-white/95 rounded-[32px] border border-slate-200/90 px-1 sm:px-3 shadow-xs overflow-hidden"
            style={{ isolation: 'isolate' }}
          >
            {/* Subtle edge fade masks for smooth horizontal scroll indicator without obscuring aura */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-slate-100/50 to-transparent z-20" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-slate-100/50 to-transparent z-20" />

            {/* Illuminated Glass Rail Track running behind the orbs */}
            <div className="absolute left-6 right-6 top-[60px] sm:top-[72px] -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-amber-200/50 via-sky-200/50 to-transparent rounded-full pointer-events-none" />

            <div className="flex items-center justify-start sm:justify-center space-x-6 sm:space-x-8 overflow-x-auto pt-7 pb-6 px-8 sm:px-10 no-scrollbar scroll-smooth">
              {emotionCategoryList.map((cat) => {
                const isSelected = activeFilter === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      stopAllAudio();
                      setActiveFilter(cat.id);
                    }}
                    className="group relative flex flex-col items-center focus:outline-none transition-all duration-300 cursor-pointer shrink-0"
                    title={`${lang === 'en' ? cat.labelEn : cat.labelTh} - แตะเพื่อเลือกหมวดนี้`}
                  >
                    {/* Multi-layered Spherical Glass Memory Orb (ลูกแก้ว Inside Out) */}
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-full shrink-0 relative flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'scale-110' : 'hover:scale-108 active:scale-95'
                      }`}
                    >
                      <MemoryOrbView
                        emotion={cat.id}
                        size="responsive"
                        isSelected={isSelected}
                        showAura={true}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Label: Only category title (ความสุข, คิดถึงวันวาน, ความรัก, etc.) */}
                    <span
                      className={`mt-2.5 text-xs sm:text-sm font-extrabold whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'text-slate-950 font-black'
                          : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {lang === 'en' ? cat.labelEn : cat.labelTh}
                    </span>

                    {/* Active Focus Light Pill under selected orb */}
                    {isSelected ? (
                      <div
                        className="w-3.5 h-1 rounded-full mt-1 transition-all"
                        style={{
                          backgroundColor: cat.glowHex,
                          boxShadow: `0 0 8px 2px ${cat.auraColor}`,
                        }}
                      />
                    ) : (
                      <div className="w-3.5 h-1 rounded-full mt-1 opacity-0 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Memories with Aura Matching Category Color */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {filteredOrbs.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-[32px] border border-slate-200/90 p-10 text-center space-y-4 shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-2xl">
                    🔮
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold tracking-normal text-slate-800">
                      {lang === 'en' ? 'No memories in this emotion yet' : 'ยังไม่มีลูกแก้วความทรงจำในหมวดนี้'}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {lang === 'en'
                        ? 'Select another emotion orb or view all memories.'
                        : 'แตะเลือกลูกแก้วหมวดอื่น หรือเลือกลูกแก้วทั้งหมดเพื่อชมความทรงจำ'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      stopAllAudio();
                      setActiveFilter('all');
                    }}
                    className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer"
                  >
                    {lang === 'en' ? 'View All Memories' : 'ดูลูกแก้วทั้งหมด'}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {filteredOrbs.map((orb, index) => {
                    const style = emotionStyles[orb.emotion] || emotionStyles.joy;
                    const orbTitle = lang === 'en' && orb.titleEn ? orb.titleEn : orb.title;
                    const orbDesc =
                      lang === 'en' && orb.descriptionEn
                        ? orb.descriptionEn
                        : orb.description || orb.voicePrompt;
                    const orbYear =
                      lang === 'en' && orb.memoryYearEn ? orb.memoryYearEn : orb.memoryYear;
                    const isPlayingThis = playingOrbId === orb.id;

                    return (
                      <div
                        key={orb.id}
                        className="relative bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-7 shadow-md hover:shadow-xl transition-all duration-300 text-left group scroll-card-contained"
                        style={{
                          background: `radial-gradient(circle at 95% 5%, ${style.auraColor.replace('0.65', '0.08').replace('0.85', '0.08')}, transparent 45%), #FFFFFF`,
                        }}
                      >
                        {/* Subtle Top Border Gradient matching Emotion */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1.5 opacity-90 rounded-t-[32px]"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${style.glowHex}, transparent)`,
                          }}
                        />

                        <div className="flex flex-col md:flex-row items-stretch md:items-start gap-6 sm:gap-7">
                          {/* Photo Box with Shimmer Loading & Aura */}
                          <OrbCardPhoto
                            photoUrl={orb.photoUrl}
                            title={orbTitle}
                            style={style}
                            emotion={orb.emotion}
                            year={orbYear}
                            lang={lang}
                            isPriority={index < 2}
                          />

                          {/* Content Section: Title, Description, Voice Prompt, Action Buttons */}
                          <div className="flex-1 flex flex-col justify-between space-y-4 text-left">
                            <div className="space-y-2.5">
                              {/* Date & Location outside photo */}
                              {orbYear && (
                                <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-slate-500">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                                  <span>{orbYear}</span>
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xl sm:text-2xl font-extrabold tracking-normal text-slate-900 leading-snug">
                                  {orbTitle}
                                </h4>
                              </div>

                              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                                {orbDesc}
                              </p>

                              {/* Warm Storytelling Cue / Doctor Memory Prompt Box */}
                              {orb.voicePrompt && (
                                <div
                                  className="p-3.5 sm:p-4 rounded-2xl border text-sm sm:text-base leading-relaxed font-medium flex items-start space-x-3 mt-2"
                                  style={{
                                    backgroundColor: style.auraColor
                                      .replace('0.85', '0.08')
                                      .replace('0.65', '0.08')
                                      .replace('0.7', '0.08'),
                                    borderColor: style.auraColor
                                      .replace('0.85', '0.35')
                                      .replace('0.65', '0.35')
                                      .replace('0.7', '0.35'),
                                  }}
                                >
                                  <Sparkles
                                    className="w-5 h-5 shrink-0 mt-0.5"
                                    style={{ color: style.glowHex }}
                                  />
                                  <div className="space-y-1">
                                    <span
                                      className="text-xs font-black uppercase tracking-wider block"
                                      style={{ color: style.glowHex }}
                                    >
                                      {lang === 'en'
                                        ? 'Story Voice Prompt & Memory Words'
                                        : 'เรื่องเล่าและความทรงจำ'}
                                    </span>
                                    <p className="text-slate-800 italic">
                                      "{lang === 'en' && orb.voicePromptEn ? orb.voicePromptEn : orb.voicePrompt}"
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Attribution & Interactive Actions */}
                            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <span className="text-xs text-slate-500 font-medium">
                                {lang === 'en' ? 'Recorded by: ' : 'บันทึกโดย: '}
                                <strong className="text-slate-700 font-semibold">
                                  {lang === 'en' && orb.uploadedByEn
                                    ? orb.uploadedByEn
                                    : orb.uploadedBy || 'ครอบครัว'}
                                </strong>
                              </span>

                              <div className="flex flex-wrap items-center gap-2.5">
                                {/* Big Speaker Voice Narration Button */}
                                <button
                                  onClick={(e) => handleToggleOrbAudio(orb, e)}
                                  aria-label={
                                    isPlayingThis
                                      ? (lang === 'en' ? 'Pause story voice' : 'พักเสียงเล่า')
                                      : (lang === 'en' ? 'Listen to story voice' : 'ฟังเสียงเล่าเรื่องราว')
                                  }
                                  className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer border ${
                                    isPlayingThis
                                      ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
                                      : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                                  }`}
                                >
                                  {isPlayingThis ? (
                                    <>
                                      <Pause className="w-5 h-5 fill-current text-white shrink-0" />
                                      <span>
                                        {lang === 'en' ? 'Playing voice...' : 'กำลังเล่นเสียงที่คุณเล่า...'}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-5 h-5 text-amber-800 shrink-0 stroke-[2.3]" />
                                      <span>
                                        {lang === 'en'
                                          ? 'Listen to your recorded story'
                                          : 'ฟังเสียงเล่าเรื่องราว'}
                                      </span>
                                    </>
                                  )}
                                </button>

                                {/* Play Recall Memory Quiz Button */}
                                <button
                                  onClick={() => {
                                    stopAllAudio();
                                    onSelectOrbForTest(orb.id);
                                  }}
                                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 cursor-pointer"
                                >
                                  <Play className="w-4 h-4 fill-white" />
                                  <span>
                                    {lang === 'en' ? 'Play this Memory' : 'เล่นทบทวนความทรงจำนี้'}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
