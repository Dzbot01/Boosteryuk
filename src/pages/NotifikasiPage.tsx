import {
  ArrowLeft,
  Bell,
  Sparkles,
  Wrench,
  Rocket,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';

const notifications = [
  {
    id: 1,
    icon: Megaphone,
    color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/25 dark:text-cyan-400',
    tag: 'Update',
    tagCls: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/25 dark:text-cyan-400 dark:ring-cyan-800/50',
    title: 'Update website v1.2',
    desc: 'Tampilan Payment, Struk Digital, dan halaman Hubungi Admin telah diperbarui agar lebih cepat di perangkat mobile.',
    time: 'Hari ini · 09:20',
  },
  {
    id: 2,
    icon: Sparkles,
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
    tag: 'Fitur',
    tagCls: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-800/40',
    title: 'Struk Digital resmi dirilis',
    desc: 'Buat bukti pesanan dari teks sukses, lalu cetak atau bagikan ke pembeli dalam hitungan detik.',
    time: 'Kemarin · 18:40',
  },
  {
    id: 3,
    icon: Rocket,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    tag: 'Layanan',
    tagCls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800/40',
    title: 'Layanan TikTok Views kembali normal',
    desc: 'Antrian views TikTok sudah stabil. Pesanan baru diproses sesuai kecepatan paket yang dipilih.',
    time: '2 hari lalu',
  },
  {
    id: 4,
    icon: Wrench,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    tag: 'Maintenance',
    tagCls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800/40',
    title: 'Pemeliharaan server terjadwal',
    desc: 'Sistem akan maintenance singkat pada pukul 02.00–03.00 WIB. Cek status pesanan tetap bisa dilakukan setelahnya.',
    time: '3 hari lalu',
  },
  {
    id: 5,
    icon: ShieldCheck,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    tag: 'Update',
    tagCls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800/40',
    title: 'Keamanan pembayaran ditingkatkan',
    desc: 'Konfirmasi transfer kini lebih aman. Selalu bayar sesuai nominal dan laporkan ke admin setelah transfer.',
    time: '1 minggu lalu',
  },
];

export default function NotifikasiPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Reveal>
        <button
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
          Kembali
        </button>
      </Reveal>

      <Reveal delay={40}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Notifikasi
            </h1>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
            {notifications.length} info
          </span>
        </div>
        <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
          Update website, fitur baru, status layanan, dan jadwal maintenance.
        </p>
      </Reveal>

      <div className="mt-6 space-y-2.5">
        {notifications.map((n, i) => {
          const Icon = n.icon;
          return (
            <Reveal key={n.id} delay={70 + i * 40}>
              <div className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.color}`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-bold text-slate-900 dark:text-white">{n.title}</p>
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${n.tagCls}`}>
                      {n.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {n.desc}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">{n.time}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
