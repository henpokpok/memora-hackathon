import { DailyRecapMemory } from '../types';

const STORAGE_KEY = 'memora_daily_recaps';

export const recentGalleryPhotos = [
  {
    id: 'gallery-recent-1',
    url: '/images/memories/river-merit-fish.jpg',
    titleTh: 'ทำบุญปล่อยปลาริมน้ำรับอรุณ',
    titleEn: 'Morning River Merit',
    timeTh: '08:30 น.',
    timeEn: '08:30 AM',
  },
  {
    id: 'gallery-recent-2',
    url: '/images/memories/korean-bbq-siblings.jpg',
    titleTh: 'พี่น้องเอ็นจอยปิ้งย่างเกาหลี',
    titleEn: 'Korean BBQ with Siblings',
    timeTh: '14:15 น.',
    timeEn: '02:15 PM',
  },
  {
    id: 'gallery-recent-3',
    url: '/images/memories/flower-garden-selfie.jpg',
    titleTh: 'หลานๆ เซลฟี่ในสวนดอกไม้',
    titleEn: 'Floral Garden Selfie',
    timeTh: '16:40 น.',
    timeEn: '04:40 PM',
  },
];

export const presetGalleryPhotos = [
  {
    id: 'preset-1',
    url: '/images/memories/wheelchair-family-bridge.jpg',
    titleTh: 'ครอบครัวเคียงข้างข้ามสะพาน',
    titleEn: 'Family Crossing Bridge',
  },
  {
    id: 'preset-2',
    url: '/images/memories/airplane-cafe-family.jpg',
    titleTh: 'รวมพลังบนคาเฟ่เครื่องบิน 747',
    titleEn: '747 Airplane Cafe Gathering',
  },
  {
    id: 'preset-3',
    url: '/images/memories/hue-restaurant-family.jpg',
    titleTh: 'มื้ออร่อยร้านอาหารเวียดนาม',
    titleEn: 'Vietnamese Restaurant Feast',
  },
  {
    id: 'preset-4',
    url: '/images/memories/vietnam-temple-selfie.jpg',
    titleTh: 'หมู่คณะครอบครัวศาลาวัดโบราณ',
    titleEn: 'Temple Pavilion Gathering',
  },
  {
    id: 'preset-5',
    url: '/images/memories/dinosaur-park-trip.jpg',
    titleTh: 'ก๊วนคุณยายตะลุยสวนไดโนเสาร์',
    titleEn: 'Dinosaur Park Adventure',
  },
];

export const initialDailyRecaps: DailyRecapMemory[] = [
  {
    id: 'recap-seed-1',
    date: '2026-10-14',
    displayDateTh: 'เมื่อวานนี้, 14 ต.ค. 2569',
    displayDateEn: 'Yesterday, Oct 14, 2026',
    transcript: 'เมื่อวานช่วงบ่าย พากันไปทำบุญปล่อยปลาที่ริมแม่น้ำ ลมพัดเย็นสบายสดชื่น หลานๆ ช่วยกันถือร่มและปล่อยปลาลงน้ำ อิ่มอกอิ่มใจ ได้ยินเสียงหัวเราะอย่างมีความสุข',
    photos: [
      '/images/memories/river-merit-fish.jpg',
      '/images/memories/flower-garden-selfie.jpg',
    ],
    emotion: 'vitality',
    timestamp: Date.now() - 86400000,
    audioDurationSec: 42,
  },
  {
    id: 'recap-seed-2',
    date: '2026-10-13',
    displayDateTh: '13 ต.ค. 2569 (วันอาทิตย์)',
    displayDateEn: 'Oct 13, 2026 (Sunday)',
    transcript: 'หลานๆ พาคุณยายไปทานปิ้งย่างเกาหลีมื้อค่ำ พี่น้องกุมมือยิ้มแย้มแย่งกันคีบหมูย่างร้อนๆ ให้คุณยาย บรรยากาศอบอุ่นหัวใจและเต็มไปด้วยเสียงหัวเราะ',
    photos: [
      '/images/memories/korean-bbq-siblings.jpg',
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
    transcript: 'ทริปเที่ยวคาเฟ่เครื่องบินโบอิ้ง 747 นั่งจิบม็อกเทลสีฟ้าเย็นฉ่ำในเคบินสุดหรู ล้อมรอบด้วยลูกหลานทุกคนที่คอยดูแลคุณยายเป็นอย่างดี ยิ้มแก้มปริทั้งวันเลย',
    photos: [
      '/images/memories/airplane-cafe-family.jpg',
      '/images/memories/airplane-cafe-drinks.jpg',
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
    transcript: 'ทริปเวียดนามสุดประทับใจ นั่งกระเช้าลอยฟ้าทะลุสายหมอกขึ้นยอดเขาบานาฮิลล์ และแวะถ่ายรูปหน้าพระราชวังโบราณเมืองเว้ คุณยายกับหลานสาวโพสท่ากางแขนเต้นร่าเริง สนุกสนานมาก',
    photos: [
      '/images/memories/cable-car-banahills.jpg',
      '/images/memories/hue-citadel-dance.jpg',
    ],
    emotion: 'vitality',
    timestamp: Date.now() - 90 * 86400000,
    audioDurationSec: 45,
  },
  {
    id: 'recap-flashback-1y',
    date: '2025-10-16',
    displayDateTh: '16 ต.ค. 2568 (1 ปีที่แล้ว)',
    displayDateEn: 'Oct 16, 2025 (1 year ago)',
    transcript: 'ค่ำคืนงานราตรีกาล่ารวมญาติครั้งยิ่งใหญ่ 11 คน ครอบครัวเราทุกคนแต่งตัวในชุดราตรีและสูทหรูหรา คุณยายสวมชุดราตรีสีกรมท่าและมงกุฎเพชร เป็นวันที่อบอุ่นและภาคภูมิใจที่สุดในชีวิต',
    photos: [
      '/images/memories/family-gala-night.jpg',
      '/images/memories/studio-six-ladies.jpg',
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
      // Auto-migrate any old Unsplash URLs found in localStorage cache
      const hasLegacyUnsplash = parsed.some((item: DailyRecapMemory) =>
        item.photos && item.photos.some((p: string) => p.includes('unsplash.com'))
      );
      if (hasLegacyUnsplash) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDailyRecaps));
        return initialDailyRecaps;
      }

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
