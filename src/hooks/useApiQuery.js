import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Tiny GET-style hook. Calls fn() on mount and whenever any item in `deps` changes.
 * Re-fetch by calling refetch().
 */
export function useApiQuery(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ loading: false, data, error: null });
    } catch (error) {
      setState({ loading: false, data: null, error });
    }
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: run };
}
