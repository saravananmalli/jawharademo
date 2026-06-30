import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Image as ImageIcon, Clock, Link2,
} from 'lucide-react';
import { Box, Paper, Grid, Typography, IconButton, MenuItem } from '@mui/material';
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Banner Management"
        subtitle={`${banners.length} campaign banner${banners.length !== 1 ? 's' : ''} — changes go live instantly`}
        action={<Button icon={Plus} onClick={openAdd}>Add Banner</Button>}
      />

      {/* Alerts */}
      {error && (
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, border: '1px solid', bgcolor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <Typography sx={{ flex: 1, fontSize: 13, color: 'error.main' }}>{error}</Typography>
          <IconButton size="small" onClick={() => setError('')} sx={{ color: 'error.main', p: 0.25 }}>✕</IconButton>
        </Paper>
      )}
      {success && (
        <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid', bgcolor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
          <Typography sx={{ fontSize: 13, color: 'success.main' }}>{success}</Typography>
        </Paper>
      )}

      {/* Banner Grid */}
      {loading && banners.length === 0 ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Skeleton height={160} sx={{ borderRadius: 0 }} />
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton height={16} width="40%" />
                    <Skeleton height={20} width={64} sx={{ borderRadius: 5 }} />
                  </Box>
                  <Skeleton height={12} width="75%" />
                  <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
                    <Skeleton height={32} sx={{ flex: 1, borderRadius: 2 }} />
                    <Skeleton height={32} width={40} sx={{ borderRadius: 2 }} />
                    <Skeleton height={32} width={32} sx={{ borderRadius: 2 }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {banners.map(b => {
            const st = bannerStatus(b);
            const link = linkSummary(b);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b._id}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Image preview */}
                  <Box sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: 'action.hover', flexShrink: 0, overflow: 'hidden' }}>
                    {b.imageUrl ? (
                      <Box component="img" src={getImageUrl(b.imageUrl)} alt={b.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>
                        <ImageIcon size={40} />
                        <Typography sx={{ fontSize: 11, mt: 0.5 }}>No image</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1.5 }}>
                      #{b.order}
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      <Box sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, color: '#fff', bgcolor: b.placement === 'offer' ? 'rgba(185,28,28,0.8)' : 'rgba(0,0,0,0.7)' }}>
                        {b.placement === 'offer' ? 'Offer Banner' : 'Hero Carousel'}
                      </Box>
                      {b.campaign && (
                        <Box sx={{ fontSize: 11, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, color: '#fff', bgcolor: 'rgba(180,83,9,0.8)' }}>
                          {b.campaign}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Card body */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</Typography>
                      <Box sx={{ flexShrink: 0 }}>
                        <Badge variant={STATUS_BADGE[st]}>{STATUS_LABEL[st]}</Badge>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }} title={link}>
                      <Link2 size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                      <Typography sx={{ fontSize: 12, color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</Typography>
                    </Box>

                    {(b.startDate || b.endDate) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Clock size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                          {b.startDate ? new Date(b.startDate).toLocaleDateString() : '∞'}
                          {' → '}
                          {b.endDate ? new Date(b.endDate).toLocaleDateString() : '∞'}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 1 }}>
                      <Button variant="secondary" size="sm" icon={Edit2} onClick={() => openEdit(b)} sx={{ flex: 1 }}>Edit</Button>
                      <Toggle checked={b.active} onChange={() => toggleActive(b)} label="" />
                      <IconBtn icon={Trash2} label="Delete banner" variant="ghost" sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} onClick={() => setDeleteTarget(b)} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}

          {banners.length === 0 && !loading && (
            <Grid size={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, color: 'text.disabled' }}>
                <ImageIcon size={56} />
                <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.disabled' }}>No banners yet. Click "Add Banner" to create one.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Banner' : 'Add Banner'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving || !form.title.trim() || !form.imageUrl}>
              {editTarget ? 'Update Banner' : 'Add Banner'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Select label="Placement" required value={form.placement} onChange={e => setF('placement', e.target.value)}>
            {PLACEMENTS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </Select>

          <Input label="Banner Title" required value={form.title} onChange={e => setF('title', e.target.value)} autoFocus placeholder="e.g. Eid Collection 2025" />

          <Input
            label="Description"
            value={form.description}
            onChange={e => setF('description', e.target.value)}
            placeholder="Short promotional text shown on the banner"
            helper={form.placement === 'offer' ? 'Displayed below the title on the offer section banner.' : 'Optional — not displayed in the hero carousel.'}
          />

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 1 }}>
              Banner Image <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <ImageUploader
              images={form.imageUrl ? [form.imageUrl] : []}
              onChange={urls => setF('imageUrl', urls[0] || '')}
              maxImages={1}
              category="banners"
              single
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Select label="Campaign / Occasion" value={form.campaign} onChange={e => setF('campaign', e.target.value)}>
              {CAMPAIGNS.map(c => <MenuItem key={c} value={c}>{c || '— None —'}</MenuItem>)}
            </Select>
            <Input label="Display Order" type="number" value={form.order} onChange={e => setF('order', Number(e.target.value))} min={1} />
          </Box>

          <Input label="Banner Link" value={form.redirectUrl} onChange={e => setF('redirectUrl', e.target.value)} placeholder="/category/rings  ·  /collection/today-deals  ·  https://..." helper="Where users go when they click this banner." />

          {/* Quick Link Shortcuts */}
          <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', p: 2.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', mb: 1.5 }}>
              Quick Link Shortcuts — selecting one auto-fills the link above
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
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
                <MenuItem value="">— None —</MenuItem>
                {categories.map(c => <MenuItem key={c._id} value={c.slug}>{c.name}</MenuItem>)}
              </Select>

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
                <MenuItem value="">— None —</MenuItem>
                {FLAG_COLLECTIONS.map(c => <MenuItem key={c.slug} value={c.slug}>{c.label}</MenuItem>)}
              </Select>

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
            </Box>
          </Paper>

          {/* Scheduling */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <Clock size={13} style={{ opacity: 0.5 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled' }}>
                Scheduling (optional — leave blank for always-on)
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Input label="Start Date" type="datetime-local" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
              <Input label="End Date" type="datetime-local" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
            </Box>
          </Box>

          <Toggle label="Active (visible on site)" checked={form.active} onChange={e => setF('active', e.target.checked)} />
        </Box>
      </Modal>

      {/* Delete Confirm Modal */}
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
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Delete <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>{deleteTarget?.title}</Box>? This cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
