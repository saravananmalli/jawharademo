import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel, CircularProgress, Tooltip, Paper, Chip,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import ImageIcon         from '@mui/icons-material/Image';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PhoneAndroidIcon  from '@mui/icons-material/PhoneAndroid';
import ImageUploader     from '../../components/admin/ImageUploader';
import api               from '../../services/api';
import { getImageUrl }   from '../../utils/imageUrl';

const SECTION_HINTS = {
  banner_slider: 'Full-width sliding banners at the top of the home screen. Landscape images (1080×540 px) recommended.',
  categories:    'Category quick-links shown as icon tiles. Square thumbnails (400×400 px) recommended.',
  offers:        'Limited-time promotional offer cards with discount badges and CTA buttons.',
  collections:   'Curated jewellery collection cards (Gold Ring, Everyday Studs, etc.).',
  most_loved:    'Best-selling and most popular products or collections.',
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

export default function MobileDashboard() {
  const [sections, setSections]         = useState([]);
  const [activeKey, setActiveKey]       = useState(null);
  const [items, setItems]               = useState({});
  const [loadingSec, setLoadingSec]     = useState(true);
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
      // Invalidate cache for this section so it reloads
      setItems(prev => { const n = { ...prev }; delete n[activeKey]; return n; });
      loadItems(activeKey);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
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

      {loadingSec ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
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

                {loadingItems ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : activeItems.length === 0 ? (
                  <Box sx={{
                    textAlign: 'center', py: 8, color: 'text.disabled',
                    border: '2px dashed', borderColor: 'divider', borderRadius: 2,
                  }}>
                    <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="h6">No items yet</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Add the first item for the <strong>{activeSection.label}</strong> section.
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
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
