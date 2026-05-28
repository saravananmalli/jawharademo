import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel, CardMedia, Select, MenuItem,
  InputLabel, FormControl, Chip, CircularProgress, Tooltip, InputAdornment,
} from '@mui/material';
import AddIcon        from '@mui/icons-material/Add';
import EditIcon       from '@mui/icons-material/Edit';
import DeleteIcon     from '@mui/icons-material/Delete';
import ImageIcon      from '@mui/icons-material/Image';
import ScheduleIcon   from '@mui/icons-material/Schedule';
import LinkIcon       from '@mui/icons-material/Link';
import { StatusChip } from './adminUtils';
import ImageUploader  from '../../components/admin/ImageUploader';
import api            from '../../services/api';
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

const STATUS_LABEL = { active: 'Active', hidden: 'Hidden', scheduled: 'Scheduled', expired: 'Expired' };
const STATUS_COLOR = { active: 'success', hidden: 'default', scheduled: 'warning', expired: 'error' };

export default function Banners() {
  const [banners, setBanners]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [collections, setCollections]   = useState([]);
  const [loading, setLoading]           = useState(true);
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
    // Back-fill redirectUrl from structured fields for banners saved before this feature
    let effectiveUrl = b.redirectUrl || '';
    if (!effectiveUrl) {
      if (b.bannerType === 'category'   && b.linkedCategory) effectiveUrl = `/category/${b.linkedCategory}`;
      else if (b.bannerType === 'brand' && b.linkedBrand)    effectiveUrl = `/search?brand=${encodeURIComponent(b.linkedBrand)}`;
      // collection type: leave empty — old DB collection slugs weren't valid routes
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Banner Management</Typography>
          <Typography variant="body2" color="text.secondary">
            {banners.length} campaign banner{banners.length !== 1 ? 's' : ''} — changes go live instantly
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Banner</Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2.5}>
          {banners.map(b => {
            const st = bannerStatus(b);
            return (
              <Grid item xs={12} sm={6} lg={4} key={b._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Image preview */}
                  <Box sx={{ height: 150, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    {b.imageUrl ? (
                      <CardMedia component="img" src={b.imageUrl} alt={b.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                        <ImageIcon sx={{ fontSize: 44 }} />
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>No image</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.72rem', fontWeight: 700 }}>
                      #{b.order}
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      <Chip
                        label={b.placement === 'offer' ? 'Offer Banner' : 'Hero Carousel'}
                        size="small"
                        sx={{ bgcolor: b.placement === 'offer' ? 'rgba(139,21,56,0.82)' : 'rgba(30,30,30,0.72)', color: '#fff', fontWeight: 700, fontSize: '0.68rem' }}
                      />
                      {b.campaign && (
                        <Chip label={b.campaign} size="small" sx={{ bgcolor: 'rgba(150,113,35,0.85)', color: '#fff', fontWeight: 700, fontSize: '0.68rem' }} />
                      )}
                    </Box>
                  </Box>

                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ minWidth: 0 }}>{b.title}</Typography>
                      <Chip
                        label={STATUS_LABEL[st]}
                        color={STATUS_COLOR[st]}
                        size="small"
                        variant="outlined"
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>

                    <Tooltip title={linkSummary(b)} placement="top">
                      <Typography variant="caption" color="text.secondary" noWrap display="flex" alignItems="center" gap={0.5}>
                        <LinkIcon sx={{ fontSize: 13 }} />
                        {linkSummary(b)}
                      </Typography>
                    </Tooltip>

                    {(b.startDate || b.endDate) && (
                      <Typography variant="caption" color="text.disabled" display="flex" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 13 }} />
                        {b.startDate ? new Date(b.startDate).toLocaleDateString() : '∞'}
                        {' → '}
                        {b.endDate ? new Date(b.endDate).toLocaleDateString() : '∞'}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 1.5 }}>
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(b)} sx={{ flex: 1 }}>Edit</Button>
                      <Tooltip title={b.active ? 'Click to hide' : 'Click to show'}>
                        <Switch size="small" checked={b.active} onChange={() => toggleActive(b)} color="primary" />
                      </Tooltip>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(b)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            {/* Placement */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Placement *</InputLabel>
                <Select value={form.placement} label="Placement *" onChange={e => setF('placement', e.target.value)}>
                  {PLACEMENTS.map(p => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Title */}
            <Grid item xs={12}>
              <TextField fullWidth label="Banner Title *" value={form.title} onChange={e => setF('title', e.target.value)} autoFocus />
            </Grid>

            {/* Description (shown for offer placement) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="Short promotional text shown on the banner"
                helperText={form.placement === 'offer' ? 'Displayed below the title on the offer section banner.' : 'Optional — not displayed in the hero carousel.'}
              />
            </Grid>

            {/* Image */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>Banner Image *</Typography>
              <ImageUploader
                images={form.imageUrl ? [form.imageUrl] : []}
                onChange={urls => setF('imageUrl', urls[0] || '')}
                maxImages={1}
                category="banners"
                single
              />
            </Grid>

            {/* Campaign */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Campaign / Occasion</InputLabel>
                <Select value={form.campaign} label="Campaign / Occasion" onChange={e => setF('campaign', e.target.value)}>
                  {CAMPAIGNS.map(c => (
                    <MenuItem key={c} value={c}>{c || '— None —'}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Order */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Display Order" value={form.order} onChange={e => setF('order', Number(e.target.value))} inputProps={{ min: 1 }} />
            </Grid>

            {/* ── Banner Link (always visible) ── */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Banner Link"
                value={form.redirectUrl}
                onChange={e => setF('redirectUrl', e.target.value)}
                placeholder="/category/rings  ·  /collection/today-deals  ·  https://..."
                helperText="Where users go when they click this banner. Type any URL or use a shortcut below."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* ── Quick Link Shortcuts ── */}
            <Grid item xs={12}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1.5 }}>
                  Quick Link Shortcuts — selecting one auto-fills the link above
                </Typography>
                <Grid container spacing={1.5}>
                  {/* Category shortcut */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Category Page</InputLabel>
                      <Select
                        value={form.bannerType === 'category' ? form.linkedCategory : ''}
                        label="Category Page"
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
                        {categories.map(c => (
                          <MenuItem key={c._id} value={c.slug}>{c.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Collection shortcut */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Collection Page</InputLabel>
                      <Select
                        value={form.bannerType === 'collection' ? form.linkedCollection : ''}
                        label="Collection Page"
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
                        {FLAG_COLLECTIONS.map(c => (
                          <MenuItem key={c.slug} value={c.slug}>{c.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Brand shortcut */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
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
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Scheduling */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5}>
                <ScheduleIcon sx={{ fontSize: 14 }} /> Scheduling (optional — leave blank for always-on)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="datetime-local" label="Start Date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="datetime-local" label="End Date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>

            {/* Active toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.active} onChange={e => setF('active', e.target.checked)} color="primary" />}
                label="Active (visible on site)"
              />
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.title.trim() || !form.imageUrl}>
            {saving ? 'Saving…' : editTarget ? 'Update' : 'Add Banner'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Banner?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete <strong>{deleteTarget?.title}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
