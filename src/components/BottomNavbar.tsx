import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, HelpCircle } from 'lucide-react';
import FAQModal from './FAQModal';
import SettingsModal from './SettingsModal';
import { useAuth } from '../context/AuthContext';

export default function BottomNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const profileActive = pathname === '/profil';

  const items = [
    { key: 'settings', icon: Settings, label: 'Pengaturan', open: () => setShowSettings(true), on: showSettings },
    { key: 'faq', icon: HelpCircle, label: 'FAQ', open: () => setShowFAQ(true), on: showFAQ },
  ];

  return (
    <>
      <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-800/95 dark:shadow-black/40">
          {items.map(({ key, icon: Icon, label, open, on }) => (
            <button
              key={key}
              onClick={open}
              aria-label={label}
              title={label}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-250 active:scale-90 ${
                on
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-cyan-400'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] transition-transform duration-500 ${
                  key === 'settings' ? 'group-hover:rotate-90' : ''
                }`}
                strokeWidth={2}
              />
            </button>
          ))}

          {/* Profile — visible after login */}
          {user && (
            <>
              <span className="mx-0.5 h-7 w-px bg-slate-200 dark:bg-slate-700" />
              <button
                onClick={() => navigate('/profil')}
                aria-label="Profil"
                title="Profil"
                className={`group relative flex h-10 w-10 items-center justify-center rounded-full font-display text-[12px] font-extrabold transition-all duration-250 active:scale-90 ${
                  profileActive
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-md shadow-cyan-600/30'
                    : 'text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/30'
                }`}
              >
                {profileActive ? (
                  user.initials
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 transition-transform duration-300 group-hover:scale-110 dark:bg-cyan-900/40 dark:text-cyan-400 dark:ring-cyan-800/50">
                    {user.initials}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
