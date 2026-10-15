# 🔮 Memora (ใจจำ: The Memory Orbs)

> **Cognitive Reminiscence & Emotional Connection Platform for Seniors and Families**  
> *Developed for Hackathon 2026*

Memora is an interactive cognitive reminiscence tablet application inspired by *Inside Out*'s glowing memory orbs. It empowers seniors with mild cognitive impairment or dementia to stimulate episodic memory through personal family photos, videos, and multi-sensory storytelling, while keeping family caregivers closely connected via automated daily updates.

---

## 🌟 Key Features

1. **Inside Out Living Orbs (ลูกแก้วแห่งความทรงจำ)**
   - 5 core emotion themes: Joy (สุขใจ), Nostalgia (อบอุ่น), Calm (สงบ), Proud (ภาคภูมิ), Love (รัก)
   - Dynamic fluid particle physics and glow aura reflecting elder's state of mind

2. **Multi-Sensory Cognitive Reminiscence (แบบทดสอบฟื้นฟูความจำ)**
   - Personalized photo/video memory stimulation
   - Thai speech narration powered by ElevenLabs Multilingual V2
   - Touchpad interaction with high-contrast accessibility

3. **Celebration & Session Review (การเฉลิมฉลองและประเมินผล)**
   - Daily milestone review with glowing 5-orb pedestal
   - Clinical telemetry tracking (Cognitive latency speed improvement, e.g. -18%)
   - Audio reflection recording playback

4. **Caregiver Console & Memory Vault (คลังความทรงจำ)**
   - Family member management (Multi-elder support, role assignment, active senior toggle)
   - Photo upload (up to 10MB) & Video upload (up to 50MB)
   - 1-click Orb generator linking uploaded family moments directly to reminiscence activities

5. **LINE Memory Capsule**
   - Push notification simulation to family LINE groups with genuine green branding (#06C755)

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Vite
* **Smart Storage**: Hybrid architecture (Express + Prisma + SQLite when run locally; zero-config LocalStorage + Data URL persistence on Vercel)
* **Voice Synthesis**: ElevenLabs Multilingual V2 (`eleven_multilingual_v2`) + Web Speech API fallback
* **Deployment**: Optimized for Vercel SPA with automated route rewrites

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install
npm --prefix server install

# 2. Seed database
npm run server:seed

# 3. Start Frontend & Backend
npm run server & npm run dev
```
