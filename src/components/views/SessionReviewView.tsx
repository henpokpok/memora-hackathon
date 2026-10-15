import React, { useState, useEffect } from 'react';
import { MemoryOrb, Language, NavigationPage, FamilyMember } from '../../types';
import { translations } from '../../data/translations';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Heart, 
  MessageCircle, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Home, 
  Share2, 
  ShieldCheck, 
  Award,
  Users
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';
import { sessionApi } from '../../services/api';

interface SessionReviewViewProps {
  orbs: MemoryOrb[];
  activeSenior: FamilyMember;
  onNavigate: (page: NavigationPage) => void;
  onOpenLineModal: () => void;
  lang: Language;
}

export const SessionReviewView: React.FC<SessionReviewViewProps> = ({
  orbs,
  activeSenior,
  onNavigate,
  onOpenLineModal,
  lang,
}) => {
  const t = translations[lang];
  const [isPlayingGrandmaVoice, setIsPlayingGrandmaVoice] = useState(false);
  const [isPlayingPraiseVoice, setIsPlayingPraiseVoice] = useState(false);
  const [isSavedToBackend, setIsSavedToBackend] = useState(false);

  const seniorName = activeSenior?.name || 'สมศรี';
  const unlockedCount = orbs.filter((o) => o.isUnlocked).length;
  const totalCount = orbs.length;

  const celebrationText = lang === 'en'
    ? `Incredible milestone, Grandma ${seniorName}! You have successfully unlocked all 5 memory orbs today. Your synaptic speed is 18% faster, and your family has been updated!`
    : `ยอดเยี่ยมที่สุดเลยค่ะคุณยาย${seniorName}! วันนี้คุณยายระลึกความทรงจำได้ครบทั้ง 5 ลูกแก้ว สมองสดใส สารสื่อประสาททำงานได้อย่างมีชีวิตชีวา และระบบได้ส่งสรุปความสดใสนี้ไปยัง LINE ของลูกหลานเรียบร้อยแล้วค่ะ!`;

  const grandmaVoiceSnippet = lang === 'en'
    ? 'Today I remembered my beloved grandson Poom! He always asks for sweet coconut ice cream. Come visit Grandma again this weekend, my dear, I miss you all dearly.'
    : 'วันนี้ยายจำน้องภูมิได้ด้วยนะ... ยายจำได้ว่าน้องชอบกินไอศกรีมกะทิ วันหยุดนี้พาน้องมาหายายอีกนะลูก ยายคิดถึงทุกคนเลยจ้ะ';

  // Play celebration praise on mount & log session to backend
  useEffect(() => {
    // 1. Play compassionate doctor praise voice
    setIsPlayingPraiseVoice(true);
    speakWithElevenLabs(celebrationText, undefined, () => {
      setIsPlayingPraiseVoice(false);
    }, lang);

    // 2. Automatically log telemetry to backend
    sessionApi.logSession({
      completedOrbs: unlockedCount,
      totalOrbs: totalCount,
      averageSpeedSec: 11.4,
      overallMood: 'ความสุขเบ่งบาน (Joy)',
      rawMetrics: {
        seniorId: activeSenior.id,
        seniorName,
        completedAt: new Date().toISOString(),
      },
    }).then(() => {
      setIsSavedToBackend(true);
    }).catch((err) => {
      console.warn('Backend logging notice:', err);
    });

    return () => {
      stopSpeech();
    };
  }, []);

  const handleTogglePraiseVoice = () => {
    if (isPlayingPraiseVoice) {
      stopSpeech();
      setIsPlayingPraiseVoice(false);
    } else {
      setIsPlayingPraiseVoice(true);
      speakWithElevenLabs(celebrationText, undefined, () => {
        setIsPlayingPraiseVoice(false);
      }, lang);
    }
  };

  const handleToggleGrandmaVoice = () => {
    if (isPlayingGrandmaVoice) {
      stopSpeech();
      setIsPlayingGrandmaVoice(false);
    } else {
      setIsPlayingGrandmaVoice(true);
      speakWithElevenLabs(grandmaVoiceSnippet, undefined, () => {
        setIsPlayingGrandmaVoice(false);
      }, lang);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-3 space-y-8 animate-fade-in">
      {/* 1. Hero Celebration Banner */}
      <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 rounded-[36px] p-7 sm:p-10 text-slate-950 shadow-xl overflow-hidden border border-amber-300/60">
        {/* Soft Decorative Ambient Beams */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Top Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-amber-950 border border-amber-200/60 text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin-slow" />
              <span>
                {lang === 'en' ? 'Daily Milestone Unlocked' : 'ภารกิจฟื้นฟูความทรงจำสำเร็จ'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 leading-tight">
              {lang === 'en'
                ? `Wonderful, Grandma ${seniorName}! 👵✨`
                : `ยอดเยี่ยมที่สุดเลยค่ะคุณยาย${seniorName}! 👵✨`}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-amber-950/85 font-medium leading-relaxed">
              {lang === 'en'
                ? 'All 5 Memory Orbs are glowing with warmth on your pedestal. Your synapses are stimulated, and your heart is full of family love.'
                : 'ลูกแก้วความทรงจำทั้ง 5 ลูกสว่างไสวด้วยพลังแห่งความรักและความผูกพัน เซลล์ประสาทได้รับการกระตุ้นอย่างอ่อนโยนและมีประสิทธิภาพ'}
            </p>

            {/* Backend Sync Indicator */}
            <div className="inline-flex items-center space-x-1.5 text-xs text-amber-900/90 font-medium pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>
                {isSavedToBackend
                  ? (lang === 'en' ? 'Synced with Memora Cloud & Family Database' : 'บันทึกข้อมูลเข้าสู่ฐานข้อมูลครอบครัวเรียบร้อยแล้ว')
                  : (lang === 'en' ? 'Connecting to database...' : 'กำลังเชื่อมต่อฐานข้อมูล...')}
              </span>
            </div>
          </div>

          {/* Praise Audio Button */}
          <button
            onClick={handleTogglePraiseVoice}
            className="flex items-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-md hover:bg-slate-50 active:scale-95 transition-all shrink-0"
          >
            {isPlayingPraiseVoice ? (
              <>
                <VolumeX className="w-5 h-5 text-amber-600 animate-pulse" />
                <span>{lang === 'en' ? 'Pause Audio' : 'หยุดฟังเสียง'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-amber-600" />
                <span>{lang === 'en' ? 'Hear Doctor Praise' : 'ฟังเสียงชื่นชมคุณหมอ'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. The 5 Glowing Restored Memory Orbs (Inside Out Pedestal) */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
              <span>🔮 {lang === 'en' ? "Today’s 5 Luminous Memory Orbs" : 'ลูกแก้วความทรงจำทั้ง 5 ลูกของวันนี้'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {lang === 'en'
                ? 'Restored on Grandma’s memory shelf through gentle episodic reminiscence'
                : 'ฟื้นฟูขึ้นบนหิ้งความทรงจำของคุณยายผ่านการกระตุ้นภาพและเรื่องราว'}
            </p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            {unlockedCount} / {totalCount} {lang === 'en' ? 'Unlocked' : 'ปลดล็อกครบ'}
          </span>
        </div>

        {/* 5 Orbs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {orbs.slice(0, 5).map((orb, index) => {
            const orbTitle = lang === 'en' && orb.titleEn ? orb.titleEn : orb.title;
            const memoryYear = lang === 'en' && orb.memoryYearEn ? orb.memoryYearEn : orb.memoryYear;

            return (
              <div
                key={orb.id}
                className="group relative flex flex-col items-center p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all text-center"
              >
                {/* Glowing Orb Sphere */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full relative overflow-hidden ring-4 shadow-sm transition-transform group-hover:scale-105"
                  style={{
                    boxShadow: `0 8px 24px ${orb.glowColor}`,
                    borderColor: 'rgba(255,255,255,0.8)',
                  }}
                >
                  <img
                    src={orb.photoUrl}
                    alt={orbTitle}
                    className="w-full h-full object-cover"
                  />
                  {/* Glass Specular Gloss */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/60 pointer-events-none" />
                  {/* Check badge */}
                  <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-slate-950 font-extrabold stroke-[2.5]" />
                  </div>
                </div>

                {/* Title & Tag */}
                <span className="text-xs font-bold text-slate-900 mt-2.5 line-clamp-1">
                  {orbTitle}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                  {memoryYear}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Clinical & Synaptic Vitality Metrics (3 Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Speed Metric */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              {lang === 'en' ? 'Recall Latency' : 'ความเร็วในการจำ'}
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900">11.4s</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                +18% เร็วขึ้น
              </span>
            </div>
          </div>
        </div>

        {/* Streak Metric */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              {lang === 'en' ? 'Daily Streak' : 'ฝึกต่อเนื่อง'}
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900">14 {lang === 'en' ? 'Days' : 'วัน'}</span>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                🔥 สม่ำเสมอ
              </span>
            </div>
          </div>
        </div>

        {/* Emotional Valence */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              {lang === 'en' ? 'Emotional Mood' : 'พลังใจ & อารมณ์'}
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-extrabold text-slate-900">
                {lang === 'en' ? 'Joyful ☀️' : 'ความสุขเบ่งบาน ☀️'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Grandma’s Loving Voice Snippet (Recorded for Family) */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-[32px] border border-rose-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'en' ? 'Grandma’s Audio Love Snippet' : 'เสียงแห่งความคิดถึงของคุณยายฝากถึงลูกหลาน'}
              </h3>
              <span className="text-xs text-slate-500">
                {lang === 'en' ? 'Recorded automatically to attach with LINE Capsule' : 'บันทึกเสียงอัตโนมัติแนบไปกับการ์ดสรุปรายวันทาง LINE'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleGrandmaVoice}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all"
          >
            {isPlayingGrandmaVoice ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>{lang === 'en' ? 'Pause' : 'หยุดฟัง'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{lang === 'en' ? 'Play Voice' : 'ฟังเสียงคุณยาย'}</span>
              </>
            )}
          </button>
        </div>

        {/* Voice Quote Box */}
        <div className="bg-white/90 rounded-2xl p-4 border border-rose-100 shadow-2xs">
          <p className="text-xs sm:text-sm text-slate-700 italic font-medium leading-relaxed">
            "{grandmaVoiceSnippet}"
          </p>
        </div>
      </div>

      {/* 5. LINE Automated Dispatch & Peace-of-Mind Link */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? 'LINE Daily Capsule Dispatched' : 'ส่งการ์ดสรุปความสดใสเข้า LINE ลูกหลานเรียบร้อยแล้ว'}
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                AUTO-SYNC 18:00
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {lang === 'en'
                ? 'Daughter Ann & family receive daily reassurance with Grandma’s 5/5 score, speed trend, and audio snippet.'
                : 'น้องแอน (ลูกสาว) และคนในครอบครัวได้รับแจ้งเตือนคะแนน 5/5 ข้อ และคลิปเสียงน่ารักของคุณยายแล้ว'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLineModal}
          className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-sm shadow-sm active:scale-95 transition-all shrink-0 w-full md:w-auto justify-center"
        >
          <Share2 className="w-4 h-4" />
          <span>{lang === 'en' ? 'Preview LINE Card' : 'ดูตัวอย่างการ์ด LINE'}</span>
        </button>
      </div>

      {/* 6. Navigation Actions (Return Home / Child Portal / Vault) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
        <button
          onClick={() => onNavigate('home')}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>{lang === 'en' ? 'Return to Home Pedestal' : 'กลับสู่หน้าหลัก (หน้าแรก)'}</span>
        </button>

        <button
          onClick={() => onNavigate('child-portal')}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-sm active:scale-95 transition-all"
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'en' ? 'Open Child / Caregiver Portal' : 'ดูรายงานมุมมองลูกหลาน'}</span>
        </button>
      </div>
    </div>
  );
};
