import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Check,
  Clock,
  Copy,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { formatRupiah } from '../constants';
import { qrImageUrl, type TripayTransaction } from '../services/tripay';

/**
 * =============================================================
 *  MODAL INVOICE TRIPAY
 *  Menampilkan hasil POST /transaction/create:
 *  status, countdown kadaluarsa, QRIS / kode bayar, rincian biaya,
 *  instruksi pembayaran, dan tombol refresh status.
 * ============================================================= */

const STATUS_STYLE: Record<string, { label: string; wrap: string; dot: string }> = {
  UNPAID: { label: 'Menunggu pembayaran', wrap: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40', dot: 'bg-amber-500' },
  PENDING: { label: 'Diproses', wrap: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40', dot: 'bg-sky-500' },
  PAID: { label: 'Lunas', wrap: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40', dot: 'bg-emerald-500' },
  FAILED: { label: 'Gagal', wrap: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40', dot: 'bg-rose-500' },
  EXPIRED: { label: 'Kedaluwarsa', wrap: 'bg-slate-100 text-slate-600 ring-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:ring-slate-700', dot: 'bg-slate-400' },
  REFUND: { label: 'Refund', wrap: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
};

/** Hitung sisa waktu dari unix timestamp (detik). */
function remaining(expiredTime: number): { text: string; done: boolean } {
  const diff = expiredTime * 1000 - Date.now();
  if (diff <= 0) return { text: 'Waktu pembayaran habis', done: true };
  const total = Math.floor(diff / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, done: false };
}

/** Instruksi Tripay mengandung tag <b>; render aman tanpa dangerouslySetInnerHTML. */
function StepText({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/<\/?b>/i), [text]);
  return (
    <span>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <b key={index} className="font-extrabold text-slate-900 dark:text-white">
            {part}
          </b>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard ditolak browser */
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-extrabold transition-all active:scale-95 ${
        copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2.6} />}
      {copied ? 'Tersalin' : label}
    </button>
  );
}

function FeeRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono text-[12px] font-bold tabular-nums ${accent ? 'text-cyan-600' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export default function TripayInvoice({
  transaction,
  refreshing,
  onRefresh,
  polling,
}: {
  transaction: TripayTransaction;
  refreshing: boolean;
  onRefresh: () => void;
  polling: boolean;
}) {
  const [tick, setTick] = useState(0);
  const status = STATUS_STYLE[transaction.status] ?? STATUS_STYLE.UNPAID;
  const qrSource = transaction.qr_url || (transaction.qr_string ? qrImageUrl(transaction.qr_string) : null);
  const isPaid = transaction.status === 'PAID';

  /* Detak countdown setiap detik */
  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = remaining(transaction.expired_time);
  void tick;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,.5)] dark:bg-slate-900 dark:border-slate-700">
      {/* Header invoice */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3.5 text-white sm:px-5 dark:border-slate-800">
        <div className="min-w-0">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-cyan-300">Invoice Tripay</p>
          <p className="mt-0.5 truncate font-mono text-[13px] font-bold">{transaction.merchant_ref}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-300">
            ref {transaction.reference} · {transaction.payment_name || transaction.payment_method}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold ring-1 ${status.wrap}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${isPaid ? '' : 'animate-pulse-dot'}`} />
            {status.label}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Cek status terbaru"
            className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        {/* Countdown */}
        {!isPaid && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 ring-1 ${time.done ? 'bg-rose-50 ring-rose-200 dark:bg-rose-950/40' : 'bg-slate-50 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700'}`}>
            <Clock className={`h-4 w-4 shrink-0 ${time.done ? 'text-rose-500' : 'text-cyan-500'}`} strokeWidth={2.4} />
            <span className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
              {time.done ? 'Invoice kedaluwarsa — buat invoice baru.' : 'Selesaikan pembayaran dalam'}
            </span>
            {!time.done && (
              <span className="ml-auto font-mono text-[15px] font-black tabular-nums text-slate-900 dark:text-white">{time.text}</span>
            )}
          </div>
        )}

        {/* QRIS atau kode bayar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {qrSource ? (
            <div className="mx-auto shrink-0 sm:mx-0">
              <div className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <img src={qrSource} alt="QR pembayaran" className="h-48 w-48 rounded-xl object-contain" />
              </div>
              <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                Scan dengan e-wallet / m-banking
              </p>
            </div>
          ) : transaction.pay_code ? (
            <div className="w-full sm:max-w-[196px]">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center dark:bg-slate-800/60 dark:border-slate-600">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Kode Bayar</p>
                <p className="mt-2 break-all font-mono text-[16px] font-black leading-tight text-slate-900 dark:text-white">
                  {transaction.pay_code}
                </p>
              </div>
              <div className="mt-2 flex justify-center">
                <CopyButton value={transaction.pay_code} label="Salin kode" />
              </div>
            </div>
          ) : null}

          {/* Rincian biaya */}
          <div className="min-w-0 flex-1">
            <div className="rounded-xl bg-cyan-50 px-3.5 py-3 ring-1 ring-cyan-100 dark:bg-cyan-950/40">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Total tagihan</p>
              <p className="mt-1 text-[26px] font-black leading-none text-slate-900 dark:text-white">
                {formatRupiah(transaction.amount + transaction.fee_customer)}
              </p>
            </div>

            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 px-3.5 py-2 dark:border-slate-700 dark:divide-slate-800">
              <FeeRow label="Nominal deposit" value={formatRupiah(transaction.amount)} />
              <FeeRow label="Biaya merchant" value={formatRupiah(transaction.fee_merchant)} />
              <FeeRow label="Biaya customer" value={formatRupiah(transaction.fee_customer)} />
              <FeeRow label="Total biaya" value={formatRupiah(transaction.total_fee)} />
              <FeeRow label="Diterima merchant" value={formatRupiah(transaction.amount_received)} accent />
            </div>

            {transaction.pay_url || transaction.checkout_url ? (
              <a
                href={transaction.pay_url || transaction.checkout_url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-[13px] font-bold text-white shadow-lg shadow-cyan-600/25 transition-all hover:opacity-90 active:scale-[0.99]"
              >
                {isPaid ? <BadgeCheck className="h-4 w-4" strokeWidth={2.6} /> : <ExternalLink className="h-4 w-4" strokeWidth={2.4} />}
                {isPaid ? 'Lihat halaman checkout' : 'Buka halaman pembayaran'}
              </a>
            ) : null}

            <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-400">
              {polling ? (
                <>
                  <LoaderCircle className="h-3 w-3 animate-spin" />
                  Status diperbarui otomatis tiap 15 detik
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Pembaruan otomatis dihentikan
                </>
              )}
            </p>
          </div>
        </div>

        {/* Instruksi pembayaran dari Tripay */}
        {(transaction.instructions?.length ?? 0) > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Cara pembayaran
            </p>
            <div className="space-y-3">
              {transaction.instructions.map((group, index) => (
                <details
                  key={group.title}
                  open={index === 0}
                  className="group rounded-xl border border-slate-200 bg-white open:bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[12.5px] font-extrabold text-slate-800 transition-colors hover:text-cyan-700 dark:text-slate-100">
                    {group.title}
                    {/* Chevron berputar saat <details> terbuka */}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 dark:text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.6}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <ol className="space-y-2 px-3.5 pb-3.5 pt-1">
                    {group.steps.map((step, index) => (
                      <li key={index} className="flex gap-2.5 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-[9px] font-extrabold text-cyan-700">
                          {index + 1}
                        </span>
                        <span>
                          <StepText text={step} />
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
