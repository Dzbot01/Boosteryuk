import { useEffect, useRef } from 'react';

const SRC = '/musik.mp3';

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.45;
    audioRef.current = audio;

    const start = () => {
      if (started.current) return;
      started.current = true;
      audio.play().catch(() => {
        started.current = false;
      });
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('touchstart', start);
    };

    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    window.addEventListener('touchstart', start, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
      window.removeEventListener('touchstart', start);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  return null;
}
