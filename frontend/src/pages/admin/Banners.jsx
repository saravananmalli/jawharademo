import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Image as ImageIcon, Clock, Link2,
} from 'lucide-react';
import {
  Button, IconBtn, Card, Modal, Input, Select, Textarea, Toggle,
  Badge, PageHeader, Skeleton,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api           from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { FLAG_COLLECTIONS } from '../../utils/filterConstants';

const CAMPAIGNS = [
  '', 'Christmas', 'Valentines', 'Eid', 'Mothers Day',
  'Wedding Season', 'National Day', 'Ramadan', 'New Year',
  'Limited Time Offer', 'Other',
];

const PLACEMENTS = [
  { value: 'hero',  label: 'Hero Carousel (homepage slider)' },
  { value: 'offer', label: 'Offer Section Banner (above offer cards)' },
];

const EMPTY = {
  title: '', description: '', imageUrl: '', placement: 'hero',
  bannerType: 'custom', campaign: '',
  linkedCategory: '', linkedCollection: '', linkedBrand: '',
  redirectUrl: '', startDate: '', endDate: '', active: true, order: 1,
};

function toDateInput(iso) {
  if (!iso) return '';
  return iso.slice(0, 16);
}

function bannerStatus(b) {
  const now = new Date();
  if (!b.active) return 'hidden';
  if (b.endDate && new Date(b.endDate) < now) return 'expired';
  if (b.startDate && new Date(b.startDate) > now) return 'scheduled';
  return 'active';
}

const STATUS_BADGE = {
  active:    'success',
  hidden:    'default',
  scheduled: 'warning',
  expired:   'danger',
};
const STATUS_LABEL = { active: 'Active', hidden: 'Hidden', scheduled: 'Scheduled', expired: 'Expired' };

export default function Banners() {
  const [banners, setBanners]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [collections, setCollections]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, cRes, colRes] = await Promise.all([
        api.get('/admin/banners'),
        api.get('/categories'),
        api.get('/collections'),
      ]);
      setBanners(bRes.data.data || []);
      setCategories(cRes.data.data || []);
      setCollections(colRes.data.data || []);
    } catch {
      setError('Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY, order: banners.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (b) => {
    setEditTarget(b);
    let effectiveUrl = b.redirectUrl || '';
    if (!effectiveUrl) {
      if (b.bannerType === 'category'   && b.linkedCategory) effectiveUrl = `/category/${b.linkedCategory}`;
      else if (b.bannerType === 'brand' && b.linkedBrand)    effectiveUrl = `/search?brand=${encodeURIComponent(b.linkedBrand)}`;
    }
    setForm({
      title:            b.title,
      description:      b.description || '',
      imageUrl:         b.imageUrl,
      placement:        b.placement || 'hero',
      bannerType:       b.bannerType || 'custom',
      campaign:         b.campaign || '',
      linkedCategory:   b.linkedCategory || '',
      linkedCollection: b.linkedCollection || '',
      linkedBrand:      b.linkedBrand || '',
      redirectUrl:      effectiveUrl,
      startDate:        toDateInput(b.startDate),
      endDate:          toDateInput(b.endDate),
      active:           b.active,
      order:            b.order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.imageUrl) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate:   form.endDate   || null,
      };
      if (editTarget) {
        await api.put(`/admin/banners/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/banners', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Banner updated.' : 'Banner created.');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b) => {
    try {
      await api.put(`/admin/banners/${b._id}`, { active: !b.active });
      setBanners(prev => prev.map(x => x._id === b._id ? { ...x, active: !x.active } : x));
    } catch {
      setError('Could not update banner status.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/banners/${deleteTarget._id}`);
      setBanners(prev => prev.filter(b => b._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  const linkSummary = (b) => {
    if (b.redirectUrl) return b.redirectUrl;
    if (b.bannerType === 'category' && b.linkedCategory) return `/category/${b.linkedCategory}`;
    if (b.bannerType === 'brand'    && b.linkedBrand)    return `/search?brand=${b.linkedBrand}`;
    return '—';
  };

  return (
    <div>
      <PageHeader
        title="Banner Management"
        subtitle={`${banners.length} campaign banner${banners.length !== 1 ? 's' : ''} — changes go live instantly`}
        action={
          <Button icon={Plus} onClick={openAdd}>Add Banner</Button>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-200 font-bold">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </div>
      )}

      {/* Banner Grid */}
      {loading && banners.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 flex-1 rounded-xl" />
                  <Skeleton className="h-8 w-10 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {banners.map(b => {
            const st = bannerStatus(b);
            const link = linkSummary(b);
            return (
              <div key={b._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
                {/* Image preview */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                  {b.imageUrl ? (
                    <img
                      src={getImageUrl(b.imageUrl)}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600">
                      <ImageIcon size={40} />
                      <span className="text-xs mt-1">No image</span>
                    </div>
                  )}
                  {/* Order badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                    #{b.order}
                  </div>
                  {/* Labels */}
                  <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md text-white ${b.placement === 'offer' ? 'bg-rose-700/80' : 'bg-gray-900/70'}`}>
                      {b.placement === 'offer' ? 'Offer Banner' : 'Hero Carousel'}
                    </span>
                    {b.campaign && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white bg-amber-700/80">
                        {b.campaign}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.title}</span>
                    <Badge variant={STATUS_BADGE[st]} className="shrink-0">{STATUS_LABEL[st]}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 truncate" title={link}>
                    <Link2 size={12} className="shrink-0" />
                    <span className="truncate">{link}</span>
                  </div>

                  {(b.startDate || b.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <Clock size={12} className="shrink-0" />
                      <span>
                        {b.startDate ? new Date(b.startDate).toLocaleDateString() : '∞'}
                        {' → '}
                        {b.endDate ? new Date(b.endDate).toLocaleDateString() : '∞'}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <Button variant="secondary" size="sm" icon={Edit2} className="flex-1" onClick={() => openEdit(b)}>
                      Edit
                    </Button>
                    <Toggle
                      checked={b.active}
                      onChange={() => toggleActive(b)}
                      label=""
                    />
                    <IconBtn
                      icon={Trash2}
                      label="Delete banner"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteTarget(b)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {banners.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600">
              <ImageIcon size={56} />
              <p className="mt-3 text-sm text-gray-400">No banners yet. Click "Add Banner" to create one.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Banner' : 'Add Banner'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={saving || !form.title.trim() || !form.imageUrl}
            >
              {editTarget ? 'Update Banner' : 'Add Banner'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Placement */}
          <Select
            label="Placement"
            required
            value={form.placement}
            onChange={e => setF('placement', e.target.value)}
          >
            {PLACEMENTS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>

          {/* Title */}
          <Input
            label="Banner Title"
            required
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            autoFocus
            placeholder="e.g. Eid Collection 2025"
          />

          {/* Description */}
          <Input
            label="Description"
            value={form.description}
            onChange={e => setF('description', e.target.value)}
            placeholder="Short promotional text shown on the banner"
            helper={form.placement === 'offer' ? 'Displayed below the title on the offer section banner.' : 'Optional — not displayed in the hero carousel.'}
          />

          {/* Image */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banner Image <span className="text-red-500">*</span>
            </p>
            <ImageUploader
              images={form.imageUrl ? [form.imageUrl] : []}
              onChange={urls => setF('imageUrl', urls[0] || '')}
              maxImages={1}
              category="banners"
              single
            />
          </div>

          {/* Campaign + Order */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Campaign / Occasion"
              value={form.campaign}
              onChange={e => setF('campaign', e.target.value)}
            >
              {CAMPAIGNS.map(c => (
                <option key={c} value={c}>{c || '— None —'}</option>
              ))}
            </Select>
            <Input
              label="Display Order"
              type="number"
              value={form.order}
              onChange={e => setF('order', Number(e.target.value))}
              min={1}
            />
          </div>

          {/* Banner Link */}
          <Input
            label="Banner Link"
            icon={Link2}
            value={form.redirectUrl}
            onChange={e => setF('redirectUrl', e.target.value)}
            placeholder="/category/rings  ·  /collection/today-deals  ·  https://..."
            helper="Where users go when they click this banner."
          />

          {/* Quick Link Shortcuts */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Quick Link Shortcuts — selecting one auto-fills the link above
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category shortcut */}
              <Select
                label="Category Page"
                value={form.bannerType === 'category' ? form.linkedCategory : ''}
                onChange={e => {
                  const slug = e.target.value;
                  setForm(f => ({
                    ...f,
                    bannerType: slug ? 'category' : 'custom',
                    linkedCategory: slug,
                    linkedCollection: '',
                    linkedBrand: '',
                    redirectUrl: slug ? `/category/${slug}` : '',
                  }));
                }}
              >
                <option value="">— None —</option>
                {categories.map(c => (
                  <option key={c._id} value={c.slug}>{c.name}</option>
                ))}
              </Select>

              {/* Collection shortcut */}
              <Select
                label="Collection Page"
                value={form.bannerType === 'collection' ? form.linkedCollection : ''}
                onChange={e => {
                  const slug = e.target.value;
                  setForm(f => ({
                    ...f,
                    bannerType: slug ? 'collection' : 'custom',
                    linkedCollection: slug,
                    linkedCategory: '',
                    linkedBrand: '',
                    redirectUrl: slug ? `/collection/${slug}` : '',
                  }));
                }}
              >
                <option value="">— None —</option>
                {FLAG_COLLECTIONS.map(c => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </Select>

              {/* Brand shortcut */}
              <Input
                label="Brand Page"
                value={form.bannerType === 'brand' ? form.linkedBrand : ''}
                onChange={e => {
                  const brand = e.target.value;
                  setForm(f => ({
                    ...f,
                    bannerType: brand ? 'brand' : 'custom',
                    linkedBrand: brand,
                    linkedCategory: '',
                    linkedCollection: '',
                    redirectUrl: brand ? `/search?brand=${encodeURIComponent(brand)}` : '',
                  }));
                }}
                placeholder="e.g. Tiffany"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              <Clock size={13} />
              Scheduling (optional — leave blank for always-on)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="datetime-local"
                value={form.startDate}
                onChange={e => setF('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="datetime-local"
                value={form.endDate}
                onChange={e => setF('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Active toggle */}
          <Toggle
            label="Active (visible on site)"
            checked={form.active}
            onChange={e => setF('active', e.target.checked)}
          />
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Banner?"
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
