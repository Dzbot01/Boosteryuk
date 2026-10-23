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
// Popup "Aktifkan Notifikasi?" (AutoNotif) dihapus atas permintaan: tidak ada lagi
// prompt push notifikasi otomatis saat halaman dibuka. Fungsi mintaIzinNotif di
// ./firebase tetap ada bila nanti ingin dipicu dari tombol pengaturan.

export default function App() {
  return (
    <MusicProvider>
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