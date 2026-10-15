import { DailyRecapMemory } from '../types';

const STORAGE_KEY = 'memora_daily_recaps';

export const recentGalleryPhotos = [
  {
    id: 'gallery-recent-1',
    url: 'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?auto=format&fit=crop&w=600&q=80',
    titleTh: 'ดอกมะลิเช้านี้',
    titleEn: 'Morning Jasmine',
    timeTh: '08:30 น.',
    timeEn: '08:30 AM',
  },
  {
    id: 'gallery-recent-2',
    url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
    titleTh: 'น้ำชายามบ่าย',
    titleEn: 'Afternoon Tea',
    timeTh: '14:15 น.',
    timeEn: '02:15 PM',
  },
  {
    id: 'gallery-recent-3',
    url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=600&q=80',
    titleTh: 'หลานชายยิ้มสดใส',
    titleEn: 'Smiling Grandson',
    timeTh: '16:40 น.',
    timeEn: '04:40 PM',
  },
];

export const presetGalleryPhotos = [
  {
    id: 'preset-1',
    url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=600&q=80',
    titleTh: 'หลานชายวิ่งเล่น',
    titleEn: 'Grandson playing',
  },
  {
    id: 'preset-2',
    url: 'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?auto=format&fit=crop&w=600&q=80',
    titleTh: 'ดอกมะลิสวนหน้าบ้าน',
    titleEn: 'Garden Jasmine Flowers',
  },
  {
    id: 'preset-3',
    url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
    titleTh: 'น้ำชายามบ่ายและขนม',
    titleEn: 'Afternoon tea & snacks',
  },
  {
    id: 'preset-4',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
    titleTh: 'ครอบครัวพร้อมหน้า',
    titleEn: 'Family together',
  },
  {
    id: 'preset-5',
    url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80',
    titleTh: 'เดินรับลมสวนสาธารณะ',
    titleEn: 'Park walk',
  },
];

export const initialDailyRecaps: DailyRecapMemory[] = [
  {
    id: 'recap-seed-1',
    date: '2026-10-14',
    displayDateTh: 'เมื่อวานนี้, 14 ต.ค. 2569',
    displayDateEn: 'Yesterday, Oct 14, 2026',
    transcript: 'เมื่อวานช่วงบ่าย นั่งรดน้ำต้นมะลิหน้าบ้าน ได้ยินเสียงนกกระจอกร้องเพลินใจ ลูกสาวนำบัวลอยน้ำกะทิอุ่นๆ มาฝาก หวานละมุนกำลังดี อิ่มอกอิ่มใจมากจ้ะ',
    photos: [
      'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
    ],
    emotion: 'joy',
    timestamp: Date.now() - 86400000,
    audioDurationSec: 42,
  },
  {
    id: 'recap-seed-2',
    date: '2026-10-13',
    displayDateTh: '13 ต.ค. 2569 (วันอาทิตย์)',
    displayDateEn: 'Oct 13, 2026 (Sunday)',
    transcript: 'น้องภูมิหลานชายคนโปรดมาหา ช่วยคุณยายแกะถั่วฝักยาวและวาดรูปแมวสีส้มใส่กระดาษแผ่นใหญ่ หัวเราะร่าเริงกันทั้งบ่าย มีความสุขที่สุดเลย',
    photos: [
      'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=600&q=80',
    ],
    emotion: 'love',
    timestamp: Date.now() - 172800000,
    audioDurationSec: 35,
  },
];

export function getDailyRecaps(): DailyRecapMemory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDailyRecaps));
      return initialDailyRecaps;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return initialDailyRecaps;
  } catch (e) {
    console.error('Failed to load daily recaps from localStorage', e);
    return initialDailyRecaps;
  }
}

export function saveDailyRecap(recap: DailyRecapMemory): DailyRecapMemory[] {
  try {
    const current = getDailyRecaps();
    // Prepend new recap
    const updated = [recap, ...current.filter((r) => r.id !== recap.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save daily recap', e);
    return [recap];
  }
}

export function deleteDailyRecap(id: string): DailyRecapMemory[] {
  try {
    const current = getDailyRecaps();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete daily recap', e);
    return [];
  }
}
