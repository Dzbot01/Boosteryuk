import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Reveal from '../components/Reveal';
import BuatPesananCard from '../components/BuatPesananCard';
import { SERVICE_SLIDES } from '../constants';

const SLIDE_INTERVAL = 4500;

export default function LayananPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SERVICE_SLIDES.length);
  }, []);

  // Auto-advance the slider, pausing while the pointer is over it.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!paused.current) next();
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [next]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6">
      <Reveal>
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
          Kembali
        </button>
      </Reveal>

      {/* Desktop (lg+): dua kolom — form Buat Pesanan rata kiri (lebar tetap), slider di kanan
          dengan ukuran lebih kecil & sticky. Mobile: slider di atas, form di bawah (seperti semula). */}
      <div className="lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* ================= SLIDER ================= */}
        <div className="lg:sticky lg:top-24 lg:order-2">
      <Reveal delay={40}>
        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] lg:!aspect-[16/10] border border-slate-200 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)] dark:border-slate-700/60 sm:aspect-[21/9]"
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
        >
          {/* horizontal track containing all slides side by side */}
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{
              width: `${SERVICE_SLIDES.length * 100}%`,
              transform: `translateX(-${index * (100 / SERVICE_SLIDES.length)}%)`,
            }}
          >
            {SERVICE_SLIDES.map((slide) => (
              <div
                key={slide.url}
                className="h-full"
                style={{ width: `${100 / SERVICE_SLIDES.length}%` }}
              >
                <img
                  src={slide.url}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  loading={slide.url === SERVICE_SLIDES[0].url ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>

          {/* dots */}
          <div className="absolute bottom-4 right-5 flex items-center gap-1.5 sm:bottom-6 sm:right-8">
            {SERVICE_SLIDES.map((s, i) => (
              <button
                key={s.url}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80' /* titik slider tetap putih di atas foto, juga di tema dark */
                }`}
              />
            ))}
          </div>
        </div>
      </Reveal>

        </div>

        {/* ================= BUAT PESANAN CARD ================= */}
        {/* order diletakkan di Reveal (anak langsung grid) agar kolom kiri benar-benar form */}
        <Reveal delay={120} className="mt-8 lg:order-1 lg:mt-0">
          <BuatPesananCard />
        </Reveal>
      </div>
    </div>
  );
}
