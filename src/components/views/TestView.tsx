import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MemoryOrb, Language } from '../../types';
import { 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  Mic, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  Smile,
  Sparkles
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';
import { soundFx } from '../../utils/soundEffects';

interface TestViewProps {
  orbs: MemoryOrb[];
  activeOrbId: string;
  onSelectOrb: (id: string) => void;
  onCorrectAnswer: (orbId: string) => void;
  onFinishSession: () => void;
  lang: Language;
  textSize?: 'normal' | 'large' | 'huge';
}

// Angles of memory questions derived from photos
type QuestionAngle = 'person' | 'place' | 'event' | 'emotion' | 'message' | 'keepsake';

interface DynamicQuestion {
  id: string;
  angle: QuestionAngle;
  angleLabel: { th: string; en: string; icon: string };
  questionText: { th: string; en: string };
  voicePrompt: { th: string; en: string };
  voiceSuccess: { th: string; en: string };
  gentleClue: { th: string; en: string };
  options: {
    id: string;
    label: string;
    labelEn?: string;
    sublabel?: string;
    sublabelEn?: string;
    photoUrl?: string;
    isCorrect: boolean;
  }[];
}

// Preset matching pairs with photos and labeled identities
export interface MatchingPair {
  id: string;
  nameTh: string;
  nameEn: string;
  relationTh: string;
  relationEn: string;
  photoUrl: string;
  icon: string;
  tagColor: {
    bg: string;
    text: string;
    border: string;
    accent: string;
  };
}

export type ChallengeStepType = 'quiz' | 'match' | 'wipe';

export type FrameStyle = 'wood' | 'gold' | 'black';

export interface DustWipePhotoItem {
  id: string;
  photoUrl: string;
  captionTh: string;
  captionEn: string;
  relationTh?: string;
  relationEn?: string;
  frameStyle: FrameStyle;
  glowColor: string;
}

export interface DustWipeData {
  items: DustWipePhotoItem[];
  photoUrl?: string;
  captionTh?: string;
  captionEn?: string;
  frameStyle?: FrameStyle;
  voicePrompt: { th: string; en: string };
  voiceSuccess: { th: string; en: string };
}

export interface ChallengeStep {
  id: string;
  type: ChallengeStepType;
  question?: DynamicQuestion;
  matchPairs?: MatchingPair[];
  wipeData?: DustWipeData;
}

interface DustWipePhotoCardProps {
  item: DustWipePhotoItem;
  index: number;
  isCompleted: boolean;
  onComplete: (id: string) => void;
  onStartWipe?: () => void;
  lang: Language;
  showHandGuide: boolean;
}

const DustWipePhotoCard: React.FC<DustWipePhotoCardProps> = ({
  item,
  index,
  isCompleted,
  onComplete,
  onStartWipe,
  lang,
  showHandGuide,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const lastSoundTimeRef = useRef(0);
  const swipeCountRef = useRef(0);
  const currentStrokeDistRef = useRef(0);
  const totalDragDistRef = useRef(0);
  const [photoRatio, setPhotoRatio] = useState<number>(1.48);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight && naturalHeight > 0) {
      setPhotoRatio(naturalWidth / naturalHeight);
    }
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    swipeCountRef.current = 0;
    currentStrokeDistRef.current = 0;
    totalDragDistRef.current = 0;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Reset transform to identity so all operations work in exact canvas backing store pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Translucent vintage dust layer (60% opacity) - allows underlying photo to be softly visible
    const dustGrad = ctx.createLinearGradient(0, 0, width, height);
    dustGrad.addColorStop(0, 'rgba(232, 224, 214, 0.62)');
    dustGrad.addColorStop(0.5, 'rgba(216, 206, 194, 0.65)');
    dustGrad.addColorStop(1, 'rgba(226, 218, 208, 0.60)');
    ctx.fillStyle = dustGrad;
    ctx.fillRect(0, 0, width, height);

    // Fine, delicate dust particles (subtle misty specks, not sand blobs)
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = (Math.random() * 1.2 + 0.4) * dpr;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.32)' : 'rgba(125, 110, 95, 0.16)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    let animId: number;
    const checkAndInit = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animId = requestAnimationFrame(checkAndInit);
        return;
      }
      initCanvas();
    };

    checkAndInit();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [item.id, photoRatio]);

  // Buttery-smooth continuous stroke erasing
  const eraseStroke = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const isPortrait = photoRatio < 0.95;
    const brushRadius = (isPortrait ? 30 : 36) * dpr;

    const dist = Math.hypot(x2 - x1, y2 - y1);
    currentStrokeDistRef.current += dist;
    totalDragDistRef.current += dist;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushRadius * 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Soft feathered stamp at destination point
    const radGrad = ctx.createRadialGradient(x2, y2, 0, x2, y2, brushRadius);
    radGrad.addColorStop(0, 'rgba(0,0,0,1)');
    radGrad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    radGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(x2, y2, brushRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Throttle progress check to once every 140ms so drag stays buttery 60fps/120fps with zero lag
    const now = performance.now();
    if (now - lastCheckTimeRef.current > 140) {
      lastCheckTimeRef.current = now;
      checkWipeProgress();
    }
  };

  const checkWipeProgress = () => {
    if (isCompleted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    try {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const imgData = ctx.getImageData(0, 0, w, h);
      let cleared = 0;
      const samples = 160;

      for (let i = 0; i < samples; i++) {
        const randX = Math.floor(Math.random() * w);
        const randY = Math.floor(Math.random() * h);
        const alphaIndex = (randY * w + randX) * 4 + 3;
        // Translucent dust alpha is ~160, cleared pixels drop below 40
        if (imgData.data[alphaIndex] < 40) {
          cleared++;
        }
      }

      const ratio = cleared / samples;
      
      // Calculate effective swipes: combines discrete finger lifts and continuous back-and-forth scrubbing
      const continuousSwipes = Math.floor(totalDragDistRef.current / (w * 0.65));
      const effectiveSwipes = Math.max(swipeCountRef.current, continuousSwipes);

      (window as any).__lastWipeMetrics = {
        ratio,
        cleared,
        samples,
        effectiveSwipes,
        swipeCount: swipeCountRef.current,
        continuousSwipes,
        totalDragDist: totalDragDistRef.current,
        w,
        h,
      };

      // Calibrated specifically so that it takes ~3-4 natural swipes to clean the picture:
      // - 1 or 2 swipes: not yet clean (reveals part of the photo, elder sees progress).
      // - 3 swipes: if wiping broadly (effectiveSwipes >= 3 && ratio >= 0.35), cleans!
      // - 4 swipes: guaranteed clean if effectiveSwipes >= 4 (ratio >= 0.28).
      // - Safety fallback: if broad scrubbing clears >= 52% of the canvas.
      const isClean = 
        (effectiveSwipes >= 4 && ratio >= 0.28) ||
        (effectiveSwipes >= 3 && ratio >= 0.35) ||
        (ratio >= 0.52);

      if (isClean) {
        onComplete(item.id);
      }
    } catch (_) {}
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    currentStrokeDistRef.current = 0;
    onStartWipe?.();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    lastPointRef.current = { x, y };
    eraseStroke(x, y, x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    const last = lastPointRef.current || { x, y };
    eraseStroke(last.x, last.y, x, y);
    lastPointRef.current = { x, y };

    const now = Date.now();
    if (now - lastSoundTimeRef.current > 240) {
      soundFx.playTap();
      lastSoundTimeRef.current = now;
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastPointRef.current = null;
    const dpr = window.devicePixelRatio || 1;
    // Count as a distinct stroke if dragged more than 35 CSS px
    if (currentStrokeDistRef.current >= 35 * dpr) {
      swipeCountRef.current += 1;
    }
    currentStrokeDistRef.current = 0;
    checkWipeProgress();
  };

  const frameOuterClass =
    item.frameStyle === 'wood'
      ? 'border-[8px] sm:border-[10px] border-[#4a240e] bg-gradient-to-b from-[#6b3716] via-[#85471e] to-[#4a240e] shadow-2xl rounded-2xl ring-2 ring-[#a36235]/60'
      : item.frameStyle === 'gold'
      ? 'border-[8px] sm:border-[10px] border-[#8a610e] bg-gradient-to-tr from-[#8f6610] via-[#f5d061] to-[#a37515] shadow-2xl rounded-2xl ring-2 ring-yellow-200/90'
      : 'border-[8px] sm:border-[10px] border-slate-950 bg-slate-900 shadow-2xl rounded-2xl ring-2 ring-slate-800';

  const frameInnerMatting =
    item.frameStyle === 'wood'
      ? 'p-1.5 sm:p-2 bg-gradient-to-tr from-[#2d1407] via-[#4a240e] to-[#2d1407] rounded-xl'
      : item.frameStyle === 'gold'
      ? 'p-1.5 sm:p-2 bg-gradient-to-b from-[#5c4008] via-[#cf9c27] to-[#5c4008] rounded-xl'
      : 'p-1.5 sm:p-2 bg-[#fbf9f5] rounded-xl shadow-inner border border-slate-200/90';

  const frameLabel =
    item.frameStyle === 'wood'
      ? (lang === 'en' ? '🪵 Teak Wood' : '🪵 ไม้สัก')
      : item.frameStyle === 'gold'
      ? (lang === 'en' ? '✨ Vintage Gold' : '✨ ทองคำ')
      : (lang === 'en' ? '🖼️ Gallery Black' : '🖼️ สีดำ');

  const glowStyle: React.CSSProperties = isCompleted
    ? {
        boxShadow: `0 0 28px 8px ${item.glowColor}, 0 0 55px 16px ${item.glowColor.replace('0.5', '0.25')}`,
        transition: 'box-shadow 0.8s ease, transform 0.5s ease',
        transform: 'scale(1.015)',
      }
    : {
        transition: 'box-shadow 0.5s ease, transform 0.5s ease',
      };

  const isPortrait = photoRatio < 0.95;

  const frameHeightClass = isPortrait
    ? 'h-[270px] xs:h-[300px] [@media(min-height:700px)]:h-[340px] [@media(min-height:780px)]:h-[390px] [@media(min-height:840px)]:h-[430px]'
    : 'h-[210px] xs:h-[235px] [@media(min-height:700px)]:h-[265px] [@media(min-height:780px)]:h-[295px] [@media(min-height:840px)]:h-[325px]';

  return (
    <div className="w-full flex flex-col items-center select-none min-w-0">
      {/* Framed Photo Container adhering strictly to the photo's real natural ratio */}
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer ${frameOuterClass} ${frameHeightClass} max-w-[90vw] xs:max-w-[350px] sm:max-w-[380px] w-auto`}
        style={{
          ...glowStyle,
          aspectRatio: `${photoRatio}`,
        }}
      >
        {/* Ornate Corner Brackets */}
        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-300/90 rounded-tl-sm pointer-events-none z-10" />
        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-300/90 rounded-tr-sm pointer-events-none z-10" />
        <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-300/90 rounded-bl-sm pointer-events-none z-10" />
        <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-300/90 rounded-br-sm pointer-events-none z-10" />

        {/* Corner Rivets for Wood Frame */}
        {item.frameStyle === 'wood' && (
          <>
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900/60 shadow-xs z-10" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900/60 shadow-xs z-10" />
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900/60 shadow-xs z-10" />
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-yellow-300 border border-amber-900/60 shadow-xs z-10" />
          </>
        )}

        {/* Inner Matting Layer with true photo natural ratio */}
        <div className={`relative w-full h-full ${frameInnerMatting}`}>
          <div className="relative w-full h-full overflow-hidden rounded-lg bg-slate-200">
            {/* Real Photo Underneath (softly visible through translucent dust) */}
            <img
              src={item.photoUrl}
              alt={item.captionTh}
              onLoad={handleImageLoad}
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Canvas for Dust Wiping */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute inset-0 w-full h-full rounded-md cursor-pointer touch-none select-none transition-opacity duration-700 ${
                isCompleted ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            />

            {/* Hand Guide Indicator on first active photo */}
            {showHandGuide && !isCompleted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 animate-fade-in p-2 text-center">
                <div className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-lg border-2 border-amber-300 flex items-center justify-center animate-bounce mb-1">
                  <span className="text-xl">👆</span>
                </div>
                <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 shadow-xs">
                  <p className="text-xs font-bold text-white whitespace-nowrap">
                    {lang === 'en' ? 'Wipe the dust' : 'ลูบหน้าจอปัดฝุ่น'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Realistic Wooden Picture Ledge Shelf (ชั้นวางภาพไม้สักทอง) */}
      <div className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[380px] h-3 sm:h-3.5 bg-gradient-to-r from-[#633314] via-[#85471e] to-[#4e270d] rounded-sm shadow-md border-t border-[#a15a28]/70 relative z-10 -mt-0.5" />
      <div className="w-[88%] max-w-[310px] xs:max-w-[330px] h-2 bg-black/15 blur-[2px] rounded-full mx-auto" />

      {/* Caption below the shelf */}
      <div className="mt-1.5 text-center max-w-[340px] xs:max-w-[360px] px-2 space-y-0.5">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
          {lang === 'en' ? item.captionEn : item.captionTh}
        </h3>
        {item.relationTh && (
          <p className="text-xs text-slate-500 font-medium">
            {lang === 'en' ? item.relationEn : item.relationTh}
          </p>
        )}
      </div>
    </div>
  );
};

export const TestView: React.FC<TestViewProps> = ({
  orbs,
  activeOrbId,
  onSelectOrb,
  onCorrectAnswer,
  onFinishSession,
  lang,
  textSize = 'large',
}) => {
  // Currently focused photo orb
  const currentOrbIndex = orbs.findIndex((o) => o.id === activeOrbId);
  const activeOrb = (currentOrbIndex >= 0 ? orbs[currentOrbIndex] : null) || orbs[0] || null;

  // Active step index in the interleaved sequence
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Interaction States
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [selectedTraitOption, setSelectedTraitOption] = useState<{
    id: string;
    label: string;
    sublabel?: string;
    photoUrl?: string;
  } | null>(null);
  const [answerState, setAnswerState] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [showClue, setShowClue] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // State for Step Type 3: Dust Wipe Memory Reveal (Full-Screen Grand Framed Gallery)
  const [wipedPhotoIds, setWipedPhotoIds] = useState<string[]>([]);
  const [hasStartedWiping, setHasStartedWiping] = useState(false);
  const [activeWipeIdx, setActiveWipeIdx] = useState(0);

  // Conversational trait formatter: tells who/what this person or item is ("เขาเป็น...") warmly
  const getChoiceStoryTrait = (
    opt: { label: string; sublabel?: string },
    angle?: QuestionAngle,
    currentLang: Language = lang
  ) => {
    const name = opt.label.replace(/^[👉✨🏷️]\s*/, '').trim();
    const trait = opt.sublabel || '';

    if (currentLang === 'en') {
      if (angle === 'person') {
        return {
          title: `About ${name}`,
          detail: `This is ${name}. They are our ${trait || 'family member'}. 🏡`,
          promptToLook: 'Take another gentle look at the photo... who is in this picture?',
        };
      } else if (angle === 'place') {
        return {
          title: `About ${name}`,
          detail: `${name} is a special place for ${trait || 'memories'}. 🌿`,
          promptToLook: 'Look closely at the photo surroundings... where was this taken?',
        };
      } else if (angle === 'event') {
        return {
          title: `About ${name}`,
          detail: `${name} is a memorable time of ${trait || 'celebration'}. 🎈`,
          promptToLook: 'What special moment is taking place in this photo?',
        };
      } else {
        return {
          title: `About ${name}`,
          detail: `${name} is ${trait || 'heartwarming feeling'}. ✨`,
          promptToLook: 'How does seeing this photo make your heart feel?',
        };
      }
    } else {
      if (angle === 'person') {
        return {
          title: `เรื่องราวของ ${name}`,
          detail: `คนนี้คือ ${name} ค่ะ เขาเป็น${trait || 'คนในครอบครัว'} 🏡`,
          promptToLook: 'ลองดูรอยยิ้มในภาพถ่ายใบนี้อีกทีนะคะ... คนในภาพนี้คือใครเอ่ย?',
        };
      } else if (angle === 'place') {
        return {
          title: `เกี่ยวกับ ${name}`,
          detail: `${name} ที่นี่เป็น${trait ? `${trait}` : 'สถานที่คุ้นเคย'}ค่ะ 🌿`,
          promptToLook: 'ลองสังเกตบรรยากาศรอบๆ ในภาพนี้นะคะ... ถ่ายที่ไหนเอ่ย?',
        };
      } else if (angle === 'event') {
        return {
          title: `เกี่ยวกับ ${name}`,
          detail: `${name} เป็นช่วงเวลา${trait ? `${trait}` : 'ที่มีความสุข'}ค่ะ 🎈`,
          promptToLook: 'ในภาพนี้ ทุกคนกำลังทำอะไรกันอยู่เอ่ย?',
        };
      } else {
        return {
          title: `เกี่ยวกับ ${name}`,
          detail: `${name} เป็น${trait ? `${trait}` : 'ความรู้สึกอบอุ่น'}ค่ะ ✨`,
          promptToLook: 'เห็นภาพนี้แล้ว ในใจรู้สึกอย่างไรบ้างคะ?',
        };
      }
    }
  };

  // Matching game state
  const [selectedMatchPhoto, setSelectedMatchPhoto] = useState<string | null>(null);
  const [selectedMatchLabel, setSelectedMatchLabel] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mismatchPair, setMismatchPair] = useState<{ photoId: string; labelId: string } | null>(null);
  const [isMatchCompleted, setIsMatchCompleted] = useState(false);

  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      stopSpeech();
    };
  }, []);

  // Family members list for matching game
  const allMatchingPairs: MatchingPair[] = useMemo(() => [
    {
      id: 'match-1',
      nameTh: 'น้องภูมิ',
      nameEn: 'Poom',
      relationTh: 'หลานชายคนโปรด',
      relationEn: 'Favorite Grandson',
      photoUrl: '/images/memories/korean-bbq-siblings.jpg',
      icon: '💙',
      tagColor: {
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200',
        accent: 'border-l-sky-500',
      },
    },
    {
      id: 'match-2',
      nameTh: 'น้องพิม',
      nameEn: 'Pim',
      relationTh: 'หลานสาวคนโต',
      relationEn: 'Eldest Granddaughter',
      photoUrl: '/images/memories/flower-garden-selfie.jpg',
      icon: '🌸',
      tagColor: {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        accent: 'border-l-rose-500',
      },
    },
    {
      id: 'match-5',
      nameTh: 'เจ้าเหมียวตัวโปรด',
      nameEn: 'Beloved Cat',
      relationTh: 'สัตว์เลี้ยงแสนรักประจำบ้าน',
      relationEn: 'Beloved Family Pet',
      photoUrl: '/images/memories/beloved-pet-cat.jpg',
      icon: '🐾',
      tagColor: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        accent: 'border-l-amber-500',
      },
    },
    {
      id: 'match-3',
      nameTh: 'น้องก้อย',
      nameEn: 'Koi',
      relationTh: 'ลูกสาวคนโต',
      relationEn: 'Eldest Daughter',
      photoUrl: '/images/memories/daughter-green-wall.jpg',
      icon: '⭐',
      tagColor: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200',
        accent: 'border-l-indigo-500',
      },
    },
    {
      id: 'match-4',
      nameTh: 'น้องแอน',
      nameEn: 'Ann',
      relationTh: 'ลูกสาวคนรอง',
      relationEn: 'Second Daughter',
      photoUrl: '/images/memories/airplane-cafe-drinks.jpg',
      icon: '🧡',
      tagColor: {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        accent: 'border-l-orange-500',
      },
    },
  ], []);

  // Generate dynamic multi-angle questions based on active photo orb
  const currentQuestions: DynamicQuestion[] = useMemo(() => {
    if (!activeOrb) return [];

    const baseQuestions: DynamicQuestion[] = [
      // 1. คนในภาพ (Person / Identity)
      {
        id: `${activeOrb.id}-person`,
        angle: 'person',
        angleLabel: { th: 'คนในภาพ', en: 'Person', icon: '👤' },
        questionText: {
          th: 'คนที่อยู่ในภาพนี้คือใครคะ?',
          en: 'Who is the person in this photo?',
        },
        voicePrompt: {
          th: activeOrb.voicePrompt || 'จำคนในภาพนี้ได้ไหมคะ... คนนี้คือใครเอ่ย?',
          en: activeOrb.voicePromptEn || 'Do you remember who this is in the photo?',
        },
        voiceSuccess: {
          th: activeOrb.voiceSuccess || 'ถูกต้องแล้วค่ะ! ความจำดีเยี่ยมมากค่ะ ✨',
          en: activeOrb.voiceSuccessEn || 'Wonderful! You remembered correctly! ✨',
        },
        gentleClue: {
          th: activeOrb.gentleClue || 'ลองสังเกตรอยยิ้มที่คุ้นเคยดูนะคะ',
          en: activeOrb.gentleClueEn || 'Notice their warm and familiar smile.',
        },
        options: (activeOrb.options || []).map((opt) => ({
          id: opt?.id || `opt-${Math.random()}`,
          label: lang === 'en' && opt?.labelEn ? opt.labelEn : (opt?.label || ''),
          sublabel: lang === 'en' && opt?.relationEn ? opt.relationEn : (opt?.relation || ''),
          photoUrl: opt?.photoUrl || activeOrb.photoUrl || '',
          isCorrect: Boolean(opt?.isCorrect),
        })),
      },

      // 2. สถานที่ในภาพ (Location / Place)
      {
        id: `${activeOrb.id}-place`,
        angle: 'place',
        angleLabel: { th: 'สถานที่', en: 'Place', icon: '📍' },
        questionText: {
          th: 'ภาพนี้ถ่ายที่ไหน จำได้ไหมคะ?',
          en: 'Where was this photo taken?',
        },
        voicePrompt: {
          th: 'ลองดูรอบๆ ภาพนี้นะคะ... จำได้ไหมคะว่าที่นี่คือที่ไหนเอ่ย?',
          en: 'Take a close look at the surroundings... Where was this taken?',
        },
        voiceSuccess: {
          th: 'ยอดเยี่ยมมากค่ะ! ตอบถูกเป๊ะเลยค่ะ ✨',
          en: 'Spot on! You remembered the exact place! ✨',
        },
        gentleClue: {
          th: activeOrb.emotion === 'nostalgia' 
            ? 'ทริปทะเลรับลมเย็นๆ ใกล้กรุงเทพฯ ค่ะ'
            : activeOrb.emotion === 'vitality'
            ? 'บริเวณบ้านที่ชอบไปนั่งรับลมสบายๆ ค่ะ'
            : 'สถานที่คุ้นเคยที่ครอบครัวเราไปด้วยกันบ่อยๆ ค่ะ',
          en: 'A special place our family visited together.',
        },
        options: activeOrb.emotion === 'nostalgia'
          ? [
              { id: 'place-1', label: 'หาดหัวหิน 🌊', labelEn: 'Hua Hin Beach 🌊', sublabel: 'ทริปครอบครัวรับลมทะเล', sublabelEn: 'Family seaside holiday', isCorrect: true },
              { id: 'place-2', label: 'ดอยอินทนนท์ ⛰️', labelEn: 'Doi Inthanon ⛰️', sublabel: 'ยอดเขาสูงภาคเหนือ', sublabelEn: 'Northern mountains', isCorrect: false },
              { id: 'place-3', label: 'เกาะสมุย 🏝️', labelEn: 'Samui Island 🏝️', sublabel: 'เกาะทางภาคใต้', sublabelEn: 'Southern island', isCorrect: false },
            ]
          : activeOrb.emotion === 'vitality'
          ? [
              { id: 'place-1', label: 'สวนหลังบ้าน 🌿', labelEn: 'Backyard Garden 🌿', sublabel: 'นั่งเล่นรับลมเย็นๆ', sublabelEn: 'Relaxing under the trees', isCorrect: true },
              { id: 'place-2', label: 'คลินิกสัตวแพทย์ 🏥', labelEn: 'Animal Clinic 🏥', sublabel: 'ตรวจสุขภาพประจำปี', sublabelEn: 'Routine checkup', isCorrect: false },
              { id: 'place-3', label: 'ตลาดน้ำดำเนินสะดวก 🛶', labelEn: 'Floating Market 🛶', sublabel: 'ซื้อขนมไทย', sublabelEn: 'Traditional market', isCorrect: false },
            ]
          : activeOrb.emotion === 'celebration'
          ? [
              { id: 'place-1', label: 'มหาวิทยาลัย (หอประชุมใหญ่) 🎓', labelEn: 'University Auditorium 🎓', sublabel: 'วันรับปริญญาสุดภูมิใจ', sublabelEn: 'Proud graduation day', isCorrect: true },
              { id: 'place-2', label: 'สนามบินดอนเมือง ✈️', labelEn: 'Don Mueang Airport ✈️', sublabel: 'ส่งญาติเดินทาง', sublabelEn: 'Travel departure', isCorrect: false },
              { id: 'place-3', label: 'สวนน้ำพัทยา 🏖️', labelEn: 'Pattaya Waterpark 🏖️', sublabel: 'ทริปสวนสนุก', sublabelEn: 'Theme park visit', isCorrect: false },
            ]
          : [
              { id: 'place-1', label: 'สนามเด็กเล่นใกล้บ้าน 🛝', labelEn: 'Neighborhood Park 🛝', sublabel: 'พาวิ่งเล่นออกกำลัง', sublabelEn: 'Playground park', isCorrect: true },
              { id: 'place-2', label: 'ห้างสรรพสินค้า 🏬', labelEn: 'Shopping Mall 🏬', sublabel: 'เดินตากแอร์ช้อปปิ้ง', sublabelEn: 'Department store', isCorrect: false },
              { id: 'place-3', label: 'สถานีรถไฟ 🚂', labelEn: 'Train Station 🚂', sublabel: 'นั่งรถไฟเที่ยว', sublabelEn: 'Train travel', isCorrect: false },
            ],
      },

      // 3. เหตุการณ์ในภาพ (Event / Occasion)
      {
        id: `${activeOrb.id}-event`,
        angle: 'event',
        angleLabel: { th: 'เหตุการณ์', en: 'Event', icon: '📅' },
        questionText: {
          th: 'ภาพนี้เป็นช่วงเวลาหรือเหตุการณ์อะไรคะ?',
          en: 'What special event was taking place?',
        },
        voicePrompt: {
          th: 'ในภาพนี้ ทุกคนกำลังมีช่วงเวลาพิเศษหรือทำอะไรกันอยู่เอ่ย?',
          en: 'What wonderful occasion or event is taking place in this photo?',
        },
        voiceSuccess: {
          th: 'ใช่แล้วค่ะ! เป็นวันที่เต็มไปด้วยรอยยิ้มของทุกคนเลยนะคะ ✨',
          en: 'Exactly! Such a heartwarming and memorable day! ✨',
        },
        gentleClue: {
          th: 'สังเกตเสื้อผ้าและรอยยิ้มของทุกคนในวันนั้นดูนะคะ',
          en: 'Look at the outfits and happy celebrations in the photo.',
        },
        options: activeOrb.emotion === 'celebration'
          ? [
              { id: 'evt-1', label: 'วันรับปริญญาบัตร 🎓', labelEn: 'Graduation Ceremony 🎓', sublabel: 'สวมชุดครุยแห่งเกียรติยศ', sublabelEn: 'Wearing graduation gown', isCorrect: true },
              { id: 'evt-2', label: 'วันทำบุญขึ้นบ้านใหม่ 🏡', labelEn: 'Housewarming Blessing 🏡', sublabel: 'เลี้ยงพระรับสิริมงคล', sublabelEn: 'Home ceremony', isCorrect: false },
              { id: 'evt-3', label: 'งานเลี้ยงเกษียณอายุ 🎉', labelEn: 'Retirement Celebration 🎉', sublabel: 'ฉลองความสำเร็จ', sublabelEn: 'Celebration party', isCorrect: false },
            ]
          : activeOrb.emotion === 'love'
          ? [
              { id: 'evt-1', label: 'วันเกิดน้องมินท์ 🎂', labelEn: 'Mint’s Birthday 🎂', sublabel: 'เป่าเค้กและกอดแน่นๆ', sublabelEn: 'Blowing birthday candles', isCorrect: true },
              { id: 'evt-2', label: 'วันเด็กแห่งชาติ 🎈', labelEn: 'Children’s Day 🎈', sublabel: 'พาไปดูนิทรรศการ', sublabelEn: 'Festival outing', isCorrect: false },
              { id: 'evt-3', label: 'วันแม่แห่งชาติ 🌸', labelEn: 'Mother’s Day 🌸', sublabel: 'มอบพวงมาลัยดอกมะลิ', sublabelEn: 'Jasmine garland', isCorrect: false },
            ]
          : [
              { id: 'evt-1', label: 'ทริปพักผ่อนของครอบครัว 🏖️', labelEn: 'Family Holiday Vacation 🏖️', sublabel: 'ถ่ายรูปพร้อมหน้าพร้อมตา', sublabelEn: 'Gathering with loved ones', isCorrect: true },
              { id: 'evt-2', label: 'วันปีใหม่รวมญาติ 🎆', labelEn: 'New Year Reunion 🎆', sublabel: 'จับสลากของขวัญ', sublabelEn: 'Gift exchange party', isCorrect: false },
              { id: 'evt-3', label: 'ทำบุญวันสงกรานต์ 💦', labelEn: 'Songkran Festival 💦', sublabel: 'รดน้ำดำหัวผู้ใหญ่', sublabelEn: 'Water blessing ceremony', isCorrect: false },
            ],
      },

      // 4. ความรู้สึกเมื่อเห็นภาพ (Emotion & Wellbeing)
      {
        id: `${activeOrb.id}-emotion`,
        angle: 'emotion',
        angleLabel: { th: 'ความรู้สึก', en: 'Feeling', icon: '💖' },
        questionText: {
          th: 'เห็นภาพนี้แล้ว ตอนนี้รู้สึกอย่างไรในใจคะ?',
          en: 'How does seeing this photo make you feel?',
        },
        voicePrompt: {
          th: 'พอมองภาพนี้แล้ว... ในใจของคุณยายรู้สึกอบอุ่นหรือมีความสุขอย่างไรบ้างคะ?',
          en: 'Looking at this warm memory, how does your heart feel?',
        },
        voiceSuccess: {
          th: 'คุณตามีความสุข ลูกหลานทุกคนก็อิ่มเอมใจที่สุดเลยค่ะ ❤️',
          en: 'When your heart smiles, the whole family smiles with you! ❤️',
        },
        gentleClue: {
          th: 'เลือกความรู้สึกที่ทำให้ใจของคุณเบิกบานได้เลยค่ะ',
          en: 'Choose any feeling that brings peace and joy to your soul.',
        },
        options: [
          { id: 'emo-1', label: 'อบอุ่นหัวใจเหลือเกิน ❤️', labelEn: 'Deeply Warm & Loved ❤️', sublabel: 'สัมผัสถึงความรักของลูกหลาน', sublabelEn: 'Feeling precious family love', isCorrect: true },
          { id: 'emo-2', label: 'ยิ้มมีความสุขสดใส ☀️', labelEn: 'Bright Joy & Happiness ☀️', sublabel: 'เห็นรอยยิ้มแล้วสดชื่น', sublabelEn: 'Smiling happily', isCorrect: true },
          { id: 'emo-3', label: 'ภาคภูมิใจในตัวลูกหลาน 🌟', labelEn: 'Proud of Our Family 🌟', sublabel: 'ชื่นใจที่เห็นทุกคนเติบโต', sublabelEn: 'Watching them grow up', isCorrect: true },
        ],
      },

      // 5. การสื่อสาร / สิ่งที่อยากบอกคนในภาพ (Expression & Message)
      {
        id: `${activeOrb.id}-message`,
        angle: 'message',
        angleLabel: { th: 'อยากบอกอะไร', en: 'Message', icon: '💌' },
        questionText: {
          th: 'ถ้าเจอคนในภาพตอนนี้ อยากบอกอะไรเขาคะ?',
          en: 'What would you like to tell them right now?',
        },
        voicePrompt: {
          th: 'ถ้าคนในภาพนี้ยืนอยู่ตรงหน้า... มีคำพูดอบอุ่นอะไรอยากบอกเขาไหมคะ?',
          en: 'If they were right in front of you, what sweet words would you say to them?',
        },
        voiceSuccess: {
          th: 'ข้อความนี้อบอุ่นมากเลยค่ะ! ระบบได้บันทึกความรู้สึกนี้ส่งต่อให้ลูกหลานแล้วนะคะ 💌✨',
          en: 'Such a heartwarming message! Sent with love to your family! 💌✨',
        },
        gentleClue: {
          th: 'สามารถแตะเลือกข้อความ หรือกดไมโครโฟนเพื่อพูดความในใจได้เลยค่ะ',
          en: 'Tap a loving message or tap the microphone to speak your heart.',
        },
        options: [
          { id: 'msg-1', label: 'คิดถึงเสมอนะลูก ขอให้มีความสุขมากๆ 💌', labelEn: 'Missing you always, stay healthy & happy 💌', sublabel: 'คำอวยพรอบอุ่นจากหัวใจ', sublabelEn: 'Warm blessing from home', isCorrect: true },
          { id: 'msg-2', label: 'ขอบใจที่มาดูแลและทำให้ยิ้มได้เสมอนะ 😊', labelEn: 'Thank you for caring and making me smile 😊', sublabel: 'ขอบคุณความกตัญญูที่น่ารัก', sublabelEn: 'Grateful for their sweet love', isCorrect: true },
          { id: 'msg-3', label: 'อย่าลืมแวะมากินข้าวฝีมือยายบ่อยๆ นะ 🍲', labelEn: 'Come visit often for home-cooked meals 🍲', sublabel: 'เตรียมของโปรดรอไว้ให้แล้ว', sublabelEn: 'Cooking your favorite dishes', isCorrect: true },
        ],
      },
    ];

    return baseQuestions;
  }, [activeOrb, lang]);

  // UNIFIED INTERLEAVED CHALLENGE STEPS:
  // Dynamically alternates between Photo Quiz, Matching challenge, and Dust Wipe Memory Reveal!
  const sessionSteps: ChallengeStep[] = useMemo(() => {
    if (!activeOrb || currentQuestions.length === 0) return [];

    const personQ = currentQuestions.find((q) => q.angle === 'person') || currentQuestions[0];
    const placeOrEventQ = currentQuestions.find((q) => q.angle === 'place' || q.angle === 'event') || currentQuestions[1] || currentQuestions[0];
    const emotionOrMsgQ = currentQuestions.find((q) => q.angle === 'emotion' || q.angle === 'message') || currentQuestions[2] || currentQuestions[0];

    const matchSet1 = allMatchingPairs.slice(0, 3); // น้องภูมิ, น้องมินท์, เจ้าทองม้วน
    const matchSet2 = allMatchingPairs.slice(3, 5); // เจี๊ยบ, น้องแอน

    const orbHash = Math.abs(activeOrb.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));

    // 3 Photos for the Dust Wipe Step (Wood, Gold, Black frames on 3 vertical shelves)
    const otherOrbs = orbs.filter((o) => o.id !== activeOrb.id);
    const orb2 = otherOrbs[0];
    const orb3 = otherOrbs[1];

    const fallbackPair1 = allMatchingPairs.find((p) => !activeOrb.photoUrl.includes(p.photoUrl.split('?')[0])) || allMatchingPairs[1];
    const fallbackPair2 = allMatchingPairs.find((p) => !activeOrb.photoUrl.includes(p.photoUrl.split('?')[0]) && p.id !== fallbackPair1?.id) || allMatchingPairs[2];

    const photo2Url = orb2?.photoUrl || fallbackPair1?.photoUrl || '/images/memories/flower-garden-selfie.jpg';
    const caption2Th = orb2?.title || fallbackPair1?.nameTh || 'น้องพิม';
    const caption2En = orb2?.titleEn || fallbackPair1?.nameEn || 'Pim';
    const relation2Th = orb2?.memoryYear || fallbackPair1?.relationTh || 'หลานสาวคนโต';
    const relation2En = orb2?.memoryYearEn || fallbackPair1?.relationEn || 'Eldest Granddaughter';
    const glow2 = orb2?.glowColor || 'rgba(244, 63, 94, 0.5)';

    const photo3Url = orb3?.photoUrl || fallbackPair2?.photoUrl || '/images/memories/beloved-pet-cat.jpg';
    const caption3Th = orb3?.title || fallbackPair2?.nameTh || 'เจ้าเหมียวตัวโปรด';
    const caption3En = orb3?.titleEn || fallbackPair2?.nameEn || 'Beloved Cat';
    const relation3Th = orb3?.memoryYear || fallbackPair2?.relationTh || 'สัตว์เลี้ยงแสนรักประจำบ้าน';
    const relation3En = orb3?.memoryYearEn || fallbackPair2?.relationEn || 'Beloved Family Pet';
    const glow3 = orb3?.glowColor || 'rgba(16, 185, 129, 0.5)';

    const wipeItems: DustWipePhotoItem[] = [
      {
        id: `wipe-${activeOrb.id}`,
        photoUrl: activeOrb.photoUrl,
        captionTh: activeOrb.title,
        captionEn: activeOrb.titleEn || activeOrb.title,
        relationTh: activeOrb.memoryYear || 'ความทรงจำวันวาน',
        relationEn: activeOrb.memoryYearEn || 'Precious Memory',
        frameStyle: 'wood',
        glowColor: activeOrb.glowColor || 'rgba(245, 158, 11, 0.5)',
      },
      {
        id: `wipe-${orb2?.id || fallbackPair1?.id || 'item-2'}`,
        photoUrl: photo2Url,
        captionTh: caption2Th,
        captionEn: caption2En,
        relationTh: relation2Th,
        relationEn: relation2En,
        frameStyle: 'gold',
        glowColor: glow2,
      },
      {
        id: `wipe-${orb3?.id || fallbackPair2?.id || 'item-3'}`,
        photoUrl: photo3Url,
        captionTh: caption3Th,
        captionEn: caption3En,
        relationTh: relation3Th,
        relationEn: relation3En,
        frameStyle: 'black',
        glowColor: glow3,
      },
    ];

    const wipeStep: ChallengeStep = {
      id: `step-wipe-${activeOrb.id}`,
      type: 'wipe',
      wipeData: {
        items: wipeItems,
        photoUrl: activeOrb.photoUrl,
        captionTh: activeOrb.title,
        captionEn: activeOrb.titleEn || activeOrb.title,
        frameStyle: 'wood',
        voicePrompt: {
          th: 'คุณยายลองเอานิ้วลูบเบาๆ บนภาพ เพื่อปัดฝุ่นดูความทรงจำทั้ง 3 ภาพกันนะคะ 🌸',
          en: 'Gently wipe the dust from all 3 photos with your finger Grandma, to reveal these warm memories... 🌸',
        },
        voiceSuccess: {
          th: 'ความทรงจำทั้ง 3 ภาพสว่างสดใสขึ้นมาแล้วค่ะคุณยาย ยอดเยี่ยมมากค่ะ! ✨',
          en: 'All 3 precious memories shine brightly again Grandma! Wonderful! ✨',
        },
      },
    };

    const quizPersonStep: ChallengeStep = {
      id: 'step-quiz-person',
      type: 'quiz',
      question: personQ,
    };

    const matchStep1: ChallengeStep = {
      id: 'step-match-family-1',
      type: 'match',
      matchPairs: matchSet1,
    };

    const quizContextStep: ChallengeStep = {
      id: 'step-quiz-context',
      type: 'quiz',
      question: placeOrEventQ,
    };

    const matchStep2: ChallengeStep = {
      id: 'step-match-family-2',
      type: 'match',
      matchPairs: matchSet2,
    };

    const quizEmotionStep: ChallengeStep = {
      id: 'step-quiz-feeling',
      type: 'quiz',
      question: emotionOrMsgQ,
    };

    // Randomized interleaving so seniors don't memorize a repetitive quiz pattern
    const variant = orbHash % 3;
    if (variant === 0) {
      // Variant 0: Quiz -> Wipe -> Match -> Quiz -> Quiz
      return [quizPersonStep, wipeStep, matchStep1, quizContextStep, quizEmotionStep];
    } else if (variant === 1) {
      // Variant 1: Quiz -> Match -> Wipe -> Quiz -> Match
      return [quizPersonStep, matchStep1, wipeStep, quizContextStep, matchStep2];
    } else {
      // Variant 2: Wipe -> Quiz -> Match -> Quiz -> Quiz
      return [wipeStep, quizPersonStep, matchStep1, quizContextStep, quizEmotionStep];
    }
  }, [activeOrb, orbs, currentQuestions, allMatchingPairs]);

  const currentStep = sessionSteps[activeStepIndex] || sessionSteps[0];

  // Shuffled right column labels for the current match step
  const shuffledStepLabels = useMemo(() => {
    if (!currentStep || currentStep.type !== 'match' || !currentStep.matchPairs) return [];
    return [...currentStep.matchPairs].sort((a, b) => a.nameTh.localeCompare(b.nameTh));
  }, [currentStep]);

  // Check if current matching step is 100% completed
  const isCurrentStepMatchCompleted = useMemo(() => {
    if (!currentStep || currentStep.type !== 'match' || !currentStep.matchPairs) return false;
    return currentStep.matchPairs.every((p) => matchedIds.includes(p.id));
  }, [currentStep, matchedIds]);


  // Handle step transition and auto-voice reading
  useEffect(() => {
    if (!currentStep) return;

    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    // Reset interaction states for the new step
    setSelectedOptId(null);
    setSelectedTraitOption(null);
    setAnswerState('unanswered');
    setShowClue(false);
    setIsListeningMic(false);
    setVoiceTranscript('');
    setSelectedMatchPhoto(null);
    setSelectedMatchLabel(null);
    setMatchedIds([]);
    setMismatchPair(null);
    setIsMatchCompleted(false);
    setWipedPhotoIds([]);
    setHasStartedWiping(false);
    setActiveWipeIdx(0);

    // Read question prompt automatically
    const timer = setTimeout(() => {
      handlePlayStepVoice();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
        recognitionRef.current = null;
      }
      stopSpeech();
    };
  }, [currentStep?.id, lang]);

  const handlePlayStepVoice = () => {
    if (!currentStep) return;

    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    let speech = '';
    if (currentStep.type === 'quiz' && currentStep.question) {
      speech = lang === 'en' ? currentStep.question.voicePrompt.en : currentStep.question.voicePrompt.th;
    } else if (currentStep.type === 'wipe' && currentStep.wipeData) {
      speech = lang === 'en' ? currentStep.wipeData.voicePrompt.en : currentStep.wipeData.voicePrompt.th;
    } else {
      speech = lang === 'en'
        ? 'Take your time Grandma... Tap a photo, then tap their matching name!'
        : 'แตะที่รูปภาพ แล้วแตะชื่อและความสัมพันธ์ที่ตรงกันได้เลยค่ะ';
    }

    speakWithElevenLabs(
      speech,
      undefined,
      () => {
        setIsPlayingAudio(false);
      },
      lang
    );
  };

  // Multiple Choice Option Selection
  const handleSelectOption = (optId: string, isCorrect: boolean) => {
    if (!currentStep || currentStep.type !== 'quiz' || !currentStep.question || answerState === 'correct') return;

    soundFx.playTap();
    setSelectedOptId(optId);

    const tappedOpt = currentStep.question.options.find((o) => o.id === optId);

    if (isCorrect) {
      soundFx.playSuccessChime();
      setAnswerState('correct');
      setSelectedTraitOption(null);

      // Persist unlock
      if (activeOrb) {
        onCorrectAnswer(activeOrb.id);
      }

      const successSpeech = lang === 'en' ? currentStep.question.voiceSuccess.en : currentStep.question.voiceSuccess.th;
      speakWithElevenLabs(successSpeech, undefined, undefined, lang);
    } else {
      // Respectful, natural storytelling affirmation ("เขาเป็น..."):
      // NEVER evaluate or say "almost correct" / "wrong" to seniors!
      setAnswerState('unanswered');
      if (tappedOpt) {
        setSelectedTraitOption(tappedOpt);
        const traitInfo = getChoiceStoryTrait(tappedOpt, currentStep.question.angle, lang);
        const speech = `${traitInfo.detail} ${traitInfo.promptToLook}`;
        speakWithElevenLabs(speech, undefined, undefined, lang);
      }
    }
  };

  // Move to next step or next orb
  const handleNextStep = () => {
    stopSpeech();
    soundFx.playTap();
    setAnswerState('unanswered');
    setSelectedOptId(null);
    setSelectedTraitOption(null);
    setIsMatchCompleted(false);
    setMatchedIds([]);
    setWipedPhotoIds([]);
    setHasStartedWiping(false);

    if (activeStepIndex < sessionSteps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      // Finished all steps for this memory! Advance to next memory photo endlessly
      if (orbs.length > 0) {
        const nextIndex = (currentOrbIndex + 1) % orbs.length;
        onSelectOrb(orbs[nextIndex].id);
        setActiveStepIndex(0);
      }
    }
  };

  // Clue button trigger
  const handleTriggerClue = () => {
    if (!currentStep || currentStep.type !== 'quiz' || !currentStep.question) return;
    soundFx.playTap();
    setShowClue(true);
    const clueText = lang === 'en' ? currentStep.question.gentleClue.en : currentStep.question.gentleClue.th;
    speakWithElevenLabs(clueText, undefined, undefined, lang);
  };

  // Voice speech answer via Web Speech API + Elder-friendly interactive mode
  const handleVoiceAnswer = () => {
    if (!currentStep || currentStep.type !== 'quiz' || !currentStep.question) return;
    soundFx.playTap();
    stopSpeech();
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }

    setIsListeningMic(true);
    setVoiceTranscript('');

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = lang === 'en' ? 'en-US' : 'th-TH';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          setVoiceTranscript(fullTranscript);

          // Check if spoken words match target
          const correctOption = currentStep.question?.options.find((o) => o.isCorrect);
          if (correctOption) {
            const targetWords = [
              correctOption.label.toLowerCase(),
              correctOption.sublabel?.toLowerCase() || '',
              ...(correctOption.label.match(/[\u0E00-\u0E7F]+/g) || []),
            ].filter(Boolean);

            const lowerSpoken = fullTranscript.toLowerCase();
            const isMatch = targetWords.some((w) => w && lowerSpoken.includes(w));
            if (isMatch) {
              handleFinishVoice();
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition notice:', e);
        };

        recognition.onend = () => {
          // Keep listening active until elder taps finish or cancel
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition could not start:', e);
      }
    }
  };

  const handleFinishVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListeningMic(false);
    soundFx.playSuccessChime();
    setAnswerState('correct');
    if (activeOrb) {
      onCorrectAnswer(activeOrb.id);
    }
    const successSpeech = lang === 'en' ? currentStep?.question?.voiceSuccess.en : currentStep?.question?.voiceSuccess.th;
    if (successSpeech) {
      speakWithElevenLabs(successSpeech, undefined, undefined, lang);
    }
  };

  const handleCancelVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListeningMic(false);
    setVoiceTranscript('');
    soundFx.playTap();
  };

  // ==========================================
  // DUST WIPE MEMORY REVEAL HANDLERS (3 PHOTOS)
  // ==========================================
  const handlePhotoWiped = (photoId: string) => {
    setWipedPhotoIds((prev) => {
      if (prev.includes(photoId)) return prev;
      const next = [...prev, photoId];
      soundFx.playSuccessChime();

      const totalRequired = currentStep?.wipeData?.items?.length || 3;
      if (next.length >= totalRequired) {
        setTimeout(() => {
          soundFx.playCelebration();
        }, 500);
        if (activeOrb) {
          onCorrectAnswer(activeOrb.id);
        }
        const successVoice = lang === 'en'
          ? currentStep?.wipeData?.voiceSuccess.en
          : currentStep?.wipeData?.voiceSuccess.th;
        if (successVoice) {
          speakWithElevenLabs(successVoice, undefined, undefined, lang);
        }
      } else {
        // Auto-advance to next unwiped photo after 1.5s delay so elder can admire the revealed photo
        const items = currentStep?.wipeData?.items || [];
        const nextUnwipedIdx = items.findIndex((it) => it.id !== photoId && !next.includes(it.id));
        if (nextUnwipedIdx !== -1) {
          setTimeout(() => {
            setActiveWipeIdx(nextUnwipedIdx);
          }, 1500);
        }
      }
      return next;
    });
  };

  // ==========================================
  // MATCHING GAME HANDLERS
  // ==========================================
  const handleTapMatchPhoto = (id: string) => {
    if (matchedIds.includes(id)) return;
    soundFx.playTap();
    setSelectedMatchPhoto(id);

    if (selectedMatchLabel) {
      evaluateMatch(id, selectedMatchLabel);
    }
  };

  const handleTapMatchLabel = (id: string) => {
    if (matchedIds.includes(id)) return;
    soundFx.playTap();
    setSelectedMatchLabel(id);

    if (selectedMatchPhoto) {
      evaluateMatch(selectedMatchPhoto, id);
    }
  };

  const evaluateMatch = (photoId: string, labelId: string) => {
    if (photoId === labelId) {
      // Correct Match!
      soundFx.playSuccessChime();
      const updated = [...matchedIds, photoId];
      setMatchedIds(updated);
      setSelectedMatchPhoto(null);
      setSelectedMatchLabel(null);
      setMismatchPair(null);

      const matchedPerson = allMatchingPairs.find((p) => p.id === photoId);
      if (matchedPerson) {
        const name = lang === 'en' ? matchedPerson.nameEn : matchedPerson.nameTh;
        const rel = lang === 'en' ? matchedPerson.relationEn : matchedPerson.relationTh;
        const praise = lang === 'en'
          ? `Correct! That is ${name}, your ${rel}!`
          : `ถูกต้องแล้วค่ะ! นี่คือ ${name} ${rel} ค่ะ!`;
        speakWithElevenLabs(praise, undefined, undefined, lang);
      }

      if (currentStep?.matchPairs && updated.length === currentStep.matchPairs.length) {
        // Complete all matches for this step!
        setTimeout(() => {
          soundFx.playCelebration();
          setIsMatchCompleted(true);
        }, 500);
      }
    } else {
      // Mismatch
      soundFx.playGentleRetry();
      setMismatchPair({ photoId, labelId });
      setTimeout(() => {
        setSelectedMatchPhoto(null);
        setSelectedMatchLabel(null);
        setMismatchPair(null);
      }, 800);
    }
  };

  if (!orbs || orbs.length === 0 || !activeOrb || !currentStep) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-base text-slate-500 font-medium">
          {lang === 'en' ? 'No memories available for playing.' : 'ไม่มีข้อมูลรูปภาพความทรงจำสำหรับเล่นเกม'}
        </p>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto px-2 sm:px-4 select-none ${
      textSize === 'huge' ? 'space-y-1.5' : 'space-y-2'
    }`}>
      {/* =========================================================================
          STEP TYPE 1: PHOTO MEMORY QUIZ
          (NO progress bar - endless continuous play with prominent large photo & choices)
          ========================================================================= */}
      {currentStep.type === 'quiz' && currentStep.question && (
        <div className={`animate-fade-in ${textSize === 'huge' ? 'space-y-1.5 sm:space-y-2' : 'space-y-2 sm:space-y-2.5'}`}>
          {/* Question Card with Photo */}
          <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center ${
            textSize === 'huge' ? 'p-2.5 sm:p-3 space-y-1.5' : 'p-3 sm:p-3.5 space-y-2'
          }`}>
            {/* Header: Angle Indicator Pill + Warm Amber Audio Speaker Button in one row */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs font-bold shadow-2xs">
                <span>{currentStep.question.angleLabel.icon}</span>
                <span>{lang === 'en' ? currentStep.question.angleLabel.en : currentStep.question.angleLabel.th}</span>
              </div>

              {/* Audio Question Speaker Button (Cohesive Warm Amber Style) */}
              <button
                onClick={handlePlayStepVoice}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs border ${
                  isPlayingAudio
                    ? 'bg-amber-400 border-amber-500 text-slate-950 ring-3 ring-amber-200 animate-pulse'
                    : 'bg-amber-50/90 hover:bg-amber-100 border-amber-200/90 text-amber-900'
                }`}
                title={lang === 'en' ? 'Listen to question' : 'แตะเพื่อฟังเสียงอ่าน'}
                aria-label="Play speech"
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-4 h-4 text-slate-950" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-700" />
                )}
              </button>
            </div>

            {/* Photo Card: Prominent yet viewport-constrained */}
            <div className={`relative mx-auto w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs group bg-slate-100 transition-all ${
              textSize === 'huge' ? 'h-32 sm:h-36 max-h-[20vh]' : 'h-36 sm:h-40 md:h-44 max-h-[24vh]'
            }`}>
              <img
                src={activeOrb.photoUrl}
                alt={activeOrb.title}
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Speaker pill on image corner */}
              <button
                onClick={handlePlayStepVoice}
                className="absolute bottom-2 right-2 px-3 py-1 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white backdrop-blur-md flex items-center space-x-1.5 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-white/15"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>{isPlayingAudio ? (lang === 'en' ? 'Speaking...' : 'กำลังอ่าน...') : (lang === 'en' ? 'Listen' : 'ฟังเสียง')}</span>
              </button>
            </div>

            {/* Question Text (Clear, Senior-friendly) */}
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-normal">
                {lang === 'en' ? currentStep.question.questionText.en : currentStep.question.questionText.th}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {lang === 'en' ? 'Tap the answer below that feels right' : 'แตะเลือกคำตอบที่คุ้นเคยด้านล่างได้เลยค่ะ'}
              </p>
            </div>
          </div>

          {/* Gentle Clue Drawer: Header is strictly "คำใบ้ 💡" */}
          {showClue && currentStep.question && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-2.5 flex items-start space-x-2.5 shadow-2xs animate-fade-in text-left">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Lightbulb className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide block">
                  {lang === 'en' ? 'Clue 💡' : 'คำใบ้ 💡'}
                </span>
                <p className="text-xs sm:text-sm text-amber-950 font-semibold mt-0.5 leading-relaxed">
                  {lang === 'en' ? currentStep.question.gentleClue.en : currentStep.question.gentleClue.th}
                </p>
              </div>
            </div>
          )}

          {/* Tactile Choice Cards: Responsive padding for zero-scroll comfort */}
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
            {currentStep.question.options.map((opt) => {
              const isSelected = selectedOptId === opt.id;
              const isAnswerCorrect = answerState === 'correct' && opt.isCorrect;

              // Senior-friendly conversational text for identity questions:
              // "นี่คือ น้องภูมิ", "นี่คือ น้องมินท์"
              const displayLabel = currentStep.question?.angle === 'person'
                ? (lang === 'en' ? `This is ${opt.label}` : `นี่คือ ${opt.label}`)
                : opt.label;

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id, opt.isCorrect)}
                  disabled={answerState === 'correct'}
                  className={`group w-full flex items-center px-4 rounded-2xl border-2 transition-all text-left cursor-pointer active:translate-y-[1px] ${
                    textSize === 'huge' ? 'py-2 sm:py-2.5' : 'py-2.5 sm:py-3'
                  } ${
                    isAnswerCorrect
                      ? 'bg-emerald-50 border-emerald-500 border-b-3 border-b-emerald-600 text-emerald-950 shadow-xs'
                      : isSelected
                      ? 'bg-amber-50/90 border-amber-400 border-b-3 border-b-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-200/60'
                      : 'bg-white hover:bg-amber-50/30 border-slate-200/90 hover:border-amber-300/80 border-b-3 border-b-slate-300/80 text-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Photo thumbnail if provided */}
                  {opt.photoUrl && (
                    <div className={`rounded-full overflow-hidden shrink-0 border-2 border-slate-200/90 mr-3 shadow-2xs ${
                      textSize === 'huge' ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-11 sm:h-11'
                    }`}>
                      <img
                        src={opt.photoUrl}
                        alt={opt.label}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-base sm:text-lg font-bold block text-slate-900 group-hover:text-slate-950 truncate">
                      {displayLabel}
                    </span>
                    {opt.sublabel && (
                      <span className="text-xs sm:text-sm text-slate-500 font-medium block truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {/* Clean Checkmark indicator only on correct answer (NO radio circles/dots!) */}
                  {isAnswerCorrect && (
                    <div className="ml-2 shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Conversational Memory Trait Card: Tells about this choice ("เขาเป็น...") warmly and dignity-preserving */}
          {selectedTraitOption && answerState !== 'correct' && (() => {
            const traitInfo = getChoiceStoryTrait(selectedTraitOption, currentStep.question?.angle, lang);
            return (
              <div className="bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-amber-50/95 border-2 border-amber-300/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left shadow-2xs space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs">
                      <span>🌸</span>
                    </div>
                    <span className="text-xs sm:text-base font-extrabold text-amber-950 tracking-normal">
                      {traitInfo.title}
                    </span>
                  </div>

                  {/* Re-play Audio Button for this trait */}
                  <button
                    onClick={() => {
                      const speech = `${traitInfo.detail} ${traitInfo.promptToLook}`;
                      speakWithElevenLabs(speech, undefined, undefined, lang);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-white hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    title={lang === 'en' ? 'Listen to story' : 'ฟังเสียงเล่า'}
                    aria-label="Listen to explanation"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700 stroke-[2.3]" />
                    <span className="text-xs">{lang === 'en' ? 'Listen' : 'ฟังเสียง'}</span>
                  </button>
                </div>

                <div className="space-y-1 pl-1">
                  <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug tracking-normal">
                    {traitInfo.detail}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-900 font-semibold leading-relaxed flex items-center space-x-1">
                    <span>{traitInfo.promptToLook}</span>
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Quick Voice / Clue Auxiliary Controls */}
          {answerState !== 'correct' && (
            <div className="space-y-3 pt-0.5">
              {/* If Listening Mic is active, display Interactive Voice Listening Card */}
              {isListeningMic ? (
                <div className="bg-gradient-to-br from-rose-50 via-amber-50/40 to-rose-50 border-2 border-rose-300/80 rounded-2xl p-3.5 sm:p-4 shadow-sm animate-fade-in space-y-2.5 text-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex items-center justify-center">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 relative" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-rose-900">
                        {lang === 'en' ? 'Listening to your voice...' : 'กำลังฟังคุณยายพูดอยู่นะคะ... 🎙️'}
                      </span>
                    </div>
                    <button
                      onClick={handleCancelVoice}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100/60 cursor-pointer"
                    >
                      {lang === 'en' ? 'Cancel' : 'ยกเลิก'}
                    </button>
                  </div>

                  {/* Live Speech Transcript / Guide */}
                  <div className="bg-white/95 border border-rose-100 rounded-xl p-3 min-h-[50px] flex items-center justify-center shadow-2xs">
                    {voiceTranscript ? (
                      <p className="text-sm sm:text-base font-bold text-slate-900 animate-fade-in">
                        "{voiceTranscript}"
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2 text-rose-600/70 text-xs sm:text-sm">
                        <Mic className="w-4 h-4 animate-bounce" />
                        <span>{lang === 'en' ? 'Speak a name or story now...' : 'พูดชื่อหรือเล่าเรื่องได้เลยค่ะ...'}</span>
                      </div>
                    )}
                  </div>

                  {/* Elder-friendly "Done Speaking" button */}
                  <button
                    onClick={() => handleFinishVoice()}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{lang === 'en' ? "I'm done speaking ✨" : 'พูดเสร็จแล้วค่ะ ✨'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    onClick={handleTriggerClue}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white hover:bg-amber-50 border border-amber-200/90 text-amber-900 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'en' ? 'Get a Clue 💡' : 'ขอคำใบ้ 💡'}</span>
                  </button>

                  <button
                    onClick={handleVoiceAnswer}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'en' ? 'Speak Answer 🎙️' : 'ตอบด้วยเสียงพูด 🎙️'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STEP TYPE 2: MATCHING PAIRS CHALLENGE
          Streamlined: Only Question & Choices, significantly enlarged buttons, zero text clutter
          ========================================================================= */}
      {currentStep.type === 'match' && currentStep.matchPairs && (
        <div className="space-y-3 sm:space-y-3.5 animate-fade-in select-none">
          {/* Question Card: Focused & Clean (Question + Match count + Speaker) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 px-4 py-3 sm:py-3.5 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="text-xl sm:text-2xl shrink-0">🧩</span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-normal whitespace-nowrap">
                {lang === 'en' ? 'Match people in the photos' : 'จับคู่คนในภาพถ่าย'}
              </h2>
            </div>

            <div className="flex items-center shrink-0">
              {/* Audio Speaker Button */}
              <button
                onClick={handlePlayStepVoice}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs border ${
                  isPlayingAudio
                    ? 'bg-amber-400 border-amber-500 text-slate-950 ring-3 ring-amber-200 animate-pulse'
                    : 'bg-amber-50/90 hover:bg-amber-100 border-amber-200/90 text-amber-900'
                }`}
                title={lang === 'en' ? 'Listen to question' : 'แตะเพื่อฟังเสียงอ่าน'}
                aria-label="Play speech"
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-4 h-4 text-slate-950" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-700" />
                )}
              </button>
            </div>
          </div>

          {/* 2 Columns: Photos on Left, Names on Right (Enlarged Cards, Pure Choices) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* Left Column: Enlarged Photo Cards */}
            <div className="space-y-2.5 sm:space-y-3">
              {currentStep.matchPairs.map((pair) => {
                const isMatched = matchedIds.includes(pair.id);
                const isSelected = selectedMatchPhoto === pair.id;
                const isMismatch = mismatchPair?.photoId === pair.id;
                const cardHeight = currentStep.matchPairs!.length <= 2 
                  ? 'h-[190px] sm:h-[210px]' 
                  : 'h-[148px] sm:h-[162px]';

                return (
                  <button
                    key={pair.id}
                    onClick={() => handleTapMatchPhoto(pair.id)}
                    disabled={isMatched}
                    className={`relative w-full ${cardHeight} rounded-2xl sm:rounded-3xl overflow-hidden border-2 transition-all cursor-pointer select-none text-left shadow-2xs group active:scale-[0.98] ${
                      isMatched
                        ? 'border-emerald-500 ring-2 ring-emerald-400/50 cursor-default opacity-90'
                        : isMismatch
                        ? 'border-rose-500 ring-4 ring-rose-200 animate-wiggle'
                        : isSelected
                        ? 'border-amber-400 ring-4 ring-amber-300/60 scale-[1.02] shadow-md z-10'
                        : 'border-slate-200/90 hover:border-amber-300/80 bg-slate-100 hover:shadow-xs'
                    }`}
                  >
                    {/* Real Full-Coverage Portrait Photo */}
                    <img
                      src={pair.photoUrl}
                      alt={pair.nameTh}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Subtle Gradient Overlay for visual depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                    {/* Matched State Overlay */}
                    {isMatched && (
                      <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center text-white z-10">
                        <div className="w-11 h-11 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg">
                          <Check className="w-6 h-6 stroke-[3] text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Column: Enlarged 3D Name & Relation Cards */}
            <div className="space-y-2.5 sm:space-y-3">
              {shuffledStepLabels.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = selectedMatchLabel === item.id;
                const isMismatch = mismatchPair?.labelId === item.id;

                const displayName = lang === 'en' ? item.nameEn : item.nameTh;
                const displayRel = lang === 'en' ? item.relationEn : item.relationTh;
                const cardHeight = currentStep.matchPairs!.length <= 2 
                  ? 'h-[190px] sm:h-[210px]' 
                  : 'h-[148px] sm:h-[162px]';

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTapMatchLabel(item.id)}
                    disabled={isMatched}
                    className={`w-full ${cardHeight} flex flex-col justify-between p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 overflow-hidden transition-all cursor-pointer text-left select-none relative min-w-0 active:scale-[0.98] ${
                      isMatched
                        ? 'bg-emerald-50/90 border-emerald-500 border-b-4 border-b-emerald-700 shadow-2xs opacity-95 cursor-default'
                        : isMismatch
                        ? 'bg-rose-50 border-rose-400 ring-4 ring-rose-200 animate-wiggle'
                        : isSelected
                        ? 'bg-amber-50/90 border-amber-400 border-b-4 border-b-amber-600 ring-4 ring-amber-300/60 scale-[1.02] shadow-md z-10'
                        : 'bg-white hover:bg-amber-50/30 border-slate-200/90 border-b-4 border-b-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Top: Relation Pill Tag (Constrained to Card Bounds with Truncation) */}
                    <div className="w-full flex items-center min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] xs:text-[11px] sm:text-xs font-bold border max-w-full min-w-0 shadow-2xs ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : `${item.tagColor.bg} ${item.tagColor.text} ${item.tagColor.border}`
                        }`}
                        title={displayRel}
                      >
                        <span className="shrink-0 text-xs leading-none">{item.icon}</span>
                        <span className="truncate block min-w-0 leading-tight">{displayRel}</span>
                      </span>
                    </div>

                    {/* Bottom: Big bold Senior-friendly Name + Checkmark */}
                    <div className="w-full flex items-center justify-between gap-1 min-w-0">
                      <span
                        className={`text-xl sm:text-2xl font-extrabold block truncate tracking-normal min-w-0 ${
                          isMatched ? 'text-emerald-950' : 'text-slate-900'
                        }`}
                      >
                        {displayName}
                      </span>

                      {isMatched && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP TYPE 3: DUST WIPE MEMORY REVEAL (ปัดฝุ่นฟื้นภาพวันวาน)
          Touch/Drag canvas to wipe away vintage dust in 3 classic frames (wood, gold, black)
          Reveals magic orb-color glow upon completion with 0 anxiety & 0 score pressure
          ========================================================================= */}
      {/* =========================================================================
          STEP TYPE 3: DUST WIPE MEMORY REVEAL (ปัดฝุ่นฟื้นภาพวันวาน)
          3 Classic Frames (Wood, Gold, Black) side-by-side in natural 3:4 portrait ratio
          Translucent dust reveals underlying photo softly
          Must wipe all 3 photos to proceed, 100% unscrollable within viewport
          ========================================================================= */}
      {currentStep.type === 'wipe' && currentStep.wipeData && (() => {
        const items = currentStep.wipeData.items || [];
        const isAllWiped = items.length > 0 && wipedPhotoIds.length >= items.length;
        const currentPhoto = items[activeWipeIdx] || items[0];
        const isCurrentPhotoWiped = currentPhoto && wipedPhotoIds.includes(currentPhoto.id);

        return (
          <div className="flex-1 flex flex-col justify-between py-0.5 select-none animate-fade-in max-w-[420px] sm:max-w-[480px] mx-auto w-full">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 px-3.5 py-1.5 shadow-xs flex items-center justify-between shrink-0 w-full">
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">🌸</span>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-normal truncate">
                    {lang === 'en' ? 'Gently wipe the dust away' : 'ปัดฝุ่นฟื้นภาพวันวาน'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                    {lang === 'en'
                      ? 'Wipe the framed memory to restore it'
                      : 'ลูบปัดฝุ่นบนกรอบรูปเพื่อฟื้นความทรงจำนะคะ'}
                  </p>
                </div>
              </div>

              {/* Audio Speaker Button */}
              <button
                onClick={handlePlayStepVoice}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs border shrink-0 ${
                  isPlayingAudio
                    ? 'bg-amber-400 border-amber-500 text-slate-950 ring-3 ring-amber-200 animate-pulse'
                    : 'bg-amber-50/90 hover:bg-amber-100 border-amber-200/90 text-amber-900'
                }`}
                title={lang === 'en' ? 'Listen to instructions' : 'แตะเพื่อฟังเสียงแนะนำ'}
                aria-label="Play speech"
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-3.5 h-3.5 text-slate-950" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                )}
              </button>
            </div>

            {/* Active Grand Framed Photo (แสดงแค่กรอบรูปใหญ่เต็มหน้าจอ) */}
            <div className="flex-1 flex flex-col justify-center items-center py-1 w-full min-h-0">
              {currentPhoto && (
                <DustWipePhotoCard
                  key={currentPhoto.id}
                  item={currentPhoto}
                  index={activeWipeIdx}
                  isCompleted={wipedPhotoIds.includes(currentPhoto.id)}
                  onComplete={handlePhotoWiped}
                  onStartWipe={() => setHasStartedWiping(true)}
                  lang={lang}
                  showHandGuide={!hasStartedWiping && wipedPhotoIds.length === 0}
                />
              )}
            </div>

            {/* Bottom Controls / Clean Navigation */}
            <div className="shrink-0 w-full py-1">
              {isAllWiped ? (
                // All 3 Photos Restored: Clean Green Continue Button
                <div className="flex items-center justify-center py-1 animate-fade-in">
                  <button
                    onClick={handleNextStep}
                    className="w-full max-w-[280px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-b-3 border-b-emerald-800 text-white font-extrabold tracking-normal text-sm shadow-md shadow-emerald-600/25 active:border-b-1 active:translate-y-[1px] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{lang === 'en' ? 'Continue' : 'ไปต่อ'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : isCurrentPhotoWiped ? (
                // Current Photo Wiped: Clean Next Photo Button
                <div className="flex items-center justify-center py-1 animate-fade-in">
                  <button
                    onClick={() => {
                      const nextIdx = (activeWipeIdx + 1) % items.length;
                      setActiveWipeIdx(nextIdx);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 border-b-3 border-b-amber-700 text-slate-950 font-extrabold tracking-normal text-xs sm:text-sm shadow-md shadow-amber-500/25 active:border-b-1 active:translate-y-[1px] transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <span>{lang === 'en' ? 'Next Photo' : 'ภาพถัดไป'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                // Wiping in progress: Clean progress dots
                <div className="flex items-center justify-center space-x-2 py-1 animate-fade-in">
                  {items.map((it, idx) => (
                    <div
                      key={it.id}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        wipedPhotoIds.includes(it.id)
                          ? 'bg-emerald-500 scale-110 shadow-xs'
                          : activeWipeIdx === idx
                          ? 'bg-amber-400 ring-2 ring-amber-200'
                          : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          POPUP เฉลย (Memory Solution & Story Reveal Modal)
          Rendered via createPortal to document.body to guarantee 100vw x 100dvh full screen coverage
          ========================================================================= */}
      {typeof document !== 'undefined' &&
        ((currentStep.type === 'quiz' && answerState === 'correct') ||
          (currentStep.type === 'match' && isMatchCompleted)) &&
        createPortal(
          <div
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
            <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-100 p-5 sm:p-6 text-center space-y-4">
            {currentStep.type === 'quiz' && currentStep.question && (() => {
              const correctOpt =
                currentStep.question.options.find((o) => o.isCorrect) ||
                currentStep.question.options[0];
              const displayLabel =
                lang === 'en'
                  ? `This is ${correctOpt.labelEn || correctOpt.label}`
                  : `นี่คือ ${correctOpt.label}`;

              return (
                <>
                  {/* Top Celebration */}
                  <div className="space-y-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-tr from-emerald-400 via-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-normal">
                      {lang === 'en' ? 'Well Done! 🌟' : 'Well Done! เยี่ยมมาก! 🌟'}
                    </h3>
                  </div>

                  {/* Solution Card with photo thumbnail */}
                  <div className="bg-emerald-50/80 border-2 border-emerald-400/90 rounded-2xl p-3.5 sm:p-4 flex items-center space-x-3.5 text-left shadow-2xs">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs bg-slate-100 flex items-center justify-center">
                      {correctOpt.photoUrl ? (
                        <img
                          src={correctOpt.photoUrl}
                          alt={correctOpt.label}
                          className="w-full h-full object-cover"
                        />
                      ) : activeOrb.photoUrl ? (
                        <img
                          src={activeOrb.photoUrl}
                          alt={activeOrb.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{currentStep.question.angleLabel.icon}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 block truncate tracking-normal">
                        {displayLabel}
                      </span>
                      {correctOpt.sublabel && (
                        <span className="text-xs sm:text-sm text-emerald-800 font-semibold block truncate mt-0.5">
                          {lang === 'en' ? (correctOpt.sublabelEn || correctOpt.sublabel) : correctOpt.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3.5 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-b-4 border-b-emerald-800 text-white font-extrabold tracking-normal text-base sm:text-lg shadow-lg shadow-emerald-600/25 active:border-b-1 active:translate-y-[2px] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>{lang === 'en' ? 'Continue' : 'ไปต่อ'}</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </>
              );
            })()}

            {currentStep.type === 'match' && currentStep.matchPairs && (
              <>
                {/* Top Badge & Celebration for Matching */}
                <div className="space-y-1.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-tr from-emerald-400 via-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
                  </div>
                  <div>
                    <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      <span>🧩</span>
                      <span>{lang === 'en' ? 'Matching Solution' : 'เฉลยการจับคู่'}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-normal">
                      {lang === 'en' ? 'All Matched Perfectly! ✨' : 'จับคู่ถูกต้องครบทุกภาพ! ✨'}
                    </h3>
                  </div>
                </div>

                {/* List of matched pairs */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                  {currentStep.matchPairs.map((p) => {
                    const displayName = lang === 'en' ? p.nameEn : p.nameTh;
                    const displayRel = lang === 'en' ? p.relationEn : p.relationTh;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center space-x-2.5 p-1.5 bg-white rounded-xl border border-slate-200/70 text-left"
                      >
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate tracking-normal">
                            {displayName}
                          </span>
                          <span className="text-[11px] sm:text-xs text-slate-500 font-medium block truncate">
                            {displayRel}
                          </span>
                        </div>
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0 mr-1" />
                      </div>
                    );
                  })}
                </div>

                {/* Warm Story Explanation */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {lang === 'en'
                    ? 'You remembered your loved ones with wonderful heart!'
                    : 'คุณยายจำลูกหลานได้อย่างแม่นยำและอบอุ่นหัวใจค่ะ'}
                </p>

                {/* Continue Button */}
                <button
                  onClick={handleNextStep}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-b-4 border-b-emerald-800 text-white font-extrabold tracking-normal text-base sm:text-lg shadow-lg shadow-emerald-600/25 active:border-b-1 active:translate-y-[2px] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{lang === 'en' ? 'Continue' : 'ไปต่อ'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
