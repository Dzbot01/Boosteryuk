import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  joined: string;
  phone: string;
  timezone: string;
}

interface AuthCtx {
  user: AuthUser | null;
  pending: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  pending: false,
  loginWithGoogle: async () => {},
  logout: () => {},
});

/** Simulated Google account used for the demo login flow. */
const DEMO_USER: AuthUser = {
  id: 'USR-88214',
  name: 'Budi Santoso',
  email: 'budi.santoso@gmail.com',
  initials: 'BS',
  joined: '14 Maret 2024',
  phone: '+62 812-3456-7890',
  timezone: 'WIB (GMT+7)',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pending, setPending] = useState(false);

  const loginWithGoogle = async () => {
    setPending(true);
    // Simulate the Google OAuth handshake.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setUser(DEMO_USER);
    setPending(false);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, pending, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const GOOGLE_LOGO = 'https://cdn.simpleicons.org/google/4285F4';
