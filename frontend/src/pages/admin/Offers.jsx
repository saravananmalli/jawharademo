import { useState, useEffect, useCallback, useRef } from 'react';
import { DirhamSymbol } from 'dirham/react';
import {
  Plus, Edit2, Trash2, Timer, Tag, Flame, Star,
  ArrowUp, ArrowDown, Eye, EyeOff, Search, PlusCircle, MinusCircle,
} from 'lucide-react';
import { Box, Paper, Grid, Typography, IconButton } from '@mui/material';
import {
  Button, IconBtn, Card, Modal, Input, Textarea, Toggle,
  Badge, PageHeader, Skeleton, Spinner,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api from '../../services/api';

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
    return <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, color: 'error.main', fontFamily: 'monospace' }}>Expired</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'center' }}>
      {['Days', 'Hours', 'Mins', 'Secs'].map((unit, i) => (
        <Box key={unit} sx={{ bgcolor: '#111827', color: '#fff', borderRadius: 2.5, p: 1.25, minWidth: 52 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, color: '#fff' }}>
            {parts[i].toString().padStart(2, '0')}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', mt: 0.5 }}>
            {unit}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

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
  return <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'warning.main' }}>{timeLeft}</Box>;
}

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

function SectionDivider({ label }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1 }}>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
    </Box>
  );
}

