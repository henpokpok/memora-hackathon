import React, { useState, useEffect, useRef } from 'react';
import { MemoryOrb, Language, FamilyGroup, FamilyMember, NavigationPage, OrbEmotion } from '../../types';
import { MemoryOrb as MemoryOrbView } from '../common/MemoryOrb';
import { Modal } from '../common/Modal';
import { 
  ArrowLeft, 
  MessageCircle, 
  Play, 
  Pause, 
  Share2, 
  Check, 
  Plus, 
  Users, 
  Sparkles, 
  Heart, 
  User, 
  Copy, 
  Layers, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  AlertCircle, 
  RefreshCw,
  MoreVertical,
  Calendar,
  MapPin,
  X,
  ChevronRight,
  Volume2,
  FileText,
  Tag,
  CheckCircle2,
  Clock,
  TrendingUp,
  Smile,
  Bookmark,
  Headphones,
  Lightbulb,
  Award,
  Activity
} from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';
import { familyApi, mediaApi } from '../../services/api';

interface ChildPortalViewProps {
  onNavigate: (page: NavigationPage) => void;
  orbs: MemoryOrb[];
  unlockedCount: number;
  familyGroup: FamilyGroup;
  onUpdateFamily: (updatedGroup: FamilyGroup) => void;
  activeSenior: FamilyMember;
  onSwitchActiveSenior: (seniorId: string) => void;
  onAddNewOrb: (newOrb: MemoryOrb) => void;
  lang: Language;
}

// 5 Emotion Presets with distinct colors and meanings
const EMOTION_CONFIG: Record<OrbEmotion, {
  labelTh: string;
  labelEn: string;
  colorName: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowColor: string;
  accentBg: string;
  ringColor: string;
  orbPreviewBg: string;
}> = {
  joy: {
    labelTh: 'ความสุขสดใส',
    labelEn: 'Joy & Warmth',
    colorName: '🟡 สีเหลืองทอง',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    accentBg: 'from-amber-400 via-amber-300 to-yellow-200',
    ringColor: 'ring-amber-400',
    orbPreviewBg: 'from-amber-400 to-yellow-500',
  },
  love: {
    labelTh: 'ความรักอบอุ่น',
    labelEn: 'Loving Family',
    colorName: '🔴 สีชมพูแดง',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-300',
    badgeText: 'text-rose-800',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    accentBg: 'from-rose-400 via-rose-300 to-pink-200',
    ringColor: 'ring-rose-400',
    orbPreviewBg: 'from-rose-400 to-pink-500',
  },
  nostalgia: {
    labelTh: 'วันวานน่าจดจำ',
    labelEn: 'Nostalgia',
    colorName: '🔵 สีฟ้าคราม',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-300',
    badgeText: 'text-sky-800',
    glowColor: 'rgba(14, 165, 233, 0.45)',
    accentBg: 'from-sky-400 via-sky-300 to-cyan-200',
    ringColor: 'ring-sky-400',
    orbPreviewBg: 'from-sky-400 to-cyan-500',
  },
  vitality: {
    labelTh: 'มีชีวิตชีวา',
    labelEn: 'Vitality',
    colorName: '🟢 สีเขียวมรกต',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-800',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    accentBg: 'from-emerald-400 via-emerald-300 to-teal-200',
    ringColor: 'ring-emerald-400',
    orbPreviewBg: 'from-emerald-400 to-teal-500',
  },
  celebration: {
    labelTh: 'ความสำเร็จ & งานฉลอง',
    labelEn: 'Celebration',
    colorName: '🟣 สีม่วงประกาย',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-300',
    badgeText: 'text-purple-800',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    accentBg: 'from-purple-400 via-purple-300 to-indigo-200',
    ringColor: 'ring-purple-400',
    orbPreviewBg: 'from-purple-400 to-indigo-500',
  },
};

