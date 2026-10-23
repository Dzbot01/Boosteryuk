import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Redirects to home if the user is not signed in. */
export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const pathname = location?.pathname || "/";

  // Tunggu data auth selesai dimuat (AuthLoadingModal tampil) sebelum memutuskan redirect,
  // agar refresh di halaman yang butuh login tidak terlempar ke beranda.
  if (loading) return null;
  if (!user) {
    return <Navigate to="/" replace state={{ from: pathname }} />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (
    !adminOnly &&
    isAdmin &&
    (pathname === '/profil' ||
      pathname === '/payment' ||
      pathname === '/pengaturan-akun' ||
      pathname.startsWith('/deposit'))
  ) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}