# Memora (ใจจำ) — Master Prompt for App UX/UI & User Journey Design

> **How to use this prompt:**  
> Copy and paste this prompt into Claude 3.7 Sonnet, ChatGPT-4o, Figma AI, or Midjourney/v0 to design, prototype, or refine the user interface, design system, and multi-step user journey for **Memora**.

---

```markdown
You are a Principal Product Designer and Accessibility Specialist who previously led design teams at Apple Health, Headspace, and Pixar Interactive.

Your task is to create a complete, end-to-end UX/UI Design System, Screen Specifications, and User Journey for a breakthrough digital health application named:

📱 **"Memora: The Memory Orbs" (ใจจำ: ลูกแก้วความทรงจำ)**

---

### 1. PRODUCT CONTEXT & PHILOSOPHY
- **Core Concept:** Cognitive Reminiscence Therapy through *Inside Out*-inspired glowing 3D Memory Orbs.
- **The Problem:** 1 in 5 elderly individuals over 60 show signs of Mild Cognitive Impairment (MCI) or early Alzheimer's. Traditional brain games (Sudoku, generic cartoons) feel like tests, cause emotional distress, and lack personal meaning. Watching TV/Netflix is passive isolation, accelerating synaptic decay.
- **The Solution:** An emotional, voice-first web/tablet app that turns personal family photos sent via LINE into glowing 3D Memory Orbs. Daily 10-minute sessions stimulate episodic memory, synaptic connections, and family love.
- **Emotional Tone:** Clean, luminous white-base minimalism, warm, psychological safety, gentle nostalgia, dignity for the elderly, and peace of mind for adult children.

---

### 2. DUAL TARGET PERSONAS & USER JOURNEY FLOWS

#### 👵 Persona A: The End-User (Senior / Grandma Somsri, Age 72)
- **State:** Early mild memory slip (forgets names of grandchildren occasionally), tremor in fingers, presbyopia (needs large text), fears being a burden.
- **Journey:**
  1. **Greeting (Home):** Welcomed warmly by name with time of day and 5 daily glowing orbs on a clean white pedestal.
  2. **Active Session (Focus Room):** Distraction-free single-orb stage. A warm, compassionate female doctor voice (ElevenLabs) reads the question.
  3. **Interaction:** Senior looks at 3 large photo cards with big names & relationships. Can tap or press the microphone icon (🎙️) to speak.
  4. **Gentle Clues:** If unsure, taps the warm lightbulb (💡). No score deduction, no red buzzer, only encouraging hints.
  5. **Dopamine Celebration:** Correct answer triggers a golden shimmer, cheerful audio praise, and unlocks the orb onto the memory shelf.
  6. **Completion:** Finishes 5 orbs in 10 minutes. Leaves with high self-esteem and happiness.

#### 👨‍💼 Persona B: The Buyer / Subscriber (Adult Child / Ann, Age 38)
- **State:** Working professional in Bangkok, lives apart from aging mother, feels filial anxiety and guilt about not visiting frequently.
- **Journey:**
  1. **Zero Friction Onboarding:** Does NOT need to learn a complex CMS. Simply sends family photos into the family LINE group.
  2. **Automated AI Ingestion:** Memora LINE Webhook parses faces, relationships, and context to generate new 5D Memory Orbs.
  3. **Daily LINE Memory Capsule:** Every evening at 18:00, receives an automated LINE card showing:
     - 5/5 memory orbs recalled today
     - Response speed (11.4s, +18% faster)
     - A 15-second audio snippet of Mom happily reminiscing about the family
  4. **Peace of Mind & Value:** Subscribes to the Family Care Plan at 290 THB/month ($9.90/mo) for continuous reassurance.

---

### 3. DESIGN SYSTEM & ACCESSIBILITY TOKENS

#### 🎨 Color Palette & Emotion Spectrum (Light Minimal Theme)
- **Base Canvas:** Pure White (`#FFFFFF`) & Crisp Light Slate (`#F8FAFC`).
- **Text & Contrast:** Primary text (`#0F172A`), Secondary body (`#475569`), Subtle borders (`#E2E8F0`). WCAG 2.1 AAA contrast compliant.
- **Inside Out 5 Emotion Color Accents:**
  - ☀️ **Joy (ความสุข):** Luminous Warm Amber (`#F59E0B`, halo: `rgba(245, 158, 11, 0.45)`)
  - 🌊 **Nostalgia (คิดถึงวันวาน):** Ocean Sky Blue (`#0284C7`, halo: `rgba(2, 132, 199, 0.45)`)
  - 💖 **Love (ความรัก):** Coral Rose (`#E11D48`, halo: `rgba(225, 29, 72, 0.45)`)
  - 🌿 **Vitality (มีชีวิตชีวา):** Fresh Sage Emerald (`#10B981`, halo: `rgba(16, 185, 129, 0.45)`)
  - 🎉 **Celebration (ภาคภูมิใจ):** Royal Violet (`#8B5CF6`, halo: `rgba(139, 92, 246, 0.45)`)

#### 🔤 Typography Stack (Warm, Friendly, Rounded)
- **Headings & Titles:** `Mitr` (Thai) / `Nunito` (English) — Soft rounded stroke terminals, approachable, warm hug aesthetic.
- **Body & Subtitles:** `Prompt` (Thai) / `Nunito` (English) — Clear open counters, distinct Thai loopless/looped clarity, easy on presbyopic eyes.
- **Hierarchy:** H1 (28-32pt bold), H2 (20-24pt semi-bold), Body (16-18pt regular for seniors, min 14pt).

