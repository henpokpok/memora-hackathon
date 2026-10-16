import { FamilyGroup, FamilyMember, MemoryOrb } from '../types';
import { initialFamilyGroup } from '../data/familyData';
import { initialMemoryOrbs } from '../data/memoryOrbs';

const API_BASE_URL = '/api';

// Helper to get auth token
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('memora_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Robust JSON fetch that gracefully detects when static host (e.g. Vercel) returns index.html for /api routes
async function safeJsonFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error(`Server returned ${res.status} (${contentType}), using local fallback`);
  }
  return await res.json();
}

// Helper to convert File to Data URL for Vercel/Client-Side Media Storage
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ----------------------------------------------------
// LocalStorage Persistence Helpers for Vercel / Offline
// ----------------------------------------------------
function getLocalFamily(): FamilyGroup {
  try {
    const saved = localStorage.getItem('memora_family');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return initialFamilyGroup;
}

function saveLocalFamily(family: FamilyGroup) {
  try {
    localStorage.setItem('memora_family', JSON.stringify(family));
  } catch (e) {
    // ignore
  }
}

function getLocalOrbs(): MemoryOrb[] {
  try {
    const saved = localStorage.getItem('memora_orbs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-migrate legacy orbs: upgrade initial seed orbs (orb-1 to orb-15) with authentic family photos & voice prompts
        const hasLegacy = parsed.some(
          (o: any) => !o.photoUrl || o.photoUrl.includes('unsplash.com')
        );
        if (hasLegacy) {
          const seedMap = new Map(initialMemoryOrbs.map((o) => [o.id, o]));
          const updated = parsed.map((o: MemoryOrb) => seedMap.get(o.id) || o);
          const updatedIds = new Set(updated.map((o: any) => o.id));
          for (const seed of initialMemoryOrbs) {
            if (!updatedIds.has(seed.id)) {
              updated.push(seed);
            }
          }
          saveLocalOrbs(updated);
          return updated;
        }

        const existingIds = new Set(parsed.map((o: any) => o.id));
        const missing = initialMemoryOrbs.filter((o) => !existingIds.has(o.id));
        const merged = [...parsed, ...missing];
        if (missing.length > 0) saveLocalOrbs(merged);
        return merged;
      }
    }
  } catch (e) {
    // ignore
  }
  return initialMemoryOrbs;
}

function saveLocalOrbs(orbs: MemoryOrb[]) {
  try {
    localStorage.setItem('memora_orbs', JSON.stringify(orbs));
  } catch (e) {
    // ignore
  }
}

function getLocalMedia(): any[] {
  try {
    const saved = localStorage.getItem('memora_media');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return [];
}

function saveLocalMedia(media: any[]) {
  try {
    localStorage.setItem('memora_media', JSON.stringify(media));
  } catch (e) {
    // ignore
  }
}

// ----------------------------------------------------
// Auth API
// ----------------------------------------------------
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: 'elder' | 'relative';
  familyCode?: string;
  familyName?: string;
  relationTitle?: string;
}

export const authApi = {
  async login(payload: LoginPayload) {
    try {
      const data = await safeJsonFetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (data.token) {
        localStorage.setItem('memora_auth_token', data.token);
      }
      return data;
    } catch (err) {
      console.warn('Backend login unavailable, simulating login locally:', err);
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('memora_auth_token', mockToken);
      return {
        message: 'Login successful',
        token: mockToken,
        user: {
          id: 'user-demo',
          email: payload.email,
          name: 'แอน วัฒนศิริ',
          role: 'relative',
        },
      };
    }
  },

  async register(payload: RegisterPayload) {
    try {
      const data = await safeJsonFetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (data.token) {
        localStorage.setItem('memora_auth_token', data.token);
      }
      return data;
    } catch (err) {
      console.warn('Backend register unavailable, creating local profile:', err);
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('memora_auth_token', mockToken);
      return {
        message: 'Registration successful',
        token: mockToken,
        user: {
          id: `user-${Date.now()}`,
          email: payload.email,
          name: payload.name,
          role: payload.role || 'relative',
        },
      };
    }
  },

  async getMe() {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeader(),
      });
    } catch (err) {
      // offline
    }
    return {
      user: {
        id: 'user-ann',
        name: 'แอน วัฒนศิริ',
        email: 'ann@memora.app',
        role: 'relative',
        familyId: 'fam-1',
      },
    };
  },

  async updateProfile(data: { name?: string; avatarUrl?: string }) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('Backend update profile failed:', err);
    }
    return { message: 'Profile updated locally', user: data };
  },

  logout() {
    localStorage.removeItem('memora_auth_token');
  },
};

