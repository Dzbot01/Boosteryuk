import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Clock,
  ShieldCheck,
  ArrowRight,
  Star,
  Rocket,
  Gauge,
  Hash,
  TrendingUp,
  Layers,
} from 'lucide-react';
import Reveal from '../components/Reveal';
import OrderResult from '../components/OrderResult';
import ErrorPanel from '../components/ErrorPanel';
import {
  LOGO_URL,
  SECONDARY_SOCIAL_BRANDS,
  SOCIAL_BRANDS,
  socialIconUrl,
} from '../constants';
import { useTheme } from '../context/ThemeContext';
import {
  checkOrderStatus,
  parseOrderIds,
  type DebugInfo,
  type LookupFailure,
  type OrderData,
} from '../services/orderApi';

export default function HomePage() {
  const { isDark } = useTheme();
  const { hash } = useLocation();

  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [failures, setFailures] = useState<LookupFailure[]>([]);
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchRef = useRef<HTMLElement>(null);

  // Scroll to the search section when arriving via the "Cek Status" menu.
  useEffect(() => {
    if (hash === '#cek-status') {
      const t = setTimeout(() => {
        searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchRef.current?.querySelector('input')?.focus();
      }, 120);
      return () => clearTimeout(t);
    }
  }, [hash]);

  const handleSearch = async () => {
    const trimmed = orderId.trim();

    if (!trimmed) {
      setError('Masukkan minimal satu ID pesanan booster.');
      setOrders([]);
      setFailures([]);
      setDebug(null);
      setSearched(true);
      return;
    }

    setLoading(true);
    setError('');
    setInfoMsg('');
    setOrders([]);
    setFailures([]);
    setDebug(null);
    setSearched(true);

    try {
      const res = await checkOrderStatus(trimmed);
      setDebug(res.debug);
      setOrders(res.orders);
      setFailures(res.failures);

      if (res.orders.length > 0) {
        setInfoMsg(res.message);
        setError(res.failures.length > 0 ? res.message : '');
      } else {
        setError(res.message || 'Pesanan tidak ditemukan.');
      }
    } catch (err) {
      const e = err as Error;
      setOrders([]);
      setFailures(
        parseOrderIds(trimmed).ids.map((id) => ({
          id,
          reason: e?.message || 'Gagal memproses permintaan.',
        })),
      );
      setError(e?.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setOrders([]);
    setFailures([]);
    setDebug(null);
    setError('');
    setInfoMsg('');
    setSearched(false);
    setOrderId('');
  };

  const marquee = [...SOCIAL_BRANDS, ...SOCIAL_BRANDS];
  const reverseMarquee = [...SECONDARY_SOCIAL_BRANDS, ...SECONDARY_SOCIAL_BRANDS];

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 pb-32 sm:px-6">
        {/* ================= HERO ================= */}
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 py-1.5 pl-1.5 pr-4 dark:border-blue-800/40 dark:bg-blue-900/20">
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Live
              </span>
              <span className="text-[12.5px] font-semibold text-blue-800 dark:text-blue-300">
                Cek status booster media sosial
              </span>
            </div>

            <h1 className="mt-5 font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-[56px] lg:text-[62px]">
              Pantau pesanan
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-blue-700 dark:text-blue-400">booster</span>
                <span className="absolute bottom-1 left-0 z-0 h-3 w-full rounded-full bg-blue-200/70 dark:bg-blue-700/40 sm:bottom-2 sm:h-4" />
              </span>{' '}
              secara real-time.
            </h1>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              Masukkan ID pesanan untuk melihat status booster followers, likes, views, dan
              engagement di platform favorit Anda — langsung dari server.
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
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                    4,9 · dipercaya seller SMM
                  </p>
                </div>
              </div>
              <div className="h-9 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="font-display text-2xl font-extrabold leading-none text-slate-900 dark:text-white">
                  8+
                </p>
                <p className="mt-1 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                  Platform sosial
                </p>
              </div>
              <div className="h-9 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="font-display text-2xl font-extrabold leading-none text-slate-900 dark:text-white">
                  24/7
                </p>
                <p className="mt-1 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                  Status update
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center lg:max-w-none">
              <div className="absolute h-3/4 w-3/4 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-800/20" />
              <span className="absolute h-[88%] w-[88%] rounded-full border border-slate-200 dark:border-slate-700/60" />
              <span className="absolute h-[64%] w-[64%] rounded-full border border-slate-200/70 dark:border-slate-700/40" />
              <span className="absolute h-[42%] w-[42%] rounded-full border border-slate-200/50 dark:border-slate-700/30" />
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
                className="animate-float absolute bottom-10 right-0 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/95 sm:right-2"
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
        </section>

        {/* ================= SEARCH ================= */}
        <Reveal>
          <section ref={searchRef} id="cek-status" className="relative z-10 scroll-mt-24">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] dark:border-slate-700/60 dark:bg-slate-800/80 dark:shadow-black/30 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Cek status pesanan booster
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                    Masukkan ID pesanan. Pisahkan dengan koma untuk cek massal (maks. 50 ID).
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-700/40">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Data aman
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Hash className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value.replace(/[^\d,]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                    placeholder="Contoh: 1107 atau 1107,1234"
                    inputMode="numeric"
                    className="h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 font-mono text-[15px] tracking-wide text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="group flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 text-[15px] font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Mengecek
                    </>
                  ) : (
                    <>
                      Cek Status
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={2.4}
                      />
                    </>
                  )}
                </button>
              </div>

              {!searched && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-dashed border-slate-200 pt-4 dark:border-slate-700/60">
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Contoh ID:
                  </span>
                  {['1107', '1234'].map((id) => (
                    <button
                      key={id}
                      onClick={() => setOrderId(id)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </Reveal>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="mt-8">
            <div className="flex flex-col items-center gap-5 rounded-[28px] border border-slate-200 bg-white py-14 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
              <div className="relative h-20 w-20">
                <span className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-700" />
                <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <img src={LOGO_URL} alt="" className="h-9 w-9 object-contain" />
                </span>
              </div>
              <div className="text-center">
                <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Memuat status pesanan…
                </p>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                  Mohon tunggu sebentar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= ERROR ================= */}
        {error && !loading && (
          <div className="mt-8">
            <ErrorPanel
              title="Pesanan tidak ditemukan"
              message={error}
              failures={failures}
              debug={debug}
              onRetry={handleSearch}
            />
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {!loading && orders.length > 0 && (
          <div className="mt-8 space-y-8">
            {orders.length > 1 && (
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Layers className="h-4 w-4" strokeWidth={2.3} />
                </span>
                <p className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  {orders.length} pesanan ditemukan
                  {failures.length > 0 && (
                    <span className="ml-2 text-[13px] font-semibold text-rose-600 dark:text-rose-400">
                      · {failures.length} gagal
                    </span>
                  )}
                </p>
              </div>
            )}

            {orders.map((o) => (
              <OrderResult key={o.orderId} order={o} message={orders.length === 1 ? infoMsg : o.msg} />
            ))}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={resetSearch}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-[13.5px] font-bold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              >
                <Search className="h-4 w-4" strokeWidth={2.4} />
                Cek pesanan lain
              </button>
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-[13.5px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.99] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Clock className="h-4 w-4" strokeWidth={2.2} />
                Refresh status
              </button>
            </div>
          </div>
        )}

        {/* ================= IDLE CONTENT ================= */}
        {!searched && (
          <>
            <section className="mt-16">
              <Reveal>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                      Kenapa Boosteryuk
                    </span>
                    <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[38px]">
                      Satu ID, status lengkap.
                    </h2>
                  </div>
                  <p className="max-w-sm text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
                    Pantau jumlah awal, sisa pengiriman, dan status booster tanpa harus membuka
                    halaman lain.
                  </p>
                </div>
              </Reveal>

              <div className="mt-8 grid gap-4 lg:grid-cols-5">
                <Reveal className="lg:col-span-3">
                  <div className="group relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.7)] dark:border-slate-700/60">
                    <div className="bg-dots absolute inset-0 opacity-15" />
                    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl transition-all duration-700 group-hover:bg-fuchsia-400/30" />
                    <div className="relative">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/40">
                        <Rocket className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <h3 className="mt-5 font-display text-[26px] font-extrabold leading-tight tracking-tight text-white">
                        Status booster
                        <br />
                        real-time
                      </h3>
                      <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-blue-100/70">
                        Dapatkan informasi terkini pesanan Anda: pending, processing, completed,
                        partial, atau canceled.
                      </p>
                      <div className="mt-7 grid grid-cols-3 gap-2">
                        {[
                          { l: 'Pending', c: 'bg-amber-400/20 text-amber-100 ring-amber-300/20' },
                          { l: 'Processing', c: 'bg-sky-400/20 text-sky-100 ring-sky-300/20' },
                          { l: 'Completed', c: 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/20' },
                        ].map((s) => (
                          <div
                            key={s.l}
                            className={`rounded-xl px-2 py-2.5 text-center text-[11px] font-bold ring-1 ${s.c}`}
                          >
                            {s.l}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>

                <div className="grid gap-4 lg:col-span-2">
                  <Reveal delay={90}>
                    <div className="group h-full rounded-[28px] border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:border-blue-800/60">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-700/40">
                        <Gauge className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Remains & start count
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-400">
                        Lihat sisa jumlah yang masih dikirim dan baseline awal sebelum booster
                        berjalan.
                      </p>
                    </div>
                  </Reveal>

                  <Reveal delay={170}>
                    <div className="group h-full rounded-[28px] border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:border-blue-800/60">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-700/40">
                        <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Aman & transparan
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-400">
                        ID pesanan hanya dipakai untuk request status. Tidak ada data sensitif yang
                        disimpan di browser.
                      </p>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>

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
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 pb-24 dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="" className="h-9 w-9 object-contain" />
            <p className="font-display text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              <span className="text-cyan-600 dark:text-cyan-400">Booster</span>
              <span className="text-black dark:text-white">yuk</span>
            </p>
          </div>
          <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
            © 2025 Boosteryuk · Cek status booster media sosial
          </p>
        </div>
      </footer>
    </>
  );
}
