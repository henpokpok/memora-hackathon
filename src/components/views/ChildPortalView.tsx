import React, { useState, useEffect } from 'react';
import { MemoryOrb, Language, FamilyGroup, FamilyMember, NavigationPage } from '../../types';
import { 
  ArrowLeft, 
  MessageCircle, 
  Play, 
  Pause, 
  ShieldCheck, 
  Share2, 
  Check, 
  Plus, 
  Users, 
  Sparkles, 
  Heart, 
  User, 
  UserCheck, 
  Copy, 
  Layers, 
  Camera,
  CheckCircle2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Video,
  AlertCircle,
  RefreshCw
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
  const [activeTab, setActiveTab] = useState<'insights' | 'family' | 'memories'>('family');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasSentLine, setHasSentLine] = useState(false);
  const [isSimulatingLine, setIsSimulatingLine] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  // Handle photo/video file upload
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
      setUploadError(err.message || (lang === 'en' ? 'Upload failed' : 'การอัปโหลดขัดข้อง'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle media deletion
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm(lang === 'en' ? 'Delete this media item?' : 'คุณต้องการลบไฟล์สื่อนี้หรือไม่?')) return;
    await mediaApi.deleteMedia(mediaId);
    setUploadedMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  // Handle turning uploaded media into Memory Orb
  const handleCreateOrbFromMedia = (mediaItem: any) => {
    const newOrb: MemoryOrb = {
      id: `orb-${Date.now()}`,
      emotion: 'joy',
      title: mediaItem.originalFilename.replace(/\.[^/.]+$/, ''),
      titleEn: 'Family Memory',
      memoryYear: 'พ.ศ. 2567',
      memoryYearEn: '2024',
      photoUrl: mediaItem.fileUrl,
      videoUrl: mediaItem.mediaType === 'video' ? mediaItem.fileUrl : undefined,
      voicePrompt: 'จำลูกแก้วความทรงจำลูกใหม่นี้ได้ไหมคะ... รูปที่คุณถ่ายร่วมกับครอบครัวเมื่อเร็วๆ นี้?',
      voicePromptEn: 'Do you remember this new loving family memory?',
      voiceSuccess: 'เก่งมากเลยค่ะคุณยาย! ถูกต้องแล้วค่ะ!',
      voiceSuccessEn: 'Wonderful! You remembered correctly!',
      gentleClue: 'ค่อยๆ นึกนะคะ รูปความสุขในบ้านเราเองค่ะ',
      gentleClueEn: 'Take your time, this is a loving family moment!',
      correctAnswer: 'คนในครอบครัว',
      correctAnswerEn: 'Family Members',
      glowColor: 'rgba(245, 158, 11, 0.45)',
      accentBg: 'from-amber-400 via-amber-300 to-yellow-200',
      isUnlocked: false,
      uploadedBy: 'ลูกหลานในครอบครัว',
      uploadedByEn: 'Family member',
      uploadDate: 'วันนี้',
      uploadDateEn: 'Today',
      options: [
        {
          id: `opt-${Date.now()}-1`,
          label: 'คนในครอบครัว',
          labelEn: 'Family Members',
          relation: 'ครอบครัวอบอุ่น',
          relationEn: 'Warm Family',
          photoUrl: mediaItem.fileUrl,
          isCorrect: true,
        },
        {
          id: `opt-${Date.now()}-2`,
          label: 'เพื่อนบ้าน',
          labelEn: 'Neighbor',
          relation: 'คนรู้จัก',
          relationEn: 'Acquaintance',
          photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
        {
          id: `opt-${Date.now()}-3`,
          label: 'เพื่อนสมัยเรียน',
          labelEn: 'Classmate',
          relation: 'เพื่อนเก่า',
          relationEn: 'Old Friend',
          photoUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
      ],
    };

    onAddNewOrb(newOrb);
    alert(lang === 'en' ? 'Created new Memory Orb on Grandma’s pedestal!' : 'แปลงเป็นลูกแก้วความทรงจำบนแท่นของคุณยายเรียบร้อยแล้ว!');
  };

  const grandmaVoiceSnippet = lang === 'en'
    ? 'Oh, this was in 1985 when we took the whole family to Chiang Mai! I remember the floral shirt you bought me!'
    : 'อ๋อ... รูปนี้ตอนปี 2528 ที่เราพากันไปเที่ยวเชียงใหม่กันทั้งบ้าน ยายยังจำเสื้อลายดอกตัวที่ลูกซื้อให้ได้อยู่เลยนะ';

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(familyGroup.familyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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

  const handleSimulateLineUpload = () => {
    setIsSimulatingLine(true);
    setTimeout(() => {
      const newOrb: MemoryOrb = {
        id: `orb-${Date.now()}`,
        emotion: 'joy',
        title: 'ทำบุญวันสงกรานต์ที่วัดบ้านเกิด',
        titleEn: 'Songkran Merit Making at Village Temple',
        memoryYear: 'พ.ศ. 2565 (เทศกาลสงกรานต์)',
        memoryYearEn: '2022 (Songkran Festival)',
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        voicePrompt: 'ลูกแก้วความทรงจำลูกใหม่จาก LINE ค่ะ... วันสงกรานต์ที่เราไปทำบุญสรงน้ำพระด้วยกัน คนที่สวมเสื้อลายดอกข้างๆ ยายคือใครเอ่ย?',
        voicePromptEn: 'A new memory orb from LINE! During Songkran, who is wearing the floral shirt next to Grandma?',
        voiceSuccess: 'ถูกต้องแล้วค่ะคุณยาย! น้าเพ็ญ น้องสาวสุดที่รักของคุณยายเองค่ะ!',
        voiceSuccessEn: 'Correct, Grandma! Aunt Phen, your beloved younger sister!',
        gentleClue: 'ใบ้ให้นะคะ... น้องสาวคนที่ชอบตำน้ำพริกกะปิมาให้คุณยายทานทุกวันพระค่ะ',
        gentleClueEn: 'A clue... Your sister who makes delicious chili paste for Grandma every holy day!',
        correctAnswer: 'น้าเพ็ญ (น้องสาว)',
        correctAnswerEn: 'Aunt Phen (Younger Sister)',
        options: [
          {
            id: 'opt-new-1',
            label: 'น้าเพ็ญ',
            labelEn: 'Aunt Phen',
            relation: 'น้องสาวคนเล็ก',
            relationEn: 'Younger Sister',
            photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
            isCorrect: true,
          },
          {
            id: 'opt-new-2',
            label: 'ป้าสมจิต',
            labelEn: 'Aunt Somjit',
            relation: 'เพื่อนบ้าน',
            relationEn: 'Neighbor',
            photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
            isCorrect: false,
          },
        ],
        glowColor: 'amber-400',
        accentBg: 'amber-500',
        isUnlocked: false,
        uploadedBy: 'หลานภูมิ (ส่งผ่าน LINE)',
        uploadedByEn: 'Poom (Sent via LINE)',
        uploadDate: 'วันนี้',
        uploadDateEn: 'Today',
        sharedSeniorIds: ['elder-1', 'elder-2'],
      };

      onAddNewOrb(newOrb);
      setIsSimulatingLine(false);
      alert(lang === 'en' ? 'Photo ingested into Memory Vault from LINE!' : 'เพิ่มรูปลูกแก้วใหม่จาก LINE เข้าสู่คลังสำเร็จแล้ว!');
    }, 900);
  };

  const elders = familyGroup.members.filter((m) => m.role === 'elder');
  const relatives = familyGroup.members.filter((m) => m.role === 'relative');

  return (
    <div className="space-y-6 sm:space-y-8 py-2 max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopSpeech();
            onNavigate('home');
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-sm shadow-2xs active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'en' ? 'Back to Senior Home' : 'กลับสู่หน้าหลักของผู้สูงอายุ'}</span>
        </button>

        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-3.5 py-1.5 rounded-full flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>{lang === 'en' ? 'Protected Caregiver Portal' : 'พื้นที่เฉพาะลูกหลานและผู้ดูแล'}</span>
        </span>
      </div>

      {/* Page Title */}
      <div className="text-left space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {lang === 'en' ? 'Caregiver & Family Console' : 'ศูนย์จัดการครอบครัวและความทรงจำ'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          {lang === 'en'
            ? 'Manage family code, add loved ones, and curate memory orbs for your elders.'
            : 'รวบรวมระบบจัดการครอบครัว สลับผู้เล่น และเพิ่มรูปลูกแก้วความทรงจำให้คุณตาคุณยาย'}
        </p>
      </div>

      {/* 3 Main Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveTab('family')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'family'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'en' ? 'Family System' : 'ระบบครอบครัว & สลับผู้เล่น'}</span>
        </button>

        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'memories'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{lang === 'en' ? 'Memory Bank' : 'จัดการลูกแก้วความทรงจำ'}</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'insights'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{lang === 'en' ? 'Daily Reports & Voice' : 'รายงานประจำวัน & เสียง'}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: FAMILY MANAGEMENT (Protected from senior accidental deletion)
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

          {/* Multi-Elder Switcher: Choose who is currently playing */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'en' ? 'Active Senior Profile' : 'ผู้สูงอายุที่กำลังเล่นอยู่ในปัจจุบัน'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {lang === 'en'
                    ? 'Switch between elders to personalize greetings and memory sets'
                    : 'คลิกเพื่อสลับผู้เล่น (เช่น สลับระหว่างคุณยายกับคุณตา)'}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {elders.length} {lang === 'en' ? 'Elders in Family' : 'ผู้สูงอายุในบ้าน'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {elders.map((elder) => {
                const isActive = activeSenior.id === elder.id;

                return (
                  <button
                    key={elder.id}
                    onClick={() => onSwitchActiveSenior(elder.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Clean Lucide Icon Avatar (NO EMOJIS!) */}
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
                        <Heart className="w-6 h-6 fill-white text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-slate-900 text-base">{elder.name}</h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                            {elder.relationTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isActive
                            ? (lang === 'en' ? '● Currently Playing' : '● กำลังเล่นอยู่')
                            : (lang === 'en' ? 'Tap to switch' : 'แตะเพื่อสลับเป็นผู้เล่น')}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Family Members List with Clean Icons (NO EMOJIS) */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>{lang === 'en' ? 'Family Members' : 'สมาชิกในครอบครัวทั้งหมด'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  {lang === 'en' ? 'Protected list of relatives & elders' : 'รายชื่อผู้สูงอายุและลูกหลานในครอบครัว'}
                </p>
              </div>

              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all"
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
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {lang === 'en' ? 'Cancel' : 'ยกเลิก'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                  >
                    {lang === 'en' ? 'Save Member' : 'บันทึกสมาชิก'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {familyGroup.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        member.role === 'elder'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {member.role === 'elder' ? <Heart className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                      <p className="text-xs text-slate-500">{member.relationTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleMemberRole(member)}
                      title={lang === 'en' ? 'Click to toggle between Elder & Relative' : 'คลิกเพื่อสลับบทบาท ผู้สูงอายุ/ลูกหลาน'}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-85 active:scale-95 transition-all ${
                        member.role === 'elder'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {member.role === 'elder' ? (lang === 'en' ? 'Elder (ผู้สูงอายุ)' : 'ผู้สูงอายุ (Elder)') : (lang === 'en' ? 'Relative (ลูกหลาน)' : 'ลูกหลาน (Relative)')}
                    </button>

                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      title={lang === 'en' ? 'Remove member' : 'ลบสมาชิกนี้'}
                      aria-label={lang === 'en' ? `Remove member ${member.name}` : `ลบสมาชิก ${member.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MEMORY BANK MANAGEMENT & LINE INGESTION
         ========================================================================= */}
      {activeTab === 'memories' && (
        <div className="space-y-6 text-left">
          {/* Quick LINE Ingestion Simulator */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-[28px] border border-emerald-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-[#06C755] text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {lang === 'en' ? 'LINE Bot Ingestion Simulator' : 'จำลองการส่งรูปจาก LINE Bot ของลูกหลาน'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {lang === 'en'
                      ? 'In real life, relatives send old family photos to @MemoraBot on LINE.'
                      : 'ในชีวิตจริง ลูกหลานเพียงส่งรูปเก่าเข้า LINE Official แล้ว AI จะสร้างลูกแก้วให้โดยอัตโนมัติ'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSimulateLineUpload}
                disabled={isSimulatingLine}
                className="px-5 py-3 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isSimulatingLine ? (lang === 'en' ? 'Ingesting...' : 'กำลังประมวลผล...') : (lang === 'en' ? 'Simulate LINE Ingestion' : 'จำลองส่งรูปเข้า LINE')}</span>
              </button>
            </div>
          </div>

          {/* Real Media Storage & Upload Manager */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>{lang === 'en' ? 'Family Media Vault (Photos & Videos)' : 'คลังรูปภาพและวิดีโอครอบครัว (จัดเก็บจริงในเซิร์ฟเวอร์)'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  {lang === 'en'
                    ? 'Upload family memories with automatic size validation (Photos ≤ 10MB, Videos ≤ 50MB)'
                    : 'อัปโหลดภาพและวิดีโอครอบครัว พร้อมระบบคัดกรองขนาดไฟล์ (รูปภาพ ≤ 10MB, วิดีโอ ≤ 50MB)'}
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
                <span>{lang === 'en' ? 'Uploading media to backend server...' : 'กำลังอัปโหลดและจัดเก็บไฟล์ลงเซิร์ฟเวอร์...'}</span>
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
                    ? 'No uploaded family media yet. Click above to upload real photos or videos.'
                    : 'ยังไม่มีไฟล์สื่อที่อัปโหลด สามารถคลิกปุ่มด้านบนเพื่ออัปโหลดภาพหรือวิดีโอครอบครัว'}
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
                          {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 pt-2 mt-auto border-t border-slate-100">
                        <button
                          onClick={() => handleCreateOrbFromMedia(item)}
                          title={lang === 'en' ? 'Create Memory Orb from this photo' : 'สร้างลูกแก้วความจำจากรูปนี้'}
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
                <p className="text-xs sm:text-sm text-slate-500">
                  {lang === 'en' ? 'Check shared memory status between Grandma & Grandpa' : 'ตรวจสอบและดูความทรงจำที่เชื่อมโยงตากับยาย'}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {orbs.length} {lang === 'en' ? 'Total Memories' : 'ความทรงจำทั้งหมด'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {orbs.map((orb) => {
                const isShared = (orb.sharedSeniorIds?.length || 0) > 1;

                return (
                  <div
                    key={orb.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3.5"
                  >
                    {/* Small Orb Thumbnail */}
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white shadow-xs">
                      <img src={orb.photoUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {lang === 'en' && orb.titleEn ? orb.titleEn : orb.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {lang === 'en' && orb.memoryYearEn ? orb.memoryYearEn : orb.memoryYear}
                      </p>

                      <div className="flex items-center space-x-2 mt-2">
                        {isShared ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>{lang === 'en' ? 'Shared (Grandma + Grandpa)' : 'ตากับยายแชร์ร่วมกัน'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                            {lang === 'en' ? 'Personal Memory' : 'ความทรงจำเดี่ยว'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DAILY INSIGHTS & VOICE RECORDINGS
         ========================================================================= */}
      {activeTab === 'insights' && (
        <div className="space-y-6 text-left">
          {/* Audio Snippet Player */}
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 rounded-[28px] border border-rose-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  {lang === 'en' ? 'Today’s Voice Capsule' : 'บันทึกเสียงของคุณยายวันนี้'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {lang === 'en' ? 'Grandma Somsri reminiscing about Chiang Mai' : 'คุณยายเล่าเรื่องตอนไปเที่ยวเชียงใหม่'}
                </h3>
              </div>

              <button
                onClick={handlePlayVoice}
                aria-label={isPlayingAudio ? (lang === 'en' ? 'Pause voice recording' : 'หยุดฟังบันทึกเสียง') : (lang === 'en' ? 'Play voice recording' : 'เล่นบันทึกเสียง')}
                className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                {isPlayingAudio ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
            </div>

            <p className="italic text-sm text-slate-700 bg-white/70 p-3.5 rounded-2xl border border-rose-100">
              "{grandmaVoiceSnippet}"
            </p>

            <button
              onClick={() => {
                setHasSentLine(true);
                setTimeout(() => setHasSentLine(false), 3000);
              }}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              {hasSentLine ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{hasSentLine ? (lang === 'en' ? 'Sent to Family LINE!' : 'ส่งเข้า LINE ครอบครัวแล้ว!') : (lang === 'en' ? 'Share to LINE Group' : 'ส่งสรุปผลเข้า LINE ครอบครัว')}</span>
            </button>
          </div>

          {/* Unit Economics for Hackathon Judges */}
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              {lang === 'en' ? 'Project Economics & Unit Viability' : 'โมเดลความคุ้มค่าเชิงธุรกิจ (Unit Economics)'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Subscription Price</span>
                <span className="text-base font-extrabold text-slate-900">฿290 / Month</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Family plan (all relatives)</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">ElevenLabs + AI Cost</span>
                <span className="text-base font-extrabold text-emerald-600">~฿22 / Senior / Mo</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Multilingual v2 cached TTS</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Gross Profit Margin</span>
                <span className="text-base font-extrabold text-amber-600">92.4%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">High margin software model</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
