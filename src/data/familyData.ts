import { FamilyGroup } from '../types';

export const initialFamilyGroup: FamilyGroup = {
  familyCode: 'MEMORA-8821',
  familyName: 'ครอบครัววัฒนศิริ',
  members: [
    {
      id: 'elder-1',
      name: 'สมศรี',
      role: 'elder',
      relationTitle: 'คุณยาย',
      avatarIcon: 'heart',
      avatarColor: 'bg-rose-500 text-white',
      isCurrentActive: true,
    },
    {
      id: 'elder-2',
      name: 'สมชาย',
      role: 'elder',
      relationTitle: 'คุณตา',
      avatarIcon: 'sparkles',
      avatarColor: 'bg-amber-500 text-white',
      isCurrentActive: false,
    },
    {
      id: 'rel-1',
      name: 'แอน',
      role: 'relative',
      relationTitle: 'ลูกสาวคนโต',
      avatarIcon: 'user',
      avatarColor: 'bg-indigo-500 text-white',
      isCurrentActive: false,
    },
    {
      id: 'rel-2',
      name: 'ภูมิ',
      role: 'relative',
      relationTitle: 'หลานชายคนโปรด',
      avatarIcon: 'shield',
      avatarColor: 'bg-emerald-500 text-white',
      isCurrentActive: false,
    },
    {
      id: 'rel-3',
      name: 'มินท์',
      role: 'relative',
      relationTitle: 'หลานสาวคนเล็ก',
      avatarIcon: 'star',
      avatarColor: 'bg-sky-500 text-white',
      isCurrentActive: false,
    },
  ],
};
