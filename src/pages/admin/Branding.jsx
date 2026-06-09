import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Button, Input } from '../../components/admin';
import { brandingService } from '../../services/brandingService';
import { useBranding } from '../../context/BrandingContext';

/**
 * Branding master — the single place to set the site-wide brand name + logo.
 * The values are fetched app-wide via BrandingContext, so saving here updates
 * the website, admin panel, browser title, and transactional emails.
 */
export default function Branding() {
  const { brandName, logoUrl, refresh } = useBranding();

  const [name, setName]           = useState('');
  const [savingName, setSavingName] = useState(false);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [uploading, setUploading] = useState(false);

  // Seed the input from the live brand name once it loads.
  useEffect(() => { setName(brandName || ''); }, [brandName]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Please choose an image file (PNG, JPG, SVG, WEBP).'); e.target.value = ''; return; }
    if (f.size > 2 * 1024 * 1024)    { toast.error('Logo must be under 2 MB.'); e.target.value = ''; return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error('Brand name is required.'); return; }
    setSavingName(true);
    try {
      await brandingService.update(trimmed);
      await refresh();
      toast.success('Brand name saved');
    } catch (err) {
      toast.error(err.message ?? 'Failed to save brand name');
    } finally {
      setSavingName(false);
    }
  };

  const uploadLogo = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await brandingService.uploadLogo(file);
      await refresh();
      setFile(null);
      setPreview(null);
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err.message ?? 'Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding"
        subtitle="Set the brand name and logo shown across the website, admin panel, and emails"
      />

      {/* Brand name */}
      <Card title="Brand Name">
        <div className="space-y-4 max-w-md">
          <Input
            label="Brand name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kommon School"
            maxLength={150}
            hint="Shown wherever the brand name appears (navbar, footer, page title, emails)."
          />
          <Button variant="primary" loading={savingName} onClick={saveName}>
            Save name
          </Button>
        </div>
      </Card>

      {/* Logo */}
      <Card title="Logo">
        <div className="space-y-4 max-w-md">
          <div className="flex items-center gap-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold w-20">Current</div>
            {logoUrl ? (
              <img src={logoUrl} alt="Current logo" className="h-12 w-auto max-w-[180px] object-contain rounded border border-slate-200 bg-white p-1" />
            ) : (
              <span className="text-sm text-slate-400 italic">No logo uploaded</span>
            )}
          </div>

          {preview && (
            <div className="flex items-center gap-4">
              <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold w-20">New</div>
              <img src={preview} alt="New logo preview" className="h-12 w-auto max-w-[180px] object-contain rounded border border-emerald-300 bg-white p-1" />
            </div>
          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
            onChange={onPickFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <p className="text-xs text-slate-400">PNG, JPG, SVG or WEBP. Max 2 MB.</p>

          <Button variant="primary" loading={uploading} disabled={!file} onClick={uploadLogo}>
            Upload logo
          </Button>
        </div>
      </Card>
    </div>
  );
}
