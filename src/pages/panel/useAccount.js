import { useCallback, useEffect, useState } from 'react';
import { userPanelService } from '../../services/userPanelService';

/**
 * useAccount — loads the logged-in user's own { profile, transactions } from
 * the self-scoped /auth/me/account endpoint. Shared by the panel Dashboard and
 * Transaction History pages.
 *
 * Returns { profile, transactions, loading, error, reload }.
 */
export function useAccount() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userPanelService.getAccount();
      setData(result ?? { profile: null, transactions: [] });
    } catch (err) {
      setError(err.message ?? 'Failed to load your account');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await userPanelService.getAccount();
        if (!cancelled) setData(result ?? { profile: null, transactions: [] });
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load your account');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    profile: data?.profile ?? null,
    transactions: data?.transactions ?? [],
    loading,
    error,
    reload: load,
  };
}
