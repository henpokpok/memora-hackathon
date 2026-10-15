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
  {
    id: 'recap-flashback-1m',
    date: '2026-09-16',
    displayDateTh: '16 ก.ย. 2569 (1 เดือนที่แล้ว)',
    displayDateEn: 'Sep 16, 2026 (1 month ago)',
    transcript: 'ทริปไปทำบุญไหว้พระอยุธยา ลมพัดเย็นสบายที่ริมแม่น้ำ แวะกินกุ้งเผาตัวโตกับน้ำจิ้มซีฟู้ดรสเด็ด น้องภูมิกับลูกสาวตักอาหารให้ไม่หยุด ยิ้มแก้มปริทั้งวันเลย',
    photos: [
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    ],
    emotion: 'joy',
    timestamp: Date.now() - 30 * 86400000,
    audioDurationSec: 38,
  },
  {
    id: 'recap-flashback-3m',
    date: '2026-07-16',
    displayDateTh: '16 ก.ค. 2569 (3 เดือนที่แล้ว)',
    displayDateEn: 'Jul 16, 2026 (3 months ago)',
    transcript: 'วันเกิดน้องพิม หลานสาวคนสวย ครอบครัวเรามาฉลองกันพร้อมหน้า คุณยายช่วยจัดดอกบัวถวายพระตอนเช้า พอตกเย็นเป่าเค้กวานิลลา หลานเข้ามากอดหอมแก้มชื่นใจที่สุด',
    photos: [
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=600&q=80',
    ],
    emotion: 'love',
    timestamp: Date.now() - 90 * 86400000,
    audioDurationSec: 45,
  },
  {
    id: 'recap-flashback-1y',
    date: '2025-10-16',
    displayDateTh: '16 ต.ค. 2568 (1 ปีที่แล้ว)',
    displayDateEn: 'Oct 16, 2025 (1 year ago)',
    transcript: 'วันแห่งความภาคภูมิใจที่สุดในชีวิต ลูกสาวคนโตเข้ารับพระราชทานปริญญาบัตร คุณยายตัดชุดผ้าไหมสีฟ้าอ่อนไปร่วมแสดงความยินดี น้ำตาแห่งความสุขไหลซึ้งจนบอกไม่ถูก',
    photos: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?auto=format&fit=crop&w=600&q=80',
    ],
    emotion: 'celebration',
    timestamp: Date.now() - 365 * 86400000,
    audioDurationSec: 52,
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
      // Ensure seed flashback memories are present if missing
      const existingIds = new Set(parsed.map((item: DailyRecapMemory) => item.id));
      let hasMissing = false;
      const combined = [...parsed];
      for (const seed of initialDailyRecaps) {
        if (!existingIds.has(seed.id)) {
          combined.push(seed);
          hasMissing = true;
        }
      }
      if (hasMissing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
        return combined;
      }
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
