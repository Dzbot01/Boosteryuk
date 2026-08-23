import { Menu } from 'lucide-react';
import { LOGO_URL } from '../constants';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#" className="group flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Boosteryuk"
            className="h-10 w-10 shrink-0 object-contain drop-shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
          />
          <span className="leading-none">
            <span className="block font-display text-[19px] font-extrabold tracking-tight">
              <span className="text-cyan-600 dark:text-cyan-400">Booster</span>
              <span className="text-black dark:text-white">yuk</span>
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Cek Status Booster
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {['Beranda', 'Cek Status', 'Bantuan'].map((item, i) => (
            <a
              key={item}
              href="#"
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                i === 0
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:text-blue-700 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:text-blue-400"
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-70 pulse-ring text-blue-400" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
          </span>
        </button>
      </div>
    </header>
  );
}
