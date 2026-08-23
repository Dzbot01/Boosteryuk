import { History, Construction, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';

export default function RiwayatPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Reveal>
        <button
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
          Kembali
        </button>
      </Reveal>

      <Reveal delay={60}>
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-900/20">
              <Construction className="h-12 w-12 text-amber-500" strokeWidth={1.6} />
            </span>
            <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
            </span>
          </div>

          <div className="mt-7 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Riwayat Pesanan
            </h1>
          </div>

          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-700/40">
            <Construction className="h-4 w-4" />
            Coming Soon
          </span>

          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-slate-500 dark:text-slate-400">
            Fitur riwayat pesanan sedang dalam pengembangan. Nantinya Anda bisa melihat daftar
            lengkap semua pesanan booster beserta detail status masing-masing.
          </p>

          <div className="mt-8 grid w-full max-w-xs gap-3">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Fitur yang akan hadir
              </p>
              <ul className="mt-3 space-y-2.5 text-left text-[13px] text-slate-600 dark:text-slate-400">
                {[
                  'Daftar semua pesanan yang pernah dicek',
                  'Filter berdasarkan status',
                  'Ekspor data pesanan ke CSV',
                  'Statistik pesanan bulanan',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
