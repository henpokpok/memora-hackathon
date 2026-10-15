import React, { useState, useEffect } from 'react';
import { MemoryOrb } from '../types';
import { Volume2, VolumeX, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../services/elevenlabs';

interface ActiveOrbStageProps {
  orb: MemoryOrb;
  isAnswered: boolean;
  onReplayQuestion?: () => void;
}

const emotionLabels: Record<string, { label: string; icon: string; colorText: string }> = {
  joy: { label: 'ความสุข (Joy)', icon: '☀️', colorText: 'text-amber-300' },
  nostalgia: { label: 'คิดถึงวันวาน (Nostalgia)', icon: '🌊', colorText: 'text-sky-300' },
  love: { label: 'ความรัก (Love)', icon: '💖', colorText: 'text-pink-300' },
  vitality: { label: 'มีชีวิตชีวา (Vitality)', icon: '🌿', colorText: 'text-emerald-300' },
  celebration: { label: 'ภาคภูมิใจ (Celebration)', icon: '🎉', colorText: 'text-purple-300' },
};

export const ActiveOrbStage: React.FC<ActiveOrbStageProps> = ({
  orb,
  isAnswered,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Play question audio automatically or when triggered
  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    const speechText = isAnswered ? orb.voiceSuccess : orb.voicePrompt;
    speakWithElevenLabs(speechText, undefined, () => {
      setIsPlayingAudio(false);
    });
  };

  // Play audio on initial orb load
  useEffect(() => {
    // Start with gentle prompt
    handlePlayVoice();
    return () => {
      stopSpeech();
    };
  }, [orb.id]);

  const emotionMeta = emotionLabels[orb.emotion] || emotionLabels.joy;

  return (
    <div className="relative flex flex-col items-center justify-center py-6 px-4">
      {/* Ambient Pulsing Aura behind the Orb */}
      <div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-40 animate-pulse-halo pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${orb.glowColor} 0%, rgba(7,9,19,0) 70%)`,
        }}
      />

      {/* Emotion & Context Pill */}
      <div className="relative z-10 flex items-center space-x-2 bg-indigo-950/70 border border-indigo-700/50 rounded-full px-4 py-1.5 mb-4 backdrop-blur-md shadow-lg">
        <span className="text-base">{emotionMeta.icon}</span>
        <span className={`text-xs sm:text-sm font-semibold ${emotionMeta.colorText}`}>
          {emotionMeta.label}
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-xs sm:text-sm text-slate-300">
          {orb.memoryYear}
        </span>
      </div>

      {/* Central 3D Glass Memory Orb */}
      <div className="relative z-10 group my-2">
        {/* Memory Orb Container */}
        <div
          className={`w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 rounded-full glass-memory-orb relative transition-transform duration-700 animate-float-slow p-2.5 ${
            isAnswered
              ? 'ring-4 ring-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.6)]'
              : 'shadow-[0_0_35px_rgba(99,102,241,0.4)]'
          }`}
          style={{
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.4) 60%, ${orb.glowColor} 100%)`,
          }}
        >
          {/* Inner Photo Sphere */}
          <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
            <img
              src={orb.photoUrl}
              alt={orb.title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isAnswered ? 'scale-105 filter brightness-105' : 'filter brightness-95'
              }`}
            />
            {/* Atmospheric inner gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 mix-blend-overlay`}
            />
          </div>

          {/* 3D Glass Curvature Highlights */}
          <div className="orb-shine" />
          <div className="orb-bottom-rim" />

          {/* Unlocked / Solved Overlay Badge */}
          {isAnswered && (
            <div className="absolute inset-0 rounded-full bg-amber-500/15 backdrop-blur-[1px] flex items-center justify-center animate-fade-in pointer-events-none">
              <div className="bg-slate-950/80 border border-amber-400/80 text-amber-300 px-4 py-2 rounded-full flex items-center space-x-2 shadow-2xl">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold tracking-wide">จำได้แล้ว! ✨</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Senior Voice Audio Bar / Playback Trigger */}
      <div className="relative z-10 mt-4 flex flex-col items-center">
        <button
          onClick={handlePlayVoice}
          className={`flex items-center space-x-3 px-6 py-3.5 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 shadow-xl active:scale-95 ${
            isPlayingAudio
              ? 'bg-amber-400 text-slate-950 shadow-amber-400/40 ring-4 ring-amber-400/30'
              : 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white border border-indigo-400/40 shadow-indigo-900/60'
          }`}
        >
          {isPlayingAudio ? (
            <>
              <VolumeX className="w-6 h-6 animate-pulse" />
              <span>กำลังอ่านให้ฟัง... (แตะเพื่อหยุด)</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-4 bg-slate-950 rounded-full animate-bounce" />
                <span className="w-1.5 h-6 bg-slate-950 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-3 bg-slate-950 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            </>
          ) : (
            <>
              <Volume2 className="w-6 h-6 text-amber-300" />
              <span>{isAnswered ? 'ฟังเสียงทบทวนอีกครั้ง' : 'แตะเพื่อฟังคำถาม'}</span>
              <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full text-indigo-200">
                เสียงคุณหมอใจดี 🎙️
              </span>
            </>
          )}
        </button>

        {/* Short Question Text for Hearing-Impaired (minimal text, high contrast) */}
        <p className="mt-3 text-center text-sm sm:text-base text-indigo-100 max-w-md font-medium px-4">
          "{isAnswered ? orb.voiceSuccess : orb.voicePrompt}"
        </p>
      </div>
    </div>
  );
};
