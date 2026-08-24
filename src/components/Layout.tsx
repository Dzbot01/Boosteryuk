import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import SideMenu from './SideMenu';
import BottomNavbar from './BottomNavbar';
import PushBanner from './PushBanner';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(true);
  const [showPushBanner, setShowPushBanner] = useState(true);
  const { pathname } = useLocation();

  // Opening the notification page marks everything as read.
  useEffect(() => {
    if (pathname === '/notifikasi') setNotifUnread(false);
  }, [pathname]);

  // Reset scroll position when the route changes (except for in-page anchors).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <BackgroundMusic />

      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid dark:opacity-40" />
        <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-blue-400/15 blur-[110px] dark:bg-blue-600/10" />
        <div className="absolute -right-40 top-[380px] h-[460px] w-[460px] rounded-full bg-fuchsia-300/15 blur-[120px] dark:bg-fuchsia-700/10" />
        <div className="absolute bottom-0 left-1/2 h-[380px] w-[820px] -translate-x-1/2 rounded-full bg-sky-100/70 blur-[100px] dark:bg-sky-900/15" />
      </div>

      <Header onMenuClick={() => setMenuOpen(true)} />
      {/* spacer for fixed header */}
      <div className="h-[60px]" />
      {showPushBanner && <PushBanner onClose={() => setShowPushBanner(false)} />}

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        notifUnread={notifUnread}
      />

      <Outlet />

      <BottomNavbar />
    </div>
  );
}
