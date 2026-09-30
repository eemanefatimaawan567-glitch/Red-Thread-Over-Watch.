import { useEffect } from 'react';

// A restrained spy-thriller score made entirely with Web Audio. It layers a
// low drone, filtered tactical pulse, distant radio noise and a slow motif.
const ROOTS = [55, 49, 43.65, 49];

export function useAmbientMusic(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let context: AudioContext | null = null;
    let timer: number | null = null;
    let step = 0;
    let master: GainNode | null = null;

    const tone = (frequency: number, start: number, length: number, volume: number, type: OscillatorType, cutoff = 900) => {
      if (!context || !master) return;
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.35, length * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      oscillator.connect(filter).connect(gain).connect(master);
      oscillator.start(start);
      oscillator.stop(start + length + 0.05);
    };

    const noiseSweep = (start: number) => {
      if (!context || !master) return;
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 1.8), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520, start);
      filter.frequency.exponentialRampToValueAtTime(110, start + 1.8);
      filter.Q.value = 1.4;
      gain.gain.setValueAtTime(0.008, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.8);
      source.connect(filter).connect(gain).connect(master);
      source.start(start);
    };

    const playBar = () => {
      if (!context) return;
      const now = context.currentTime + 0.03;
      const root = ROOTS[step % ROOTS.length];
      tone(root, now, 4.8, 0.11, 'sawtooth', 145);
      tone(root * 2, now, 4.5, 0.045, 'triangle', 420);
      [0, 0.75, 1.5, 2.25, 3, 3.5].forEach((offset, index) => {
        tone(index === 4 ? root * 3 : root * 2, now + offset, 0.32, index === 4 ? 0.045 : 0.026, 'square', 250);
      });
      tone(root * (step % 2 ? 2.4 : 2.25), now + 1.65, 1.7, 0.025, 'sine', 760);
      if (step % 2 === 1) noiseSweep(now + 2.7);
      step += 1;
    };

    const start = () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.24;
      master.connect(context.destination);
      void context.resume();
      playBar();
      timer = window.setInterval(playBar, 4000);
    };

    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      if (timer !== null) window.clearInterval(timer);
      if (context) void context.close();
    };
  }, [enabled]);
}
