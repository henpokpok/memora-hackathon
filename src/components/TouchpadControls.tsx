import React, { useState } from 'react';
import { MemoryOrb, MemoryOption } from '../types';
import { Lightbulb, Mic, CheckCircle2, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { speakWithElevenLabs } from '../services/elevenlabs';

interface TouchpadControlsProps {
  orb: MemoryOrb;
  isAnswered: boolean;
  onCorrectAnswer: () => void;
  onNextOrb: () => void;
  hasNextOrb: boolean;
}

export const TouchpadControls: React.FC<TouchpadControlsProps> = ({
  orb,
  isAnswered,
  onCorrectAnswer,
  onNextOrb,
  hasNextOrb,
}) => {
  const [showClue, setShowClue] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isWrongAttempt, setIsWrongAttempt] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  // Reset local state when orb changes
  React.useEffect(() => {
    setShowClue(false);
    setSelectedOptionId(null);
    setIsWrongAttempt(false);
    setIsListeningMic(false);
  }, [orb.id]);

  const handleSelectOption = (option: MemoryOption) => {
    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      setIsWrongAttempt(false);
      onCorrectAnswer();
      speakWithElevenLabs(orb.voiceSuccess);
    } else {
      setIsWrongAttempt(true);
      speakWithElevenLabs(
        `เกือบถูกแล้วค่ะคุณยาย... ${option.label} เป็น ${option.relation} ค่ะ ลองดูอีกครั้งนะคะ หรือแตะดูคำใบ้ได้เลยค่ะ`
      );
    }
  };

  const handleTriggerClue = () => {
    setShowClue(true);
    speakWithElevenLabs(orb.gentleClue);
  };

  const handleVoiceAnswer = () => {
    setIsListeningMic(true);
    speakWithElevenLabs('คุณยายพูดชื่อได้เลยค่ะ... หนูฟังอยู่นะคะ', undefined, () => {
      // Mock senior speech recognition after 2.5s for seamless hackathon live demo
      setTimeout(() => {
        setIsListeningMic(false);
        onCorrectAnswer();
        speakWithElevenLabs(orb.voiceSuccess);
      }, 2500);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-10">
      {/* 💡 Gentle Clue Notification Card (if triggered) */}
      {showClue && (
        <div className="mb-5 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 border border-amber-500/50 rounded-2xl p-4 flex items-start space-x-3 backdrop-blur-md shadow-lg animate-fade-in">
          <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            <Lightbulb className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                คำใบ้อบอุ่น
              </span>
              <span className="text-[11px] text-amber-200/60">💡 ฟังเสียงแล้วตอบได้เลย</span>
            </div>
            <p className="text-sm sm:text-base text-amber-100 font-medium mt-1">
              {orb.gentleClue}
            </p>
          </div>
        </div>
      )}

      {/* Gentle feedback banner if senior chose wrong */}
      {isWrongAttempt && !isAnswered && (
        <div className="mb-4 bg-sky-950/60 border border-sky-500/40 rounded-xl p-3 text-center text-sky-200 text-sm animate-shake">
          💙 ไม่เป็นไรเลยนะคะ ค่อยๆ นึกดูอีกที แตะปุ่ม "ขอคำใบ้ 💡" ด้านล่างได้เลยค่ะ
        </div>
      )}

      {/* 3 Large Senior-Friendly Tactile Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {orb.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isCorrectAndAnswered = isAnswered && opt.isCorrect;

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              disabled={isAnswered}
              className={`group relative flex flex-row sm:flex-col items-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 text-left sm:text-center active:scale-95 ${
                isCorrectAndAnswered
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/80'
                  : isSelected && !opt.isCorrect
                  ? 'bg-slate-800/40 border-slate-700 opacity-60'
                  : 'bg-indigo-950/40 hover:bg-indigo-900/50 border-indigo-800/60 hover:border-indigo-500/80 shadow-lg'
              }`}
            >
              {/* Choice Photo Thumbnail */}
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-2 border-indigo-400/40 group-hover:border-amber-300 transition-colors shadow-md">
                <img
                  src={opt.photoUrl}
                  alt={opt.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {isCorrectAndAnswered && (
                  <div className="absolute inset-0 bg-amber-400/20 backdrop-blur-[1px] flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-amber-300 drop-shadow" />
                  </div>
                )}
              </div>

              {/* Text Label & Relation */}
              <div className="ml-4 sm:ml-0 sm:mt-3 flex-1">
                <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {opt.label}
                </h4>
                <p className="text-xs sm:text-sm text-indigo-300/80 mt-0.5">
                  {opt.relation}
                </p>
              </div>

              {/* Status Indicator Pill */}
              {isCorrectAndAnswered && (
                <div className="absolute top-2 right-2 text-amber-300">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Auxiliary Touchpad Buttons: 💡 Clue, 🎙️ Voice Input, or ➡️ Next Memory */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {/* If memory is unlocked, show prominent NEXT button */}
        {isAnswered ? (
          <button
            onClick={onNextOrb}
            className="flex items-center space-x-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 font-bold text-base sm:text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all active:scale-95"
          >
            <span>{hasNextOrb ? 'ลูกแก้วถัดไป' : 'ดูสรุปความทรงจำวันนี้'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <>
            {/* Clue Button */}
            <button
              onClick={handleTriggerClue}
              className="flex items-center space-x-2 px-5 py-3 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm sm:text-base font-semibold transition-all active:scale-95"
            >
              <Lightbulb className="w-5 h-5" />
              <span>ขอคำใบ้หน่อย 💡</span>
            </button>

            {/* Voice Answer Button */}
            <button
              onClick={handleVoiceAnswer}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full border text-sm sm:text-base font-semibold transition-all active:scale-95 ${
                isListeningMic
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse ring-2 ring-rose-400/50'
                  : 'bg-indigo-950/50 hover:bg-indigo-900/60 border-indigo-700/60 text-indigo-200'
              }`}
            >
              <Mic className={`w-5 h-5 ${isListeningMic ? 'text-rose-400' : 'text-indigo-400'}`} />
              <span>{isListeningMic ? 'กำลังฟังคุณยายพูด... 🎙️' : 'ตอบด้วยเสียงพูด 🎙️'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
