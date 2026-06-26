import { useState, useEffect, useCallback, useRef } from 'react';
import { DirhamSymbol } from 'dirham/react';
import {
  Plus, Edit2, Trash2, Timer, Tag, Flame, Star,
  ArrowUp, ArrowDown, Eye, EyeOff, Search, PlusCircle, MinusCircle,
} from 'lucide-react';
import {
  Button, IconBtn, Card, Modal, Input, Textarea, Toggle,
  Badge, PageHeader, Skeleton, Spinner,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api from '../../services/api';

// ── Countdown display ─────────────────────────────────────────────────────────
function CountdownTimer({ endDate }) {
  const [parts, setParts] = useState([0, 0, 0, 0]);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate) - Date.now();
      if (diff <= 0) { setExpired(true); setParts([0, 0, 0, 0]); return; }
      setExpired(false);
      setParts([
        Math.floor(diff / 86400000),
        Math.floor((diff % 86400000) / 3600000),
        Math.floor((diff % 3600000) / 60000),
        Math.floor((diff % 60000) / 1000),
      ]);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  if (expired) {
    return <span className="text-xs font-bold text-red-500 font-mono">Expired</span>;
  }

  return (
    <div className="flex items-center gap-1.5 text-center">
      {['Days', 'Hours', 'Mins', 'Secs'].map((unit, i) => (
        <div key={unit} className="bg-gray-900 dark:bg-gray-800 text-white rounded-xl p-2.5 min-w-[52px]">
          <div className="text-xl font-bold tabular-nums leading-none">{parts[i].toString().padStart(2, '0')}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{unit}</div>
        </div>
      ))}
    </div>
  );
}