export const ChildPortalView: React.FC<ChildPortalViewProps> = ({
  onNavigate,
  orbs,
  unlockedCount,
  familyGroup,
  onUpdateFamily,
  activeSenior,
  onSwitchActiveSenior,
  onAddNewOrb,
  lang,
}) => {
  // Page mode: 'main' (Your Family) or 'reports' (Daily Reports & Voice)
  const [subView, setSubView] = useState<'main' | 'reports'>('main');

  // 2 main tabs inside 'main': Members and Upload Memories
  const [activeTab, setActiveTab] = useState<'family' | 'memories'>('family');

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasSentLine, setHasSentLine] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLine, setCopiedLine] = useState(false);

  // Kebab menu state for family members
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);

  // New member form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'elder' | 'relative'>('elder');
  const [newMemberRelation, setNewMemberRelation] = useState('');

  // Media uploads state
  const [uploadedMediaList, setUploadedMediaList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Rich Memory Ingestion Modal State
  const [showCreateOrbModal, setShowCreateOrbModal] = useState(false);
  const [orbTitle, setOrbTitle] = useState('');
  const [orbPeople, setOrbPeople] = useState<string[]>([]);
  const [customPersonName, setCustomPersonName] = useState('');
  const [orbLocation, setOrbLocation] = useState('');
  const [orbDateYear, setOrbDateYear] = useState('');
  const [orbDescription, setOrbDescription] = useState('');
  const [orbEmotion, setOrbEmotion] = useState<OrbEmotion>('joy');
  const [orbMediaUrl, setOrbMediaUrl] = useState('');
  const [orbMediaType, setOrbMediaType] = useState<'photo' | 'video'>('photo');
  const [orbQuizQuestion, setOrbQuizQuestion] = useState('');
  const [orbQuizClue, setOrbQuizClue] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenKebabId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Load uploaded media on mount
  useEffect(() => {
    mediaApi.listMedia().then((res) => {
      if (res && res.media) {
        setUploadedMediaList(res.media);
      }
    }).catch((err) => console.warn('Could not load media list:', err));
  }, []);

  // Handle member role toggle (Elder <-> Relative)
  const handleToggleMemberRole = async (member: FamilyMember) => {
    const nextRole: 'elder' | 'relative' = member.role === 'elder' ? 'relative' : 'elder';
    const nextTitle = nextRole === 'elder' ? 'ผู้สูงอายุ' : 'ลูกหลาน';

    const updatedMembers = familyGroup.members.map((m) =>
      m.id === member.id ? { ...m, role: nextRole, relationTitle: m.relationTitle || nextTitle } : m
    );
    onUpdateFamily({ ...familyGroup, members: updatedMembers });

    await familyApi.updateMember(member.id, {
      role: nextRole,
    }).catch((err) => console.warn('Failed to update member role on backend:', err));
  };

  // Handle member deletion
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm(lang === 'en' ? 'Remove this member from family group?' : 'คุณต้องการลบสมาชิกท่านนี้ออกจากครอบครัวหรือไม่?')) return;

    const updatedMembers = familyGroup.members.filter((m) => m.id !== memberId);
    onUpdateFamily({ ...familyGroup, members: updatedMembers });

    await familyApi.deleteMember(memberId).catch((err) => console.warn('Failed to delete member on backend:', err));
  };

  // Handle photo/video file upload in media list
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Validate size
    if (type === 'photo' && file.size > 10 * 1024 * 1024) {
      setUploadError(lang === 'en' ? 'Photo size exceeds 10MB limit' : 'ขนาดรูปภาพเกิน 10MB กรุณาเลือกไฟล์ที่ขนาดไม่เกิน 10MB');
      return;
    }
    if (type === 'video' && file.size > 50 * 1024 * 1024) {
      setUploadError(lang === 'en' ? 'Video size exceeds 50MB limit' : 'ขนาดวิดีโอเกิน 50MB กรุณาเลือกไฟล์ที่ขนาดไม่เกิน 50MB');
      return;
    }

    setIsUploading(true);
    try {
      let res;
      if (type === 'photo') {
        res = await mediaApi.uploadPhoto(file);
      } else {
        res = await mediaApi.uploadVideo(file);
      }

      setUploadSuccess(lang === 'en' ? 'Uploaded successfully!' : 'อัปโหลดสื่อสำเร็จแล้ว!');
      if (res && res.media) {
        setUploadedMediaList((prev) => [res.media, ...prev]);
      }
    } catch (err: any) {
      // Fallback
      const localUrl = URL.createObjectURL(file);
      const fallbackMedia = {
        id: `media-${Date.now()}`,
        fileUrl: localUrl,
        originalFilename: file.name,
        mediaType: type,
        fileSize: file.size,
      };
      setUploadedMediaList((prev) => [fallbackMedia, ...prev]);
      setUploadSuccess(lang === 'en' ? 'Uploaded successfully!' : 'อัปโหลดสื่อสำเร็จแล้ว!');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle media file upload inside creation modal
  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let res;
      if (type === 'photo') {
        res = await mediaApi.uploadPhoto(file);
      } else {
        res = await mediaApi.uploadVideo(file);
      }

      if (res && res.media) {
        setOrbMediaUrl(res.media.fileUrl);
        setOrbMediaType(type);
        setUploadedMediaList((prev) => [res.media, ...prev]);
        if (!orbTitle) {
          setOrbTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: any) {
      const localUrl = URL.createObjectURL(file);
      setOrbMediaUrl(localUrl);
      setOrbMediaType(type);
      if (!orbTitle) {
        setOrbTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Open modal from an existing media item
  const handleOpenModalWithMedia = (mediaItem: any) => {
    setOrbMediaUrl(mediaItem.fileUrl);
    setOrbMediaType(mediaItem.mediaType === 'video' ? 'video' : 'photo');
    setOrbTitle(mediaItem.originalFilename.replace(/\.[^/.]+$/, ''));
    setShowCreateOrbModal(true);
  };

  // Handle media deletion
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this media item?' : 'คุณต้องการลบไฟล์สื่อนี้หรือไม่?')) return;
    await mediaApi.deleteMedia(mediaId).catch(() => {});
    setUploadedMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  // Toggle person chip selection
  const handleTogglePerson = (personName: string) => {
    if (orbPeople.includes(personName)) {
      setOrbPeople(orbPeople.filter((p) => p !== personName));
    } else {
      setOrbPeople([...orbPeople, personName]);
    }
  };

  // Add custom person to list
  const handleAddCustomPerson = () => {
    const trimmed = customPersonName.trim();
    if (trimmed && !orbPeople.includes(trimmed)) {
      setOrbPeople([...orbPeople, trimmed]);
      setCustomPersonName('');
    }
  };

  // Submit complete rich memory creation
  const handleCreateNewMemoryOrb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orbMediaUrl) {
      alert(lang === 'en' ? 'Please upload or provide a photo or video' : 'กรุณาอัปโหลดรูปภาพหรือวิดีโอก่อนค่ะ');
      return;
    }
    if (!orbTitle.trim()) {
      alert(lang === 'en' ? 'Please enter a memory title' : 'กรุณาระบุชื่อความทรงจำ');
      return;
    }

    setIsFormSubmitting(true);

    const emotionConf = EMOTION_CONFIG[orbEmotion];
    const primaryPerson = orbPeople.length > 0 ? orbPeople[0] : (lang === 'en' ? 'Family Member' : 'คนในครอบครัว');

    // Build distractors from family members not selected
    const otherMembers = familyGroup.members
      .filter((m) => !orbPeople.includes(m.name))
      .map((m) => m.name);
    
    const distractor1 = otherMembers[0] || (lang === 'en' ? 'Neighbor' : 'เพื่อนบ้าน');
    const distractor2 = otherMembers[1] || (lang === 'en' ? 'Old Friend' : 'เพื่อนสมัยเรียน');

    const generatedOptions = [
      {
        id: `opt-${Date.now()}-1`,
        label: primaryPerson,
        labelEn: primaryPerson,
        relation: orbPeople.join(', ') || (lang === 'en' ? 'Loving Family' : 'ครอบครัวอบอุ่น'),
        relationEn: 'Loving Family',
        photoUrl: orbMediaUrl,
        isCorrect: true,
      },
      {
        id: `opt-${Date.now()}-2`,
        label: distractor1,
        labelEn: distractor1,
        relation: lang === 'en' ? 'Acquaintance' : 'คนรู้จัก',
        relationEn: 'Acquaintance',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        isCorrect: false,
      },
      {
        id: `opt-${Date.now()}-3`,
        label: distractor2,
        labelEn: distractor2,
        relation: lang === 'en' ? 'Old Friend' : 'เพื่อนเก่า',
        relationEn: 'Old Friend',
        photoUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80',
        isCorrect: false,
      },
    ];

    const defaultPrompt = lang === 'en'
      ? `Do you remember this memory from ${orbLocation || 'our family archive'}? Who is in this photo?`
      : `จำลูกแก้วความทรงจำนี้ได้ไหมคะ... รูปที่ถ่ายที่ ${orbLocation || 'ช่วงเวลาแสนสุข'} คนในภาพนี้คือใครเอ่ย?`;

    const newOrb: MemoryOrb = {
      id: `orb-${Date.now()}`,
      emotion: orbEmotion,
      title: orbTitle.trim(),
      titleEn: orbTitle.trim(),
      description: orbDescription.trim() || undefined,
      descriptionEn: orbDescription.trim() || undefined,
      memoryYear: orbDateYear.trim() || (lang === 'en' ? '2024' : 'พ.ศ. 2567'),
      memoryYearEn: orbDateYear.trim() || '2024',
      photoUrl: orbMediaUrl,
      videoUrl: orbMediaType === 'video' ? orbMediaUrl : undefined,
      voicePrompt: orbQuizQuestion.trim() || defaultPrompt,
      voicePromptEn: orbQuizQuestion.trim() || defaultPrompt,
      voiceSuccess: lang === 'en' 
        ? `Wonderful! You remembered correctly! That's ${primaryPerson}!` 
        : `เก่งมากเลยค่ะคุณยาย! ถูกต้องแล้วค่ะ ${primaryPerson} นั่นเอง!`,
      voiceSuccessEn: `Wonderful! You remembered correctly! That's ${primaryPerson}!`,
      gentleClue: orbQuizClue.trim() || (lang === 'en' ? 'Take your time, this is a loving family member!' : 'ค่อยๆ นึกนะคะ คนในบ้านเราเองค่ะ'),
      gentleClueEn: orbQuizClue.trim() || 'Take your time, this is a loving family member!',
      correctAnswer: primaryPerson,
      correctAnswerEn: primaryPerson,
      glowColor: emotionConf.glowColor,
      accentBg: emotionConf.accentBg,
      isUnlocked: false,
      uploadedBy: lang === 'en' ? 'Family Member' : 'ลูกหลานในครอบครัว',
      uploadedByEn: 'Family Member',
      uploadDate: lang === 'en' ? 'Today' : 'วันนี้',
      uploadDateEn: 'Today',
      options: generatedOptions,
    };

    onAddNewOrb(newOrb);
    setIsFormSubmitting(false);
    setShowCreateOrbModal(false);

    // Reset form fields
    setOrbTitle('');
    setOrbPeople([]);
    setCustomPersonName('');
    setOrbLocation('');
    setOrbDateYear('');
    setOrbDescription('');
    setOrbMediaUrl('');
    setOrbMediaType('photo');
    setOrbQuizQuestion('');
    setOrbQuizClue('');

    alert(lang === 'en' ? 'Memory Orb created successfully and placed in Grandma’s vault!' : 'สร้างลูกแก้วความทรงจำสำเร็จแล้ว! บรรจุลงบนแท่นของคุณยายเรียบร้อยแล้วค่ะ ✨');
  };

  // Multi-clip state and bookmarks
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [bookmarkedClips, setBookmarkedClips] = useState<string[]>([]);
  const [sharedClipId, setSharedClipId] = useState<string | null>(null);

  const voiceRecordings = [
    {
      id: 'clip-1',
      titleTh: 'คุณยายเล่าเรื่องตอนไปเที่ยวเชียงใหม่ ปี 2528',
      titleEn: 'Grandma Somsri reminiscing about Chiang Mai trip (1985)',
      time: '10:45 น.',
      duration: '0:42',
      topicTh: 'ทริปเชียงใหม่ เสื้อลายดอก',
      topicEn: 'Chiang Mai Floral Shirt',
      emotion: 'nostalgia' as OrbEmotion,
      transcriptTh: 'อ๋อ... รูปนี้ตอนปี 2528 ที่เราพากันไปเที่ยวเชียงใหม่กันทั้งบ้าน ยายยังจำเสื้อลายดอกตัวที่ลูกซื้อให้ได้อยู่เลยนะ... ดอยสุเทพตอนนั้นลมเย็นมาก ลูกๆ วิ่งเล่นกันสนุกสนาน ยายชอบอากาศที่นั่นที่สุด',
      transcriptEn: 'Oh, this was in 1985 when we took the whole family to Chiang Mai! I remember the floral shirt you bought me... The breeze at Doi Suthep was so cool, the kids were running around happily.',
      aiInsightTh: 'การออกเสียงชัดเจน น้ำเสียงร่าเริง มีการเชื่อมโยงความจำเรื่องเสื้อลายดอกและสถานที่ได้อย่างสมบูรณ์',
      aiInsightEn: 'Clear articulation, upbeat emotional tone, perfectly recollected the floral shirt and location context.',
    },
    {
      id: 'clip-2',
      titleTh: 'เล่าถึงวันสงกรานต์และน้ำพริกกะปิน้าเพ็ญ',
      titleEn: 'Recollecting Songkran and Aunt Phen’s chili paste',
      time: '10:38 น.',
      duration: '0:31',
      topicTh: 'ทำบุญสงกรานต์ วัดบ้านเกิด',
      topicEn: 'Songkran Merit Making',
      emotion: 'joy' as OrbEmotion,
      transcriptTh: 'จำได้เลย น้าเพ็ญเขาชอบตำน้ำพริกกะปิมาฝากยายทุกวันพระ วันสงกรานต์นั้นสนุกมาก รดน้ำดำหัวกันชื่นใจ ยายชอบกลิ่นมะลิอบควันเทียนที่สุด',
      transcriptEn: 'I remember vividly! Aunt Phen always made delicious shrimp paste chili for me. That Songkran was wonderful, so refreshing with the jasmine water.',
      aiInsightTh: 'ยิ้มแย้มขณะเล่า ตอบชื่อน้าเพ็ญได้ภายใน 3 วินาที แสดงถึงความจำระยะยาวเกี่ยวกับคนสนิทที่แข็งแรงมาก',
      aiInsightEn: 'Smiled throughout, identified Aunt Phen within 3 seconds, showing strong long-term affective memory recall.',
    },
    {
      id: 'clip-3',
      titleTh: 'ความทรงจำวันรับปริญญาหลานคนโต',
      titleEn: 'Pride and joy during oldest grandchild’s graduation',
      time: '10:30 น.',
      duration: '0:35',
      topicTh: 'งานรับปริญญาหลานรัก',
      topicEn: 'Grandchild Graduation',
      emotion: 'celebration' as OrbEmotion,
      transcriptTh: 'วันนั้นยายตื่นตั้งแต่ตีห้าไปรอแสดงความยินดีกับหลาน ยายจำได้ว่าเอาพวงมาลัยดอกดาวเรืองไปคล้องคอให้ ยายภูมิใจในตัวหลานทุกคนนะลูก',
      transcriptEn: 'Grandma woke up at 5 AM that day just to be there for graduation. I remember placing the marigold garland on your neck. I am so proud of all of you.',
      aiInsightTh: 'แววตามีประกายความสุข ชะลอความเร็วการตอบเล็กน้อยแต่ลำดับเรื่องราวได้ชัดเจน',
      aiInsightEn: 'Vibrant emotional connection, high coherence and sequential recall of event details.',
    },
  ];

  const handleTogglePlayClip = (clipId: string, text: string) => {
    if (isPlayingAudio && activeClipId === clipId) {
      stopSpeech();
      setIsPlayingAudio(false);
      setActiveClipId(null);
    } else {
      stopSpeech();
      setActiveClipId(clipId);
      setIsPlayingAudio(true);
      speakWithElevenLabs(text, undefined, () => {
        setIsPlayingAudio(false);
        setActiveClipId(null);
      }, lang);
    }
  };

  const handleToggleBookmark = (clipId: string) => {
    if (bookmarkedClips.includes(clipId)) {
      setBookmarkedClips(bookmarkedClips.filter((id) => id !== clipId));
    } else {
      setBookmarkedClips([...bookmarkedClips, clipId]);
    }
  };

  const handleShareClip = (clipId: string) => {
    setSharedClipId(clipId);
    setTimeout(() => setSharedClipId(null), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyGroup.familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLineId = () => {
    navigator.clipboard.writeText('@memora');
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: FamilyMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      relationTitle: newMemberRelation.trim() || (newMemberRole === 'elder' ? 'ผู้สูงอายุ' : 'คนในครอบครัว'),
      avatarIcon: newMemberRole === 'elder' ? 'heart' : 'user',
      avatarColor: newMemberRole === 'elder' ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white',
      isCurrentActive: false,
    };

    onUpdateFamily({
      ...familyGroup,
      members: [...familyGroup.members, newMember],
    });

    familyApi.addMember({
      name: newMember.name,
      role: newMember.role,
      relationTitle: newMember.relationTitle,
      avatarIcon: newMember.avatarIcon,
      avatarColor: newMember.avatarColor,
    }).catch((err) => console.warn('Failed to save member to database:', err));

    setNewMemberName('');
    setNewMemberRelation('');
    setShowAddMember(false);
  };

  // =========================================================================
  // SUB-VIEW: DAILY REPORTS & VOICE RECORDINGS
  // =========================================================================
  if (subView === 'reports') {
    return (
      <div className="space-y-6 sm:space-y-8 py-2 max-w-4xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              stopSpeech();
              setSubView('main');
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-sm shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'en' ? 'Back to Your Family' : 'กลับสู่ Your Family'}</span>
          </button>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full flex items-center space-x-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'en' ? 'Live Synced Today' : 'ซิงค์ข้อมูลล่าสุดวันนี้'}</span>
          </span>
        </div>

        {/* Page Title & Description */}
        <div className="text-left space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-normal">
            {lang === 'en' ? 'Daily Reports & Voice Recordings' : 'รายงานประจำวัน & เสียงเล่าความทรงจำ'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            {lang === 'en'
              ? 'Listen to senior voice memories recorded during gameplay, review cognitive recall, and share heartwarming moments with family.'
              : 'ฟังเสียงเล่าความทรงจำจริงของคุณยายที่บันทึกระหว่างเล่น ติดตามพัฒนาการฟื้นฟูสมอง และส่งต่อเรื่องราวความสุขเข้ากลุ่มครอบครัว'}
          </p>
        </div>

        {/* 4 Cognitive & Storytelling Vitality Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {lang === 'en' ? 'Recall Rate' : 'อัตราการจำได้'}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">94%</span>
              <span className="text-[11px] font-bold text-emerald-600">+6%</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {lang === 'en' ? '5 of 5 memory orbs' : 'ตอบถูก 5 จาก 5 ลูกแก้ว'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {lang === 'en' ? 'Story Time' : 'เวลาเล่าเรื่อง'}
              </span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">8m 45s</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {lang === 'en' ? '3 new recorded stories' : '3 เรื่องเล่าความทรงจำใหม่'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {lang === 'en' ? 'Senior Mood' : 'อารมณ์ความรู้สึก'}
              </span>
              <Smile className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900">
                {lang === 'en' ? 'Joyful & Warm' : 'สดใส & อบอุ่น'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {lang === 'en' ? 'Smiled throughout session' : 'มีรอยยิ้มระหว่างกิจกรรม'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {lang === 'en' ? 'Key Relative' : 'บุคคลที่นึกถึง'}
              </span>
              <Users className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900 truncate">
                {lang === 'en' ? 'Aunt Phen' : 'น้าเพ็ญ, ภูมิ'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {lang === 'en' ? 'Strong affective bond' : 'สายสัมพันธ์ครอบครัวแน่นแฟ้น'}
            </p>
          </div>
        </div>

        {/* Featured Voice Capsule Player */}
        <div className="bg-gradient-to-br from-rose-50/90 via-amber-50/60 to-orange-50/70 rounded-[32px] border border-rose-200/90 p-6 sm:p-8 shadow-xs space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500 text-white shadow-2xs flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Today’s Featured Audio' : 'บันทึกเสียงเด่นประจำวัน'}</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {lang === 'en' ? 'Recorded at 10:45 AM' : 'บันทึกเมื่อ 10:45 น. วันนี้'}
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-full border border-slate-200/60 w-fit">
              ElevenLabs AI · Thai Natural Voice
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white/95 p-5 rounded-2xl border border-rose-100 shadow-2xs">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleTogglePlayClip('clip-1', voiceRecordings[0].transcriptTh)}
                aria-label={isPlayingAudio && activeClipId === 'clip-1' ? 'Pause voice recording' : 'Play voice recording'}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                {isPlayingAudio && activeClipId === 'clip-1' ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  {lang === 'en' ? voiceRecordings[0].titleEn : voiceRecordings[0].titleTh}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-rose-600">{voiceRecordings[0].duration} นาที</span>
                  <span>•</span>
                  <span>{lang === 'en' ? 'Unlocked Chiang Mai Orb' : 'จากลูกแก้ว "เที่ยวเชียงใหม่"'}</span>
                </div>
              </div>
            </div>

            {/* Audio Waveform Visualizer */}
            <div className="flex items-center space-x-1 h-8 shrink-0 px-2">
              {[30, 65, 45, 90, 75, 40, 85, 95, 60, 80, 50, 70, 90, 40, 75, 60, 85, 50, 95, 65, 40, 70].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlayingAudio && activeClipId === 'clip-1'
                      ? 'bg-gradient-to-t from-rose-500 to-amber-500 animate-pulse'
                      : 'bg-slate-200'
                  }`}
                  style={{
                    height: isPlayingAudio && activeClipId === 'clip-1'
                      ? `${Math.max(20, (h * Math.sin((i + 1) * 0.85)) % 100)}%`
                      : `${h * 0.35}%`,
                    animationDelay: `${(i % 6) * 100}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Transcript Box */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {lang === 'en' ? 'Voice Transcript (คำถอดเสียง)' : 'บันทึกคำพูดจริงของคุณยาย (Voice Transcript)'}
            </span>
            <p className="italic text-base sm:text-lg text-slate-800 bg-white/80 p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-2xs leading-relaxed">
              "{lang === 'en' ? voiceRecordings[0].transcriptEn : voiceRecordings[0].transcriptTh}"
            </p>
          </div>

          {/* AI Cognitive & Linguistic Insight */}
          <div className="flex items-start space-x-3 p-3.5 bg-amber-100/70 border border-amber-200/90 rounded-2xl text-xs text-amber-950 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">{lang === 'en' ? 'Memora AI Clinical Insight: ' : 'การวิเคราะห์จาก Memora AI: '}</span>
              {lang === 'en' ? voiceRecordings[0].aiInsightEn : voiceRecordings[0].aiInsightTh}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => handleShareClip('clip-1')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {sharedClipId === 'clip-1' ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{sharedClipId === 'clip-1' ? (lang === 'en' ? 'Sent to Family LINE!' : 'ส่งเข้า LINE ครอบครัวแล้ว!') : (lang === 'en' ? 'Share to Family LINE' : 'ส่งคลิปเสียงเข้า LINE ครอบครัว')}</span>
            </button>

            <button
              onClick={() => handleToggleBookmark('clip-1')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                bookmarkedClips.includes('clip-1')
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${bookmarkedClips.includes('clip-1') ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{bookmarkedClips.includes('clip-1') ? (lang === 'en' ? 'Saved to Favorites' : 'บันทึกเป็นเสียงโปรดแล้ว') : (lang === 'en' ? 'Save as Favorite' : 'บันทึกเป็นเสียงโปรด')}</span>
            </button>
          </div>
        </div>

        {/* Timeline of Today's Memory Reflections */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'en' ? 'Today’s Voice Reflections Timeline' : 'ไทม์ไลน์บันทึกเสียงเล่าเรื่องวันนี้'}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {lang === 'en' ? 'All memories shared by Grandma during quiz unlocking' : 'รวมทุกเรื่องเล่าที่คุณยายพูดคุยขณะปลดล็อกลูกแก้ว'}
              </p>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              {voiceRecordings.length} {lang === 'en' ? 'Recordings' : 'คลิปเสียง'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {voiceRecordings.map((recording, idx) => {
              const isPlaying = isPlayingAudio && activeClipId === recording.id;
              const isBookmarked = bookmarkedClips.includes(recording.id);
              const isShared = sharedClipId === recording.id;

              return (
                <div
                  key={recording.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {lang === 'en' ? recording.titleEn : recording.titleTh}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-slate-500">
                        {recording.time} ({recording.duration} นาที)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {lang === 'en' ? recording.topicEn : recording.topicTh}
                      </span>
                    </div>
                  </div>

                  <p className="italic text-sm text-slate-700 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-slate-100">
                    "{lang === 'en' ? recording.transcriptEn : recording.transcriptTh}"
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTogglePlayClip(recording.id, lang === 'en' ? recording.transcriptEn : recording.transcriptTh)}
                        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                        <span>{isPlaying ? (lang === 'en' ? 'Pause' : 'หยุดฟัง') : (lang === 'en' ? 'Play Voice' : 'ฟังเสียงยาย')}</span>
                      </button>

                      <button
                        onClick={() => handleToggleBookmark(recording.id)}
                        className={`p-2 rounded-full border transition-all cursor-pointer ${
                          isBookmarked
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                        }`}
                        title={lang === 'en' ? 'Favorite' : 'บันทึกเป็นเสียงโปรด'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleShareClip(recording.id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#06C755] font-bold text-xs transition-all cursor-pointer"
                    >
                      {isShared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{isShared ? (lang === 'en' ? 'Sent!' : 'ส่งแล้ว!') : (lang === 'en' ? 'Share Clip' : 'แชร์เข้า LINE')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Caregiver Recommendation for Tonight */}
        <div className="rounded-[28px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300/80 p-6 sm:p-7 shadow-xs text-left space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              {lang === 'en' ? 'AI Caregiver Tip for Tonight' : 'คำแนะนำสำหรับลูกหลานและผู้ดูแลช่วงเย็นนี้'}
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
            {lang === 'en'
              ? '💡 Tip for tonight: Grandma spoke fondly about her Chiang Mai trip and the floral shirt. Try calling her tonight and asking about her favorite Northern dishes or show old holiday pictures. This stimulates emotional episodic memory!'
              : '💡 ข้อแนะนำช่วงเย็นนี้: วันนี้คุณยายพูดถึงทริปเชียงใหม่และเสื้อลายดอกด้วยแววตามีความสุขมาก ช่วงเย็นนี้ลองโทรหาแล้วชวนคุยถามถึงสูตรอาหารเหนือ หรือเปิดรูปเก่าๆ ในอัลบั้มให้ดู จะช่วยกระตุ้นความจำระยะยาวและสร้างความอบอุ่นใจให้คุณยายได้อย่างต่อเนื่องค่ะ'}
          </p>
        </div>

        {/* Storytelling Recap CTA & Unit Economics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <button
            onClick={() => {
              stopSpeech();
              onNavigate('today-recap');
            }}
            className="p-6 rounded-[28px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-sky-500/10 border border-indigo-200/80 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
          >
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Storytelling Scrapbook
              </span>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {lang === 'en' ? 'Open Full Storytelling Recap →' : 'เปิดดูสมุดบันทึกเรื่องเล่าประจำวัน (Today’s Recap) →'}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'en'
                  ? 'View interactive organic sticky notes and photos of today’s reminiscence.'
                  : 'ดูบันทึกโน้ตเรื่องเล่าและรูปภาพแบบสแครปบุ๊กที่ประมวลผลจากเสียงพูด'}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>{lang === 'en' ? 'View Scrapbook' : 'เปิดดูสมุดเรื่องเล่า'}</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Unit Economics */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {lang === 'en' ? 'Unit Economics for Judges' : 'โมเดลความคุ้มค่าเชิงธุรกิจ (Unit Economics)'}
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Plan</span>
                <span className="text-sm font-extrabold text-slate-900">฿290/mo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">AI Cost</span>
                <span className="text-sm font-extrabold text-emerald-600">~฿22</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Margin</span>
                <span className="text-sm font-extrabold text-amber-600">92.4%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Multilingual ElevenLabs v2 + Gemini caching architecture
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW: YOUR FAMILY
  // =========================================================================
  return (
    <div className="space-y-6 sm:space-y-8 py-2 max-w-4xl mx-auto">
      {/* Top Header Navigation (Caregiver portal badge removed as requested) */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopSpeech();
            onNavigate('home');
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-sm shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'en' ? 'Back to Senior Home' : 'กลับสู่หน้าหลักของผู้สูงอายุ'}</span>
        </button>
      </div>

      {/* Page Title & Description */}
      <div className="text-left space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-normal">
          {lang === 'en' ? 'Your Family' : 'Your Family'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          {lang === 'en'
            ? 'Manage family members, upload cherished photos & videos, and enrich memory orbs for your elders.'
            : 'จัดการสมาชิกในครอบครัว อัปโหลดรูปภาพและวิดีโอแห่งความทรงจำ พร้อมสร้างลูกแก้วสำหรับคุณตาคุณยาย'}
        </p>
      </div>

      {/* Button below title & description to navigate to Daily Reports & Voice */}
      <div className="text-left">
        <button
          onClick={() => {
            stopSpeech();
            setSubView('reports');
          }}
          className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start space-x-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 hover:from-rose-500/15 hover:via-amber-500/15 hover:to-indigo-500/15 border border-amber-200/70 text-slate-800 font-bold text-sm shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                {lang === 'en' ? 'Daily Reports & Voice Recordings' : 'รายงานประจำวัน & เสียงเล่าความทรงจำ'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {lang === 'en' ? 'Listen to today’s voice stories and engagement summary →' : 'คลิกเพื่อฟังเสียงเล่าเรื่องวันนี้และดูสรุปผลพัฒนาการ →'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* 2 Main Navigation Tabs: Members & Upload Memories */}
      <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('family')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'family'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>{lang === 'en' ? 'Members' : 'Members (สมาชิก)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'memories'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>{lang === 'en' ? 'Upload Memories' : 'Upload Memories (อัปโหลดความทรงจำ)'}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MEMBERS
         ========================================================================= */}
      {activeTab === 'family' && (
        <div className="space-y-6">
          {/* Family Code Card */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-[28px] p-6 text-slate-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                {lang === 'en' ? 'Unique Family ID' : 'รหัสประจำครอบครัว (Family Code)'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-wider mt-0.5">
                {familyGroup.familyCode}
              </h3>
              <p className="text-xs font-semibold text-slate-900/80 mt-1">
                {lang === 'en'
                  ? 'Share this code with other relatives to connect to Grandma & Grandpa’s vault.'
                  : 'ส่งรหัสนี้ให้ลูกหลานคนอื่นๆ เพื่อเชื่อมต่อรูปภาพและความทรงจำเข้ามาที่เครื่องนี้'}
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              aria-label={lang === 'en' ? 'Copy family code' : 'คัดลอกรหัสประจำครอบครัว'}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-full bg-slate-950 text-white font-bold text-xs shadow-xs hover:bg-slate-900 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? (lang === 'en' ? 'Copied!' : 'คัดลอกแล้ว!') : (lang === 'en' ? 'Copy Code' : 'คัดลอกรหัส')}</span>
            </button>
          </div>

          {/* Redesigned Family Members List */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs text-left space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>{lang === 'en' ? 'Family Members' : 'สมาชิกในครอบครัว'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {lang === 'en' ? 'Loved ones connected to this memory vault' : 'รายชื่อสมาชิกครอบครัวและผู้สูงอายุที่ร่วมแชร์ความทรงจำ'}
                </p>
              </div>

              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Add Member' : 'เพิ่มสมาชิกใหม่'}</span>
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {lang === 'en' ? 'New Member Information' : 'กรอกข้อมูลสมาชิกใหม่'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder={lang === 'en' ? 'Name (e.g. Grandma Mali)' : 'ชื่อ (เช่น ยายมะลิ)'}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    placeholder={lang === 'en' ? 'Relation (e.g. Aunt)' : 'ความสัมพันธ์ (เช่น น้าสาว)'}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'elder' | 'relative')}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500"
                  >
                    <option value="elder">{lang === 'en' ? 'Elder (ผู้สูงอายุ)' : 'ผู้สูงอายุ (Elder)'}</option>
                    <option value="relative">{lang === 'en' ? 'Caregiver/Relative' : 'ลูกหลาน/ผู้ดูแล (Relative)'}</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    {lang === 'en' ? 'Cancel' : 'ยกเลิก'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    {lang === 'en' ? 'Save Member' : 'บันทึกสมาชิก'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Members with 3-dot Kebab Menu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {familyGroup.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs relative"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                        member.role === 'elder'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {member.role === 'elder' ? <Heart className="w-5 h-5 fill-amber-500 text-amber-500" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{member.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            member.role === 'elder'
                              ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100/80 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {member.role === 'elder' ? (lang === 'en' ? 'Elder' : 'ผู้สูงอายุ') : (lang === 'en' ? 'Relative' : 'ลูกหลาน')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{member.relationTitle}</p>
                    </div>
                  </div>

                  {/* 3-Dots Action Menu */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenKebabId(openKebabId === member.id ? null : member.id);
                      }}
                      title={lang === 'en' ? 'More options' : 'ตัวเลือกเพิ่มเติม'}
                      aria-label={lang === 'en' ? `Actions for ${member.name}` : `ตัวเลือกสำหรับ ${member.name}`}
                      className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openKebabId === member.id && (
                      <div 
                        className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleToggleMemberRole(member);
                            setOpenKebabId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2.5 font-medium cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lang === 'en' ? 'Switch Role (Elder/Relative)' : 'สลับบทบาท (ผู้สูงอายุ/ญาติ)'}</span>
                        </button>

                        <div className="border-t border-slate-100 my-1" />

                        <button
                          onClick={() => {
                            setOpenKebabId(null);
                            handleDeleteMember(member.id);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center space-x-2.5 font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>{lang === 'en' ? 'Delete Member' : 'ลบสมาชิกนี้'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: UPLOAD MEMORIES (Reworked Process)
         ========================================================================= */}
      {activeTab === 'memories' && (
        <div className="space-y-6 text-left">
          {/* Informative LINE Account Sync Banner (Replaces simulator widget) */}
          <div className="rounded-[28px] bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-300/80 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div className="w-13 h-13 rounded-2xl bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="w-7 h-7 fill-white" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#06C755]/15 text-[#06C755] border border-[#06C755]/30">
                    LINE Family Sync
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    @memora
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  Add LINE @memora and add the account to your family group to sync your group photo albums
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {lang === 'en'
                    ? 'Photos and videos shared into your family LINE album will sync automatically into Memora AI to generate new memory orbs.'
                    : 'เพิ่มเพื่อน LINE @memora แล้วดึงบอทเข้ากลุ่มครอบครัว เพื่อซิงค์อัลบั้มรูปภาพเข้ามาสร้างลูกแก้วความทรงจำโดยอัตโนมัติ'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyLineId}
              className="px-5 py-3 rounded-full bg-white hover:bg-slate-50 border border-emerald-300/80 text-[#06C755] font-bold text-xs shadow-2xs hover:shadow-xs active:scale-95 transition-all flex items-center space-x-2 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedLine ? (lang === 'en' ? 'Copied @memora!' : 'คัดลอก @memora แล้ว!') : (lang === 'en' ? 'Copy @memora' : 'คัดลอก @memora')}</span>
            </button>
          </div>

          {/* Primary Action: Add New Memory with Full Details */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-yellow-500/10 rounded-[28px] border border-amber-300/80 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                {lang === 'en' ? 'Create Memory Orb' : 'สร้างลูกแก้วความทรงจำใหม่'}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {lang === 'en' ? 'Add Photo / Video with Memory Clues' : 'เพิ่มรูปภาพหรือวิดีโอ พร้อมระบุข้อมูลความทรงจำ'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {lang === 'en'
                  ? 'Select who is in the photo, location, date, emotion orb color, and memory clues for your elders.'
                  : 'ระบุว่าใครอยู่ในภาพ สถานที่ วันที่ เลือกลูกแก้วอารมณ์ และตั้งคำใบ้ให้คุณตาคุณยายทาย'}
              </p>
            </div>

            <button
              onClick={() => {
                setOrbMediaUrl('');
                setOrbTitle('');
                setOrbPeople([]);
                setShowCreateOrbModal(true);
              }}
              className="px-6 py-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{lang === 'en' ? 'Add New Memory' : 'เพิ่มความทรงจำใหม่'}</span>
            </button>
          </div>

          {/* Real Media Storage & Upload Manager */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>{lang === 'en' ? 'Family Media Vault (Photos & Videos)' : 'คลังรูปภาพและวิดีโอครอบครัว'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  {lang === 'en'
                    ? 'Upload family media (Photos ≤ 10MB, Videos ≤ 50MB) and turn them into memory orbs anytime.'
                    : 'อัปโหลดภาพและวิดีโอ (รูปภาพ ≤ 10MB, วิดีโอ ≤ 50MB) เพื่อนำมาสร้างเป็นลูกแก้วความทรงจำ'}
                </p>
              </div>

              {/* Upload Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <label className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Upload Photo' : 'อัปโหลดรูปภาพ'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                <label className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold active:scale-95 transition-all cursor-pointer">
                  <Video className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Upload Video' : 'อัปโหลดวิดีโอ'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Upload Feedback */}
            {isUploading && (
              <div className="flex items-center space-x-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'en' ? 'Uploading media...' : 'กำลังอัปโหลดและประมวลผลไฟล์...'}</span>
              </div>
            )}
            {uploadError && (
              <div className="flex items-center space-x-2 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center space-x-2 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Media Grid */}
            {uploadedMediaList.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'en'
                    ? 'No uploaded family media yet. Click above or use the "Add New Memory" button.'
                    : 'ยังไม่มีไฟล์สื่อที่อัปโหลด คลิกปุ่มด้านบนหรือกด "เพิ่มความทรงจำใหม่" ได้เลย'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {uploadedMediaList.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col shadow-2xs hover:shadow-md transition-all"
                  >
                    {/* Media Thumbnail */}
                    <div className="w-full aspect-square bg-slate-100 relative overflow-hidden">
                      {item.mediaType === 'video' ? (
                        <video
                          src={item.fileUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={item.fileUrl}
                          alt={item.originalFilename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                        {item.mediaType === 'video' ? 'VIDEO 🎥' : 'PHOTO 📸'}
                      </span>
                    </div>

                    {/* Media Details */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-900 truncate block">
                          {item.originalFilename}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {item.fileSize ? `${(item.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Media file'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 pt-2 mt-auto border-t border-slate-100">
                        <button
                          onClick={() => handleOpenModalWithMedia(item)}
                          title={lang === 'en' ? 'Create Memory Orb from this file' : 'สร้างลูกแก้วความจำจากรูปนี้'}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center space-x-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-slate-950" />
                          <span>สร้างลูกแก้ว</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          title={lang === 'en' ? 'Delete file' : 'ลบไฟล์'}
                          aria-label={lang === 'en' ? `Delete file ${item.originalFilename}` : `ลบไฟล์ ${item.originalFilename}`}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Memory Orbs in Vault */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'en' ? 'Active Memory Orbs in Vault' : 'ลูกแก้วความทรงจำในคลังปัจจุบัน'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {lang === 'en' ? 'Orbs ready for senior quiz sessions' : 'ลูกแก้วพร้อมคำถามที่แสดงบนแท่นของคุณตาคุณยาย'}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {orbs.length} {lang === 'en' ? 'Total Memories' : 'ความทรงจำทั้งหมด'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {orbs.map((orb) => {
                const orbConf = EMOTION_CONFIG[orb.emotion] || EMOTION_CONFIG.joy;

                return (
                  <div
                    key={orb.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3.5"
                  >
                    {/* Small Orb Thumbnail */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white shadow-xs relative bg-slate-200">
                      {orb.videoUrl ? (
                        <video src={orb.videoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={orb.photoUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      <span className={`absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r ${orbConf.accentBg}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {lang === 'en' && orb.titleEn ? orb.titleEn : orb.title}
                        </h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${orbConf.badgeBg} ${orbConf.badgeText} border ${orbConf.badgeBorder}`}>
                          {lang === 'en' ? orbConf.labelEn : orbConf.labelTh}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {lang === 'en' && orb.memoryYearEn ? orb.memoryYearEn : orb.memoryYear}
                      </p>
                      {orb.correctAnswer && (
                        <p className="text-[11px] text-slate-600 mt-1 truncate">
                          <span className="font-semibold text-slate-700">{lang === 'en' ? 'Answer: ' : 'บุคคลในภาพ: '}</span>
                          {orb.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RICH MEMORY CREATION MODAL
         ========================================================================= */}
      <Modal
        isOpen={showCreateOrbModal}
        onClose={() => setShowCreateOrbModal(false)}
        title={lang === 'en' ? 'Add New Memory' : 'เพิ่มความทรงจำใหม่'}
        subtitle={lang === 'en' ? 'Upload photo/video and tell the story for Grandma & Grandpa' : 'ระบุข้อมูลภาพ เรื่องราว และเลือกลูกแก้วอารมณ์สำหรับคุณตาคุณยาย'}
        icon={<Sparkles className="w-5 h-5 text-white" />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateNewMemoryOrb} className="space-y-5">
          {/* Media Upload / Preview */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'en' ? 'Upload Photo or Video *' : 'อัปโหลดรูปภาพหรือวิดีโอ *'}</span>
            </label>

            {orbMediaUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-56 flex items-center justify-center">
                {orbMediaType === 'video' ? (
                  <video src={orbMediaUrl} className="max-h-56 w-full object-contain" controls />
                ) : (
                  <img src={orbMediaUrl} alt="Preview" className="max-h-56 w-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => setOrbMediaUrl('')}
                  className="absolute top-2 right-2 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Change File' : 'เปลี่ยนไฟล์'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2 cursor-pointer bg-slate-50/60 hover:bg-indigo-50/30 transition-all">
                  <ImageIcon className="w-8 h-8 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800">{lang === 'en' ? 'Upload Photo (Image)' : 'อัปโหลดรูปภาพ (Photo)'}</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP ≤ 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleModalFileUpload(e, 'photo')}
                    className="hidden"
                  />
                </label>

                <label className="border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2 cursor-pointer bg-slate-50/60 hover:bg-purple-50/30 transition-all">
                  <Video className="w-8 h-8 text-purple-500" />
                  <span className="text-xs font-bold text-slate-800">{lang === 'en' ? 'Upload Video (MP4)' : 'อัปโหลดวิดีโอ (Video)'}</span>
                  <span className="text-[10px] text-slate-400">MP4, WebM ≤ 50MB</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleModalFileUpload(e, 'video')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Memory Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'en' ? 'Memory Name / Title *' : 'ชื่อภาพ / ชื่อความทรงจำ *'}</span>
            </label>
            <input
              type="text"
              value={orbTitle}
              onChange={(e) => setOrbTitle(e.target.value)}
              placeholder={lang === 'en' ? 'e.g. Family trip to Hua Hin beach' : 'เช่น เที่ยวทะเลหัวหินกับครอบครัว, วันรับปริญญาหลาน'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500 font-medium"
              required
            />
          </div>

          {/* Who is in the photo */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'en' ? 'Who is in this photo/video? *' : 'ใครอยู่ในภาพนี้บ้าง? (เลือกสมาชิกหรือพิมพ์เพิ่ม) *'}</span>
            </label>
            
            {/* Family Member Chips */}
            <div className="flex flex-wrap gap-2">
              {familyGroup.members.map((member) => {
                const isSelected = orbPeople.includes(member.name);
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => handleTogglePerson(member.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{member.name} ({member.relationTitle})</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Name Input */}
            <div className="flex space-x-2 pt-1">
              <input
                type="text"
                value={customPersonName}
                onChange={(e) => setCustomPersonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomPerson();
                  }
                }}
                placeholder={lang === 'en' ? 'Add other person name...' : 'เพิ่มชื่อคนอื่นๆ ในภาพ...'}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomPerson}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                {lang === 'en' ? '+ Add' : '+ เพิ่ม'}
              </button>
            </div>
          </div>

          {/* Location & Date/Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{lang === 'en' ? 'Location' : 'สถานที่ของภาพ'}</span>
              </label>
              <input
                type="text"
                value={orbLocation}
                onChange={(e) => setOrbLocation(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Hua Hin Beach, Chiang Mai' : 'เช่น ชายหาดหัวหิน, วัดพระแก้ว'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>{lang === 'en' ? 'Date or Year' : 'วันที่หรือปีในภาพ'}</span>
              </label>
              <input
                type="text"
                value={orbDateYear}
                onChange={(e) => setOrbDateYear(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. 1995 or 15 April 2020' : 'เช่น พ.ศ. 2538 หรือ เมษายน 2542'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Description / Story */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Description / Story' : 'คำอธิบาย / เรื่องเล่าเบื้องหลังภาพ'}</span>
            </label>
            <textarea
              value={orbDescription}
              onChange={(e) => setOrbDescription(e.target.value)}
              rows={2}
              placeholder={lang === 'en' ? 'e.g. The first time the kids took Grandma to see the ocean. Grandma loved the sea breeze and eating coconut ice cream.' : 'เช่น ทริปแรกที่ลูกๆ พาคุณยายไปเห็นทะเล คุณยายชอบลมทะเลมาก และนั่งทานไอศกรีมกะทิสดอย่างเอร็ดอร่อย'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-indigo-500 font-medium resize-none"
            />
          </div>

          {/* Orb Emotion & Color Selection with authentic 3D Glass MemoryOrb */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{lang === 'en' ? 'Memory Orb Emotion & Color *' : 'สีและอารมณ์ของลูกแก้ว (Orb Emotion) *'}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(Object.keys(EMOTION_CONFIG) as OrbEmotion[]).map((em) => {
                const conf = EMOTION_CONFIG[em];
                const isSelected = orbEmotion === em;

                return (
                  <button
                    type="button"
                    key={em}
                    onClick={() => setOrbEmotion(em)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? `${conf.badgeBg} ${conf.badgeBorder} ring-2 ${conf.ringColor} shadow-xs scale-102`
                        : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xs z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Official Inside Out 3D Glass Memory Orb with Core Swirl and Aura */}
                    <div className="py-1.5 flex items-center justify-center">
                      <MemoryOrbView
                        emotion={em}
                        size={52}
                        isSelected={isSelected}
                        showAura={true}
                      />
                    </div>

                    <div className="mt-1 w-full text-center">
                      <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                        {lang === 'en' ? conf.labelEn : conf.labelTh}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {conf.colorName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiz Prompt & Clue (Optional / Auto-suggested) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                {lang === 'en' ? 'Memory Quiz Settings for Grandma' : 'คำถามและคำใบ้สำหรับคุณตาคุณยาย'}
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={orbQuizQuestion}
                onChange={(e) => setOrbQuizQuestion(e.target.value)}
                placeholder={lang === 'en' ? 'Voice prompt (e.g. Do you remember who is hugging you in this photo?)' : 'คำถามเสียง (เช่น จำรูปนี้ได้ไหมคะ... คนที่ยืนกอดคุณยายอยู่คือใครเอ่ย?)'}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-xs focus:outline-amber-500"
              />
              <input
                type="text"
                value={orbQuizClue}
                onChange={(e) => setOrbQuizClue(e.target.value)}
                placeholder={lang === 'en' ? 'Gentle clue (e.g. The granddaughter who calls you every Sunday)' : 'คำใบ้แบบอ่อนโยน (เช่น หลานสาวคนที่ชอบโทรมาหาคุณยายทุกวันอาทิตย์)'}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-xs focus:outline-amber-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateOrbModal(false)}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {lang === 'en' ? 'Cancel' : 'ยกเลิก'}
            </button>
            <button
              type="submit"
              disabled={isFormSubmitting}
              className="px-6 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{lang === 'en' ? 'Save & Create Memory Orb' : 'บันทึกและสร้างลูกแก้วความทรงจำ'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
