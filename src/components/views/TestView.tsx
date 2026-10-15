import React, { useState, useEffect } from 'react';
import { MemoryOrb, MemoryOption, Language } from '../../types';
import { translations } from '../../data/translations';
import { 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  Mic, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';

interface TestViewProps {
  orbs: MemoryOrb[];
  activeOrbId: string;
  onSelectOrb: (id: string) => void;
  onCorrectAnswer: (orbId: string) => void;
  onFinishSession: () => void;
  lang: Language;
}

const emotionLabels: Record<string, Record<Language, { label: string; icon: string; bg: string; text: string }>> = {
  joy: {
    th: { label: 'ความสุข (Joy)', icon: '☀️', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
    en: { label: 'Joy (☀️)', icon: '☀️', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' }
  },
  nostalgia: {
    th: { label: 'คิดถึงวันวาน (Nostalgia)', icon: '🌊', bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800' },
    en: { label: 'Nostalgia (🌊)', icon: '🌊', bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800' }
  },
  love: {
    th: { label: 'ความรัก (Love)', icon: '💖', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' },
    en: { label: 'Love (💖)', icon: '💖', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' }
  },
  vitality: {
    th: { label: 'มีชีวิตชีวา (Vitality)', icon: '🌿', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
    en: { label: 'Vitality (🌿)', icon: '🌿', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' }
  },
  celebration: {
    th: { label: 'ภาคภูมิใจ (Celebration)', icon: '🎉', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
    en: { label: 'Celebration (🎉)', icon: '🎉', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' }
  },
};

export const TestView: React.FC<TestViewProps> = ({
  orbs,
  activeOrbId,
  onSelectOrb,
  onCorrectAnswer,
  onFinishSession,
  lang,
}) => {
  const t = translations[lang];
  const currentOrbIndex = orbs.findIndex((o) => o.id === activeOrbId);
  const orb = orbs[currentOrbIndex] || orbs[0];
  const isAnswered = orb.isUnlocked;
  const hasNextOrb = currentOrbIndex < orbs.length - 1;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showClue, setShowClue] = useState(false);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [isWrongAttempt, setIsWrongAttempt] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);

  const voicePrompt = lang === 'en' && orb.voicePromptEn ? orb.voicePromptEn : orb.voicePrompt;
  const voiceSuccess = lang === 'en' && orb.voiceSuccessEn ? orb.voiceSuccessEn : orb.voiceSuccess;
  const gentleClue = lang === 'en' && orb.gentleClueEn ? orb.gentleClueEn : orb.gentleClue;
  const orbTitle = lang === 'en' && orb.titleEn ? orb.titleEn : orb.title;
  const memoryYear = lang === 'en' && orb.memoryYearEn ? orb.memoryYearEn : orb.memoryYear;

  // Play question audio on orb switch
  useEffect(() => {
    setShowClue(false);
    setSelectedOptId(null);
    setIsWrongAttempt(false);
    setIsListeningMic(false);

    handlePlayVoice();
    return () => {
      stopSpeech();
    };
  }, [orb.id, lang]);

  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    const speechText = isAnswered ? voiceSuccess : voicePrompt;
    speakWithElevenLabs(speechText, undefined, () => {
      setIsPlayingAudio(false);
    }, lang);
  };

  const handleSelectOption = (option: MemoryOption) => {
    setSelectedOptId(option.id);

    if (option.isCorrect) {
      setIsWrongAttempt(false);
      onCorrectAnswer(orb.id);
      speakWithElevenLabs(voiceSuccess, undefined, undefined, lang);
    } else {
      setIsWrongAttempt(true);
      const wrongMsg = lang === 'en'
        ? `Almost there Grandma! ${option.labelEn || option.label} is your ${option.relationEn || option.relation}. Take another look, or tap the clue button!`
        : `เกือบถูกแล้วค่ะคุณยาย... ${option.label} เป็น ${option.relation} ค่ะ ลองดูอีกครั้งนะคะ หรือแตะดูคำใบ้ได้เลยค่ะ`;
      speakWithElevenLabs(wrongMsg, undefined, undefined, lang);
    }
  };

  const handleTriggerClue = () => {
    setShowClue(true);
    speakWithElevenLabs(gentleClue, undefined, undefined, lang);
  };

  const handleVoiceAnswer = () => {
    setIsListeningMic(true);
    const promptMsg = lang === 'en'
      ? 'Go ahead and speak Grandma, I am listening...'
      : 'คุณยายพูดชื่อได้เลยค่ะ... หนูฟังอยู่นะคะ';

    speakWithElevenLabs(promptMsg, undefined, () => {
      setTimeout(() => {
        setIsListeningMic(false);
        onCorrectAnswer(orb.id);
        speakWithElevenLabs(voiceSuccess, undefined, undefined, lang);
      }, 2500);
    }, lang);
  };

  const handleNext = () => {
    stopSpeech();
    if (hasNextOrb) {
      onSelectOrb(orbs[currentOrbIndex + 1].id);
    } else {
      onFinishSession();
    }
  };

  const emotionMeta = emotionLabels[orb.emotion]?.[lang] || emotionLabels.joy[lang];

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Top Track: Inside Out Memory Rail */}
      <div className="bg-white rounded-[30px] border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <span>{t.railTitle}</span>
            <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
              {currentOrbIndex + 1} / {orbs.length}
            </span>
          </span>
          <span className="text-xs text-slate-400">
            {t.railHint}
          </span>
        </div>

        {/* 5 Orbs Track */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-2 px-1 no-scrollbar">
          {orbs.map((item, idx) => {
            const isActive = item.id === orb.id;
            const itemTitle = lang === 'en' && item.titleEn ? item.titleEn : item.title;

            return (
              <button
                key={item.id}
                onClick={() => {
                  stopSpeech();
                  onSelectOrb(item.id);
                }}
                className={`flex-1 flex flex-col items-center p-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-amber-50/90 border-2 border-amber-400 shadow-sm scale-105'
                    : 'bg-slate-50/70 border border-slate-200/80 hover:bg-slate-100/60'
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 aspect-square rounded-full shrink-0 relative overflow-hidden transition-transform ${
                    isActive ? 'ring-3 ring-amber-400 shadow-xs' : 'opacity-80'
                  }`}
                >
                  <img
                    src={item.photoUrl}
                    alt={itemTitle}
                    className="w-full h-full object-cover"
                  />
                  {item.isUnlocked && (
                    <div className="absolute inset-0 bg-amber-400/35 flex items-center justify-center">
                      <Check className="w-4 h-4 text-slate-950 font-extrabold stroke-[3]" />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold mt-1.5 truncate max-w-[65px] ${
                    isActive ? 'text-amber-900' : 'text-slate-500'
                  }`}
                >
                  {idx + 1}. {itemTitle.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Centerpiece: Luminous 3D Memory Orb Stage */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
        {/* Luminous Ambient Background Glow */}
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-40 animate-pulse-halo pointer-events-none"
          style={{ background: orb.glowColor }}
        />

        {/* Emotion Pill */}
        <div
          className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold mb-4 shadow-2xs ${emotionMeta.bg} ${emotionMeta.text}`}
        >
          <span>{emotionMeta.icon}</span>
          <span>{emotionMeta.label}</span>
          <span className="text-slate-300">•</span>
          <span className="font-normal text-slate-600">{memoryYear}</span>
        </div>

        {/* 3D Glass Memory Orb on Light Canvas */}
        <div className="relative my-2 group">
          <div
            className={`w-56 h-56 sm:w-68 sm:h-68 rounded-full glass-memory-orb-light relative transition-all duration-700 animate-float-slow p-2.5 ${
              isAnswered
                ? 'ring-4 ring-amber-400 shadow-xl shadow-amber-200/70'
                : 'shadow-lg shadow-slate-200'
            }`}
            style={{
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.5) 60%, ${orb.glowColor} 100%)`,
            }}
          >
            {/* Embedded Photo inside Glass */}
            <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
              <img
                src={orb.photoUrl}
                alt={orbTitle}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isAnswered ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
            </div>

            {/* 3D Glass Highlights */}
            <div className="orb-shine-light" />
            <div className="orb-bottom-rim-light" />

            {/* Success Celebration overlay */}
            {isAnswered && (
              <div className="absolute inset-0 rounded-full bg-amber-400/20 backdrop-blur-[1px] flex items-center justify-center animate-fade-in pointer-events-none">
                <div className="bg-white/95 border border-amber-300 text-amber-800 px-4 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold">{t.rememberedBadge}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Large Super-Rounded Voice Audio Button */}
        <div className="mt-5 flex flex-col items-center">
          <button
            onClick={handlePlayVoice}
            className={`flex items-center space-x-3 px-8 py-4 rounded-full text-base sm:text-lg font-bold transition-all shadow-md active:scale-95 ${
              isPlayingAudio
                ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-200 shadow-amber-300/60'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-5 h-5 animate-pulse" />
                <span>{t.listeningNotice}</span>
                <span className="flex space-x-1">
                  <span className="w-1.5 h-3.5 bg-slate-950 rounded-full animate-bounce" />
                  <span className="w-1.5 h-5 bg-slate-950 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-3 bg-slate-950 rounded-full animate-bounce [animation-delay:0.3s]" />
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-amber-300" />
                <span>{isAnswered ? t.relisten : t.touchToListen}</span>
                <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full text-slate-200">
                  {t.doctorVoiceBadge}
                </span>
              </>
            )}
          </button>

          {/* Minimal Question Subtitle */}
          <p className="mt-3 text-slate-800 font-semibold text-base sm:text-lg max-w-md">
            "{isAnswered ? voiceSuccess : voicePrompt}"
          </p>
        </div>
      </div>

      {/* Senior Tactile Choice Cards */}
      <div className="space-y-4">
        {/* 💡 Clue Drawer Banner */}
        {showClue && (
          <div className="bg-amber-50 border border-amber-300/80 rounded-3xl p-4 flex items-start space-x-3 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                {t.clueTitle}
              </span>
              <p className="text-sm sm:text-base text-amber-950 font-medium mt-0.5">
                {gentleClue}
              </p>
            </div>
          </div>
        )}

        {/* Gentle Notice if Wrong */}
        {isWrongAttempt && !isAnswered && (
          <div className="bg-sky-50 border border-sky-300 rounded-2xl p-3 text-center text-sky-900 text-sm">
            {t.wrongAttempt}
          </div>
        )}

        {/* 3 Choice Cards (Super-Rounded) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {orb.options.map((opt) => {
            const isSelected = selectedOptId === opt.id;
            const isCorrectAndAnswered = isAnswered && opt.isCorrect;
            const optLabel = lang === 'en' && opt.labelEn ? opt.labelEn : opt.label;
            const optRelation = lang === 'en' && opt.relationEn ? opt.relationEn : opt.relation;

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                disabled={isAnswered}
                className={`group flex sm:flex-col items-center p-4 sm:p-5 rounded-[28px] border transition-all text-left sm:text-center active:scale-98 ${
                  isCorrectAndAnswered
                    ? 'bg-amber-50 border-2 border-amber-400 ring-4 ring-amber-100 shadow-md'
                    : isSelected && !opt.isCorrect
                    ? 'bg-slate-100 border-slate-200 opacity-60'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Photo Thumbnail (Pure Circle) */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-3 border-slate-200 group-hover:border-amber-400 transition-colors shadow-xs relative">
                  <img
                    src={opt.photoUrl}
                    alt={optLabel}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform"
                  />
                  {isCorrectAndAnswered && (
                    <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-amber-800" />
                    </div>
                  )}
                </div>

                {/* Name & Relation */}
                <div className="ml-4 sm:ml-0 sm:mt-3 flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {optLabel}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {optRelation}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Auxiliary Controls (Clue / Voice / Next) - Super Rounded */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {isAnswered ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleNext}
                className="flex items-center space-x-2.5 px-9 py-4.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-base sm:text-lg shadow-md shadow-amber-200 hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                <span>{hasNextOrb ? t.nextOrbBtn : t.finishOrbBtn}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {orbs.every((o) => o.isUnlocked) && (
                <button
                  onClick={onFinishSession}
                  className="flex items-center space-x-2 px-6 py-4 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-sm sm:text-base active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  <span>🏆 {lang === 'en' ? 'View Daily Review' : 'ดูสรุปผลประจำวัน'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Clue Button */}
              <button
                onClick={handleTriggerClue}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-sm sm:text-base active:scale-95 transition-all shadow-2xs"
              >
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>{t.clueBtn}</span>
              </button>

              {/* Voice Answer Button */}
              <button
                onClick={handleVoiceAnswer}
                className={`flex items-center space-x-2 px-6 py-3.5 rounded-full border text-sm sm:text-base font-bold transition-all active:scale-95 shadow-2xs ${
                  isListeningMic
                    ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-200 animate-pulse'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Mic className={`w-4 h-4 ${isListeningMic ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{isListeningMic ? t.voiceListening : t.voiceBtn}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
