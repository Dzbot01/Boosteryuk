import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { MusicProvider } from './context/MusicContext';
import HomePage from './pages/HomePage';
import CekStatusPage from './pages/CekStatusPage';
import RiwayatPage from './pages/RiwayatPage';
import HubungiPage from './pages/HubungiPage';
import AboutPage from './pages/AboutPage';
import PlusPage from './pages/PlusPage';
import UpgradePlusPage from './pages/UpgradePlusPage';
import SupportPage from './pages/SupportPage';
import PaymentPage from './pages/PaymentPage';
import TermsPage from './pages/TermsPage';
import ManualDepositPage from './pages/ManualDepositPage';
import StrukPage from './pages/StrukPage';
import StrukSuksesPage from './pages/StrukSuksesPage';
import PrivacyPage from './pages/PrivacyPage';
import LayananPage from './pages/LayananPage';
import LayananDetailPage from './pages/LayananDetailPage';
import OrderVpsPage from './pages/OrderVpsPage';
import PengaturanAkunPage from './pages/PengaturanAkunPage';
import DepositPage from './pages/DepositPage';
import DepositMethodPage from './pages/DepositMethodPage';
import DepositInvoicePage from './pages/DepositInvoicePage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminWebsitePage from './pages/admin/AdminWebsitePage';
import AdminServerPage from './pages/admin/AdminServerPage';
import AdminProfitPage from './pages/admin/AdminProfitPage';
import AdminBroadcastPage from './pages/admin/AdminBroadcastPage';
import { useEffect, useState } from 'react';
import { mintaIzinNotif } from './firebase';

function AutoNotif() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (Notification.permission!== 'default') return;
    if (localStorage.getItem("notif_diminta")) return;
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-5 left-4 right-4 z-[999] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[380px] animate-fade-in">
      <div className="rounded-[20px] bg-white p-4 shadow-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white">🔔</span>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-slate-900 dark:text-white">Aktifkan Notifikasi?</p>
            <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Dapetin info harga & promo terbaru langsung di HP kamu.</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => { setShow(false); localStorage.setItem("notif_diminta", "1"); }} className="flex-1 h-10 rounded-xl bg-slate-100 text-[13px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">Nanti</button>
          <button onClick={async () => { setShow(false); localStorage.setItem("notif_diminta", "1"); await mintaIzinNotif(); }} className="flex-1 h-10 rounded-xl bg-cyan-600 text-[13px] font-bold text-white">Aktifkan</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
       <AutoNotif />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="cek-status" element={<CekStatusPage />} />
          <Route path="riwayat-pesanan" element={<RiwayatPage />} />
          <Route path="hubungi" element={<HubungiPage />} />
          <Route path="hubungi-kami" element={<Navigate to="/hubungi" replace />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="manualdepo" element={<ManualDepositPage />} />
          <Route path="struk" element={<StrukPage />} />
          <Route path="layanan" element={<LayananPage />} />
          <Route path="layanan/:platform" element={<LayananDetailPage />} />
          <Route path="plus" element={<PlusPage />} />
          <Route path="upgrade-plus" element={<ProtectedRoute><UpgradePlusPage /></ProtectedRoute>} />

          <Route path="ordervps" element={<ProtectedRoute><OrderVpsPage /></ProtectedRoute>} />
          <Route path="payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="pengaturan-akun" element={<ProtectedRoute><PengaturanAkunPage /></ProtectedRoute>} />
          <Route path="deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
          <Route path="deposit/:method" element={<ProtectedRoute><DepositMethodPage /></ProtectedRoute>} />
          <Route path="deposit/:method/invoice" element={<ProtectedRoute><DepositInvoicePage /></ProtectedRoute>} />

          <Route path="admin" element={<ProtectedRoute adminOnly><AdminHomePage /></ProtectedRoute>} />
          <Route path="admin/profit" element={<ProtectedRoute adminOnly><AdminProfitPage /></ProtectedRoute>} />
          <Route path="admin/broadcast" element={<ProtectedRoute adminOnly><AdminBroadcastPage /></ProtectedRoute>} />
          <Route path="admin/website" element={<ProtectedRoute adminOnly><AdminWebsitePage /></ProtectedRoute>} />
          <Route path="admin/server" element={<ProtectedRoute adminOnly><AdminServerPage /></ProtectedRoute>} />

          {/* FIX UTAMA: jangan pakai :slug yang rakus, pakai prefix s/ atau struk/ */}
          <Route path="s/:slug" element={<StrukSuksesPage />} />
          <Route path="struk/:slug" element={<StrukSuksesPage />} />
          {/* fallback lama biar link struk lama tetep jalan, tapi taruh paling akhir */}
          <Route path=":slug" element={<StrukSuksesPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MusicProvider>
  );
}