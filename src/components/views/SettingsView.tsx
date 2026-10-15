import React, { useState } from 'react';
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
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';

interface SettingsViewProps {
  onNavigate: (page: NavigationPage) => void;
  lang: Language;
  onToggleLang: () => void;
  onResetOrbs?: () => void;
  onUnlockAllOrbs?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  lang,
  onToggleLang,
  onResetOrbs,
  onUnlockAllOrbs,
}) => {
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<'slow' | 'normal'>('normal');
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);

  const handleTestSpeech = () => {
    setIsTestingSpeech(true);
    const text = lang === 'en'
      ? 'Hello, this is Memora gentle voice assistant. Ready to accompany you today.'
      : 'สวัสดีค่ะ นี่คือเสียงแนะนำจากแอปพลิเคชัน เมโมร่า พร้อมช่วยดูแลความทรงจำของคุณยายแล้วค่ะ';

    speakWithElevenLabs(text, undefined, () => {
      setIsTestingSpeech(false);
    }, lang);
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
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'en' ? 'Comfort & Settings' : 'ตั้งค่าการใช้งาน'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          {lang === 'en'
            ? 'Adjust sound, language, letters, and family options.'
            : 'ปรับแต่งระบบเสียง ภาษา ขนาดตัวหนังสือ และระบบครอบครัว'}
        </p>
      </div>

      {/* =========================================================================
          SECTION 1: LANGUAGE PREFERENCE (MOVED FROM TOPBAR TO SETTINGS)
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200/70 text-sky-700 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'en' ? 'Language / ภาษา' : 'ภาษาของแอปพลิเคชัน (Language)'}
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
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
              lang === 'th'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/60 shadow-xs'
                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🇹🇭</span>
              <div>
                <span className="font-extrabold text-slate-900 block text-base sm:text-lg">ภาษาไทย</span>
                <span className="text-xs text-slate-500">Thai</span>
              </div>
            </div>
            {lang === 'th' && (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          {/* English Language Option */}
          <button
            onClick={() => {
              if (lang !== 'en') onToggleLang();
            }}
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
              lang === 'en'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/60 shadow-xs'
                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <span className="font-extrabold text-slate-900 block text-base sm:text-lg">English</span>
                <span className="text-xs text-slate-500">อังกฤษ</span>
              </div>
            </div>
            {lang === 'en' && (
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: VOICE & SOUND GUIDANCE (ELEVENLABS BACKEND)
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">
                {lang === 'en' ? 'Voice Guidance' : 'ระบบเสียงอ่านและคุณหมอ AI'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === 'en' ? 'Natural warm speech from ElevenLabs' : 'เสียงพูดภาษาไทยที่อบอุ่นและเป็นธรรมชาติ'}
              </p>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer ${
              soundEnabled ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Voice Speed */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div>
            <span className="text-sm font-bold text-slate-800">
              {lang === 'en' ? 'Voice Speed' : 'ความเร็วในการพูด'}
            </span>
            <p className="text-xs text-slate-500">
              {lang === 'en' ? 'Gentle pacing for easy understanding' : 'ปรับให้พูดช้าลงเพื่อให้ฟังง่ายขึ้น'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVoiceSpeed('slow')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                voiceSpeed === 'slow'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'en' ? 'Slower (0.85x)' : 'ช้าลง ฟังสบาย'}
            </button>
            <button
              onClick={() => setVoiceSpeed('normal')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                voiceSpeed === 'normal'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'en' ? 'Normal (1.0x)' : 'ความเร็วปกติ'}
            </button>
          </div>
        </div>

        {/* Test Voice Button */}
        <div className="pt-2">
          <button
            onClick={handleTestSpeech}
            disabled={isTestingSpeech}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 font-bold text-sm transition-all active:scale-98 cursor-pointer"
          >
            <Volume2 className={`w-4 h-4 ${isTestingSpeech ? 'animate-bounce text-amber-600' : ''}`} />
            <span>
              {isTestingSpeech
                ? (lang === 'en' ? 'Playing Voice Sample...' : 'กำลังเล่นเสียงตัวอย่าง...')
                : (lang === 'en' ? 'Test Voice Quality' : 'ทดสอบเสียงพูด (ภาษาไทย/อังกฤษ)')}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: TEXT SIZE & ACCESSIBILITY
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
            onClick={() => setTextSize('normal')}
            className={`py-3 rounded-2xl border text-center transition-all cursor-pointer ${
              textSize === 'normal'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold block">{lang === 'en' ? 'Standard' : 'ขนาดปกติ'}</span>
            <span className="text-xs opacity-70">Aa</span>
          </button>

          <button
            onClick={() => setTextSize('large')}
            className={`py-3 rounded-2xl border text-center transition-all cursor-pointer ${
              textSize === 'large'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold block">{lang === 'en' ? 'Large ✨' : 'ตัวใหญ่ ✨'}</span>
            <span className="text-sm font-bold opacity-80">Aa</span>
          </button>

          <button
            onClick={() => setTextSize('huge')}
            className={`py-3 rounded-2xl border text-center transition-all cursor-pointer ${
              textSize === 'huge'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
          >
            <span className="text-xs font-bold block">{lang === 'en' ? 'Extra Large' : 'ใหญ่พิเศษ'}</span>
            <span className="text-base font-extrabold opacity-90">Aa</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3.5: USER ACCOUNT & ACTIVE PROFILE
         ========================================================================= */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-700 flex items-center justify-center font-bold">
              👤
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {lang === 'en' ? 'User Account & Profile' : 'ข้อมูลบัญชีผู้ใช้งาน (User Profile)'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'en' ? 'Logged-in user profile & family association' : 'บัญชีที่เชื่อมโยงกับครอบครัวและฐานข้อมูล'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            AUTHENTICATED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">
              {lang === 'en' ? 'Account Holder' : 'ชื่อผู้ใช้งาน'}
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              แอน วัฒนศิริ (Ann)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ann@memora.app
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">
              {lang === 'en' ? 'Family & Role' : 'กลุ่มครอบครัวและบทบาท'}
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              ครอบครัววัฒนศิริ
            </span>
            <span className="text-xs text-indigo-600 font-bold">
              ลูกหลานคนโต (Caregiver / Buyer)
            </span>
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
