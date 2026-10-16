import React, { useState, useEffect } from 'react';
import { Language, NavigationPage } from '../../types';
import { 
  ArrowLeft, 
  Volume2, 
  Type, 
  Globe, 
  Lock, 
  Check, 
  HeartHandshake,
  ChevronRight,
  VolumeX
} from 'lucide-react';
import { 
  stopSpeech,
  getThaiVoiceId,
  setThaiVoiceId,
  getEnglishVoiceId,
  setEnglishVoiceId,
  isSpeechGloballyMuted,
  setSpeechGloballyMuted,
  THAI_VOICE_PRESETS,
  ENGLISH_VOICE_PRESETS
} from '../../services/elevenlabs';

// Official ElevenLabs SVG wordmark logo
const ElevenLabsLogo: React.FC<{ className?: string }> = ({ className = "h-3.5 w-auto" }) => (
  <svg viewBox="0 0 694 90" fill="currentColor" className={className} aria-label="ElevenLabs">
    <path d="M248.261 22.1901H230.466L251.968 88.5124H271.123L292.625 22.1901H274.83L261.365 72.1488L248.261 22.1901Z" />
    <path d="M0 0H18.413V88.5124H0V0Z" />
    <path d="M36.5788 0H54.9917V88.5124H36.5788V0Z" />
    <path d="M73.1551 0H127.652V14.7521H91.568V35.8264H125.181V50.5785H91.568V73.7603H127.652V88.5124H73.1551V0Z" />
    <path d="M138.896 0H156.32V88.5124H138.896V0Z" />
    <path d="M166.824 55.2893C166.824 31.1157 178.811 20.7025 197.471 20.7025C216.131 20.7025 226.759 30.9917 226.759 55.5372V59.5041H184.001C184.619 73.8843 188.944 78.719 197.224 78.719C203.773 78.719 207.851 74.876 208.593 68.1818H226.017C224.905 82.8099 212.795 90 197.224 90C177.452 90 166.824 79.4628 166.824 55.2893ZM209.582 47.9752C208.717 35.8264 204.515 31.8595 197.224 31.8595C189.933 31.8595 185.36 35.9504 184.125 47.9752H209.582Z" />
    <path d="M295.962 55.2893C295.962 31.1157 307.949 20.7025 326.609 20.7025C345.269 20.7025 355.897 30.9917 355.897 55.5372V59.5041H313.139C313.757 73.8843 318.082 78.719 326.362 78.719C332.911 78.719 336.989 74.876 337.731 68.1818H355.155C354.043 82.8099 341.932 90 326.362 90C306.589 90 295.962 79.4628 295.962 55.2893ZM338.719 47.9752C337.854 35.8264 333.653 31.8595 326.362 31.8595C319.071 31.8595 314.498 35.9504 313.263 47.9752H338.719Z" />
    <path d="M438.443 0H456.856V73.7603H491.457V88.5124H438.443V0Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M495.783 55.2893C495.783 30 507.399 20.7025 522.352 20.7025C529.766 20.7025 536.563 24.9174 539.282 29.3802V22.1901H557.077V88.5124H539.776V80.7025C537.181 85.9091 529.89 90 521.857 90C506.04 90 495.783 79.8347 495.783 55.2893ZM526.924 33.719C535.574 33.719 540.27 40.2893 540.27 55.2893C540.27 70.2893 535.574 76.9835 526.924 76.9835C518.274 76.9835 513.331 70.2893 513.331 55.2893C513.331 40.2893 518.274 33.719 526.924 33.719Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M587.847 80.7025V88.5124H570.547V0H587.971V29.3802C590.937 24.7934 597.857 20.7025 605.272 20.7025C619.854 20.7025 631.47 30 631.47 55.2893C631.47 80.5785 620.101 90 604.901 90C596.869 90 590.319 85.9091 587.847 80.7025ZM600.329 33.843C608.979 33.843 613.922 40.2893 613.922 55.2893C613.922 70.2893 608.979 76.9835 600.329 76.9835C591.678 76.9835 586.982 70.2893 586.982 55.2893C586.982 40.2893 591.678 33.843 600.329 33.843Z" />
    <path d="M638.638 68.8017H656.062C656.309 75.7438 660.016 79.0909 666.566 79.0909C673.115 79.0909 676.823 76.1157 676.823 70.9091C676.823 66.1983 673.981 64.4628 667.802 62.9752L662.488 61.6116C647.412 57.7686 639.873 53.6777 639.873 41.157C639.873 28.6364 651.49 20.7025 666.319 20.7025C681.148 20.7025 692.394 26.5289 692.888 40.2893H675.463C675.093 34.2149 671.385 31.6116 666.072 31.6116C660.758 31.6116 657.05 34.2149 657.05 39.1736C657.05 43.7603 660.016 45.4959 665.207 46.7355L670.644 48.0992C684.979 51.6942 694 55.2893 694 68.6777C694 82.0661 682.137 90 666.072 90C648.647 90 639.008 83.4297 638.638 68.8017Z" />
    <path d="M384.072 49.4628C384.072 39.0496 389.015 33.3471 396.677 33.3471C402.979 33.3471 406.563 37.314 406.563 45.8678V88.5124H423.987V43.1405C423.987 27.7686 415.337 20.7025 402.732 20.7025C394.205 20.7025 387.162 25.0413 384.072 30.7438V22.1901H366.401V88.5124H384.072V49.4628Z" />
  </svg>
);

