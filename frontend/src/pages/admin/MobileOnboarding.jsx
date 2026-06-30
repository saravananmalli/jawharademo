import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Image, GripVertical, Smartphone } from 'lucide-react';
import { Box, Paper, Grid, Typography, Switch, IconButton } from '@mui/material';
import {
  Button, IconBtn, Input, Textarea, Toggle,
  Modal, Skeleton,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api           from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const EMPTY = { title: '', description: '', imageUrl: '', order: 1, active: true };

export default function MobileOnboarding() {
  const [slides, setSlides]             = useState([]);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Smartphone size={22} style={{ opacity: 0.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Onboarding Screens</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {slides.length} slide{slides.length !== 1 ? 's' : ''} — drag cards to reorder · recommended size: 1080 × 1920 px
          </Typography>
        </Box>
        <Button icon={Plus} onClick={openAdd}>Add Slide</Button>
      </Box>

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

      {loading && slides.length === 0 ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Skeleton height={224} sx={{ borderRadius: 0 }} />
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton height={16} width="75%" />
                  <Skeleton height={12} width="50%" />
                  <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
                    <Skeleton width={28} height={28} sx={{ borderRadius: '50%' }} />
                    <Skeleton width={28} height={28} sx={{ borderRadius: '50%' }} />
                    <Skeleton width={28} height={28} sx={{ borderRadius: '50%' }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : slides.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <Box sx={{ color: 'text.disabled', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Smartphone size={52} />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>No onboarding slides yet</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.disabled', mb: 2.5 }}>
            Add slides that appear when a user first opens the mobile app.
          </Typography>
          <Button icon={Plus} onClick={openAdd}>Add First Slide</Button>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
          {slides.map((s, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s._id}>
              <Paper
                elevation={0}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                sx={{
                  borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  cursor: 'grab', '&:active': { cursor: 'grabbing' },
                  '&:hover': { boxShadow: 3 }, transition: 'box-shadow 0.2s',
                }}
              >
                {/* Portrait image */}
                <Box sx={{ height: 224, bgcolor: 'action.hover', position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.imageUrl ? (
                    <Box component="img" src={getImageUrl(s.imageUrl)} alt={s.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                      <Image size={40} />
                      <Typography sx={{ fontSize: 11, mt: 0.75 }}>No image</Typography>
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, px: 1, py: 0.25, borderRadius: 1 }}>
                    Slide {s.order}
                  </Box>
                  <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}>
                    <GripVertical size={16} />
                  </Box>
                  {!s.active && (
                    <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, px: 1, py: 0.25, borderRadius: 5 }}>
                      Hidden
                    </Box>
                  )}
                </Box>

                {/* Card content */}
                <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}>
                    {s.title || <Box component="em" sx={{ color: 'text.disabled', fontStyle: 'normal', fontWeight: 400 }}>No title</Box>}
                  </Typography>
                  {s.description && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                      {s.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 1 }}>
                    <Box
                      component="button"
                      onClick={() => openEdit(s)}
                      sx={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                        px: 1.5, py: 0.75, fontSize: 12, fontWeight: 500,
                        border: '1px solid', borderColor: 'divider', color: 'text.secondary',
                        borderRadius: 1.5, background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.15s',
                      }}
                    >
                      <Pencil size={11} /> Edit
                    </Box>
                    <Switch
                      size="small"
                      checked={s.active}
                      onChange={() => toggleActive(s)}
                      title={s.active ? 'Click to hide' : 'Click to show'}
                      sx={{ '& .MuiSwitch-thumb': { width: 12, height: 12 }, '& .MuiSwitch-track': { borderRadius: 8 } }}
                    />
                    <IconBtn icon={Trash2} size="sm" label="Delete" onClick={() => setDeleteTarget(s)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Slide' : 'Add Onboarding Slide'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving || !form.imageUrl}>
              {editTarget ? 'Update Slide' : 'Add Slide'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Slide Image * — portrait format recommended (1080 × 1920 px)
            </Typography>
            <ImageUploader images={form.imageUrl ? [form.imageUrl] : []} onChange={urls => setF('imageUrl', urls[0] || '')} maxImages={1} category="mobile" single />
          </Box>
          <Input label="Title" required value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. No hassle, try before you buy!" autoFocus />
          <Textarea label="Description" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="e.g. Shortlist your favourite design online and try it at home or visit your nearest store." rows={2} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'flex-end' }}>
            <Input label="Slide Order" type="number" value={form.order} onChange={e => setF('order', Number(e.target.value))} min={1} />
            <Toggle label="Active (visible in app)" checked={form.active} onChange={e => setF('active', e.target.checked)} />
          </Box>
        </Box>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Slide?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Delete slide <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>{deleteTarget?.order}</Box>? This cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
