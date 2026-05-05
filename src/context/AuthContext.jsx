import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setOnUnauthorized } from '../services/apiClient';
import { tokenStorage } from '../services/tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Wire 401 → forced logout once on mount
  useEffect(() => {
    setOnUnauthorized(() => {
      tokenStorage.clear();
      setUser(null);
    });
  }, []);

  const login = useCallback(async ({ email, password, tenantId }) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password, tenantId });
      const { user: u, tokens } = data;
      tokenStorage.setSession({
        accessToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
        user: u,
        tenantId: u?.tenantId ?? tenantId ?? null,
      });
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: !!user }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
