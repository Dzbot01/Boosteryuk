import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Redirects to home if the user is not signed in. */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: pathname }} />;
  }
  return <>{children}</>;
}