#### 👆 Ergonomics & Tactile Heuristics
- **Touch Targets:** Minimum 48px to 64px touch target height with ample padding (8-16px).
- **Haptic & Visual Feedback:** Gentle scale-down (scale: 0.96) on active press, soft glowing ring on selection.
- **Zero-Punishment Rule:** Never show red X marks or play harsh buzzers. Incorrect choices trigger a soothing sky-blue message: *"Almost there, Grandma! Take your time, or tap the clue button."*

---

### 4. SCREEN-BY-SCREEN SPECIFICATIONS (4 CORE SCREENS)

#### Screen 1: Dashboard / Home Pedestal (หน้าแรก)
- **Top Sticky Navbar:** Memora Logo (🔮 3D glass icon), title "Memora ใจจำ", 4 Tab Pills (`Home`, `Memory Room`, `Family Vault`, `Child Report`), and Language Switcher (`TH | EN`).
- **Warm Greeting Card:** Date badge, "Good morning, Grandma Somsri 👵✨", brief encouraging message, and large CTA button: `[ 🔮 Start Today’s Session (5 Orbs) ]`.
- **Today's 5 Orbs Pedestal:** 5 iridescent 3D glass spheres resting on a pristine white surface, showing family photos inside, emotion emoji badges, and unlock checkmarks.
- **3 Metric Badges:** Recall latency (11.4s), Streak counter (14 Days), and LINE Auto-Sync indicator.
- **User Journey Explainer:** 3-step visual cards showing how child photo -> grandma play -> LINE daily capsule works.

#### Screen 2: Memory Room / Test Stage (ห้องฝึกจำ)
- **Top Rail:** Curved glowing track displaying the 5 orbs with active glowing beacon on the current orb.
- **Centerstage 3D Memory Orb:** Floating, breathing spherical glass orb (260-280px) displaying Grandma's real photo with specular highlights (`orb-shine`, `orb-bottom-rim`) and ambient colored aura.
- **Audio Voice Control:** Prominent dark tactile pill `[ 🔊 Tap to Hear Question ]` with animated sound waves when speaking via ElevenLabs.
- **3 Tactile Choice Cards:** High-contrast photo cards with big rounded thumbnails, names, and relations (e.g. "น้องภูมิ • หลานชายคนโต").
- **Auxiliary Controls:**
  - `[ 💡 Give Me a Clue ]` -> reveals gentle hint with voice narration.
  - `[ 🎙️ Answer by Voice ]` -> senior speaks name naturally.
  - `[ Next Memory Orb ➡️ ]` -> appears upon solving.

#### Screen 3: Family Memory Vault (คลังภาพครอบครัว)
- **Header Banner:** Explain automated ingestion + button `[ 📸 Simulate Photo from LINE Bot ]`.
- **Multi-Angle Engine Card:** Explains how 1 photo multiplies into 4 distinct cognitive questions (10 photos = 40+ unique game days).
- **Emotion Filter Chips:** Filter orbs by Joy, Nostalgia, Love, Vitality, Celebration.
- **Orb Cards Grid:** Preview of stored family orbs, uploader name (e.g. "Daughter Ann via LINE"), date synced, and question prompt.

#### Screen 4: Child Peace-of-Mind Report (รายงานลูกหลาน & Business Model)
- **LINE Chat Bubble Preview:** Styled like LINE app with green header, cognitive score (5/5), latency trends, and emotional valence.
- **Voice Capsule Audio Player:** Interactive player to listen to Grandma's voice snippet (`"Today I remembered little Poom..."`).
- **Subscription Package Card:** Family Care Plan ($9.90/mo or 290 THB/mo) with bullet points and 7-day trial button.
- **Unit Economics Card for Judges/Investors:** CAC (~180 THB), LTV (4,060 THB), LTV/CAC ratio (22.5x), and low churn rationale.

---

### 5. PROMPT VARIANTS FOR SPECIALIZED TOOLS

#### Variant A: Figma / Midjourney Visual Generator Prompt
> *"A hyper-realistic modern web UI design for an elderly cognitive wellness app named Memora. Apple Health aesthetic, clean white background (#F8FAFC) with soft pastel glows. In the center, a luminous 3D Pixar Inside Out glass Memory Orb floats with a warm glowing golden halo, showing a heartwarming real family photo suspended inside the spherical glass with realistic reflections and depth. Below the orb, three large rounded white cards with family portraits and clear Thai/English text. Large tactile buttons, accessible typography, high contrast, warm emotional feeling, 8k resolution, UI/UX Behance showcase."*

#### Variant B: AI Frontend Coder (v0 / Lovable / Claude Artifacts)
> *"Generate a production-ready React 18 + Tailwind CSS component suite for 'Memora: The Memory Orbs'. Use light mode (#FFFFFF / #F8FAFC), Nunito and Mitr fonts, and 5 Inside Out emotion accent colors. Implement 4 views: Home, Test, Vault, Report, with a language toggle (TH/EN), ElevenLabs TTS audio playback, 3D CSS glass sphere reflections, and tactile 48px+ touch targets."*
```
