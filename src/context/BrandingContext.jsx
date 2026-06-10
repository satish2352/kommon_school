import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { brandingService, resolveLogoUrl } from '../services/brandingService';

const DEFAULT_BRAND = 'Kommon School';

const BrandingContext = createContext({
  brandName: DEFAULT_BRAND,
  logoUrl: null,
  loading: true,
  refresh: () => {},
});

/**
 * Loads the site branding (name + logo) once and exposes it app-wide. Wrap the
 * whole app so the public site and admin panel render the dynamic brand. Call
 * refresh() after the admin saves new branding to update without a reload.
 */
export function BrandingProvider({ children }) {
  const [brandName, setBrandName] = useState(DEFAULT_BRAND);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const s = await brandingService.get();
      setBrandName(s?.brandName || DEFAULT_BRAND);
      setLogoUrl(resolveLogoUrl(s?.logoUrl));
    } catch {
      /* keep defaults on failure */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Keep the browser tab title in sync with the brand name.
  useEffect(() => {
    if (brandName) document.title = brandName;
  }, [brandName]);

  return (
    <BrandingContext.Provider value={{ brandName, logoUrl, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranding() {
  return useContext(BrandingContext);
}
