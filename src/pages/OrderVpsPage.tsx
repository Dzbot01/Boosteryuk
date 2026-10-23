import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ChevronDown, Layers, RefreshCw, Server, Sparkles, Tag } from 'lucide-react';
import { SERVICE_SLIDES } from '../constants';
import DragScroller from '../components/DragScroller';
import OrderDetailSheet, { type OrderDetail } from '../components/OrderDetailSheet';
import {
  ImageTile,
  NetworkCard,
  PlanCard,
  RegionCard,
  SectionHeader,
  VersionChip,
} from '../components/ServerCards';
import { IP_OPTIONS, NETWORK_PLANS, PLAN_FAMILIES, type PlanFamily } from '../data/serverData';
import { useVpsCatalog, type VpsCatalogState } from '../services/vpsApi';

// Warna memakai CSS variable (lihat --by-* di index.css) agar ikut berubah di tema dark;
// sebelumnya hex statis sehingga card tetap putih & teks gelap saat dark mode.
const COLOR = {
  primary: 'var(--by-primary)',
  dark: 'var(--by-ink)',
  secondary: 'var(--by-ink-2)',
  border: 'var(--by-line)',
  surface: 'var(--by-surface)',
  muted: 'var(--by-muted)',
};

const SLIDE_INTERVAL = 4500;

interface Option {
  value: string;
  label: string;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function FormSection({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeader step={step} title={title} hint={hint} />
      {children}
    </section>
  );
}

/** Kartu placeholder saat katalog HostVDS sedang dimuat. */
function SkeletonCards({ count, width }: { count: number; width: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="aspect-square shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:bg-slate-800 dark:border-slate-700"
          style={{ width }}
        />
      ))}
    </>
  );
}

/** Status sumber data: live dari HostVDS, memuat, atau fallback ke katalog contoh. */
function CatalogStatus({ catalog }: { catalog: VpsCatalogState }) {
  if (catalog.status === 'loading') {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11.5px] font-medium text-slate-500 dark:text-slate-400 dark:bg-slate-800/60">
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-500" strokeWidth={2.4} />
        Memuat paket, image &amp; region dari HostVDS…
      </p>
    );
  }
  if (catalog.status === 'fallback') {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:bg-amber-950/40 dark:border-amber-800/60">
        <p className="flex items-start gap-2 text-[11.5px] font-medium text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
          <span>
            Data live HostVDS belum tersedia — menampilkan katalog contoh.
            {catalog.error ? <span className="block text-[10.5px] text-amber-600/80">{catalog.error}</span> : null}
          </span>
        </p>
        <button
          type="button"
          onClick={catalog.reload}
          className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-100 active:scale-95 dark:bg-slate-900"
        >
          Coba lagi
        </button>
      </div>
    );
  }
  return (
    <p className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-400">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-dot" />
      Live dari HostVDS
      {catalog.generatedAt ? ` · diperbarui ${new Date(catalog.generatedAt).toLocaleTimeString('id-ID')}` : ''}
    </p>
  );
}

