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
  Smile 
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

export type ChallengeStepType = 'quiz' | 'match';

export interface ChallengeStep {
  id: string;
  type: ChallengeStepType;
  question?: DynamicQuestion;
  matchPairs?: MatchingPair[];
}

export const TestView: React.FC<TestViewProps> = ({
  orbs,
  activeOrbId,
  onSelectOrb,
  onCorrectAnswer,
  onFinishSession,
  lang,
}) => {
  // Currently focused photo orb
  const currentOrbIndex = orbs.findIndex((o) => o.id === activeOrbId);
  const activeOrb = (currentOrbIndex >= 0 ? orbs[currentOrbIndex] : null) || orbs[0] || null;

  // Active step index in the interleaved sequence
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Interaction States
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [showClue, setShowClue] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);

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
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
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
      nameTh: 'น้องมินท์',
      nameEn: 'Mint',
      relationTh: 'หลานสาวคนเล็ก',
      relationEn: 'Youngest Granddaughter',
      photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80',
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
      nameTh: 'เจ้าทองม้วน',
      nameEn: 'Thong Muan',
      relationTh: 'สุนัขแสนรู้ประจำบ้าน',
      relationEn: 'Loyal Golden Retriever',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
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
      nameTh: 'เจี๊ยบ',
      nameEn: 'Jeab',
      relationTh: 'หลานสาวคนเก่ง',
      relationEn: 'Caring Granddaughter',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
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
      relationTh: 'ลูกสาวคนโต',
      relationEn: 'Eldest Daughter',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
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
        options: activeOrb.options.map((opt) => ({
          id: opt.id,
          label: lang === 'en' && opt.labelEn ? opt.labelEn : opt.label,
          sublabel: lang === 'en' && opt.relationEn ? opt.relationEn : opt.relation,
          photoUrl: opt.photoUrl,
          isCorrect: opt.isCorrect,
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
  // Alternates between Photo Quiz questions and Matching challenges in one seamless, natural flow!
  const sessionSteps: ChallengeStep[] = useMemo(() => {
    if (!activeOrb || currentQuestions.length === 0) return [];

    const personQ = currentQuestions.find((q) => q.angle === 'person') || currentQuestions[0];
    const placeOrEventQ = currentQuestions.find((q) => q.angle === 'place' || q.angle === 'event') || currentQuestions[1] || currentQuestions[0];
    const emotionOrMsgQ = currentQuestions.find((q) => q.angle === 'emotion' || q.angle === 'message') || currentQuestions[2] || currentQuestions[0];

    const matchSet1 = allMatchingPairs.slice(0, 3); // น้องภูมิ, น้องมินท์, เจ้าทองม้วน
    const matchSet2 = allMatchingPairs.slice(3, 5); // เจี๊ยบ, น้องแอน

    return [
      // Step 1: Photo Quiz - Identity / Person
      {
        id: 'step-1-quiz-person',
        type: 'quiz',
        question: personQ,
      },
      // Step 2: Matching Challenge - 3 Family Members
      {
        id: 'step-2-match-family-1',
        type: 'match',
        matchPairs: matchSet1,
      },
      // Step 3: Photo Quiz - Place / Event
      {
        id: 'step-3-quiz-context',
        type: 'quiz',
        question: placeOrEventQ,
      },
      // Step 4: Matching Challenge - 2 Family Members
      {
        id: 'step-4-match-family-2',
        type: 'match',
        matchPairs: matchSet2,
      },
      // Step 5: Photo Quiz - Emotion & Loving Message
      {
        id: 'step-5-quiz-feeling',
        type: 'quiz',
        question: emotionOrMsgQ,
      },
    ];
  }, [activeOrb, currentQuestions, allMatchingPairs]);

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

    // Reset interaction states for the new step
    setSelectedOptId(null);
    setAnswerState('unanswered');
    setShowClue(false);
    setIsListeningMic(false);
    setSelectedMatchPhoto(null);
    setSelectedMatchLabel(null);
    setMatchedIds([]);
    setMismatchPair(null);
    setIsMatchCompleted(false);

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

    if (isCorrect) {
      soundFx.playSuccessChime();
      setAnswerState('correct');

      // Persist unlock
      if (activeOrb) {
        onCorrectAnswer(activeOrb.id);
      }

      const successSpeech = lang === 'en' ? currentStep.question.voiceSuccess.en : currentStep.question.voiceSuccess.th;
      speakWithElevenLabs(successSpeech, undefined, undefined, lang);
    } else {
      soundFx.playGentleRetry();
      setAnswerState('wrong');

      const gentleRetrySpeech = lang === 'en'
        ? 'Almost there Grandma! Take another gentle look or tap the clue button!'
        : 'เกือบถูกแล้วค่ะคุณตาคุณยาย... ค่อยๆ ดูอีกนิด หรือแตะดูคำใบ้ได้เลยนะคะ 💡';
      speakWithElevenLabs(gentleRetrySpeech, undefined, undefined, lang);
    }
  };

  // Move to next step or next orb
  const handleNextStep = () => {
    stopSpeech();
    soundFx.playTap();
    setAnswerState('unanswered');
    setSelectedOptId(null);
    setIsMatchCompleted(false);
    setMatchedIds([]);

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

  // Voice speech answer via mic simulation
  const handleVoiceAnswer = () => {
    if (!currentStep || currentStep.type !== 'quiz' || !currentStep.question) return;
    soundFx.playTap();
    setIsListeningMic(true);

    const promptMsg = lang === 'en'
      ? 'Go ahead and speak Grandma, I am listening with warm love...'
      : 'คุณยายพูดชื่อหรือเล่าเรื่องได้เลยค่ะ... หนูฟังอยู่นะคะ 🎙️';

    speakWithElevenLabs(promptMsg, undefined, () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
      voiceTimeoutRef.current = setTimeout(() => {
        setIsListeningMic(false);
        soundFx.playSuccessChime();
        setAnswerState('correct');
        if (activeOrb) {
          onCorrectAnswer(activeOrb.id);
        }
        const successSpeech = lang === 'en' ? currentStep.question?.voiceSuccess.en : currentStep.question?.voiceSuccess.th;
        if (successSpeech) {
          speakWithElevenLabs(successSpeech, undefined, undefined, lang);
        }
      }, 2600);
    }, lang);
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
    <div className="max-w-xl mx-auto px-2 sm:px-4 space-y-2 select-none">
      {/* =========================================================================
          STEP TYPE 1: PHOTO MEMORY QUIZ
          (NO progress bar - endless continuous play with prominent large photo & choices)
          ========================================================================= */}
      {currentStep.type === 'quiz' && currentStep.question && (
        <div className="space-y-2 sm:space-y-2.5 animate-fade-in">
          {/* Question Card with Photo */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-3.5 shadow-sm text-center space-y-2">
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

            {/* Photo Card: Much larger size, vivid and prominent */}
            <div className="relative mx-auto w-full h-40 sm:h-44 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs group bg-slate-100">
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
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
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

          {/* Tactile Choice Cards: Enlarged size, larger font & avatar, generous padding */}
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
            {currentStep.question.options.map((opt) => {
              const isSelected = selectedOptId === opt.id;
              const isAnswerCorrect = answerState === 'correct' && opt.isCorrect;
              const isAnswerWrong = answerState === 'wrong' && isSelected && !opt.isCorrect;

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
                  className={`group w-full flex items-center px-4 py-2.5 sm:py-3 rounded-2xl border-2 transition-all text-left cursor-pointer active:translate-y-[1px] ${
                    isAnswerCorrect
                      ? 'bg-emerald-50 border-emerald-500 border-b-3 border-b-emerald-600 text-emerald-950 shadow-xs'
                      : isAnswerWrong
                      ? 'bg-rose-50 border-rose-300 border-b-3 border-b-rose-400 text-rose-950 shadow-2xs'
                      : isSelected
                      ? 'bg-amber-50 border-amber-400 border-b-3 border-b-amber-500 text-slate-950 shadow-2xs'
                      : 'bg-white hover:bg-amber-50/30 border-slate-200/90 hover:border-amber-300/80 border-b-3 border-b-slate-300/80 text-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Photo thumbnail if provided */}
                  {opt.photoUrl && (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 border-2 border-slate-200/90 mr-3 shadow-2xs">
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

          {/* Quick Voice / Clue Auxiliary Controls */}
          {answerState !== 'correct' && (
            <div className="flex items-center justify-center gap-2.5 pt-0.5">
              <button
                onClick={handleTriggerClue}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white hover:bg-amber-50 border border-amber-200/90 text-amber-900 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'en' ? 'Get a Clue 💡' : 'ขอคำใบ้ 💡'}</span>
              </button>

              <button
                onClick={handleVoiceAnswer}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full border text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer ${
                  isListeningMic
                    ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-200 animate-pulse'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
                }`}
              >
                <Mic className={`w-3.5 h-3.5 ${isListeningMic ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{isListeningMic ? (lang === 'en' ? 'Listening...' : 'กำลังฟังเสียง...') : (lang === 'en' ? 'Speak Answer 🎙️' : 'ตอบด้วยเสียงพูด 🎙️')}</span>
              </button>
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
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                {lang === 'en' ? 'Match people in the photos' : 'จับคู่คนในภาพถ่าย'}
              </h2>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Progress Count Badge */}
              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span>✨</span>
                <span>
                  {matchedIds.length}/{currentStep.matchPairs.length}
                </span>
              </div>

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
                    className={`w-full ${cardHeight} flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer text-left select-none relative active:scale-[0.98] ${
                      isMatched
                        ? 'bg-emerald-50/90 border-emerald-500 border-b-4 border-b-emerald-700 shadow-2xs opacity-95 cursor-default'
                        : isMismatch
                        ? 'bg-rose-50 border-rose-400 ring-4 ring-rose-200 animate-wiggle'
                        : isSelected
                        ? 'bg-amber-50/90 border-amber-400 border-b-4 border-b-amber-600 ring-4 ring-amber-300/60 scale-[1.02] shadow-md z-10'
                        : 'bg-white hover:bg-amber-50/30 border-slate-200/90 border-b-4 border-b-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Top: Relation Pill Tag */}
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : `${item.tagColor.bg} ${item.tagColor.text} ${item.tagColor.border}`
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span className="whitespace-nowrap">{displayRel}</span>
                      </span>
                    </div>

                    {/* Bottom: Big bold Senior-friendly Name + Checkmark */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xl sm:text-2xl font-black block truncate tracking-tight ${
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
                currentStep.question.angle === 'person'
                  ? (lang === 'en' ? `This is ${correctOpt.label}` : `นี่คือ ${correctOpt.label}`)
                  : correctOpt.label;

              return (
                <>
                  {/* Top Badge & Celebration */}
                  <div className="space-y-1.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-tr from-emerald-400 via-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
                    </div>
                    <div>
                      <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <span>✨</span>
                        <span>{lang === 'en' ? 'Memory Reveal' : 'เฉลยความทรงจำ'}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                        {lang === 'en' ? 'Correct! Well Done! ✨' : 'ถูกต้องแล้วค่ะ! ✨'}
                      </h3>
                    </div>
                  </div>

                  {/* Solution Card with photo thumbnail */}
                  <div className="bg-emerald-50/80 border-2 border-emerald-400/90 rounded-2xl p-3.5 flex items-center space-x-3 text-left shadow-2xs">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs bg-slate-100 flex items-center justify-center">
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
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-700 block uppercase tracking-wide">
                        {lang === 'en' ? 'Correct Answer' : 'เฉลยคำตอบ'}
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 block truncate">
                        {displayLabel}
                      </span>
                      {correctOpt.sublabel && (
                        <span className="text-xs sm:text-sm text-slate-600 font-medium block truncate">
                          {correctOpt.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warm Story Explanation */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {lang === 'en'
                        ? currentStep.question.voiceSuccess.en
                        : currentStep.question.voiceSuccess.th}
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3.5 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-b-4 border-b-emerald-800 text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-600/25 active:border-b-1 active:translate-y-[2px] transition-all flex items-center justify-center space-x-2 cursor-pointer"
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
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
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
                          <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
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
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-b-4 border-b-emerald-800 text-white font-black text-base sm:text-lg shadow-lg shadow-emerald-600/25 active:border-b-1 active:translate-y-[2px] transition-all flex items-center justify-center space-x-2 cursor-pointer"
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

      {currentStep.type === 'quiz' && answerState === 'wrong' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-100/95 border-t-3 border-amber-300 shadow-xl backdrop-blur-md animate-slide-up">
          <div className="max-w-xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 text-left min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                <Smile className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-amber-950 truncate">
                  {lang === 'en' ? 'Almost there, take another look!' : 'เกือบถูกแล้วค่ะ ลองดูอีกทีนะคะ 💡'}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-amber-800 font-medium truncate">
                  {lang === 'en' ? 'No worries at all, tap any choice to try again.' : 'ไม่เป็นไรเลยนะคะ ค่อยๆ นึกดูหรือแตะดูคำใบ้ได้เลยค่ะ'}
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerClue}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 border-b-2 border-b-amber-600 text-slate-950 font-extrabold text-xs shadow-xs active:border-b-0 active:translate-y-[1px] transition-all cursor-pointer shrink-0"
            >
              <span>{lang === 'en' ? 'View Clue' : 'ดูคำใบ้ 💡'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
