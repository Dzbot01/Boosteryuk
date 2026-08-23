import {
  X,
  Home,
  Rocket,
  History,
  Phone,
  LogOut,
  Bell,
  Settings,
  Sparkles,
  Construction,
  UserCircle2,
  Wallet,
  Receipt,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GOOGLE_LOGO, useAuth } from '../context/AuthContext';
import { LOGO_URL } from '../constants';

export type PageId =
  | 'home'
  | 'cek-status'
  | 'riwayat'
  | 'notifikasi'
  | 'hubungi'
  | 'pengaturan'
  | 'profil'
  | 'payment'
  | 'struk';

/** Map a PageId to its route path. */
const ROUTE_PATH: Record<PageId, string> = {
  home: '/',
  'cek-status': '/#cek-status',
  riwayat: '/riwayat',
  notifikasi: '/notifikasi',
  hubungi: '/hubungi',
  pengaturan: '/',
  profil: '/profil',
  payment: '/payment',
  struk: '/struk',
};

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  notifUnread?: boolean;
}

const baseMenu: {
  id: PageId;
  icon: typeof Home;
  label: string;
  desc: string;
  badge?: string;
  tag?: string;
}[] = [
  { id: 'home', icon: Home, label: 'Beranda', desc: 'Dashboard utama' },
  { id: 'cek-status', icon: Rocket, label: 'Cek Status', desc: 'Lacak ID pesanan booster' },
  { id: 'riwayat', icon: History, label: 'Riwayat', desc: 'Pesanan sebelumnya', tag: 'Coming Soon' },
  { id: 'struk', icon: Receipt, label: 'Struk Digital', desc: 'Buat bukti pesanan' },
  { id: 'notifikasi', icon: Bell, label: 'Notifikasi', desc: 'Update otomatis', badge: '3' },
  { id: 'hubungi', icon: Phone, label: 'Hubungi Admin', desc: 'Bantuan 24 jam' },
  { id: 'pengaturan', icon: Settings, label: 'Pengaturan', desc: 'Preferensi akun' },
];

const authMenu: typeof baseMenu = [
  { id: 'profil', icon: UserCircle2, label: 'Profil', desc: 'Akun & keamanan' },
  { id: 'payment', icon: Wallet, label: 'Payment', desc: 'Saldo & transaksi' },
];

export default function SideMenu({ isOpen, onClose, notifUnread = true }: SideMenuProps) {
  const { user, logout } = useAuth();
  const [loginTip, setLoginTip] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const menuItems = (user ? [...authMenu, ...baseMenu] : baseMenu).map((item) =>
    item.id === 'notifikasi' ? { ...item, badge: notifUnread ? item.badge : undefined } : item,
  );

  const handleNav = (id: PageId) => {
    // "pengaturan" opens the Settings modal (handled by the floating navbar),
    // so it has no route of its own — just close the drawer.
    if (id === 'pengaturan') {
      onClose();
      return;
    }
    navigate(ROUTE_PATH[id]);
    onClose();
  };

  const handleLogin = () => {
    setLoginTip(true);
    window.setTimeout(() => setLoginTip(false), 2400);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[3px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[85%] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-black/40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-700 via-cyan-600 to-cyan-900 px-5 pb-6 pt-5">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="bg-dots absolute inset-0 opacity-20" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 shadow-lg ring-2 ring-white/40">
                <img src={LOGO_URL} alt="Logo" className="h-8 w-8 object-contain" />
              </span>
              <div>
                <p className="font-display text-base font-extrabold text-white">Boosteryuk</p>
                <p className="text-xs font-medium text-cyan-100/80">Social Media Booster</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition-all duration-200 hover:bg-white/30 active:scale-90"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>

          <div className="relative mt-5 flex items-center gap-3 rounded-xl bg-white/12 px-3 py-3 ring-1 ring-white/15">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center text-emerald-400">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 pulse-ring" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-extrabold leading-tight text-white">
                Status Server Aktif
              </p>
              <p className="text-[11px] font-semibold text-cyan-100/70">Sistem operasional normal</p>
            </div>
            <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[12px] font-extrabold text-emerald-100 ring-1 ring-emerald-300/30">
              100%
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Navigasi
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // "pengaturan" and "cek-status" are modals/anchors, never a real active route.
              const isActive =
                item.id !== 'pengaturan' &&
                item.id !== 'cek-status' &&
                pathname === ROUTE_PATH[item.id];
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-white/20'
                          : 'bg-slate-100 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block text-[13.5px] font-semibold leading-tight">
                          {item.label}
                        </span>
                        {item.tag && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Construction className="h-2.5 w-2.5" />
                            {item.tag}
                          </span>
                        )}
                      </span>
                      <span
                        className={`block truncate text-[11px] ${
                          isActive ? 'text-cyan-100/80' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-white text-cyan-700'
                            : 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400 dark:ring-cyan-700/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-4 dark:border-cyan-800/30 dark:from-cyan-900/20 dark:to-slate-900">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
              <Sparkles className="h-4 w-4" strokeWidth={2.3} />
              <p className="text-[12px] font-bold">Tips booster</p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Simpan ID pesanan setelah checkout agar mudah dilacak kapan saja.
            </p>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-700/60">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-50 active:scale-[0.98] dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
                  <LogOut className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate leading-tight">Keluar</span>
                  <span className="block truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {user.email}
                  </span>
                </span>
              </button>

              {/* Profile icon — bottom right corner */}
              <button
                onClick={() => handleNav('profil')}
                title="Profil"
                aria-label="Profil"
                className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 font-display text-[13px] font-extrabold text-white shadow-lg shadow-cyan-600/25 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {user.initials}
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 pulse-ring text-emerald-400" />
                  <span className="relative h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                </span>
              </button>
            </div>
          ) : (
            <div className="relative">
              {loginTip && (
                <div className="absolute -top-12 left-1/2 z-10 w-[calc(100%-8px)] -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-center text-[11.5px] font-bold text-white shadow-lg">
                  Fitur ini akan segera hadir.
                  <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
                </div>
              )}
              <button
                type="button"
                onClick={handleLogin}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[13.5px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300"
              >
                <img src={GOOGLE_LOGO} alt="Google" className="h-[18px] w-[18px] object-contain" />
                Login dengan Google
              </button>
            </div>
          )}
          <p className="mt-2 text-center text-[10px] font-medium text-slate-300 dark:text-slate-600">
            Boosteryuk v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