function CustomSelect({
  id,
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
}: {
  id: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white pl-3.5 pr-3 text-left text-[13.5px] outline-none transition-colors focus-visible:ring-4 focus-visible:ring-cyan-500/10 dark:bg-slate-900 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
        style={{ borderColor: COLOR.border }}
      >
        <span className="min-w-0 flex-1 truncate" style={{ color: selected ? COLOR.dark : 'var(--by-placeholder)' }}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: COLOR.secondary }}
          strokeWidth={2.2}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border bg-white shadow-[0_8px_24px_-8px_rgba(23,32,51,0.18)] dark:bg-slate-900"
          style={{ borderColor: COLOR.border }}
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="flex h-11 w-full items-center gap-2.5 border-b px-3.5 text-left text-[13.5px] last:border-b-0 transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-950/60"
                style={{ borderColor: COLOR.border, background: active ? 'var(--by-active)' : undefined, color: active ? COLOR.primary : COLOR.dark }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [slideIndex, setSlideIndex] = useState(0);
  const paused = useRef(false);

  const next = useCallback(() => {
    setSlideIndex((i) => (i + 1) % SERVICE_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!paused.current) next();
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [next]);

  /* ----------------------- katalog HostVDS ----------------------- */
  const catalog = useVpsCatalog();
  const loading = catalog.status === 'loading';
  const families = useMemo(
    () => PLAN_FAMILIES.filter((item) => catalog.plans.some((plan) => plan.family === item)),
    [catalog.plans],
  );

  /* ------------------------- order state ------------------------- */
  const [family, setFamily] = useState<PlanFamily>('Burstable');
  const [planId, setPlanId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string>(NETWORK_PLANS[0].id);
  const [imageTab, setImageTab] = useState<'os' | 'app'>('os');
  const [imageId, setImageId] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState<string>('');
  const [serverName, setServerName] = useState('');
  const [ipId, setIpId] = useState<string>(IP_OPTIONS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Jika katalog live tidak punya paket di family terpilih, pindah ke family pertama yang ada.
  useEffect(() => {
    if (families.length && !families.includes(family)) setFamily(families[0]);
  }, [families, family]);

  const familyPlans = useMemo(() => catalog.plans.filter((plan) => plan.family === family), [catalog.plans, family]);
  const plan = useMemo(() => catalog.plans.find((item) => item.id === planId) || null, [catalog.plans, planId]);
  const region = useMemo(() => catalog.regions.find((item) => item.id === regionId) || null, [catalog.regions, regionId]);
  const network = useMemo(() => NETWORK_PLANS.find((item) => item.id === networkId) || NETWORK_PLANS[0], [networkId]);
  const ipOption = useMemo(() => IP_OPTIONS.find((item) => item.id === ipId) || IP_OPTIONS[0], [ipId]);
  const images = useMemo(() => catalog.images.filter((image) => image.kind === imageTab), [catalog.images, imageTab]);
  const image = useMemo(() => catalog.images.find((item) => item.id === imageId) || null, [catalog.images, imageId]);
  const hasEstimatedPrice = familyPlans.some((item) => item.priceSource === 'formula');

  const detail: OrderDetail | null = plan
    ? { plan, region, network, image, imageVersion, ip: ipOption, serverName }
    : null;

  const selectPlan = (id: string) => {
    setPlanId(id);
    setSheetOpen(true);
  };

  const selectImage = (id: string) => {
    const target = catalog.images.find((item) => item.id === id);
    setImageId(id);
    if (target) setImageVersion(target.versions[0]);
  };

  const resetAll = () => {
    setFamily('Burstable');
    setPlanId(null);
    setRegionId(null);
    setNetworkId(NETWORK_PLANS[0].id);
    setImageTab('os');
    setImageId(null);
    setImageVersion('');
    setServerName('');
    setIpId(IP_OPTIONS[0].id);
    setQuantity(1);
    setSheetOpen(false);
    document.getElementById('new-server-plan')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f9ff,_#ffffff_42%,_#f8fafc_100%)] pb-40 text-slate-900 dark:bg-none dark:text-slate-100">
      {/* dark:bg-none + dark:text-*: gradien terang dimatikan di tema dark agar teks tidak tenggelam */}
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Reveal>
          <button className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Kembali
          </button>
        </Reveal>

        <Reveal delay={30}>
          <div className="mb-6">
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700">
              <Sparkles className="h-3 w-3" strokeWidth={2.6} />
              Provisioning
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Bangun server baru dalam hitungan detik
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-300">
              Pilih plan, lokasi, network plan, image, dan konfigurasi jaringan. Semua kartu di bawah bisa
              digeser langsung ke kiri dan kanan.
            </p>
          </div>
        </Reveal>

      {/* ================= SLIDER ================= */}
      {/* lg:!aspect-[3/1]: di desktop slider dibuat lebih pendek agar tidak mendominasi halaman */}
      <Reveal delay={40}>
        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] lg:!aspect-[3/1] border border-slate-200 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)] dark:border-slate-700/60 sm:aspect-[21/9]"
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
        >
          {/* horizontal track containing all slides side by side */}
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{
              width: `${SERVICE_SLIDES.length * 100}%`,
              transform: `translateX(-${slideIndex * (100 / SERVICE_SLIDES.length)}%)`,
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
                onClick={() => setSlideIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slideIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80' /* titik slider tetap putih di atas foto, juga di tema dark */
                }`}
              />
            ))}
          </div>
        </div>
      </Reveal>

        {/* ============================================================
            MODAL / CARD UTAMA: form “Buat Pesanan / New Server”
            Berisi semua step konfigurasi: Plan, Paket, Region,
            Network, Image, dan Configuration.
           ============================================================ */}
        <Reveal delay={100}>
          <div
            className="mt-8 w-full rounded-[22px] px-4 py-5 sm:px-6 sm:py-6"
            style={{ background: COLOR.surface, boxShadow: '0 16px 44px -26px rgba(15,23,42,.35)' }}
          >
            {/* Header modal form */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="h-[18px] w-[18px]" style={{ color: COLOR.primary }} strokeWidth={2.2} />
                <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: COLOR.dark }}>
                  Buat Pesanan
                </h2>
              </div>

              {/* Pill biru “New Server” (bukan tombol tutup) —
                  untuk mereset semua pilihan ke default. */}
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                style={{ background: COLOR.primary }}
              >
                <Tag className="h-3 w-3" strokeWidth={2.2} />
                New Server
              </button>
            </div>

            <div className="my-4 h-px w-full" style={{ background: COLOR.border }} />

            <div className="mb-5">
              <CatalogStatus catalog={catalog} />
            </div>

            <div className="space-y-7">
              {/* Step 01 — MODAL PILIHAN FAMILY PLAN
                  Dropdown untuk memilih keluarga server: Burstable /
                  Highload / High Frequency. */}
              <FormSection step="01" title="Plan" hint="Pilih keluarga server">
                <CustomSelect
                  id="new-server-plan"
                  value={family}
                  disabled={loading}
                  options={(families.length ? families : PLAN_FAMILIES).map((item) => ({ value: item, label: item }))}
                  onChange={(value) => {
                    setFamily(value as PlanFamily);
                    setPlanId(null);
                  }}
                />
              </FormSection>

              {/* Step 02 — MODAL KARTU PAKET SERVER
                  Deretan kartu persegi yang bisa di-drag/swipe
                  horizontal (tanpa tombol next/prev). */}
              <FormSection
                step="02"
                title="Pilih Paket Server"
                hint={
                  loading
                    ? 'Memuat paket dari HostVDS…'
                    : `${familyPlans.length} paket tersedia untuk plan ${family}${hasEstimatedPrice ? ' · harga estimasi' : ''}`
                }
              >
                <DragScroller hint="Geser / drag ke kiri-kanan untuk melihat paket lain">
                  {loading ? <SkeletonCards count={4} width={244} /> : null}
                  {familyPlans.map((item) => (
                    <PlanCard
                      key={item.id}
                      plan={item}
                      selected={item.id === planId}
                      onSelect={() => selectPlan(item.id)}
                    />
                  ))}
                </DragScroller>
              </FormSection>

              {/* Step 03 — MODAL KARTU REGION
                  Kartu persegi dengan bendera (object-contain,
                  tidak terpotong), nama kota, dan indikator ping
                  berwarna hijau/kuning/merah. */}
              <FormSection
                step="03"
                title="Region"
                hint={
                  catalog.status === 'live'
                    ? `${catalog.regions.length} region tersedia di HostVDS`
                    : 'Ping diukur dari lokasi Anda (Looking Glass)'
                }
              >
                <DragScroller hint="Geser / drag untuk melihat region lain">
                  {loading ? <SkeletonCards count={3} width={212} /> : null}
                  {catalog.regions.map((item) => (
                    <RegionCard
                      key={item.id}
                      region={item}
                      selected={item.id === regionId}
                      onSelect={() => setRegionId(item.id)}
                    />
                  ))}
                </DragScroller>
              </FormSection>

              {/* Step 04 — MODAL KARTU NETWORK PLAN
                  Kartu persegi add-on network. Entri duplikat
                  100 Mbps berbayar sudah dihapus; tinggal included
                  100 Mbps + upgrade Gbps/Dedicated. */}
              <FormSection
                step="04"
                title="Network plan"
                hint="Pertama sudah termasuk gratis di semua plan"
              >
                <DragScroller hint="Geser / drag untuk memilih bandwidth">
                  {NETWORK_PLANS.map((item) => (
                    <NetworkCard
                      key={item.id}
                      plan={item}
                      selected={item.id === networkId}
                      onSelect={() => setNetworkId(item.id)}
                    />
                  ))}
                </DragScroller>
              </FormSection>

              {/* Step 05 — MODAL PILIHAN IMAGE (OS / APPS)
                  Berisi: tab toggle OS ↔ Applications, grid ikon
                  image di slider drag, dan bar tombol swap versi. */}
              <section>
                <SectionHeader
                  step="05"
                  title="Image"
                  hint="Operating system atau aplikasi siap pakai"
                />

                {/* Tab segment Operating Systems / Applications */}
                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  {(
                    [
                      { id: 'os', label: 'Operating Systems' },
                      { id: 'app', label: 'Applications' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setImageTab(tab.id);
                        setImageId(null);
                      }}
                      className={`rounded-lg px-3.5 py-2 text-[12px] font-bold transition-all active:scale-95 ${
                        imageTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:text-white dark:bg-slate-900' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Baris kartu ikon image di dalam slider drag */}
                <DragScroller hint="Geser untuk melihat semua image">
                  {loading ? <SkeletonCards count={6} width={132} /> : null}
                  {!loading && !images.length ? (
                    <p className="py-6 text-[12px] font-medium text-slate-400 dark:text-slate-400">Belum ada image untuk kategori ini.</p>
                  ) : null}
                  {images.map((item) => (
                    <ImageTile
                      key={item.id}
                      image={item}
                      selected={item.id === imageId}
                      onSelect={() => selectImage(item.id)}
                    />
                  ))}
                </DragScroller>

                {/* MODAL VERSION SWAP
                    Muncul saat sebuah image dipilih. Berisi chip
                    versi OS/app; versi terbaru dipilih sebagai
                    default. */}
                <div className="mt-3 rounded-xl border p-3" style={{ borderColor: COLOR.border, background: COLOR.muted }}>
                  {image ? (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Swap versi · {image.name}
                        </p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-cyan-600 ring-1 ring-cyan-100 dark:bg-slate-900">
                          default: {image.versions[0]}
                        </span>
                      </div>
                      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                        {image.versions.map((version) => (
                          <VersionChip
                            key={version}
                            version={version}
                            active={version === imageVersion}
                            onSelect={() => setImageVersion(version)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="py-1 text-center text-[12px] font-medium text-slate-400 dark:text-slate-400">
                      Klik salah satu image untuk memilih versi
                    </p>
                  )}
                </div>
              </section>

              {/* Step 06 — MODAL CONFIGURATION
                  Input nama server + pilihan IP Address
                  (IPv4 / IPv4+IPv6 / IPv6). */}
              <FormSection step="06" title="Configuration" hint="Identitas server dan tipe IP address">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Nama server
                    </label>
                    <div className="relative">
                      <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" strokeWidth={2.4} />
                      <input
                        value={serverName}
                        onChange={(event) => setServerName(event.target.value)}
                        placeholder="server-produksi-01"
                        className="h-11 w-full rounded-xl border bg-white pl-9 pr-3 text-[13.5px] outline-none transition-colors focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:bg-slate-900"
                        style={{ borderColor: COLOR.border }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-400">
                      Biarkan kosong untuk memakai nama paket otomatis
                    </p>
                  </div>

                  {/* Segmented button IP Address */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      IP Address
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {IP_OPTIONS.map((option) => {
                        const active = option.id === ipId;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setIpId(option.id)}
                            className={`h-11 rounded-xl border text-[12px] font-bold transition-all active:scale-95 ${
                              active
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700 shadow-[0_10px_24px_-16px_rgba(72,198,229,1)] dark:bg-cyan-950/40'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-400">{ipOption.desc} · included</p>
                  </div>
                </div>
              </FormSection>

              {/* Info bantuan jika belum memilih paket — bukan card biru total. */}
              {!plan ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-[11.5px] font-medium text-slate-500 dark:text-slate-400 dark:bg-slate-800/60 dark:border-slate-600">
                  Pilih paket server di langkah 02 — panel order di bawah layar bisa ditarik ke atas untuk membuka detail.
                </p>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>

      {/* =============================================================
          MODAL DETAIL ORDER — bottom sheet tarik (buka/tutup)
          - Tidak ada tombol X / close.
          - Selalu terlihat strip handle di bawah layar;
            tarik ke atas untuk membuka, tarik ke bawah untuk
            menutup. Di dalamnya ada detail kecil rata kiri,
            stepper +/- qty, total, dan tombol “Buat Server”.
         ============================================================= */}
      <OrderDetailSheet
        open={sheetOpen && !!plan}
        detail={detail}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
