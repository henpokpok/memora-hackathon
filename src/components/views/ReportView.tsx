import React, { useState } from 'react';
import { MemoryOrb, Language } from '../../types';
import { translations } from '../../data/translations';
import { 
  MessageCircle, 
  Play, 
  Pause, 
  ShieldCheck, 
  Share2, 
  CheckCircle2, 
  Check
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';

interface ReportViewProps {
  orbs: MemoryOrb[];
  unlockedCount: number;
  lang: Language;
}

export const ReportView: React.FC<ReportViewProps> = ({ orbs, unlockedCount, lang }) => {
  const t = translations[lang];
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasSentLine, setHasSentLine] = useState(false);

  const grandmaVoiceSnippet = t.grandmaSnippet;

  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakWithElevenLabs(grandmaVoiceSnippet, undefined, () => {
        setIsPlayingAudio(false);
      }, lang);
    }
  };

  const handleSendToLine = () => {
    setHasSentLine(true);
    setTimeout(() => setHasSentLine(false), 4000);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.reportBadge}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.reportTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.reportSubtitle}
          </p>
        </div>

        <button
          onClick={handleSendToLine}
          className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-sm shadow-sm active:scale-95 transition-all shrink-0"
        >
          <Share2 className="w-4 h-4" />
          <span>{hasSentLine ? t.sentLineSuccess : t.sendLineBtn}</span>
        </button>
      </div>

      {/* 2-Column: Left (LINE Capsule Preview) / Right (Clinical Cognitive Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Simulated LINE Chat Bubble (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-[#06C755] flex items-center justify-center text-white shadow-2xs">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t.lineCapsuleTitle}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {t.lineCapsuleSub}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                {t.statusGood}
              </span>
            </div>

            {/* Daily Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {t.dailySummaryHeading}
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {unlockedCount}/5 {lang === 'en' ? 'Done' : 'ครบถ้วน'}
                </span>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">{t.metricRecall}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">{t.metricRecallVal}</span>
                  <span className="text-[10px] text-emerald-600 block">{t.metricRecallSub}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">{t.metricSpeed}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">11.4s</span>
                  <span className="text-[10px] text-sky-600 block">{t.metricSpeedSub}</span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">{t.metricMood}</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">{t.metricMoodVal}</span>
                  <span className="text-[10px] text-rose-600 block">{t.metricMoodSub}</span>
                </div>
              </div>

              {/* Voice Capsule Player */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePlayVoice}
                    className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform"
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-5 h-5 fill-slate-950" />
                    ) : (
                      <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                    )}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      {t.voiceSnippetTitle}
                    </span>
                    <span className="text-[11px] text-amber-800 line-clamp-1">
                      "{grandmaVoiceSnippet}"
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-700">0:14</span>
              </div>
            </div>

            {/* Reassurance Message */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>{t.reassuranceHeading}</strong> {t.reassuranceText}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Business Model & Pricing (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Subscription Package Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  Business Model
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {t.pricingPackageTitle}
                </h3>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {t.pricingPrice} <span className="text-xs font-normal text-slate-500">{t.pricingPerMonth}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.pricingDesc}
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.feature1}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.feature2}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.feature3}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.feature4}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.feature5}</span>
              </li>
            </ul>

            <button className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors">
              {t.subscribeBtn}
            </button>
          </div>

          {/* Unit Economics Box for Judges */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>{t.unitEconomicsTitle}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">{t.cacLabel}</span>
                <span className="font-bold text-slate-900">~180 THB ($5.2)</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">{t.ltvLabel}</span>
                <span className="font-bold text-slate-900">4,060 THB ($116)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 pt-1">
              <strong>{t.ltvCacHighlight}</strong> {t.ltvCacDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
