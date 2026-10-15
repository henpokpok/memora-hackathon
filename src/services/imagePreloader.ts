import { MemoryOrb, DailyRecapMemory } from '../types';

// In-memory cache of successfully preloaded & decoded image URLs
const preloadedUrls = new Set<string>();

/**
 * Preload an array of image URLs in the background using native Image and decode() API
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const uniqueUrls = urls.filter((url) => url && !preloadedUrls.has(url));

  const promises = uniqueUrls.map((url) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;

      if (img.complete && img.naturalWidth > 0) {
        preloadedUrls.add(url);
        resolve();
        return;
      }

      img.onload = () => {
        // Use decode() if available for smooth zero-jank frame rendering
        if ('decode' in img) {
          img
            .decode()
            .catch(() => {
              // Ignore decode errors on non-critical images
            })
            .finally(() => {
              preloadedUrls.add(url);
              resolve();
            });
        } else {
          preloadedUrls.add(url);
          resolve();
        }
      };

      img.onerror = () => {
        // Resolve anyway to avoid blocking other preloads
        resolve();
      };
    });
  });

  return Promise.all(promises);
}

/**
 * Checks if an image URL has already been preloaded into browser memory
 */
export function isImagePreloaded(url: string): boolean {
  if (!url) return false;
  return preloadedUrls.has(url);
}

/**
 * Preload all core application media: memory orbs, cognitive options, and daily recaps
 */
export function preloadAppMedia(
  orbs: MemoryOrb[],
  recaps?: DailyRecapMemory[]
): void {
  const urls: string[] = [];

  // 1. Gather all orb photos & option photos
  orbs.forEach((orb) => {
    if (orb.photoUrl) urls.push(orb.photoUrl);
    if (orb.options) {
      orb.options.forEach((opt) => {
        if (opt.photoUrl) urls.push(opt.photoUrl);
      });
    }
  });

  // 2. Gather daily recap photos
  if (recaps) {
    recaps.forEach((recap) => {
      if (recap.photos) {
        recap.photos.forEach((p) => urls.push(p));
      }
    });
  }

  // Execute async background preload with low idle priority
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preloadImages(urls);
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      preloadImages(urls);
    }, 100);
  }
}
