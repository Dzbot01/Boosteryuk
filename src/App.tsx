import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import BackgroundMusic from './components/BackgroundMusic';

import HomePage from './pages/HomePage';
import RiwayatPage from './pages/RiwayatPage';
import NotifikasiPage from './pages/NotifikasiPage';
import HubungiPage from './pages/HubungiPage';
import ProfilPage from './pages/ProfilPage';
import PaymentPage from './pages/PaymentPage';
import StrukPage from './pages/StrukPage';

export default function App() {
  return (
    <>
      {/* Background Music */}
      <BackgroundMusic />

      <Routes>
        <Route element={<Layout />}>
          {/* Public pages */}
          <Route index element={<HomePage />} />

          <Route
            path="riwayat"
            element={<RiwayatPage />}
          />

          <Route
            path="notifikasi"
            element={<NotifikasiPage />}
          />

          <Route
            path="hubungi"
            element={<HubungiPage />}
          />

          <Route
            path="struk"
            element={<StrukPage />}
          />

          {/* Auth-protected pages */}
          <Route
            path="profil"
            element={
              <ProtectedRoute>
                <ProfilPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </>
  );
}