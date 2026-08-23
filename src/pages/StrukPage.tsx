import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Receipt,
  Printer,
  Copy,
  Check,
  BadgeCheck,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { LOGO_URL } from '../constants';

export interface Struk {
  orderId: string;
  layanan: string;
  target: string;
  jumlah: string;
  tanggal: string;
  ok: boolean;
}

const DEFAULT_TEXT = `Sukses! Pesanan anda berhasil di buat
Id Pesanan : 5109532
Layanan : TikTok Video Views FP 52 [ Max Unlimited ] Slow
Target : https://vt.tiktok.com/ZSV5nubgL/
Jumlah : 5.000
Tanggal pesanan : 22 Agustus 2026 17:43:43`;

function extract(text: string, key: string): string {
  const regex = new RegExp(`${key}\\s*:\\s*(.*)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseFields(text: string) {
  return {
    orderId: extract(text, 'Id Pesanan'),
    layanan: extract(text, 'Layanan'),
    target: extract(text, 'Target'),
    jumlah: extract(text, 'Jumlah'),
    tanggal: extract(text, 'Tanggal pesanan'),
  };
}

function isComplete(fields: ReturnType<typeof parseFields>) {
  return Object.values(fields).every((v) => v.length > 0 && v !== '-');
}

export default function StrukPage() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState(DEFAULT_TEXT);
  const [struk, setStruk] = useState<Struk | null>(null);
  const [copied, setCopied] = useState(false);

  const fields = useMemo(() => parseFields(rawText), [rawText]);
  const complete = isComplete(fields);

  const handleGenerate = () => {
    if (complete) {
      setStruk({ ...fields, ok: true });
    } else {
      setStruk({
        orderId: '',
        layanan: '',
        target: '',
        jumlah: '',
        tanggal: '',
        ok: false,
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyStruk = () => {
    if (!struk) return;
    const text = struk.ok
      ? [
          'Sukses! Pesanan anda berhasil di buat',
          `Id Pesanan : ${struk.orderId}`,
          `Layanan : ${struk.layanan}`,
          `Target : ${struk.target}`,
          `Jumlah : ${struk.jumlah}`,
          `Tanggal pesanan : ${struk.tanggal}`,
        ].join('\n')
      : 'Gagal! Data pesanan tidak lengkap.';
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  if (struk) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-md flex-col px-4 py-8 sm:px-6">
        <Reveal>
          <button
            onClick={() => setStruk(null)}
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Kembali ke Editor
          </button>
        </Reveal>

        <Reveal delay={40} className="flex flex-1 flex-col items-center">
          <StrukCard struk={struk} />

          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <button
              onClick={() => window.print()}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[13.5px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.99] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Printer className="h-4 w-4" strokeWidth={2.3} />
              Cetak / PDF
            </button>
            <button
              onClick={copyStruk}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 text-[13.5px] font-bold text-cyan-700 transition-all hover:bg-cyan-100 active:scale-[0.99] dark:border-cyan-800/50 dark:bg-cyan-900/20 dark:text-cyan-400 dark:hover:bg-cyan-900/35"
            >
              {copied ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <Copy className="h-4 w-4" strokeWidth={2.3} />}
              {copied ? 'Tersalin' : 'Salin Teks'}
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-lg shadow-cyan-600/25">
            <Receipt className="h-7 w-7" strokeWidth={2} />
          </span>
          <div>
            <h1 className="font-display text-[30px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-white sm:text-[38px]">
              Buat Struk
            </h1>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Tempel teks pesanan sukses Anda di bawah ini, dan kami akan mengubahnya menjadi
              struk digital yang rapi.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700/50">
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Data Pesanan
            </h3>
          </div>
          <div className="p-6">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="h-64 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-[13.5px] leading-relaxed text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:focus:border-cyan-600 dark:focus:bg-slate-900"
              placeholder={`Sukses! Pesanan anda berhasil di buat
Id Pesanan : 
Layanan : 
Target : 
Jumlah : 
Tanggal pesanan : `}
            />

            {!complete && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12.5px] font-bold text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                data belum lengkap
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 text-[14px] font-bold text-white shadow-lg shadow-cyan-600/25 transition-all hover:bg-cyan-700 active:scale-[0.99]"
            >
              Buat Struk Digital Sekarang
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function StrukCard({ struk }: { struk: Struk }) {
  const rows = [
    { label: 'Id Pesanan', value: struk.ok ? struk.orderId : '' },
    { label: 'Layanan', value: struk.ok ? struk.layanan : '' },
    { label: 'Target', value: struk.ok ? struk.target : '' },
    { label: 'Jumlah', value: struk.ok ? struk.jumlah : '' },
    { label: 'Tanggal', value: struk.ok ? struk.tanggal : '' },
  ];

  return (
    <div
      id="struk-print"
      className="relative w-full overflow-hidden rounded-lg bg-white text-slate-900 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.25] mix-blend-multiply">
        <div
          className="absolute -inset-[60%] -rotate-[30deg]"
          style={{
            backgroundImage: `url('${LOGO_URL}')`,
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div className="receipt-zigzag relative text-white">
        <span className="block h-2.5" />
      </div>

      <div className="relative px-5 pb-8 pt-2 sm:px-7">
        <div className="flex items-center justify-center gap-2.5">
          <img src={LOGO_URL} alt="Boosteryuk" className="h-9 w-9 object-contain" />
          <p className="font-display text-[17px] font-extrabold tracking-tight">
            <span className="text-cyan-600">Booster</span>yuk
          </p>
        </div>
        <p className="mt-1 text-center font-mono text-[9.5px] uppercase tracking-[0.22em] text-slate-500">
          Bukti Pesanan Digital
        </p>

        <div className="my-5 border-t-2 border-dashed border-slate-200" />

        <div className="relative flex items-center justify-center">
          {struk.ok ? (
            <span className="animate-stamp inline-flex items-center gap-1.5 rounded-md border-2 border-emerald-500 bg-emerald-50 px-3.5 py-1.5 font-display text-[13.5px] font-extrabold uppercase tracking-widest text-emerald-600 shadow-sm">
              <BadgeCheck className="h-4 w-4" strokeWidth={2.6} />
              Sukses
            </span>
          ) : (
            <span className="animate-stamp inline-flex items-center gap-1.5 rounded-md border-2 border-rose-500 bg-rose-50 px-3.5 py-1.5 font-display text-[13.5px] font-extrabold uppercase tracking-widest text-rose-600 shadow-sm">
              <XCircle className="h-4 w-4" strokeWidth={2.6} />
              Gagal
            </span>
          )}
        </div>

        <p className="mt-5 text-center font-mono text-[13px] font-bold leading-relaxed text-slate-800">
          {struk.ok ? 'Pesanan anda berhasil di buat' : 'Data pesanan tidak lengkap'}
        </p>

        <div className="my-5 border-t-2 border-dashed border-slate-200" />

        <dl className="space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-1 sm:grid sm:grid-cols-[100px_1fr] sm:gap-2">
              <dt className="font-mono text-[11.5px] font-semibold uppercase tracking-wider text-slate-500">
                {r.label}
              </dt>
              <dd className="flex items-start gap-1.5">
                <span className="mt-[7px] hidden font-mono text-[11.5px] text-slate-400 sm:inline">:</span>
                <span className="min-h-[18px] min-w-0 flex-1 break-all font-mono text-[12.5px] font-bold leading-relaxed text-slate-900">
                  {r.value || '—'}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="my-5 border-t-2 border-dashed border-slate-200" />

        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Terima kasih
          </p>
          <div className="flex gap-[3px]" aria-hidden>
            {[2, 4, 2, 6, 2, 4, 6, 2, 4, 2, 6, 4, 2, 6].map((w, i) => (
              <span key={i} style={{ width: `${w}px` }} className="block h-7 bg-slate-800" />
            ))}
          </div>
        </div>

        <p className="mt-5 text-center font-mono text-[9.5px] leading-relaxed text-slate-400">
          boosteryuk.id · Struk ini sah tanpa tanda tangan
        </p>
      </div>

      <div className="receipt-zigzag relative text-white">
        <span className="block h-2.5" />
      </div>
    </div>
  );
}