interface SettingsViewProps {
  onNavigate: (page: NavigationPage) => void;
  lang: Language;
  onToggleLang: () => void;
  textSize: 'normal' | 'large' | 'huge';
  onUpdateTextSize: (size: 'normal' | 'large' | 'huge') => void;
  onResetOrbs?: () => void;
  onUnlockAllOrbs?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  lang,
  onToggleLang,
  textSize,
  onUpdateTextSize,
  onResetOrbs,
  onUnlockAllOrbs,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(!isSpeechGloballyMuted());
  const [selectedThaiVoiceId, setSelectedThaiVoiceIdState] = useState(getThaiVoiceId());
  const [selectedEnglishVoiceId, setSelectedEnglishVoiceIdState] = useState(getEnglishVoiceId());
  const [voiceTab, setVoiceTab] = useState<'th' | 'en'>(lang === 'en' ? 'en' : 'th');

  // Synchronize active voice tab whenever display language changes
  useEffect(() => {
    setVoiceTab(lang === 'en' ? 'en' : 'th');
  }, [lang]);

  const handleSelectThaiVoice = (voiceId: string) => {
    setSelectedThaiVoiceIdState(voiceId);
    setThaiVoiceId(voiceId);
  };

  const handleSelectEnglishVoice = (voiceId: string) => {
    setSelectedEnglishVoiceIdState(voiceId);
    setEnglishVoiceId(voiceId);
  };

  const handleToggleSoundMaster = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    setSpeechGloballyMuted(!nextState);
    if (!nextState) {
      stopSpeech();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-2 max-w-3xl mx-auto">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopSpeech();
            onNavigate('home');
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-sm shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'en' ? 'Back to Home' : 'กลับสู่หน้าหลัก'}</span>
        </button>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          {lang === 'en' ? 'Settings' : 'ตั้งค่าแอป'}
        </span>
      </div>

