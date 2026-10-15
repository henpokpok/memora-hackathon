import React, { useState } from 'react';
import { X, MessageCircle, Play, Pause, Sparkles, TrendingUp, Heart, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { MemoryOrb } from '../types';
import { speakWithElevenLabs, stopSpeech } from '../services/elevenlabs';

interface LineCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  orbs: MemoryOrb[];
  unlockedCount: number;
}

export const LineCapsuleModal: React.FC<LineCapsuleModalProps> = ({
  isOpen,
  onClose,
  orbs,
  unlockedCount,
}) => {
  const [isPlayingGrandmaVoice, setIsPlayingGrandmaVoice] = useState(false);

  if (!isOpen) return null;

  const grandmaVoiceSnippet =
    'วันนี้ยายจำน้องภูมิได้ด้วยนะ... ยายจำได้ว่าน้องชอบกินไอศกรีมกะทิ วันหยุดนี้พาน้องมาหายายอีกนะลูก ยายคิดถึง';

  const handlePlayVoiceSnippet = () => {
    if (isPlayingGrandmaVoice) {
      stopSpeech();
      setIsPlayingGrandmaVoice(false);
    } else {
      setIsPlayingGrandmaVoice(true);
      speakWithElevenLabs(grandmaVoiceSnippet, undefined, () => {
        setIsPlayingGrandmaVoice(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* LINE Branded Green Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#06C755] text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-[#06C755] flex items-center justify-center shadow-xs">
              <MessageCircle className="w-5 h-5 fill-[#06C755]" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center space-x-1.5">
                <span>LINE Daily Memory Capsule</span>
                <span className="text-[10px] bg-white/20 text-white font-mono px-1.5 py-0.2 rounded-full">
                  18:00 AUTO-PUSH
                </span>
              </h3>
              <p className="text-[11px] text-white/90">ส่งตรงเข้า LINE ลูกหลานทุกเย็นเพื่อความสบายใจ</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-black/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar text-sm bg-slate-50">
          {/* Simulated LINE Chat Room & Bubble */}
          <div className="bg-[#7494C0]/20 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>ห้องแชทครอบครัว (Family LINE)</span>
              <span>วันนี้ 18:00 น.</span>
            </div>

            {/* In-Chat Bubble Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              {/* Header inside Card */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">👵</span>
                  <div>
                    <span className="font-bold text-slate-900 text-xs">คุณยายสมศรี (คุณแม่)</span>
                    <span className="text-[10px] text-slate-500 block">รายงานการฟื้นฟูความจำวันนี้</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  สมองสดใสดีเยี่ยม
                </span>
              </div>

              {/* 3 Metric Badges */}
              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-amber-800 font-bold block">ลูกแก้วจำได้</span>
                  <span className="text-lg font-extrabold text-amber-950 font-mono">
                    {unlockedCount}/5
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block">ครบตามเป้า</span>
                </div>
                <div className="bg-sky-50/80 border border-sky-200/60 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-sky-800 font-bold block">ความเร็วเฉลี่ย</span>
                  <span className="text-lg font-extrabold text-sky-950 font-mono">11.4s</span>
                  <span className="text-[9px] text-sky-700 font-bold block">+18% เร็วขึ้น</span>
                </div>
                <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-rose-800 font-bold block">อารมณ์รวม</span>
                  <span className="text-lg font-extrabold text-rose-950 font-mono">แจ่มใส</span>
                  <span className="text-[9px] text-rose-700 font-bold block">ยิ้มหัวเราะ</span>
                </div>
              </div>

              {/* Voice Capsule Player Inside LINE */}
              <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePlayVoiceSnippet}
                    className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xs cursor-pointer"
                  >
                    {isPlayingGrandmaVoice ? (
                      <Pause className="w-5 h-5 fill-slate-950" />
                    ) : (
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    )}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      คลิปเสียงคุณยายฝากถึงลูกหลาน 🎙️
                    </span>
                    <span className="text-[11px] text-slate-600 line-clamp-1 italic">
                      "{grandmaVoiceSnippet}"
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-amber-900 font-mono font-bold">0:14</span>
              </div>
            </div>
          </div>

          {/* Value for Adult Children (Peace of Mind & Willingness to Pay) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ทำไมลูกหลานถึงเต็มใจบอกรับสมาชิก (Business Model)</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Friction:</strong> ลูกหลานไม่ต้องเข้าเว็บหรือโหลดแอป แค่ส่งรูปเข้ากลุ่ม LINE
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Daily Peace of Mind:</strong> ได้ยินเสียงแม่หัวเราะและรู้ทันทีว่าสมองยังสดใสทุก 18:00 น.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Subscription Model:</strong> Family Care Plan เพียง 290 บาท/เดือน ($9.90/mo) ถูกกว่าจ้างคนดูแลหลายเท่า
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
