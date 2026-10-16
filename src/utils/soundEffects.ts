// Web Audio API Sound Synthesizer: Warm, gentle acoustic tones for seniors (No arcade/game sounds)

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Warm, peaceful acoustic bell chime (Mindful, gentle, comforting)
   * Strummed soft harmonic chord with lingering natural acoustic decay
   */
  playSuccessChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Gentle warm pentatonic harmony: D4 (293.66Hz), A4 (440Hz), F#5 (739.99Hz)
      const tones = [
        { freq: 293.66, delay: 0.0, gainVal: 0.09 },
        { freq: 440.0, delay: 0.08, gainVal: 0.08 },
        { freq: 739.99, delay: 0.16, gainVal: 0.07 },
      ];

      tones.forEach(({ freq, delay, gainVal }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        // Warm acoustic lowpass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now + delay);
        filter.Q.setValueAtTime(0.8, now + delay);

        // Smooth, soft attack + gentle lingering acoustic decay
        const startTime = now + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0005, startTime + 1.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.45);
      });
    } catch {
      // Audio context might be restricted, ignore silently
    }
  }

  /**
   * Tactile soft felt / wooden touch (No arcade pop or electronic chirp)
   */
  playTap(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  /**
   * Gentle, comforting reassurance note (Soft warm major chord, non-judgmental)
   */
  playGentleRetry(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Soft calming two-note harmony: F4 (349.23Hz) + A4 (440Hz)
      const freqs = [349.23, 440.0];

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Heartwarming acoustic music box / wind chime celebration
   * Uplifting, serene arpeggio with warm ringing resonance
   */
  playCelebration(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Gentle music box pentatonic progression: C4, G4, C5, E5, G5
      const notes = [
        { freq: 261.63, delay: 0.0, gainVal: 0.07 },
        { freq: 392.0, delay: 0.14, gainVal: 0.065 },
        { freq: 523.25, delay: 0.28, gainVal: 0.06 },
        { freq: 659.25, delay: 0.42, gainVal: 0.055 },
        { freq: 783.99, delay: 0.56, gainVal: 0.05 },
      ];

      notes.forEach(({ freq, delay, gainVal }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now + delay);

        const startTime = now + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0005, startTime + 1.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.65);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundManager();
