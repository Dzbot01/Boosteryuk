import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ChevronRight, Wallet } from 'lucide-react';
import Reveal from '../components/Reveal';

type TripayChannel = {
  group: string;
  code: string;
  name: string;
  type: string;
  fee_merchant: { flat: number; percent: number };
  fee_customer: { flat: number; percent: number };
  total_fee: { flat: string; percent: string };
  minimum_fee: number;
  maximum_fee: number;
  icon_url: string;
  active: boolean;
};

export default function DepositPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<TripayChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(10000);

  useEffect(() => {
    async function fetchChannels() {
      try {
        // GANTI URL INI sesuai backend lu
        // kalo vercel: /api/payment-channels
        // kalo php aeonfree: /api_tripay.php
        const res = await fetch('/api/tripay/channels');
        const json = await res.json();
        if (json.data) setChannels(json.data.filter((c: TripayChannel) => c.active));
      } catch (e) {
        console.error('Tripay error', e);
      } finally {
        setLoading(false);
      }
    }
    fetchChannels();
  }, []);

  const grouped = channels.reduce((acc, ch) => {
    (acc[ch.group] = acc[ch.group] || []).push(ch);
    return acc;
  }, {} as Record<string, TripayChannel[]>);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-8 sm:px-6">
      <Reveal>
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
      </Reveal>

      <Reveal delay={30}>
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[32px]">Deposit</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400">
          Pilih nominal & metode pembayaran otomatis via Tripay.
        </p>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800/70">
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Nominal Deposit</label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
              <Wallet className="h-5 w-5" />
            </div>
            <input
              type="number"
              value={amount}
              min={1000}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-transparent text-[18px] font-bold text-slate-900 outline-none dark:text-white"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[10000, 20000, 50000, 100000].map(n => (
              <button key={n} onClick={() => setAmount(n)} className={`rounded-full border px-3 py-1 text-[12px] font-bold ${amount === n? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                Rp {n.toLocaleString('id-ID')}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-[11.5px] font-bold text-cyan-700 dark:border-cyan-800/40 dark:bg-cyan-900/25 dark:text-cyan-400">
          <Sparkles className="h-3.5 w-3.5" /> Fee otomatis, Bonus 10% aktif
        </div>
      </Reveal>

      {loading? (
        <div className="mt-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />)}
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {Object.entries(grouped).map(([group, list], gi) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
              <div className="space-y-3">
                {list.map((ch, i) => (
                  <Reveal key={ch.code} delay={90 + i * 30}>
                    <button
                      onClick={() => navigate(`/deposit/${ch.code}`, { state: { channel: ch, amount } })}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-800/70 dark:hover:border-cyan-700/60 sm:p-5"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-700">
                        <img src={ch.icon_url} alt={ch.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[15px] font-extrabold text-slate-900 dark:text-white">{ch.name}</p>
                        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                          Fee: Rp {ch.total_fee.flat!== '0'? ch.total_fee.flat : `${ch.total_fee.percent}%`} · Min. Rp {ch.minimum_fee.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}