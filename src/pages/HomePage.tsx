import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  Rocket,
  Gauge,
  TrendingUp,
  UserRound,
  Shield,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import Reveal from '../components/Reveal';
import AuthModal from '../components/AuthModal';

import {
  LOGO_URL,
  SECONDARY_SOCIAL_BRANDS,
  SOCIAL_BRANDS,
  socialIconUrl,
} from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import Lightfall from '../components/Lightfall';
import ReviewsSection from '../components/ReviewsSection';


const HERO_COLORS = ['#A6C8FF', '#5227FF', '#FF9FFC'];

export default function HomePage() {
  const { isDark } = useTheme();
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const marquee = [...SOCIAL_BRANDS,...SOCIAL_BRANDS];
  const reverseMarquee = [...SECONDARY_SOCIAL_BRANDS,...SECONDARY_SOCIAL_BRANDS];

  return (
    <>
      {/* ================= HERO LAYER ================= */}
      <section className="relative isolate overflow-hidden">
        {/* Lightfall WebGL animation layer */}
        <div className="absolute inset-0 -z-10">
          <Lightfall
            colors={HERO_COLORS}
            backgroundColor="#0A29FF"
            speed={0.5}
            streakCount={2}
            streakWidth={1}
            streakLength={1}
            glow={1}
            density={0.6}
            twinkle={1}
            zoom={3}
            backgroundGlow={0.5}
            opacity={1}
            mouseInteraction
            mouseStrength={0.5}
            mouseRadius={1}
          />
          {/* fade into body */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-slate-950" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <h1 className="font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] text-white sm:text-[60px] lg:text-[68px]">
              <span className="text-cyan-300">Booster</span>
              <span className="text-white">yuk</span>
            </h1>

            <p className="mt-5 max-w-md font-display text-[19px] font-bold leading-snug tracking-tight text-white/90 sm:text-[22px]">
              Turbo Speed,
              <br />
              <span className="text-cyan-300">Fort Knox Security.</span>
            </p>

            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-blue-100/80">
              Platform booster media sosial terpercaya — followers, likes, views, dan engagement
              untuk semua platform favorit Anda.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {SOCIAL_BRANDS.slice(0, 5).map((b) => (
                    <span
                      key={b.slug}
                      title={b.name}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-white dark:bg-slate-800 dark:ring-slate-800"
                    >
                      <img
                        src={socialIconUrl(b.slug, b.color)}
                        alt={b.name}
                        className="h-4 w-4 object-contain"
                        loading="lazy"
                      />
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-blue-100/80">
                    4,9 · dipercaya seller SMM
                  </p>
                </div>
              </div>
              <div className="h-9 w-px bg-white/20" />
              <div>
                <p className="font-display text-2xl font-extrabold leading-none text-white">
                  698+
                </p>
                <p className="mt-1 text-[11.5px] font-semibold text-blue-100/80">
                  Layanan Tersedia
                </p>
              </div>
              <div className="h-9 w-px bg-white/20" />
              <div>
                <p className="font-display text-2xl font-extrabold leading-none text-white">
                  24/7
                </p>
                <p className="mt-1 text-[11.5px] font-semibold text-blue-100/80">
                  Suport Center
                </p>
              </div>
            </div>
            
            {/* CTA — cek status */}
            <div className="mt-7">
              <button
                onClick={() => navigate('/cek-status')}
                className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-[14px] font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                <Search className="h-4 w-4" strokeWidth={2.4} />
                Cek Status Pesanan
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={2.4}
                />
              </button>
            </div>

            {/* Auth buttons — compact, shown until a user signs in */}
            {!user && (
              <div className="mt-4 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthOpen(true);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cyan-600 px-4 text-[12px] font-bold text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-700 active:scale-95"
                >
                  <UserRound className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthOpen(true);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-700 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Shield className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Daftar
                </button>
              </div>
            )}
          </Reveal>

          <Reveal delay={140}>
            <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center lg:max-w-none">
              <div className="absolute h-3/4 w-3/4 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-800/20" />
              <span className="absolute h-[88%] w-[88%] rounded-full border border-slate-200 dark:border-slate-700/60" />
              <span className="absolute h-[64%] w-[64%] rounded-full border border-slate-200/70 dark:border-slate-700/40" />
              <span className="absolute h-[42%] w-[42%] rounded-full border-slate-200/50 dark:border-slate-700/30" />
              <img
                src={LOGO_URL}
                alt="Boosteryuk"
                className="relative h-2/5 w-2/5 max-h-[200px] min-h-[120px] animate-float-slow object-contain drop-shadow-[0_18px_30px_rgba(2,6,23,0.18)]"
              />

              <div className="animate-float absolute left-0 top-8 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/95 sm:left-2">
                <span className="relative flex h-2.5 w-2.5 items-center justify-center text-emerald-500">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 pulse-ring" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">Booster aktif</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Sinkron dari server
                  </p>
                </div>
              </div>

              <div
                className="animate-float absolute bottom-10 right-0 flex items-center gap-2.5 rounded-2xl border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/95 sm:right-2"
                style={{ animationDelay: '1.4s' }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <TrendingUp className="h-4 w-4" strokeWidth={2.3} />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">Engagement naik</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    Likes · Views · Followers
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </section>

  
        {/* ================= BODY LAYER ================= */}
      <main className="mx-auto max-w-6xl px-4 pb-32 sm:px-6">
        {/* ================= WHY ================= */}
        <ReviewsSection />

        {/* social marquees */}
        <Reveal>
          <section className="mt-14">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Platform booster yang didukung
            </p>
            <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="animate-marquee flex w-max items-center gap-12 px-6">
                {marquee.map((brand, i) => (
                  <img
                    key={`${brand.slug}-${i}`}
                    src={socialIconUrl(brand.slug, isDark ? 'ffffff' : brand.color)}
                    alt={brand.name}
                    title={brand.name}
                    className="h-9 w-9 shrink-0 object-contain opacity-60 transition-all duration-200 hover:scale-110 hover:opacity-100"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>

            {/* Reverse marquee */}
            <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="animate-marquee-reverse flex w-max items-center gap-14 px-7">
                {reverseMarquee.map((brand, i) => (
                  <img
                    key={`${brand.name}-${i}`}
                    src={isDark ? brand.darkUrl : brand.url}
                    alt={brand.name}
                    title={brand.name}
                    className={`h-10 w-10 shrink-0 object-contain opacity-65 transition-all duration-200 hover:scale-110 hover:opacity-100 ${brand.darkInvert ? 'dark:invert' : ''}`}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 pb-24 dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={settings.logoUrl} alt="" className="h-9 w-9 object-contain" />
            <p className="font-display text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              <span className="text-cyan-600 dark:text-cyan-400">{settings.brandName}</span>
              <span className="text-black dark:text-white">{settings.brandSuffix}</span>
            </p>
          </div>
          <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
            {settings.footerText}
          </p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}