export default function Offers() {
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [prodTarget, setProdTarget]   = useState(null);
  const [assignedProducts, setAssignedProducts] = useState([]);

  const [productOptions, setProductOptions] = useState([]);
  const [prodSearch, setProdSearch]   = useState('');
  const searchTimer = useRef(null);

  const [suggestions, setSuggestions]         = useState([]);
  const [loadingSuggestions, setLoadingSugg]  = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

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

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setDialogOpen(true); };

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
      const payload = { ...form, startDate: form.startDate || null, endDate: form.endDate || null };
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
    setAssignedProducts(prev => [...prev, { product, enabled: true, featured: false, displayOrder: prev.length }]);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Offers & Countdown"
        subtitle="Manage limited-time offers, assign products, and configure countdown timers"
        action={<Button icon={Plus} onClick={openAdd}>New Offer</Button>}
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

      {/* Offer Cards Grid */}
      {loading && offers.length === 0 ? (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton width={36} height={36} sx={{ borderRadius: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Skeleton height={16} width={144} />
                      <Skeleton height={12} width={96} />
                    </Box>
                  </Box>
                  <Skeleton height={20} width={64} sx={{ borderRadius: 5 }} />
                </Box>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton height={12} />
                  <Skeleton height={12} width="80%" />
                  <Skeleton height={6} sx={{ borderRadius: 3, mt: 0.5 }} />
                  <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
                    {[1,2,3].map(j => <Skeleton key={j} height={32} sx={{ flex: 1, borderRadius: 2 }} />)}
                    <Skeleton height={32} width={32} sx={{ borderRadius: 2 }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {offers.map(o => {
            const st = offerStatus(o);
            const now = Date.now();
            const start = o.startDate ? new Date(o.startDate).getTime() : now;
            const end   = o.endDate   ? new Date(o.endDate).getTime()   : now + 1;
            const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
            const expired  = st === 'expired';

            return (
              <Grid size={{ xs: 12, md: 6 }} key={o._id}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flex: 1, p: 2.5 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                          <Tag size={18} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</Typography>
                          {o.subtitle && <Typography sx={{ fontSize: 12, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.subtitle}</Typography>}
                        </Box>
                      </Box>
                      <Box sx={{ flexShrink: 0 }}>
                        <Badge variant={STATUS_BADGE[st]}>{STATUS_LABEL[st]}</Badge>
                      </Box>
                    </Box>

                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      {/* Products count */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Products assigned</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'primary.main' }}>
                          {(o.products || []).filter(p => p.enabled).length} / {(o.products || []).length}
                        </Typography>
                      </Box>

                      {o.endDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Ends</Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{new Date(o.endDate).toLocaleString()}</Typography>
                        </Box>
                      )}

                      {o.showCountdown && o.endDate && !expired && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Timer size={12} style={{ opacity: 0.5 }} />
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Countdown</Typography>
                          </Box>
                          <CountdownInline endDate={o.endDate} />
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {o.showCountdown && <Badge variant="warning">Countdown ON</Badge>}
                        {o.autoExpire    && <Badge variant="info">Auto-Expire</Badge>}
                      </Box>

                      {o.endDate && (
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden', mt: 0.5 }}>
                          <Box sx={{ height: '100%', borderRadius: 3, bgcolor: expired ? 'error.main' : 'primary.main', width: `${progress}%`, transition: 'width 1s linear' }} />
                        </Box>
                      )}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
                      <Button variant="secondary" size="sm" icon={Edit2} onClick={() => openEdit(o)} sx={{ flex: 1, minWidth: 72 }}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => openProdDialog(o)} sx={{ flex: 1, minWidth: 72 }}>
                        Products ({(o.products || []).length})
                      </Button>
                      <Button size="sm" variant={o.active ? 'warning' : 'success'} onClick={() => toggleActive(o)} sx={{ flex: 1, minWidth: 72 }}>
                        {o.active ? 'Pause' : 'Activate'}
                      </Button>
                      <IconBtn icon={Trash2} label="Delete offer" variant="ghost" sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} onClick={() => setDeleteTarget(o)} />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}

          {offers.length === 0 && !loading && (
            <Grid size={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, color: 'text.disabled' }}>
                <Tag size={52} />
                <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.disabled' }}>No offers yet. Click "New Offer" to create one.</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create / Edit Offer Modal */}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Input label="Offer Title" required value={form.title} onChange={e => setF('title', e.target.value)} autoFocus placeholder="Limited-Time Jewellery Offers" />
          <Input label="Subtitle" value={form.subtitle} onChange={e => setF('subtitle', e.target.value)} placeholder="Sale up to 50% off on selected items." />
          <Input label="View All Link" value={form.viewAllLink} onChange={e => setF('viewAllLink', e.target.value)} placeholder="/search?sale=true" />

          {/* Countdown / Schedule */}
          <Box>
            <SectionDivider label="Countdown / Schedule" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              <Input label="Start Date & Time" type="datetime-local" value={form.startDate} onChange={e => setF('startDate', e.target.value)} />
              <Input label="End Date & Time" type="datetime-local" value={form.endDate} onChange={e => setF('endDate', e.target.value)} />
            </Box>

            {form.endDate && (
              <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', p: 2, mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                  <Timer size={13} style={{ opacity: 0.5 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>Countdown preview</Typography>
                </Box>
                <CountdownTimer endDate={form.endDate} />
              </Paper>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2.5 }}>
              <Toggle label="Show Countdown" checked={form.showCountdown} onChange={e => setF('showCountdown', e.target.checked)} />
              <Toggle label="Auto Expire" checked={form.autoExpire} onChange={e => setF('autoExpire', e.target.checked)} />
              <Toggle label="Active" checked={form.active} onChange={e => setF('active', e.target.checked)} />
            </Box>
          </Box>

          {/* Promotional Banner */}
          <Box>
            <SectionDivider label="Promotional Banner (Left Card)" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 1 }}>Banner Image</Typography>
                <ImageUploader
                  images={form.bannerImage ? [form.bannerImage] : []}
                  onChange={urls => setF('bannerImage', urls[0] || '')}
                  maxImages={1}
                  category="banners"
                  single
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Input label="Banner Title" value={form.bannerTitle} onChange={e => setF('bannerTitle', e.target.value)} placeholder="Christmas Gifts" />
                <Input label="Banner Description" value={form.bannerDescription} onChange={e => setF('bannerDescription', e.target.value)} placeholder="Hurry to take advantage of the offer" />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 2, alignItems: 'flex-end' }}>
                <Input label="CTA Button Text" value={form.bannerCtaText} onChange={e => setF('bannerCtaText', e.target.value)} placeholder="See More Product" />
                <Input label="CTA Link" value={form.bannerCtaLink} onChange={e => setF('bannerCtaLink', e.target.value)} placeholder="/category/rings" />
                <Toggle label="Show" checked={form.bannerActive} onChange={e => setF('bannerActive', e.target.checked)} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Product Assignment Modal */}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {prodTarget && (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: -1 }}>{prodTarget.title}</Typography>
          )}

          {/* Search input */}
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', color: 'text.disabled', display: 'flex' }}>
              <Search size={15} />
            </Box>
            <Box
              component="input"
              value={prodSearch}
              onChange={e => setProdSearch(e.target.value)}
              placeholder="Type product name…"
              sx={{
                width: '100%', pl: 5, pr: 2, py: 1.25, fontSize: 14,
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                bgcolor: 'background.paper', color: 'text.primary',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                '&:focus': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
                '&::placeholder': { color: 'text.disabled' },
              }}
            />
          </Box>

          {/* Autocomplete dropdown */}
          {productOptions.length > 0 && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mt: -1 }}>
              {productOptions.map(p => (
                <Box
                  key={p._id}
                  component="button"
                  onClick={() => addProduct(p)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, width: '100%',
                    px: 1.5, py: 1.25, textAlign: 'left', background: 'none', border: 'none',
                    borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer',
                    '&:last-child': { border: 0 },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {p.images?.[0] && <Box component="img" src={p.images[0]} alt="" sx={{ width: 36, height: 36, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>AED {p.price} · {p.category}</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}

          {/* Hot-deal suggestions */}
          {(loadingSuggestions || suggestions.length > 0) && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <Flame size={14} style={{ color: '#ef4444' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'error.main' }}>Suggested — 50%+ Discount</Typography>
                {loadingSuggestions && <Spinner size="xs" />}
              </Box>
              {!loadingSuggestions && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {suggestions.map(p => (
                    <Box
                      key={p._id}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
                        borderRadius: 2, border: '1px dashed', borderColor: 'rgba(239,68,68,0.3)',
                        bgcolor: 'rgba(239,68,68,0.04)',
                      }}
                    >
                      {p.images?.[0] && <Box component="img" src={p.images[0]} alt="" sx={{ width: 32, height: 32, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          AED {p.price}
                          {p.originalPrice && <Box component="span" sx={{ textDecoration: 'line-through', ml: 1, color: 'text.disabled' }}>AED {p.originalPrice}</Box>}
                        </Typography>
                      </Box>
                      <Box sx={{ flexShrink: 0 }}><Badge variant="danger">-{p.discount}%</Badge></Box>
                      <IconBtn icon={PlusCircle} label="Add to offer" size="sm" variant="ghost" sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' } }} onClick={() => addProduct(p)} />
                    </Box>
                  ))}
                </Box>
              )}
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1.5 }} />
            </Box>
          )}

          {/* Assigned product list */}
          {assignedProducts.length === 0 ? (
            <Typography sx={{ fontSize: 13, textAlign: 'center', color: 'text.disabled', py: 3 }}>
              No products assigned yet. Search above to add.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {assignedProducts.map((entry, idx) => {
                const p = entry.product;
                return (
                  <Paper
                    key={p._id || idx}
                    elevation={0}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.25,
                      borderRadius: 2.5, border: '1px solid',
                      borderColor: entry.featured ? 'rgba(245,158,11,0.4)' : 'divider',
                      bgcolor: entry.featured ? 'rgba(245,158,11,0.04)' : 'transparent',
                      opacity: entry.enabled ? 1 : 0.4, transition: 'opacity 0.15s',
                    }}
                  >
                    {/* Reorder */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <IconBtn icon={ArrowUp} label="Move up" size="xs" onClick={() => moveProduct(idx, -1)} disabled={idx === 0} />
                      <IconBtn icon={ArrowDown} label="Move down" size="xs" onClick={() => moveProduct(idx, 1)} disabled={idx === assignedProducts.length - 1} />
                    </Box>

                    {p.images?.[0] && <Box component="img" src={p.images[0]} alt="" sx={{ width: 36, height: 36, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name || '—'}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>AED {p.price} · #{idx + 1}</Typography>
                    </Box>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <IconBtn
                        icon={Star}
                        label={entry.featured ? 'Remove featured' : 'Mark as featured'}
                        size="sm"
                        variant="ghost"
                        sx={{ color: entry.featured ? '#f59e0b' : 'text.disabled' }}
                        onClick={() => toggleProductProp(idx, 'featured')}
                      />
                      <IconBtn
                        icon={entry.enabled ? Eye : EyeOff}
                        label={entry.enabled ? 'Hide product' : 'Show product'}
                        size="sm"
                        variant="ghost"
                        sx={{ color: entry.enabled ? 'primary.main' : 'text.disabled' }}
                        onClick={() => toggleProductProp(idx, 'enabled')}
                      />
                      <IconBtn
                        icon={MinusCircle}
                        label="Remove from offer"
                        size="sm"
                        variant="ghost"
                        sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
                        onClick={() => removeProduct(idx)}
                      />
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Modal>

      {/* Delete Confirm */}
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
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Delete <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>{deleteTarget?.title}</Box>? This cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
