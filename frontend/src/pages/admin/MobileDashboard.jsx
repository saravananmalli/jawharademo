import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel, CircularProgress, Tooltip, Paper, Chip, Skeleton,
  Tabs, Tab, Divider,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import ImageIcon         from '@mui/icons-material/Image';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PhoneAndroidIcon  from '@mui/icons-material/PhoneAndroid';
import StarIcon          from '@mui/icons-material/Star';
import CheckIcon         from '@mui/icons-material/Check';
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome';
import ImageUploader     from '../../components/admin/ImageUploader';
import api               from '../../services/api';
import { getImageUrl }   from '../../utils/imageUrl';

const SECTION_HINTS = {
  banner_slider: 'Full-width sliding banners at the top of the home screen. Landscape images (1080×540 px) recommended.',
  categories:    'Category quick-links shown as icon tiles. Square thumbnails (400×400 px) recommended.',
  offers:        'Limited-time promotional offer cards with discount badges and CTA buttons.',
  collections:   'Curated jewellery collection cards (Gold Ring, Everyday Studs, etc.).',
  most_loved:    'Best-selling and most popular products shown on the mobile home screen.',
  gifting:       'Gift-idea cards and gifting collection banners.',
  trending:      'Currently trending styles and designs.',
  moodboard:     'Seasonal style moodboard images (e.g. "Your June Style Moodboard").',
  iconic:        'Brand-defining iconic collection tiles.',
  best_sellers:  'Wide banners showcasing diamond best sellers.',
  stories:       'Customer reviews and testimonials. Title = customer name · Badge = star rating (1–5) · Description = review text.',
};

const EMPTY_ITEM = {
  title: '', subtitle: '', description: '',
  imageUrl: '', ctaText: '', ctaLink: '', badge: '', active: true,
};

const SORT_TABS = [
  { value: 'purchased', label: 'Most Purchased' },
  { value: 'rated',     label: 'Highest Rated'  },
  { value: 'newest',    label: 'Newest'          },
];

// ── Most Loved: Product Suggestion Panel ─────────────────────────────────────

