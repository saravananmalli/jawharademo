import { useState, useEffect, useCallback, useRef } from 'react';
import { DirhamSymbol } from 'dirham/react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel, LinearProgress, Divider, CircularProgress,
  Chip, Avatar, Tooltip, List, ListItem, ListItemAvatar, ListItemText,
  InputAdornment, Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon          from '@mui/icons-material/Add';
import EditIcon         from '@mui/icons-material/Edit';
import DeleteIcon       from '@mui/icons-material/Delete';
import TimerIcon        from '@mui/icons-material/Timer';
import LocalOfferIcon   from '@mui/icons-material/LocalOffer';
import StarIcon         from '@mui/icons-material/Star';
import StarBorderIcon   from '@mui/icons-material/StarBorder';
import ArrowUpwardIcon  from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SearchIcon       from '@mui/icons-material/Search';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { StatusChip }   from './adminUtils';
import ImageUploader    from '../../components/admin/ImageUploader';
import api              from '../../services/api';

// ── Countdown display (used inside admin cards) ───────────────────────────────
function CountdownTimer({ endDate }) {
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <TimerIcon sx={{ fontSize: 14, color: 'warning.main' }} />
      <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace', color: 'warning.main' }}>
        {timeLeft}
      </Typography>
    </Box>
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

const STATUS_LABEL = { active: 'Active', paused: 'Paused', scheduled: 'Scheduled', expired: 'Expired' };
const STATUS_COLOR = { active: 'success', paused: 'default', scheduled: 'warning', expired: 'error' };

const EMPTY_FORM = {
  title: '', subtitle: '', viewAllLink: '/search?sale=true',
  startDate: '', endDate: '', showCountdown: true, autoExpire: true, active: true,
  bannerImage: '', bannerTitle: '', bannerDescription: '',
  bannerCtaText: 'See More Product', bannerCtaLink: '/', bannerActive: true,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Offers() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  // Offer dialog
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  // Products dialog (attached to an offer being edited)
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [prodTarget, setProdTarget]   = useState(null);    // the offer whose products we're editing
  const [assignedProducts, setAssignedProducts] = useState([]); // [{product, enabled, featured, displayOrder}]

  // Product search autocomplete
  const [productOptions, setProductOptions] = useState([]);
  const [prodSearch, setProdSearch]   = useState('');
  const searchTimer = useRef(null);

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
        // Exclude already-assigned
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
  const openProdDialog = (o) => {
    setProdTarget(o);
    // Build local product list from populated offer.products
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
    setProdDialogOpen(true);
  };

  const addProduct = (product) => {
    if (!product) return;
    setAssignedProducts(prev => [
      ...prev,
      { product, enabled: true, featured: false, displayOrder: prev.length },
    ]);
    setProdSearch('');
    setProductOptions([]);
  };

  const removeProduct = (idx) => {
    setAssignedProducts(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, displayOrder: i })));
  };

  const toggleProductProp = (idx, key) => {
    setAssignedProducts(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      if (key === 'featured') {
        // Only one featured at a time
        return { ...p, featured: !p.featured };
      }
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Offers & Countdown</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage limited-time offers, assign products, and configure countdown timers
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>New Offer</Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2.5}>
          {offers.map(o => {
            const st = offerStatus(o);
            const now = Date.now();
            const start = o.startDate ? new Date(o.startDate).getTime() : now;
            const end   = o.endDate   ? new Date(o.endDate).getTime()   : now + 1;
            const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
            const expired  = st === 'expired';

            return (
              <Grid item xs={12} md={6} key={o._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>

                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(150,113,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', flexShrink: 0 }}>
                          <LocalOfferIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{o.title}</Typography>
                          {o.subtitle && (
                            <Typography variant="caption" color="text.secondary" noWrap display="block">{o.subtitle}</Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip label={STATUS_LABEL[st]} color={STATUS_COLOR[st]} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1}>
                      {/* Products count */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Products assigned</Typography>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                          {(o.products || []).filter(p => p.enabled).length} / {(o.products || []).length}
                        </Typography>
                      </Box>

                      {/* End date */}
                      {o.endDate && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Ends</Typography>
                          <Typography variant="caption" fontWeight={600}>{new Date(o.endDate).toLocaleString()}</Typography>
                        </Box>
                      )}

                      {/* Countdown */}
                      {o.showCountdown && o.endDate && !expired && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Countdown</Typography>
                          <CountdownTimer endDate={o.endDate} />
                        </Box>
                      )}

                      {/* Auto-expire badge */}
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {o.showCountdown && <Chip label="Countdown ON" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem' }} />}
                        {o.autoExpire    && <Chip label="Auto-Expire"  size="small" color="info"    variant="outlined" sx={{ fontSize: '0.65rem' }} />}
                      </Box>

                      {/* Progress bar */}
                      {o.endDate && (
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            mt: 0.5,
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f0f2f5',
                            '& .MuiLinearProgress-bar': { bgcolor: expired ? 'error.main' : 'primary.main' },
                          }}
                        />
                      )}
                    </Stack>

                    {/* Actions */}
                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(o)} sx={{ flex: 1, minWidth: 80 }}>Edit</Button>
                      <Button size="small" variant="outlined" color="secondary" onClick={() => openProdDialog(o)} sx={{ flex: 1, minWidth: 80 }}>
                        Products ({(o.products || []).length})
                      </Button>
                      <Button
                        size="small"
                        variant={o.active ? 'outlined' : 'contained'}
                        color={o.active ? 'warning' : 'success'}
                        onClick={() => toggleActive(o)}
                        sx={{ flex: 1, minWidth: 80 }}
                      >
                        {o.active ? 'Pause' : 'Activate'}
                      </Button>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(o)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {offers.length === 0 && !loading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
                <LocalOfferIcon sx={{ fontSize: 56, mb: 1 }} />
                <Typography>No offers yet. Click "New Offer" to create one.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Create / Edit Offer Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Offer' : 'New Offer'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            <Grid item xs={12}>
              <TextField fullWidth label="Offer Title *" value={form.title} onChange={e => setF('title', e.target.value)} autoFocus placeholder="Limited-Time Jewellery Offers" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Subtitle" value={form.subtitle} onChange={e => setF('subtitle', e.target.value)} placeholder="Sale up to 50% off on selected items." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="View All Link" value={form.viewAllLink} onChange={e => setF('viewAllLink', e.target.value)} placeholder="/search?sale=true" />
            </Grid>

            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary" fontWeight={600}>Countdown / Schedule</Typography></Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="datetime-local" label="Start Date & Time" value={form.startDate} onChange={e => setF('startDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="datetime-local" label="End Date & Time" value={form.endDate} onChange={e => setF('endDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Switch checked={form.showCountdown} onChange={e => setF('showCountdown', e.target.checked)} color="warning" />} label="Show Countdown" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Switch checked={form.autoExpire} onChange={e => setF('autoExpire', e.target.checked)} color="info" />} label="Auto Expire" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Switch checked={form.active} onChange={e => setF('active', e.target.checked)} color="success" />} label="Active" />
            </Grid>

            {/* ── Promotional Banner (left card) ─────────────────────────── */}
            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary" fontWeight={600}>Promotional Banner (Left Card)</Typography></Divider>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>Banner Image</Typography>
              <ImageUploader
                images={form.bannerImage ? [form.bannerImage] : []}
                onChange={urls => setF('bannerImage', urls[0] || '')}
                maxImages={1}
                category="banners"
                single
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Banner Title" value={form.bannerTitle} onChange={e => setF('bannerTitle', e.target.value)} placeholder="Christmas Gifts" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Banner Description" value={form.bannerDescription} onChange={e => setF('bannerDescription', e.target.value)} placeholder="Hurry to take advantage of the offer" />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField fullWidth label="CTA Button Text" value={form.bannerCtaText} onChange={e => setF('bannerCtaText', e.target.value)} placeholder="See More Product" />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField fullWidth label="CTA Link" value={form.bannerCtaLink} onChange={e => setF('bannerCtaLink', e.target.value)} placeholder="/category/rings" />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControlLabel control={<Switch checked={form.bannerActive} onChange={e => setF('bannerActive', e.target.checked)} color="primary" />} label="Show" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOffer} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : editTarget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Product Assignment Dialog ──────────────────────────────────────── */}
      <Dialog open={prodDialogOpen} onClose={() => setProdDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Products
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {prodTarget?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>

          {/* Search + add */}
          <Autocomplete
            freeSolo
            options={productOptions}
            getOptionLabel={p => typeof p === 'string' ? p : `${p.name} — ⃃ ${p.price}`}
            inputValue={prodSearch}
            onInputChange={(_, v) => setProdSearch(v)}
            onChange={(_, v) => { if (v && typeof v !== 'string') addProduct(v); }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search & add product"
                placeholder="Type product name…"
                size="small"
                InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option._id} sx={{ gap: 1.5 }}>
                <Avatar src={option.images?.[0]} variant="rounded" sx={{ width: 36, height: 36, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap fontWeight={600}>{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary"><DirhamSymbol size="0.8em" /> {option.price} · {option.category}</Typography>
                </Box>
              </Box>
            )}
            sx={{ mb: 2 }}
          />

          {/* Assigned product list */}
          {assignedProducts.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
              No products assigned yet. Search above to add.
            </Typography>
          ) : (
            <List dense disablePadding>
              {assignedProducts.map((entry, idx) => {
                const p = entry.product;
                return (
                  <ListItem
                    key={p._id || idx}
                    disableGutters
                    sx={{
                      mb: 0.75,
                      px: 1.25,
                      py: 0.75,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      opacity: entry.enabled ? 1 : 0.45,
                      bgcolor: entry.featured ? 'rgba(150,113,35,0.06)' : 'transparent',
                    }}
                  >
                    {/* Reorder */}
                    <Stack sx={{ mr: 0.5 }}>
                      <IconButton size="small" onClick={() => moveProduct(idx, -1)} disabled={idx === 0} sx={{ p: 0.25 }}>
                        <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => moveProduct(idx, 1)} disabled={idx === assignedProducts.length - 1} sx={{ p: 0.25 }}>
                        <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>

                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar src={p.images?.[0]} variant="rounded" sx={{ width: 36, height: 36 }} />
                    </ListItemAvatar>

                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600} noWrap>{p.name || '—'}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary"><DirhamSymbol size="0.8em" /> {p.price} · #{idx + 1}</Typography>}
                    />

                    {/* Controls */}
                    <Stack direction="row" spacing={0.25} sx={{ ml: 0.5 }}>
                      <Tooltip title={entry.featured ? 'Remove featured' : 'Mark as featured'}>
                        <IconButton size="small" onClick={() => toggleProductProp(idx, 'featured')} color={entry.featured ? 'warning' : 'default'}>
                          {entry.featured ? <StarIcon sx={{ fontSize: 18 }} /> : <StarBorderIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={entry.enabled ? 'Hide product' : 'Show product'}>
                        <IconButton size="small" onClick={() => toggleProductProp(idx, 'enabled')} color={entry.enabled ? 'primary' : 'default'}>
                          {entry.enabled ? <VisibilityIcon sx={{ fontSize: 18 }} /> : <VisibilityOffIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from offer">
                        <IconButton size="small" color="error" onClick={() => removeProduct(idx)}>
                          <RemoveCircleIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProdDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveProdAssignment} disabled={saving}>
            {saving ? 'Saving…' : 'Save Products'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Offer?</DialogTitle>
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
