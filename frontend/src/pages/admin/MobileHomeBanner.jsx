import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Image, GripVertical, LayoutTemplate, X } from 'lucide-react';
import {
  Button, IconBtn, Input, Textarea, Toggle,
  Modal, Skeleton,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api           from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const EMPTY = { title: '', description: '', imageUrl: '', order: 1, active: true };

// ── Small inline toggle ───────────────────────────────────────────────────────
function SmallToggle({ checked, onChange, title }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer" title={title}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200" />
      <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
    </label>
  );
}

export default function MobileHomeBanner() {
  const [banners, setBanners]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const dragIndex = useRef(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/mobile-assets/home');
      setBanners(res.data.data || []);
    } catch {
      setError('Failed to load home banners.');
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
    setForm({ title: b.title, description: b.description, imageUrl: b.imageUrl, order: b.order, active: b.active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, screen: 'home', slot: 'banner' };
      if (editTarget) {
        await api.put(`/admin/mobile-assets/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/mobile-assets', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Banner updated.' : 'Banner added.');
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
      await api.put(`/admin/mobile-assets/${b._id}`, { active: !b.active });
      setBanners(prev => prev.map(x => x._id === b._id ? { ...x, active: !x.active } : x));
    } catch {
      setError('Could not update banner status.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/mobile-assets/${deleteTarget._id}`);
      setBanners(prev => prev.filter(b => b._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  // Drag-to-reorder
  const handleDragStart = (index) => { dragIndex.current = index; };

  const handleDrop = async (dropIndex) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((b, i) => ({ ...b, order: i + 1 }));
    setBanners(withOrder);
    dragIndex.current = null;
    try {
      await api.put('/admin/mobile-assets/reorder', {
        items: withOrder.map(b => ({ _id: b._id, order: b.order })),
      });
    } catch {
      setError('Reorder failed — please reload.');
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate size={22} className="text-gray-400" />
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Mobile Home Banners</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {banners.length} banner{banners.length !== 1 ? 's' : ''} — drag to reorder · recommended size: 1080 × 540 px
          </p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Banner</Button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="shrink-0 hover:opacity-70"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}

      {loading && banners.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <Skeleton className="h-44 w-full" />
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-1/3" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-24">
          <LayoutTemplate size={52} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">No mobile home banners yet</h2>
          <p className="text-sm text-gray-400 dark:text-gray-600 mb-5 max-w-md mx-auto">
            These banners appear at the top of the mobile app home screen. They are separate from the web app banners so you can use a portrait crop.
          </p>
          <Button icon={Plus} onClick={openAdd}>Add First Banner</Button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-150 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {banners.map((b, index) => (
            <div
              key={b._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
            >
              {/* Banner image — landscape ratio */}
              <div className="h-44 bg-gray-100 dark:bg-gray-800 relative overflow-hidden shrink-0 flex items-center justify-center">
                {b.imageUrl ? (
                  <img
                    src={getImageUrl(b.imageUrl)}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-600">
                    <Image size={40} className="mx-auto" />
                    <span className="text-xs block mt-1.5">No image</span>
                  </div>
                )}
                {/* Order badge */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  #{b.order}
                </div>
                {/* Drag handle */}
                <div className="absolute top-2 right-2 text-white/70">
                  <GripVertical size={16} />
                </div>
                {/* Active/hidden status */}
                {!b.active && (
                  <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Hidden
                  </div>
                )}
              </div>

              {/* Card content */}
              <div className="p-3 flex-1 flex flex-col bg-white dark:bg-gray-900">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                    {b.title || <em className="text-gray-400 font-normal">No title</em>}
                  </p>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    b.active
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'
                  }`}>
                    {b.active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                {b.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <SmallToggle
                    checked={b.active}
                    onChange={() => toggleActive(b)}
                    title={b.active ? 'Click to hide' : 'Click to show'}
                  />
                  <IconBtn
                    icon={Trash2}
                    size="sm"
                    label="Delete"
                    onClick={() => setDeleteTarget(b)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────── */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Home Banner' : 'Add Home Banner'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving || !form.imageUrl}>
              {editTarget ? 'Update Banner' : 'Add Banner'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Banner Image * — landscape format recommended (1080 × 540 px)
            </p>
            <ImageUploader
              images={form.imageUrl ? [form.imageUrl] : []}
              onChange={urls => setF('imageUrl', urls[0] || '')}
              maxImages={1}
              category="mobile"
              single
            />
          </div>

          <Input
            label="Title"
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            placeholder="e.g. Summer Collection 2026"
            autoFocus
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setF('description', e.target.value)}
            placeholder="e.g. Discover our latest jewellery designs"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4 items-end">
            <Input
              label="Display Order"
              type="number"
              value={form.order}
              onChange={e => setF('order', Number(e.target.value))}
              min={1}
            />
            <div className="pb-1">
              <Toggle
                label="Active (visible in app)"
                checked={form.active}
                onChange={e => setF('active', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
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
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Delete banner <strong>{deleteTarget?.title || `#${deleteTarget?.order}`}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