// ── Inline countdown for card (compact text) ──────────────────────────────────
function CountdownInline({ endDate }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate) - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endDate]);
  return (
    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{timeLeft}</span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateInput(iso) { return iso ? iso.slice(0, 16) : ''; }

function offerStatus(o) {
  const now = Date.now();
  if (!o.active) return 'paused';
  if (o.endDate && new Date(o.endDate) < now) return 'expired';
  if (o.startDate && new Date(o.startDate) > now) return 'scheduled';
  return 'active';
}

const STATUS_BADGE  = { active: 'success', paused: 'default', scheduled: 'warning', expired: 'danger' };
const STATUS_LABEL  = { active: 'Active', paused: 'Paused', scheduled: 'Scheduled', expired: 'Expired' };

const EMPTY_FORM = {
  title: '', subtitle: '', viewAllLink: '/search?sale=true',
  startDate: '', endDate: '', showCountdown: true, autoExpire: true, active: true,
  bannerImage: '', bannerTitle: '', bannerDescription: '',
  bannerCtaText: 'See More Product', bannerCtaLink: '/', bannerActive: true,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Offers() {
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  // Offer dialog
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  // Products dialog
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [prodTarget, setProdTarget]   = useState(null);
  const [assignedProducts, setAssignedProducts] = useState([]);

  // Product search autocomplete
  const [productOptions, setProductOptions] = useState([]);
  const [prodSearch, setProdSearch]   = useState('');
  const searchTimer = useRef(null);

  // Hot-deal suggestions
  const [suggestions, setSuggestions]         = useState([]);
  const [loadingSuggestions, setLoadingSugg]  = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Load all offers ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/offers');
      setOffers(res.data.data || []);
    } catch {
      setError('Failed to load offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Search products for autocomplete ───────────────────────────────────────
  useEffect(() => {
    if (!prodSearch.trim()) { setProductOptions([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(prodSearch)}&limit=10`);
        const data = res.data.data || [];
        const assignedIds = new Set(assignedProducts.map(p => p.product?._id || p.product));
        setProductOptions(data.filter(p => !assignedIds.has(p._id)));
      } catch {
        setProductOptions([]);
      }
    }, 350);
  }, [prodSearch, assignedProducts]);

  // ── Offer CRUD ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (o) => {
    setEditTarget(o);
    setForm({
      title:             o.title,
      subtitle:          o.subtitle || '',
      viewAllLink:       o.viewAllLink || '/search?sale=true',
      startDate:         toDateInput(o.startDate),
      endDate:           toDateInput(o.endDate),
      showCountdown:     o.showCountdown,
      autoExpire:        o.autoExpire,
      active:            o.active,
      bannerImage:       o.bannerImage       || '',
      bannerTitle:       o.bannerTitle       || '',
      bannerDescription: o.bannerDescription || '',
      bannerCtaText:     o.bannerCtaText     || 'See More Product',
      bannerCtaLink:     o.bannerCtaLink     || '/',
      bannerActive:      o.bannerActive      !== false,
    });
    setDialogOpen(true);
  };

  const handleSaveOffer = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate:   form.endDate   || null,
      };
      if (editTarget) {
        await api.put(`/admin/offers/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/offers', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Offer updated.' : 'Offer created.');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o) => {
    try {
      await api.put(`/admin/offers/${o._id}`, { active: !o.active });
      setOffers(prev => prev.map(x => x._id === o._id ? { ...x, active: !x.active } : x));
    } catch {
      setError('Could not update offer.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/offers/${deleteTarget._id}`);
      setOffers(prev => prev.filter(o => o._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  // ── Product management dialog ────────────────────────────────────────────────
  const openProdDialog = async (o) => {
    setProdTarget(o);
    const list = (o.products || []).map((p, i) => ({
      product:      p.product || {},
      enabled:      p.enabled,
      featured:     p.featured,
      displayOrder: p.displayOrder ?? i,
    }));
    list.sort((a, b) => a.displayOrder - b.displayOrder);
    setAssignedProducts(list);
    setProdSearch('');
    setProductOptions([]);
    setSuggestions([]);
    setProdDialogOpen(true);

    // Fetch hot-deal suggestions (≥50% off)
    setLoadingSugg(true);
    try {
      const res = await api.get('/offers/hot-deals?minDiscount=50&limit=30');
      const assignedIds = new Set(list.map(p => p.product?._id || p.product));
      setSuggestions((res.data.data || []).filter(p => !assignedIds.has(p._id)));
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSugg(false);
    }
  };

  const addProduct = (product) => {
    if (!product) return;
    setAssignedProducts(prev => [
      ...prev,
      { product, enabled: true, featured: false, displayOrder: prev.length },
    ]);
    setProdSearch('');
    setProductOptions([]);
    setSuggestions(prev => prev.filter(p => p._id !== product._id));
  };

  const removeProduct = (idx) => {
    setAssignedProducts(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, displayOrder: i })));
  };

  const toggleProductProp = (idx, key) => {
    setAssignedProducts(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      if (key === 'featured') return { ...p, featured: !p.featured };
      return { ...p, [key]: !p[key] };
    }));
  };

  const moveProduct = (idx, dir) => {
    setAssignedProducts(prev => {
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((p, i) => ({ ...p, displayOrder: i }));
    });
  };

  const saveProdAssignment = async () => {
    setSaving(true);
    setError('');
    try {
      const products = assignedProducts.map((p, i) => ({
        product:      p.product._id,
        enabled:      p.enabled,
        featured:     p.featured,
        displayOrder: i,
      }));
      await api.put(`/admin/offers/${prodTarget._id}`, { products });
      setProdDialogOpen(false);
      setSuccess('Products updated.');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Offers & Countdown"
        subtitle="Manage limited-time offers, assign products, and configure countdown timers"
        action={<Button icon={Plus} onClick={openAdd}>New Offer</Button>}
      />

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </div>
      )}

      {/* Offer Cards Grid */}
      {loading && offers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <hr className="border-gray-100 dark:border-gray-800" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2 w-full rounded-full mt-1" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {offers.map(o => {
            const st = offerStatus(o);
            const now = Date.now();
            const start = o.startDate ? new Date(o.startDate).getTime() : now;
            const end   = o.endDate   ? new Date(o.endDate).getTime()   : now + 1;
            const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
            const expired  = st === 'expired';

            return (
              <div key={o._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                <div className="flex-1 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Tag size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{o.title}</p>
                        {o.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[st]} className="shrink-0">{STATUS_LABEL[st]}</Badge>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800 mb-4" />

                  <div className="space-y-2.5">
                    {/* Products count */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Products assigned</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {(o.products || []).filter(p => p.enabled).length} / {(o.products || []).length}
                      </span>
                    </div>

                    {/* End date */}
                    {o.endDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Ends</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {new Date(o.endDate).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Countdown */}
                    {o.showCountdown && o.endDate && !expired && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Timer size={12} /> Countdown
                        </span>
                        <CountdownInline endDate={o.endDate} />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex gap-1.5 flex-wrap">
                      {o.showCountdown && <Badge variant="warning">Countdown ON</Badge>}
                      {o.autoExpire    && <Badge variant="info">Auto-Expire</Badge>}
                    </div>

                    {/* Progress bar */}
                    {o.endDate && (
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${expired ? 'bg-red-500' : 'bg-indigo-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Button variant="secondary" size="sm" icon={Edit2} className="flex-1 min-w-[72px]" onClick={() => openEdit(o)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 min-w-[72px]" onClick={() => openProdDialog(o)}>
                      Products ({(o.products || []).length})
                    </Button>
                    <Button
                      size="sm"
                      variant={o.active ? 'warning' : 'success'}
                      className="flex-1 min-w-[72px]"
                      onClick={() => toggleActive(o)}
                    >
                      {o.active ? 'Pause' : 'Activate'}
                    </Button>
                    <IconBtn
                      icon={Trash2}
                      label="Delete offer"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteTarget(o)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {offers.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600">
              <Tag size={52} />
              <p className="mt-3 text-sm text-gray-400">No offers yet. Click "New Offer" to create one.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Offer Modal ─────────────────────────────────────── */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Offer' : 'New Offer'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOffer} loading={saving} disabled={saving || !form.title.trim()}>
              {editTarget ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Offer Title"
            required
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            autoFocus
            placeholder="Limited-Time Jewellery Offers"
          />
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={e => setF('subtitle', e.target.value)}
            placeholder="Sale up to 50% off on selected items."
          />
          <Input
            label="View All Link"
            value={form.viewAllLink}
            onChange={e => setF('viewAllLink', e.target.value)}
            placeholder="/search?sale=true"
          />

          {/* Countdown / Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Countdown / Schedule</span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={form.startDate}
                onChange={e => setF('startDate', e.target.value)}
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={form.endDate}
                onChange={e => setF('endDate', e.target.value)}
              />
            </div>

            {/* Live countdown preview */}
            {form.endDate && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                  <Timer size={13} /> Countdown preview
                </p>
                <CountdownTimer endDate={form.endDate} />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Toggle
                label="Show Countdown"
                checked={form.showCountdown}
                onChange={e => setF('showCountdown', e.target.checked)}
              />
              <Toggle
                label="Auto Expire"
                checked={form.autoExpire}
                onChange={e => setF('autoExpire', e.target.checked)}
              />
              <Toggle
                label="Active"
                checked={form.active}
                onChange={e => setF('active', e.target.checked)}
              />
            </div>
          </div>

          {/* Promotional Banner */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Promotional Banner (Left Card)</span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banner Image</p>
                <ImageUploader
                  images={form.bannerImage ? [form.bannerImage] : []}
                  onChange={urls => setF('bannerImage', urls[0] || '')}
                  maxImages={1}
                  category="banners"
                  single
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Banner Title"
                  value={form.bannerTitle}
                  onChange={e => setF('bannerTitle', e.target.value)}
                  placeholder="Christmas Gifts"
                />
                <Input
                  label="Banner Description"
                  value={form.bannerDescription}
                  onChange={e => setF('bannerDescription', e.target.value)}
                  placeholder="Hurry to take advantage of the offer"
                />
              </div>
              <div className="grid grid-cols-5 gap-3 items-end">
                <div className="col-span-2">
                  <Input
                    label="CTA Button Text"
                    value={form.bannerCtaText}
                    onChange={e => setF('bannerCtaText', e.target.value)}
                    placeholder="See More Product"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label="CTA Link"
                    value={form.bannerCtaLink}
                    onChange={e => setF('bannerCtaLink', e.target.value)}
                    placeholder="/category/rings"
                  />
                </div>
                <div className="pb-0.5">
                  <Toggle
                    label="Show"
                    checked={form.bannerActive}
                    onChange={e => setF('bannerActive', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Product Assignment Modal ────────────────────────────────────── */}
      <Modal
        open={prodDialogOpen}
        onClose={() => setProdDialogOpen(false)}
        title="Manage Products"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setProdDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProdAssignment} loading={saving}>
              {saving ? 'Saving…' : 'Save Products'}
            </Button>
          </>
        }
      >
        <div>
          {prodTarget && (
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-4">{prodTarget.title}</p>
          )}

          {/* Search input */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
              <Search size={15} />
            </div>
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
              placeholder="Type product name…"
              value={prodSearch}
              onChange={e => setProdSearch(e.target.value)}
            />
          </div>

          {/* Autocomplete dropdown */}
          {productOptions.length > 0 && (
            <div className="mb-3 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
              {productOptions.map(p => (
                <button
                  key={p._id}
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors border-b last:border-0 border-gray-100 dark:border-gray-800"
                >
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">AED {p.price} · {p.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Hot-deal suggestions */}
          {(loadingSuggestions || suggestions.length > 0) && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Flame size={14} className="text-red-500" />
                <span className="text-xs font-bold text-red-500">Suggested — 50%+ Discount</span>
                {loadingSuggestions && <Spinner size="xs" className="ml-1" />}
              </div>
              {!loadingSuggestions && (
                <div className="space-y-1.5">
                  {suggestions.map(p => (
                    <div
                      key={p._id}
                      className="flex items-center gap-3 px-3 py-2 border border-dashed border-red-200 dark:border-red-800 rounded-xl bg-red-50/50 dark:bg-red-900/10"
                    >
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          AED {p.price}
                          {p.originalPrice && (
                            <span className="line-through ml-1.5 text-gray-400">AED {p.originalPrice}</span>
                          )}
                        </p>
                      </div>
                      <Badge variant="danger" className="shrink-0">-{p.discount}%</Badge>
                      <IconBtn
                        icon={PlusCircle}
                        label="Add to offer"
                        size="sm"
                        variant="ghost"
                        className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        onClick={() => addProduct(p)}
                      />
                    </div>
                  ))}
                </div>
              )}
              <hr className="border-gray-100 dark:border-gray-800 mt-3" />
            </div>
          )}

          {/* Assigned product list */}
          {assignedProducts.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-6">
              No products assigned yet. Search above to add.
            </p>
          ) : (
            <div className="space-y-2">
              {assignedProducts.map((entry, idx) => {
                const p = entry.product;
                return (
                  <div
                    key={p._id || idx}
                    className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl transition-opacity ${
                      entry.enabled ? '' : 'opacity-40'
                    } ${
                      entry.featured
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <IconBtn
                        icon={ArrowUp}
                        label="Move up"
                        size="xs"
                        onClick={() => moveProduct(idx, -1)}
                        disabled={idx === 0}
                      />
                      <IconBtn
                        icon={ArrowDown}
                        label="Move down"
                        size="xs"
                        onClick={() => moveProduct(idx, 1)}
                        disabled={idx === assignedProducts.length - 1}
                      />
                    </div>

                    {p.images?.[0] && (
                      <img src={p.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name || '—'}</p>
                      <p className="text-xs text-gray-500">AED {p.price} · #{idx + 1}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5">
                      <IconBtn
                        icon={entry.featured ? Star : Star}
                        label={entry.featured ? 'Remove featured' : 'Mark as featured'}
                        size="sm"
                        variant="ghost"
                        className={entry.featured ? 'text-amber-500' : 'text-gray-400'}
                        onClick={() => toggleProductProp(idx, 'featured')}
                      />
                      <IconBtn
                        icon={entry.enabled ? Eye : EyeOff}
                        label={entry.enabled ? 'Hide product' : 'Show product'}
                        size="sm"
                        variant="ghost"
                        className={entry.enabled ? 'text-indigo-500' : 'text-gray-400'}
                        onClick={() => toggleProductProp(idx, 'enabled')}
                      />
                      <IconBtn
                        icon={MinusCircle}
                        label="Remove from offer"
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => removeProduct(idx)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Offer?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete <strong className="text-gray-900 dark:text-white">{deleteTarget?.title}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