      {/* Page Title */}
      <div className="text-left space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-normal">
          {lang === 'en' ? 'Comfort & Settings' : 'ตั้งค่าการใช้งาน'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          {lang === 'en'
            ? 'Adjust sound, language, letters, and family options.'
            : 'ปรับแต่งระบบเสียง ภาษา ขนาดตัวหนังสือ และระบบครอบครัว'}
        </p>
      </div>

      {/* =========================================================================
          SECTION 1: LANGUAGE PREFERENCE (MINIMAL: NO EMOJIS, NO DESCRIPTION)
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/70 text-sky-700 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'en' ? 'Language' : 'ภาษาของระบบ'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {lang === 'en' ? 'Choose display language' : 'เลือกภาษาที่สะดวกสำหรับการใช้งาน'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Thai Language Option */}
          <button
            onClick={() => {
              if (lang !== 'th') onToggleLang();
            }}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
              lang === 'th'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/60 shadow-xs'
                : 'bg-slate-50/80 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <span className="font-extrabold text-slate-900 text-base sm:text-lg">ภาษาไทย</span>
            {lang === 'th' && (
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* English Language Option */}
          <button
            onClick={() => {
              if (lang !== 'en') onToggleLang();
            }}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
              lang === 'en'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/60 shadow-xs'
                : 'bg-slate-50/80 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <span className="font-extrabold text-slate-900 text-base sm:text-lg">English</span>
            {lang === 'en' && (
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: VOICE GUIDANCE & AI NARRATOR (MINIMAL & ELEVENLABS WORDMARK LOGO)
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-left space-y-1">
              <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 w-fit">
                <ElevenLabsLogo className="h-3.5 w-auto text-slate-800" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {lang === 'en' ? 'Voice Guidance & AI Narrator' : 'ระบบเสียงพูดและคุณหมอ AI'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === 'en' ? 'Natural warm speech powered by ElevenLabs' : 'เสียงพูดภาษาไทยและอังกฤษที่เป็นธรรมชาติ ฟังสบาย'}
              </p>
            </div>
          </div>

          {/* Sound Master Toggle */}
          <button
            onClick={handleToggleSoundMaster}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer ${
              soundEnabled ? 'bg-amber-500' : 'bg-slate-300'
            }`}
            title={soundEnabled ? (lang === 'en' ? 'Mute Speech' : 'ปิดเสียงชั่วคราว') : (lang === 'en' ? 'Enable Speech' : 'เปิดใช้งานเสียง')}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Minimal Voice System Paused Banner (No description paragraph, no parens in title) */}
        {!soundEnabled && (
          <div className="px-4 py-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 text-amber-900 text-left flex items-center space-x-3 shadow-2xs">
            <VolumeX className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-amber-950">
              {lang === 'en' ? 'Voice System Paused' : 'พักระบบเสียงชั่วคราว'}
            </span>
          </div>
        )}

        {/* Choose your comfortable sound */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">
              {lang === 'en' ? 'Choose your comfortable sound' : 'เลือกน้ำเสียงที่คุณฟังแล้วสบายใจ'}
            </span>
          </div>

          {/* Language Selector Tabs (Minimal, no emojis) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setVoiceTab('th')}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                voiceTab === 'th'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>ภาษาไทย</span>
            </button>
            <button
              type="button"
              onClick={() => setVoiceTab('en')}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                voiceTab === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>English</span>
            </button>
          </div>

          {/* Presets for Thai */}
          {voiceTab === 'th' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {THAI_VOICE_PRESETS.map((preset) => {
                const isSelected = selectedThaiVoiceId === preset.id;
                const displayName = lang === 'en' && preset.nameEn ? preset.nameEn : preset.name;
                const displayLabel = lang === 'en' ? (preset.labelEn || preset.label) : preset.label;
                const displayDesc = lang === 'en' ? (preset.descriptionEn || preset.description) : preset.description;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectThaiVoice(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200/90 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-sm">{displayName}</span>
                          {preset.id === 'B4NdgwdU97lHqA8Udh2D' && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                              {lang === 'en' ? 'Recommended' : 'แนะนำสูงสุด'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{displayLabel}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{displayDesc}</p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Presets for English */}
          {voiceTab === 'en' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {ENGLISH_VOICE_PRESETS.map((preset) => {
                const isSelected = selectedEnglishVoiceId === preset.id;
                const displayName = lang === 'en' && preset.nameEn ? preset.nameEn : preset.name;
                const displayLabel = lang === 'en' ? (preset.labelEn || preset.label) : (preset.label || preset.labelEn);
                const displayDesc = lang === 'en' ? (preset.descriptionEn || preset.description) : (preset.description || preset.descriptionEn);
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectEnglishVoice(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200/90 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900 text-sm">{displayName}</span>
                          {preset.id === 'pFZP5JQG7iQjIQuC4Bku' && (
                            <span className="text-[10px] bg-sky-100 text-sky-800 font-extrabold px-2 py-0.5 rounded-full border border-sky-200">
                              {lang === 'en' ? 'Recommended' : 'แนะนำ'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{displayLabel}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{displayDesc}</p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: TEXT SIZE & ACCESSIBILITY (RESPONSIVE LIVE SCALING)
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-700 flex items-center justify-center">
            <Type className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'en' ? 'Text Size' : 'ขนาดตัวหนังสือ'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {lang === 'en' ? 'Choose the size that feels most comfortable' : 'ปรับให้มองเห็นชัดเจนโดยไม่ต้องเพ่ง'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
          <button
            onClick={() => onUpdateTextSize('normal')}
            className={`py-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              textSize === 'normal'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold block">{lang === 'en' ? 'Standard' : 'ขนาดปกติ'}</span>
            <span className="text-xs opacity-70">Aa</span>
          </button>

          <button
            onClick={() => onUpdateTextSize('large')}
            className={`py-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              textSize === 'large'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold block">{lang === 'en' ? 'Large ✨' : 'ตัวใหญ่ ✨'}</span>
            <span className="text-sm font-bold opacity-80">Aa</span>
          </button>

          <button
            onClick={() => onUpdateTextSize('huge')}
            className={`py-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
              textSize === 'huge'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold block">{lang === 'en' ? 'Extra Large' : 'ใหญ่พิเศษ'}</span>
            <span className="text-base font-extrabold opacity-90">Aa</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3.5: USER ACCOUNT & PROFILE (REDESIGNED: AVATAR ON LEFT, WATTANASHIRI FAMILY)
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-900">
              {lang === 'en' ? 'User Account & Profile' : 'ข้อมูลบัญชีผู้ใช้งาน'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'en' ? 'AUTHENTICATED' : 'ยืนยันตัวตนแล้ว'}</span>
          </span>
        </div>

        {/* Modern Profile Card: Avatar on Left, Clean Typographic Details & Family on Right */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50/90 via-indigo-50/30 to-amber-50/20 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Circular Avatar of Ann */}
            <div className="relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
                alt="Ann Wattanashiri"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-indigo-200/70"
              />
              <span 
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" 
                title="Active" 
              />
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-normal">
                  แอน วัฒนศิริ
                </h4>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Ann
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-mono">
                ann@memora.app
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                  ครอบครัววัฒนศิริ
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  MEMORA-8821
                </span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
                  {lang === 'en' ? 'Eldest Daughter • Primary Caregiver' : 'ลูกสาวคนโต • ผู้ดูแลหลัก'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: FAMILY & CAREGIVER ZONE (WARM FAMILY ICON: HEARTHANDSHAKE)
          Separated into Settings to keep seniors safe from accidental disconnections
         ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-rose-50/60 rounded-[32px] border border-amber-200/80 p-6 sm:p-8 shadow-xs text-left space-y-4">
        <div className="flex items-start space-x-3.5">
          {/* Warm Genuine Family Icon: Caregiver & Elder Hand-in-Hand */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 flex items-center space-x-1">
                <Lock className="w-3 h-3 inline" />
                <span>{lang === 'en' ? 'Family & Caregiver Portal' : 'ระบบครอบครัว (สำหรับลูกหลาน)'}</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {lang === 'en' ? 'Family System & Memory Vault' : 'จัดการสมาชิกครอบครัวและคลังความทรงจำ'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {lang === 'en'
                ? 'Safely located inside Settings to protect seniors from accidental exits. Manage family members, view unique family code, switch elders, and add memory photos via LINE simulator.'
                : 'จัดเก็บอยู่ในหน้านี้เพื่อความปลอดภัย เพื่อป้องกันไม่ให้คุณตาคุณยายเผลอกดออกจากครอบครัว สามารถดูรหัสครอบครัว สลับผู้สูงอายุที่ร่วมเล่น และอัปโหลดภาพลูกแก้วผ่าน LINE ได้ที่นี่'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            stopSpeech();
            onNavigate('child-portal');
          }}
          className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-md transition-all active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <HeartHandshake className="w-5 h-5 text-amber-400" />
            <span>{lang === 'en' ? 'Open Family Hub (Caregiver Portal)' : 'เข้าสู่ศูนย์ดูแลครอบครัว (สำหรับลูกหลาน)'}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* =========================================================================
          SECTION 5: HACKATHON SHOWCASE TOOLKIT (เครื่องมือช่วยนำเสนอผลงานกรรมการ)
         ========================================================================= */}
      <div className="bg-white rounded-[32px] border-2 border-indigo-200/80 p-6 sm:p-7 shadow-xs text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏆</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {lang === 'en' ? 'Hackathon Showcase Presenter Tools' : 'เครื่องมือช่วยพรีเซนต์สด (Hackathon Showcase)'}
              </h3>
              <span className="text-xs text-slate-500">
                {lang === 'en' ? 'Quick shortcuts for live judge demonstrations' : 'ทางลัดควบคุมการสาธิตระบบสดต่อหน้าคณะกรรมการ'}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            SHOWCASE READY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Jump to Session Review */}
          <button
            onClick={() => {
              stopSpeech();
              if (onUnlockAllOrbs) onUnlockAllOrbs();
              onNavigate('session-review');
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>✨ ดูหน้าสรุป Session Review ทันที</span>
          </button>

          {/* Fast Unlock All Orbs */}
          <button
            onClick={() => {
              if (onUnlockAllOrbs) onUnlockAllOrbs();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>⚡ ปลดล็อกลูกแก้วครบ (5/5)</span>
          </button>

          {/* Reset All Orbs for Scratch Demo */}
          <button
            onClick={() => {
              if (onResetOrbs) onResetOrbs();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>🔄 รีเซ็ตลูกแก้ว (เริ่มเล่นใหม่ 0/5)</span>
          </button>
        </div>

        {/* Backend Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">Backend Server: http://localhost:5001</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Prisma • SQLite • Multer</span>
        </div>
      </div>
    </div>
  );
};
