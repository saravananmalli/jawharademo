import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel, CardMedia, CircularProgress, Tooltip,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import ImageIcon         from '@mui/icons-material/Image';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ViewCarouselIcon  from '@mui/icons-material/ViewCarousel';
import ImageUploader     from '../../components/admin/ImageUploader';
import api               from '../../services/api';

const EMPTY = { title: '', description: '', imageUrl: '', order: 1, active: true };

export default function MobileHomeBanner() {
  const [banners, setBanners]           = useState([]);
  const [loading, setLoading]           = useState(true);
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ViewCarouselIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h5" fontWeight={800}>Mobile Home Banners</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {banners.length} banner{banners.length !== 1 ? 's' : ''} — drag to reorder · recommended size: 1080 × 540 px
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Banner</Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : banners.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.disabled' }}>
          <ViewCarouselIcon sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h6">No mobile home banners yet</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            These banners appear at the top of the mobile app home screen. They are separate from the web app banners so you can use a portrait crop.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add First Banner</Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {banners.map((b, index) => (
            <Grid item xs={12} sm={6} lg={4} key={b._id}>
              <Card
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
              >
                <Box sx={{ height: 160, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
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
                  <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}>
                    <DragIndicatorIcon fontSize="small" />
                  </Box>
                </Box>

                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                    {b.title || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No title</span>}
                  </Typography>
                  {b.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(b)} sx={{ flex: 1 }}>Edit</Button>
                    <Tooltip title={b.active ? 'Click to hide' : 'Click to show'}>
                      <Switch size="small" checked={b.active} onChange={() => toggleActive(b)} color="primary" />
                    </Tooltip>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(b)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Home Banner' : 'Add Home Banner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                Banner Image * — landscape format recommended (1080 × 540 px)
              </Typography>
              <ImageUploader
                images={form.imageUrl ? [form.imageUrl] : []}
                onChange={urls => setF('imageUrl', urls[0] || '')}
                maxImages={1}
                category="mobile"
                single
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                placeholder="e.g. Summer Collection 2026"
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="e.g. Discover our latest jewellery designs"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={form.order}
                onChange={e => setF('order', Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={form.active} onChange={e => setF('active', e.target.checked)} color="primary" />}
                label="Active (visible in app)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.imageUrl}>
            {saving ? 'Saving…' : editTarget ? 'Update Banner' : 'Add Banner'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Banner?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete banner <strong>{deleteTarget?.title || `#${deleteTarget?.order}`}</strong>? This cannot be undone.
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
