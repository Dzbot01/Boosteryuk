import { BellRing, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PushBanner({ onClose }: Props) {
  return (
    <div className="sticky top-[60px] z-20 border-b border-cyan-200 bg-cyan-50/95 backdrop-blur-md dark:border-cyan-800/50 dark:bg-cyan-950/80">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:items-center sm:px-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white sm:mt-0">
          <BellRing className="h-4 w-4" strokeWidth={2.3} />
        </span>
        <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-relaxed text-cyan-900 dark:text-cyan-100 sm:text-[13px]">
          Aktifkan fitur Push Notifikasi agar mendapatkan info layanan terbaru.
        </p>
        <button
          onClick={onClose}
          aria-label="Tutup banner"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-cyan-700 transition-colors hover:bg-cyan-100 active:scale-90 dark:text-cyan-300 dark:hover:bg-cyan-900/50"
        >
          <X className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
