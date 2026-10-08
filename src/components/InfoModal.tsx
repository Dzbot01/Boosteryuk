import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ArrowUpRight, Inbox } from 'lucide-react';
import { useSiteSettings, type InfoItem } from '../context/SiteSettingsContext';

const CLOSE_DURATION_MS = 180;

const DEMO_ACTION: Record<string, { label: string; to: string }> = {
  Fitur: { label: 'Lihat Layanan', to: '/layanan' },
  Layanan: { label: 'Lihat Layanan', to: '/layanan' },
  Promo: { label: 'Klaim Sekarang', to: '/deposit' },
};

export default function InfoModal() {
  const location = useLocation();
  const pathname = location?.pathname || "/";
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setVisible(true);
    setClosing(false);
  }, [pathname]);

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, CLOSE_DURATION_MS);
  }, []);

  const handleAction = useCallback(
    (to: string) => {
      navigate(to);
      handleClose();
    },
    [navigate, handleClose],
  );

  useEffect(() => {
    if (!visible) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => closeBtnRef.current?.focus());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const list = Array.from(focusables);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(focusFrame);
      previouslyFocused.current?.focus?.();
    };
  }, [visible, handleClose]);

  if (!visible) return null;

  const items = settings.infoItems;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div
        className={`absolute inset-0 bg-slate-900/50 ${
          closing? 'animate-fade-out' : 'animate-fade-in'
        }`}
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-center-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/25 dark:bg-slate-900 dark:shadow-black/50 sm:h-auto sm:max-h-[82vh] ${
          closing? 'animate-modal-pop-out' : 'animate-modal-pop-in'
        }`}
      >
        <div className="flex shrink-0 items-center gap-3.5 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60 sm:px-6 sm:py-5">
            <img src={settings.logoUrl} alt="Boosteryuk" className="h-12 w-12 shrink-0 object-contain drop-shadow" />
          <div className="min-w-0 flex-1">
            <h2
              id="info-center-title"
              className="font-display text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[19px]"
            >
              Informasi &amp; Pengumuman
            </h2>
            <p className="text-[11.5px] font-medium text-slate-400 dark:text-slate-500">
              {items.length > 0? `${items.length} pembaruan` : 'Belum ada pembaruan'}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            aria-label="Tutup Informasi & Pengumuman"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 active:scale-90 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          {items.length === 0? (
            <EmptyState />
          ) : (
            <ol className="space-y-3">
              {items.map((item) => (
                <InfoCard key={item.id} item={item} onAction={handleAction} />
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ item, onAction }: { item: InfoItem; onAction: (to: string) => void; }) {
  const action = DEMO_ACTION[item.tag];
  if (item.image) {
    return (
      <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-800/40">
        <img src={item.image} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900 dark:text-white">{item.title}</h3>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800/50">{item.tag}</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
        </div>
      </li>
    );
  }
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-200 hover:border-slate-300 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600 sm:p-5">
      <div className="text-left">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900 dark:text-white">{item.title}</h3>
          <span className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/25 dark:text-cyan-400 dark:ring-cyan-800/50">{item.tag}</span>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{item.time}</span>
          {action && (
            <button onClick={() => onAction(action.to)} className="group/action inline-flex items-center gap-1 text-[11.5px] font-bold text-cyan-700 transition-colors hover:text-cyan-800 focus-visible:outline-none focus-visible:underline dark:text-cyan-400 dark:hover:text-cyan-300">
              {action.label}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Inbox className="h-7 w-7" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-[13.5px] font-bold text-slate-800 dark:text-slate-200">Belum ada pengumuman</p>
      <p className="mt-1.5 max-w-[240px] text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">Info terbaru akan muncul di sini begitu tersedia.</p>
    </div>
  );
}