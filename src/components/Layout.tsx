import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import SideMenu from './SideMenu';
import BottomNavbar from './BottomNavbar';
import PushBanner from './PushBanner';
import InfoModal from './InfoModal';
import Calculator from './Calculator';

const BANNER_DELAY = 4000;

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  /* Identical reveal pattern to the music tooltip: hidden on first paint,
     fired once after a fixed delay, permanently gone once dismissed. */
  const [showPushBanner, setShowPushBanner] = useState(false);
  const bannerDismissed = useRef(false);
  const { pathname } = useLocation();

  // Reveal the banner exactly once, 4s after the site loads — never on first paint.
  useEffect(() => {
    if (bannerDismissed.current) return;
    const timer = window.setTimeout(() => {
      if (!bannerDismissed.current) setShowPushBanner(true);
    }, BANNER_DELAY);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissBanner = useCallback(() => {
    bannerDismissed.current = true;
    setShowPushBanner(false);
  }, []);

  // Reset scroll position when the route changes (except for in-page anchors).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
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
      {showPushBanner && <PushBanner onClose={dismissBanner} />}

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <Outlet />

      <BottomNavbar />

      {/* Floating info modal — reappears on each route change / refresh */}
      <InfoModal />

      {/* Floating calculator */}
      <Calculator />
    </div>
  );
}