// ----------------------------------------------------
// Family API
// ----------------------------------------------------
export const familyApi = {
  async getCurrentFamily(): Promise<FamilyGroup> {
    try {
      const data = await safeJsonFetch(`${API_BASE_URL}/family/current`, {
        headers: getAuthHeader(),
      });
      if (data.family && data.family.members?.length > 0) {
        const formatted: FamilyGroup = {
          familyCode: data.family.familyCode,
          familyName: data.family.familyName,
          members: data.family.members.map((m: any) => ({
            id: m.id,
            name: m.name,
            role: m.role as 'elder' | 'relative',
            relationTitle: m.relationTitle,
            avatarIcon: m.avatarIcon,
            avatarColor: m.avatarColor,
            isCurrentActive: m.isCurrentActive,
          })),
        };
        saveLocalFamily(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Backend family fetch failed, using smart local storage:', err);
    }
    return getLocalFamily();
  },

  async joinFamily(familyCode: string) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/family/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ familyCode }),
      });
    } catch (e) {
      // offline
    }
    return { message: 'Successfully joined family' };
  },

  async addMember(member: {
    name: string;
    role: 'elder' | 'relative';
    relationTitle: string;
    avatarIcon?: string;
    avatarColor?: string;
  }) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/family/member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(member),
      });
    } catch (err) {
      console.warn('Backend add member failed, saving locally:', err);
    }
    // Update local storage
    const current = getLocalFamily();
    const newMember: FamilyMember = {
      id: `member-${Date.now()}`,
      name: member.name,
      role: member.role,
      relationTitle: member.relationTitle,
      avatarIcon: member.avatarIcon || 'heart',
      avatarColor: member.avatarColor || 'bg-rose-500 text-white',
      isCurrentActive: false,
    };
    current.members.push(newMember);
    saveLocalFamily(current);
    return { member: newMember };
  },

  async updateMember(memberId: string, data: Partial<FamilyMember>) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/family/member/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('Backend update member failed, updating locally:', err);
    }
    const current = getLocalFamily();
    current.members = current.members.map((m) =>
      m.id === memberId ? { ...m, ...data } : m
    );
    saveLocalFamily(current);
    return { message: 'Updated locally' };
  },

  async deleteMember(memberId: string) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/family/member/${memberId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
    } catch (err) {
      console.warn('Backend delete member failed, deleting locally:', err);
    }
    const current = getLocalFamily();
    current.members = current.members.filter((m) => m.id !== memberId);
    saveLocalFamily(current);
    return { message: 'Deleted locally' };
  },

  async setActiveSenior(memberId: string) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/family/member/${memberId}/active`, {
        method: 'PATCH',
        headers: getAuthHeader(),
      });
    } catch (err) {
      console.warn('Backend setActiveSenior failed, updating locally:', err);
    }
    const current = getLocalFamily();
    current.members = current.members.map((m) =>
      m.role === 'elder' ? { ...m, isCurrentActive: m.id === memberId } : m
    );
    saveLocalFamily(current);
    return { message: 'Active senior set locally' };
  },
};

// ----------------------------------------------------
// Media API (Photos & Videos with Vercel/Client-Side Fallback)
// ----------------------------------------------------
export const mediaApi = {
  async uploadPhoto(file: File) {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      return await safeJsonFetch(`${API_BASE_URL}/media/upload-photo`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
    } catch (err) {
      console.warn('Backend photo upload unavailable, using client-side media storage for Vercel:', err);
    }

    // Client-side fallback for Vercel
    const dataUrl = await fileToDataUrl(file);
    const localMedia = {
      id: `media-${Date.now()}`,
      familyId: 'local-family',
      mediaType: 'image',
      originalFilename: file.name,
      fileUrl: dataUrl,
      fileSize: file.size,
      mimeType: file.type || 'image/jpeg',
      createdAt: new Date().toISOString(),
    };

    const mediaList = getLocalMedia();
    mediaList.unshift(localMedia);
    saveLocalMedia(mediaList);

    return {
      message: 'Photo uploaded successfully (Vercel Client Storage)',
      media: localMedia,
      url: dataUrl,
    };
  },

  async uploadVideo(file: File) {
    try {
      const formData = new FormData();
      formData.append('video', file);

      return await safeJsonFetch(`${API_BASE_URL}/media/upload-video`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
    } catch (err) {
      console.warn('Backend video upload unavailable, using client-side media storage for Vercel:', err);
    }

    // Client-side fallback for Vercel
    const objectUrl = URL.createObjectURL(file);
    const localMedia = {
      id: `media-${Date.now()}`,
      familyId: 'local-family',
      mediaType: 'video',
      originalFilename: file.name,
      fileUrl: objectUrl,
      fileSize: file.size,
      mimeType: file.type || 'video/mp4',
      createdAt: new Date().toISOString(),
    };

    const mediaList = getLocalMedia();
    mediaList.unshift(localMedia);
    saveLocalMedia(mediaList);

    return {
      message: 'Video uploaded successfully (Vercel Client Storage)',
      media: localMedia,
      url: objectUrl,
    };
  },

  async listMedia(type?: 'image' | 'video') {
    try {
      const query = type ? `?type=${type}` : '';
      const data = await safeJsonFetch(`${API_BASE_URL}/media/list${query}`, {
        headers: getAuthHeader(),
      });
      if (data.media && data.media.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Backend media list failed, using local media:', err);
    }

    let localMedia = getLocalMedia();
    if (type) {
      localMedia = localMedia.filter((m) => m.mediaType === type);
    }
    return { media: localMedia };
  },

  async deleteMedia(id: string) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/media/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
    } catch (err) {
      console.warn('Backend delete media failed, deleting locally:', err);
    }
    const mediaList = getLocalMedia().filter((m) => m.id !== id);
    saveLocalMedia(mediaList);
    return { message: 'Deleted locally' };
  },
};

// ----------------------------------------------------
// Memory Orbs API
// ----------------------------------------------------
export const orbsApi = {
  async getOrbs(params?: { elderId?: string; emotion?: string }): Promise<MemoryOrb[]> {
    try {
      const search = new URLSearchParams();
      if (params?.elderId) search.set('elderId', params.elderId);
      if (params?.emotion) search.set('emotion', params.emotion);

      const data = await safeJsonFetch(`${API_BASE_URL}/orbs?${search.toString()}`, {
        headers: getAuthHeader(),
      });

      if (Array.isArray(data.orbs) && data.orbs.length > 0) {
        // Merge with initialMemoryOrbs to ensure all rich family orbs are preserved without truncation
        const existingTitles = new Set(data.orbs.map((o: any) => o.title));
        const missing = initialMemoryOrbs.filter((o) => !existingTitles.has(o.title));
        const combined = [...data.orbs, ...missing];
        saveLocalOrbs(combined);
        return combined;
      }
    } catch (err) {
      console.warn('Backend orbs fetch failed, using smart local storage:', err);
    }
    return getLocalOrbs();
  },

  async createOrb(orb: Partial<MemoryOrb>) {
    try {
      const data = await safeJsonFetch(`${API_BASE_URL}/orbs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(orb),
      });
      if (data && data.orb) return data.orb;
    } catch (err) {
      console.warn('Backend create orb failed, saving locally:', err);
    }
    const current = getLocalOrbs();
    const newOrb = orb as MemoryOrb;
    current.unshift(newOrb);
    saveLocalOrbs(current);
    return newOrb;
  },

  async unlockOrb(orbId: string) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/orbs/${orbId}/unlock`, {
        method: 'PATCH',
        headers: getAuthHeader(),
      });
    } catch (err) {
      console.warn('Backend unlock orb failed, updating locally:', err);
    }
    const current = getLocalOrbs();
    const updated = current.map((o) => (o.id === orbId ? { ...o, isUnlocked: true } : o));
    saveLocalOrbs(updated);
    return { message: 'Unlocked locally' };
  },
};

// ----------------------------------------------------
// Sessions & Reports API
// ----------------------------------------------------
export const sessionApi = {
  async logSession(params: {
    completedOrbs: number;
    totalOrbs?: number;
    averageSpeedSec?: number;
    overallMood?: string;
    rawMetrics?: any;
  }) {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/sessions/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.warn('Backend log session failed, saving locally:', err);
    }
    try {
      const sessions = JSON.parse(localStorage.getItem('memora_sessions') || '[]');
      sessions.unshift({
        ...params,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('memora_sessions', JSON.stringify(sessions));
    } catch (e) {
      // ignore
    }
    return { message: 'Logged locally' };
  },

  async getLatestStats() {
    try {
      return await safeJsonFetch(`${API_BASE_URL}/sessions/latest`, {
        headers: getAuthHeader(),
      });
    } catch (err) {
      // offline
    }
    return {
      stats: {
        completedToday: 5,
        totalOrbs: 5,
        streakDays: 14,
        averageSpeedSec: 11.4,
        overallMood: 'ความสุขเบ่งบาน',
        elderName: 'คุณยายสมศรี',
      },
    };
  },
};
