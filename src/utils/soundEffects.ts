// Zero-dependency Web Audio API Sound Synthesizer for Duolingo-style playful interactions

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
   * Cheerful Duolingo-style correct answer chime (Major Triad arpeggio: C5 -> E5 -> G5 -> C6)
   */
  playSuccessChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const noteDuration = 0.09;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

        // Soft envelope
        gain.gain.setValueAtTime(0, now + idx * noteDuration);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * noteDuration + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteDuration + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * noteDuration);
        osc.stop(now + idx * noteDuration + 0.3);
      });
    } catch {
      // Audio context might be restricted, ignore silently
    }
  }

  /**
   * Tactile soft pop / tap sound for card selection
   */
  playTap(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Gentle retry wobble tone (not harsh, friendly encouraging tone)
   */
  playGentleRetry(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /**
   * Fanfare / Milestone celebration chord
   */
  playCelebration(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Strummed cheerful chord
      const chords = [
        [523.25, 659.25, 783.99],       // C
        [587.33, 739.99, 880.00],       // D
        [659.25, 830.61, 987.77],       // E
        [1046.50, 1318.51, 1567.98],    // C high
      ];

      chords.forEach((chord, chordIdx) => {
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + chordIdx * 0.12);

          const startTime = now + chordIdx * 0.12;
          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.5);
        });
      });
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundManager();
