import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Switch, FormControlLabel, CardMedia, CircularProgress, Tooltip, Skeleton,
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

const EMPTY = { title: '', description: '', imageUrl: '', order: 1, active: true };

export default function MobileOnboarding() {
  const [slides, setSlides]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const dragIndex = useRef(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/mobile-assets/onboarding');
      setSlides(res.data.data || []);
    } catch {
      setError('Failed to load onboarding slides.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY, order: slides.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({ title: s.title, description: s.description, imageUrl: s.imageUrl, order: s.order, active: s.active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, screen: 'onboarding', slot: 'slide' };
      if (editTarget) {
        await api.put(`/admin/mobile-assets/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/mobile-assets', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Slide updated.' : 'Slide added.');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/admin/mobile-assets/${s._id}`, { active: !s.active });
      setSlides(prev => prev.map(x => x._id === s._id ? { ...x, active: !x.active } : x));
    } catch {
      setError('Could not update slide status.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/mobile-assets/${deleteTarget._id}`);
      setSlides(prev => prev.filter(s => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  // Drag-to-reorder
  const handleDragStart = (index) => { dragIndex.current = index; };

  const handleDrop = async (dropIndex) => {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(withOrder);
    dragIndex.current = null;
    try {
      await api.put('/admin/mobile-assets/reorder', {
        items: withOrder.map(s => ({ _id: s._id, order: s.order })),
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
            <PhoneAndroidIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h5" fontWeight={800}>Onboarding Screens</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {slides.length} slide{slides.length !== 1 ? 's' : ''} — drag cards to reorder · recommended size: 1080 × 1920 px
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Slide</Button>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={220} />
                <CardContent>
                  <Skeleton width="70%" height={18} sx={{ mb: 0.75 }} />
                  <Skeleton width="50%" height={14} sx={{ mb: 1.5 }} />
                  <Stack direction="row" spacing={1}>
                    <Skeleton variant="circular" width={30} height={30} />
                    <Skeleton variant="circular" width={30} height={30} />
                    <Skeleton variant="circular" width={30} height={30} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : slides.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.disabled' }}>
          <PhoneAndroidIcon sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h6">No onboarding slides yet</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>Add slides that appear when a user first opens the mobile app.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add First Slide</Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {slides.map((s, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={s._id}>
              <Card
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
              >
                {/* Portrait image */}
                <Box sx={{ height: 220, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  {s.imageUrl ? (
                    <CardMedia component="img" src={getImageUrl(s.imageUrl)} alt={s.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                      <ImageIcon sx={{ fontSize: 44 }} />
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>No image</Typography>
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.72rem', fontWeight: 700 }}>
                    Slide {s.order}
                  </Box>
                  <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}>
                    <DragIndicatorIcon fontSize="small" />
                  </Box>
                </Box>

                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                    {s.title || <span style={{ color: '#aaa', fontStyle: 'italic' }}>No title</span>}
                  </Typography>
                  {s.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(s)} sx={{ flex: 1 }}>Edit</Button>
                    <Tooltip title={s.active ? 'Click to hide' : 'Click to show'}>
                      <Switch size="small" checked={s.active} onChange={() => toggleActive(s)} color="primary" />
                    </Tooltip>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(s)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Slide' : 'Add Onboarding Slide'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                Slide Image * — portrait format recommended (1080 × 1920 px)
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
                label="Title *"
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                placeholder="e.g. No hassle, try before you buy!"
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
                placeholder="e.g. Shortlist your favourite design online and try it at home or visit your nearest store."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Slide Order"
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
            {saving ? 'Saving…' : editTarget ? 'Update Slide' : 'Add Slide'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Slide?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Delete slide <strong>{deleteTarget?.order}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