function ProductSuggestionPanel({ existingItems, onAdd }) {
  const [sortBy,       setSortBy]       = useState('purchased');
  const [category,     setCategory]     = useState('all');
  const [categories,   setCategories]   = useState([]);
  const [suggestions,  setSuggestions]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [adding,       setAdding]       = useState(null); // product _id being added

  const existingProductIds = new Set(
    existingItems.map(x => x.productId).filter(Boolean)
  );

  // Load categories once
  useEffect(() => {
    api.get('/admin/products/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // Load suggestions whenever sortBy or category changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/admin/products/suggestions', { params: { sortBy, category, limit: 24 } })
      .then(({ data }) => { if (!cancelled) setSuggestions(data.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sortBy, category]);

  const handleAdd = async (product) => {
    setAdding(product._id);
    await onAdd(product);
    setAdding(null);
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
      {/* Panel header */}
      <Box sx={{
        px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1,
        bgcolor: 'primary.50',
      }}>
        <AutoAwesomeIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>Product Suggestions</Typography>
          <Typography variant="caption" color="text.secondary">
            Pick products to feature in the Most Loved section. Click Add to pin them to the mobile view.
          </Typography>
        </Box>
      </Box>

      {/* Sort tabs */}
      <Box sx={{ px: 2, pt: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={sortBy}
          onChange={(_, v) => setSortBy(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: '0.78rem', py: 0 } }}
        >
          {SORT_TABS.map(t => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>
      </Box>

      {/* Category filter chips */}
      <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 0.75, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
        {['all', ...categories].map(cat => (
          <Chip
            key={cat}
            label={cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            size="small"
            variant={category === cat ? 'filled' : 'outlined'}
            color={category === cat ? 'primary' : 'default'}
            onClick={() => setCategory(cat)}
            sx={{ fontSize: '0.72rem', cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Product grid */}
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Grid container spacing={1.5}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Box sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <Skeleton variant="rectangular" height={110} />
                  <Box sx={{ p: 1 }}>
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="50%" height={12} sx={{ mt: 0.5 }} />
                    <Skeleton variant="rounded" width="100%" height={28} sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : suggestions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
            <ImageIcon sx={{ fontSize: 36, mb: 1 }} />
            <Typography variant="body2">No products found for this filter.</Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {suggestions.map(product => {
              const alreadyAdded = existingProductIds.has(product._id);
              const isAdding     = adding === product._id;
              const imgSrc       = getImageUrl(product.images?.[0]);

              return (
                <Grid item xs={6} sm={4} md={3} key={product._id}>
                  <Box sx={{
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: alreadyAdded ? 'success.main' : 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'border-color 0.2s',
                    bgcolor: alreadyAdded ? 'success.50' : 'background.paper',
                  }}>
                    {/* Thumbnail */}
                    <Box sx={{ position: 'relative', height: 110, bgcolor: 'action.hover', flexShrink: 0 }}>
                      {imgSrc ? (
                        <Box
                          component="img"
                          src={imgSrc}
                          alt={product.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled' }}>
                          <ImageIcon />
                        </Box>
                      )}
                      {/* Badge */}
                      {product.badge && (
                        <Chip
                          label={product.badge}
                          size="small"
                          sx={{
                            position: 'absolute', top: 5, left: 5,
                            fontSize: '0.6rem', fontWeight: 700,
                            bgcolor: 'primary.main', color: '#fff',
                            height: 18,
                          }}
                        />
                      )}
                      {/* Already added tick */}
                      {alreadyAdded && (
                        <Box sx={{
                          position: 'absolute', top: 5, right: 5,
                          bgcolor: 'success.main', borderRadius: '50%',
                          width: 20, height: 20,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CheckIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />
                        </Box>
                      )}
                      {/* Sold count badge for "purchased" sort */}
                      {sortBy === 'purchased' && product.soldCount > 0 && (
                        <Box sx={{
                          position: 'absolute', bottom: 5, right: 5,
                          bgcolor: 'rgba(0,0,0,0.65)', color: '#fff',
                          px: 0.6, py: 0.1, borderRadius: 0.75,
                          fontSize: '0.62rem', fontWeight: 700,
                        }}>
                          {product.soldCount} sold
                        </Box>
                      )}
                    </Box>

                    {/* Info */}
                    <Box sx={{ p: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" fontWeight={700} sx={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        lineHeight: 1.3, mb: 0.25,
                      }}>
                        {product.name}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {product.category}
                      </Typography>

                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                        {product.rating > 0 && (
                          <>
                            <StarIcon sx={{ fontSize: '0.7rem', color: 'warning.main' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                              {product.rating.toFixed(1)}
                            </Typography>
                            {product.reviewCount > 0 && (
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>
                                ({product.reviewCount})
                              </Typography>
                            )}
                          </>
                        )}
                      </Stack>

                      <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mt: 0.25 }}>
                        AED {product.price?.toLocaleString()}
                      </Typography>

                      <Button
                        size="small"
                        variant={alreadyAdded ? 'outlined' : 'contained'}
                        color={alreadyAdded ? 'success' : 'primary'}
                        startIcon={alreadyAdded ? <CheckIcon /> : isAdding ? null : <AddIcon />}
                        disabled={alreadyAdded || isAdding}
                        onClick={() => handleAdd(product)}
                        sx={{ mt: 'auto', pt: 0.75, fontSize: '0.68rem', minHeight: 28 }}
                        fullWidth
                      >
                        {isAdding ? <CircularProgress size={14} /> : alreadyAdded ? 'Added' : 'Add'}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MobileDashboard() {
  const [sections, setSections]         = useState([]);
  const [activeKey, setActiveKey]       = useState(null);
  const [items, setItems]               = useState({});
  const [loadingSec, setLoadingSec]     = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_ITEM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const dragItemRef                     = useRef(null);
  const dragSecRef                      = useRef(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Sections ──────────────────────────────────────────────────────────────

  const loadSections = useCallback(async () => {
    try {
      setLoadingSec(true);
      const { data } = await api.get('/admin/dashboard-sections');
      const secs = data.data || [];
      setSections(secs);
      if (secs.length > 0) setActiveKey(k => k || secs[0].key);
    } catch {
      setError('Failed to load dashboard sections.');
    } finally {
      setLoadingSec(false);
    }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  const toggleSection = async (e, sec) => {
    e.stopPropagation();
    try {
      await api.put(`/admin/dashboard-sections/${sec._id}`, { enabled: !sec.enabled });
      setSections(prev => prev.map(s => s._id === sec._id ? { ...s, enabled: !s.enabled } : s));
    } catch {
      setError('Could not update section.');
    }
  };

  const handleSecDragStart = (index) => { dragSecRef.current = index; };
  const handleSecDrop = async (dropIndex) => {
    if (dragSecRef.current === null || dragSecRef.current === dropIndex) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(dragSecRef.current, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    setSections(withOrder);
    dragSecRef.current = null;
    try {
      await api.put('/admin/dashboard-sections/reorder', {
        items: withOrder.map(s => ({ _id: s._id, order: s.order })),
      });
    } catch {
      setError('Section reorder failed.');
    }
  };

  // ── Items ─────────────────────────────────────────────────────────────────

  const loadItems = useCallback(async (sectionKey) => {
    try {
      setLoadingItems(true);
      const { data } = await api.get('/admin/mobile-assets', {
        params: { screen: 'dashboard', section: sectionKey },
      });
      setItems(prev => ({ ...prev, [sectionKey]: data.data || [] }));
    } catch {
      setError('Failed to load items.');
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const selectSection = (key) => {
    setActiveKey(key);
    if (!items[key]) loadItems(key);
  };

  useEffect(() => {
    if (activeKey && !items[activeKey]) loadItems(activeKey);
  }, [activeKey, items, loadItems]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_ITEM, order: (items[activeKey]?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      title:       item.title       || '',
      subtitle:    item.subtitle    || '',
      description: item.description || '',
      imageUrl:    item.imageUrl    || '',
      ctaText:     item.ctaText     || '',
      ctaLink:     item.ctaLink     || '',
      badge:       item.badge       || '',
      active:      item.active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, screen: 'dashboard', section: activeKey, slot: activeKey };
      if (editTarget) {
        await api.put(`/admin/mobile-assets/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/mobile-assets', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Item updated.' : 'Item added.');
      setTimeout(() => setSuccess(''), 3000);
      setItems(prev => { const n = { ...prev }; delete n[activeKey]; return n; });
      loadItems(activeKey);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // Add a product directly from the suggestion panel into Most Loved
  const handleAddFromSuggestion = async (product) => {
    try {
      const currentCount = items[activeKey]?.length || 0;
      const payload = {
        screen:      'dashboard',
        section:     'most_loved',
        slot:        'most_loved',
        productId:   product._id,
        title:       product.name,
        subtitle:    `AED ${product.price?.toLocaleString() || ''}`,
        imageUrl:    product.images?.[0] || '',
        ctaText:     'Shop Now',
        ctaLink:     `/product/${product._id}`,
        badge:       product.badge || '',
        active:      true,
        order:       currentCount + 1,
      };
      await api.post('/admin/mobile-assets', payload);
      setSuccess(`"${product.name}" added to Most Loved.`);
      setTimeout(() => setSuccess(''), 3000);
      setItems(prev => { const n = { ...prev }; delete n['most_loved']; return n; });
      loadItems('most_loved');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add product.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/mobile-assets/${deleteTarget._id}`);
      setItems(prev => ({
        ...prev,
        [activeKey]: (prev[activeKey] || []).filter(x => x._id !== deleteTarget._id),
      }));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  const toggleItemActive = async (item) => {
    try {
      await api.put(`/admin/mobile-assets/${item._id}`, { active: !item.active });
      setItems(prev => ({
        ...prev,
        [activeKey]: (prev[activeKey] || []).map(x =>
          x._id === item._id ? { ...x, active: !x.active } : x
        ),
      }));
    } catch {
      setError('Could not update item.');
    }
  };

  const handleItemDragStart = (index) => { dragItemRef.current = index; };
  const handleItemDrop = async (dropIndex) => {
    if (dragItemRef.current === null || dragItemRef.current === dropIndex) return;
    const sectionItems = [...(items[activeKey] || [])];
    const [moved] = sectionItems.splice(dragItemRef.current, 1);
    sectionItems.splice(dropIndex, 0, moved);
    const withOrder = sectionItems.map((item, i) => ({ ...item, order: i + 1 }));
    setItems(prev => ({ ...prev, [activeKey]: withOrder }));
    dragItemRef.current = null;
    try {
      await api.put('/admin/mobile-assets/reorder', {
        items: withOrder.map(x => ({ _id: x._id, order: x.order })),
      });
    } catch {
      setError('Reorder failed — please reload.');
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeSection = sections.find(s => s.key === activeKey);
  const activeItems   = items[activeKey] || [];
  const isStories     = activeKey === 'stories';
  const isMostLoved   = activeKey === 'most_loved';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <PhoneAndroidIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="h5" fontWeight={800}>Mobile App Dashboard</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Manage every section of the mobile app home screen. Toggle sections on/off, reorder them, and add or edit items within each section. Changes are immediately available via the API.
        </Typography>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loadingSec && sections.length === 0 ? (
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
          <Paper variant="outlined" sx={{ width: 248, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Skeleton width={80} height={18} />
              <Skeleton width={160} height={14} sx={{ mt: 0.5 }} />
            </Box>
            {Array.from({ length: 9 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton width={14} height={14} />
                <Skeleton width="60%" height={16} sx={{ flex: 1 }} />
                <Skeleton variant="rounded" width={32} height={18} />
              </Box>
            ))}
          </Paper>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box><Skeleton width={140} height={24} /><Skeleton width={200} height={16} sx={{ mt: 0.5 }} /></Box>
              <Skeleton variant="rounded" width={96} height={36} />
            </Box>
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} lg={4} key={i}>
                  <Card><Skeleton variant="rectangular" height={140} /><CardContent><Skeleton width="70%" height={16} /><Skeleton width="45%" height={14} sx={{ mt: 0.5 }} /></CardContent></Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>

          {/* ── Left: section list ──────────────────────────────────────── */}
          <Paper
            variant="outlined"
            sx={{ width: 248, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700}>Sections</Typography>
              <Typography variant="caption" color="text.secondary">Drag to reorder · toggle to show/hide</Typography>
            </Box>

            {sections.map((sec, idx) => (
              <Box
                key={sec._id}
                draggable
                onDragStart={() => handleSecDragStart(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleSecDrop(idx)}
                onClick={() => selectSection(sec.key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.85,
                  cursor: 'pointer',
                  borderLeft: '3px solid',
                  borderLeftColor: activeKey === sec.key ? 'primary.main' : 'transparent',
                  bgcolor: activeKey === sec.key ? 'action.selected' : 'transparent',
                  borderBottom: idx < sections.length - 1 ? '1px solid' : 'none',
                  borderBottomColor: 'divider',
                  transition: 'background-color 0.12s',
                  '&:hover': { bgcolor: activeKey === sec.key ? 'action.selected' : 'action.hover' },
                }}
              >
                <DragIndicatorIcon sx={{ fontSize: '0.95rem', color: 'text.disabled', cursor: 'grab', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={activeKey === sec.key ? 700 : 400} noWrap sx={{ lineHeight: 1.3 }}>
                    {sec.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {items[sec.key] !== undefined ? `${items[sec.key].length} item${items[sec.key].length !== 1 ? 's' : ''}` : '—'}
                  </Typography>
                </Box>
                <Tooltip title={sec.enabled ? 'Hide section in app' : 'Show section in app'}>
                  <Switch
                    size="small"
                    checked={sec.enabled}
                    onChange={(e) => toggleSection(e, sec)}
                    onClick={e => e.stopPropagation()}
                    color="primary"
                    sx={{ flexShrink: 0 }}
                  />
                </Tooltip>
              </Box>
            ))}
          </Paper>

          {/* ── Right: item management ──────────────────────────────────── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {activeSection ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight={700}>{activeSection.label}</Typography>
                      {!activeSection.enabled && (
                        <Chip label="Hidden in app" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {SECTION_HINTS[activeSection.key] || ''}
                    </Typography>
                  </Box>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                    Add Item
                  </Button>
                </Box>

                {/* ── Most Loved: product suggestion panel ── */}
                {isMostLoved && (
                  <ProductSuggestionPanel
                    existingItems={activeItems}
                    onAdd={handleAddFromSuggestion}
                  />
                )}

                {/* ── Section: pinned items label (Most Loved only) ── */}
                {isMostLoved && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Pinned Items ({activeItems.length})
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Drag to reorder · toggle to show/hide
                    </Typography>
                  </Box>
                )}

                {loadingItems && !(items[activeKey]?.length > 0) ? (
                  <Grid container spacing={2}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Grid item xs={12} sm={6} lg={4} key={i}>
                        <Card><Skeleton variant="rectangular" height={140} /><CardContent><Skeleton width="70%" height={16} /><Skeleton width="45%" height={14} sx={{ mt: 0.5 }} /></CardContent></Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : activeItems.length === 0 ? (
                  <Box sx={{
                    textAlign: 'center', py: 8, color: 'text.disabled',
                    border: '2px dashed', borderColor: 'divider', borderRadius: 2,
                  }}>
                    <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="h6">No items yet</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {isMostLoved
                        ? 'Use the Product Suggestions panel above to add products, or click Add Item to add manually.'
                        : <>Add the first item for the <strong>{activeSection.label}</strong> section.</>
                      }
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Item</Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {activeItems.map((item, index) => (
                      <Grid item xs={12} sm={6} lg={4} key={item._id}>
                        <Card
                          draggable
                          onDragStart={() => handleItemDragStart(index)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleItemDrop(index)}
                          sx={{
                            height: '100%', display: 'flex', flexDirection: 'column',
                            cursor: 'grab', '&:active': { cursor: 'grabbing' },
                            opacity: item.active ? 1 : 0.55,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {/* Thumbnail */}
                          <Box sx={{
                            height: 140, bgcolor: 'action.hover',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', overflow: 'hidden', flexShrink: 0,
                          }}>
                            {item.imageUrl ? (
                              <Box
                                component="img"
                                src={getImageUrl(item.imageUrl)}
                                alt={item.title}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                                <ImageIcon sx={{ fontSize: 36 }} />
                                <Typography variant="caption" display="block">No image</Typography>
                              </Box>
                            )}
                            <Box sx={{
                              position: 'absolute', top: 6, left: 6,
                              bgcolor: 'rgba(0,0,0,0.6)', color: '#fff',
                              px: 0.75, py: 0.2, borderRadius: 0.75,
                              fontSize: '0.68rem', fontWeight: 700,
                            }}>
                              #{index + 1}
                            </Box>
                            <Box sx={{ position: 'absolute', top: 6, right: 6, color: 'rgba(255,255,255,0.75)' }}>
                              <DragIndicatorIcon fontSize="small" />
                            </Box>
                            {item.badge && (
                              <Chip
                                label={item.badge}
                                size="small"
                                sx={{
                                  position: 'absolute', bottom: 6, left: 6,
                                  fontSize: '0.65rem', bgcolor: 'primary.main',
                                  color: '#fff', fontWeight: 700,
                                }}
                              />
                            )}
                          </Box>

                          {/* Card body */}
                          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                              {item.title || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No title</span>}
                            </Typography>
                            {item.subtitle && (
                              <Typography variant="caption" color="text.secondary" noWrap>{item.subtitle}</Typography>
                            )}
                            {item.description && (
                              <Typography variant="caption" color="text.disabled" sx={{
                                mt: 0.25,
                                display: '-webkit-box', WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              }}>
                                {item.description}
                              </Typography>
                            )}
                            {item.ctaText && (
                              <Typography variant="caption" color="primary" sx={{ mt: 0.25 }}>
                                CTA: {item.ctaText}
                              </Typography>
                            )}

                            <Stack direction="row" spacing={0.75} sx={{ mt: 'auto', pt: 1, alignItems: 'center' }}>
                              <Button
                                size="small" variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => openEdit(item)}
                                sx={{ flex: 1, fontSize: '0.72rem' }}
                              >
                                Edit
                              </Button>
                              <Tooltip title={item.active ? 'Hide item' : 'Show item'}>
                                <Switch size="small" checked={item.active} onChange={() => toggleItemActive(item)} />
                              </Tooltip>
                              <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, color: 'text.disabled' }}>
                <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2">Select a section from the left to manage its items</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ── Add / Edit dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget ? 'Edit Item' : 'Add Item'}
          {activeSection && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              Section: {activeSection.label}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
                {isStories ? 'Customer Avatar (optional)' : 'Image *'}
              </Typography>
              <ImageUploader
                images={form.imageUrl ? [form.imageUrl] : []}
                onChange={urls => setF('imageUrl', urls[0] || '')}
                maxImages={1}
                category="mobile"
                single
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isStories ? 'Customer Name *' : 'Title'}
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                autoFocus
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={isStories ? 'Star Rating (1–5)' : 'Badge / Label'}
                value={form.badge}
                onChange={e => setF('badge', e.target.value)}
                placeholder={isStories ? 'e.g. 5' : 'e.g. BEST SELL · 50% OFF'}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subtitle"
                value={form.subtitle}
                onChange={e => setF('subtitle', e.target.value)}
                placeholder="Short supporting text shown below the title"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth multiline minRows={2}
                label={isStories ? 'Review Text' : 'Description'}
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder={isStories ? 'What the customer said…' : 'Additional detail or promotional copy'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CTA Button Text"
                value={form.ctaText}
                onChange={e => setF('ctaText', e.target.value)}
                placeholder="e.g. Shop Now · Explore"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CTA Link / Deep Link"
                value={form.ctaLink}
                onChange={e => setF('ctaLink', e.target.value)}
                placeholder="e.g. /category/rings"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.active} onChange={e => setF('active', e.target.checked)} color="primary" />}
                label="Active (visible in app)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (!isStories && !form.imageUrl)}
          >
            {saving ? 'Saving…' : editTarget ? 'Update' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm dialog ───────────────────────────────────────── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Item?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete <strong>{deleteTarget?.title || 'this item'}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
