export type OrbEmotion = 'joy' | 'nostalgia' | 'love' | 'vitality' | 'celebration';

export type NavigationPage = 'home' | 'test' | 'vault' | 'settings' | 'child-portal' | 'session-review' | 'today-recap';

export interface DailyRecapMemory {
  id: string;
  date: string;
  displayDateTh: string;
  displayDateEn: string;
  transcript: string;
  photos: string[];
  emotion: OrbEmotion;
  timestamp: number;
  audioDurationSec?: number;
  audioUrl?: string;
}

export type Language = 'th' | 'en';

export type FamilyRole = 'elder' | 'relative';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  relationTitle: string;
  avatarIcon?: string;
  avatarColor?: string;
  isCurrentActive?: boolean;
}

export interface FamilyGroup {
  familyCode: string;
  familyName: string;
  members: FamilyMember[];
}

export interface MemoryOption {
  id: string;
  label: string;
  labelEn?: string;
  relation: string;
  relationEn?: string;
  photoUrl: string;
  isCorrect: boolean;
}

export interface MemoryOrb {
  id: string;
  emotion: OrbEmotion;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  memoryYear: string;
  memoryYearEn?: string;
  photoUrl: string;
  videoUrl?: string;
  voicePrompt: string;
  voicePromptEn?: string;
  voiceSuccess: string;
  voiceSuccessEn?: string;
  gentleClue: string;
  gentleClueEn?: string;
  correctAnswer: string;
  correctAnswerEn?: string;
  options: MemoryOption[];
  glowColor: string;
  accentBg: string;
  isUnlocked: boolean;
  uploadedBy?: string;
  uploadedByEn?: string;
  uploadDate?: string;
  uploadDateEn?: string;
  sharedSeniorIds?: string[];
}

export interface SessionStats {
  completedToday: number;
  totalOrbs: number;
  streakDays: number;
  averageSpeedSec: number;
  overallMood: string;
}
