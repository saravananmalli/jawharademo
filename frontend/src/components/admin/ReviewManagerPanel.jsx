import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Stack, Rating,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Avatar,
  Alert, CircularProgress,
} from '@mui/material';
import AddIcon          from '@mui/icons-material/Add';
import EditIcon         from '@mui/icons-material/Edit';
import DeleteIcon       from '@mui/icons-material/Delete';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import api from '../../services/api';

const UAE_LOCATIONS = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
  'Fujairah', 'Umm Al Quwain', 'Al Ain',
  'Marina', 'Jumeirah', 'Business Bay', 'Silicon Oasis',
  'Yas Island', 'Khalifa City',
];

const BLANK = {
  userName: '', location: '', rating: 5, title: '', text: '',
  verified: false, featured: false, status: 'pending', avatar: '',
};

const STATUS_COLOR = { published: 'success', pending: 'warning', hidden: 'default' };

function ReviewForm({ value, onChange, isEdit }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <Stack spacing={2} sx={{ pt: 0.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField fullWidth size="small" label="Customer Name *" value={value.userName}
          onChange={e => set('userName', e.target.value)} />
        <FormControl fullWidth size="small">
          <InputLabel>Location (UAE)</InputLabel>
          <Select
            label="Location (UAE)"
            value={value.location}
            onChange={e => set('location', e.target.value)}
          >
            <MenuItem value=""><em>Select city…</em></MenuItem>
            {UAE_LOCATIONS.map(loc => (
              <MenuItem key={loc} value={loc}>{loc}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Rating *
        </Typography>
        <Rating
          value={value.rating}
          onChange={(_, v) => set('rating', v || 1)}
          precision={0.5}
          size="large"
        />
      </Box>

      <TextField fullWidth size="small" label="Review Title"
        value={value.title} onChange={e => set('title', e.target.value)}
        placeholder="e.g. Absolutely stunning!" />

      <TextField fullWidth multiline rows={3} size="small" label="Review Text *"
        value={value.text} onChange={e => set('text', e.target.value)} />

      <TextField fullWidth size="small" label="Customer Avatar URL (optional)"
        value={value.avatar} onChange={e => set('avatar', e.target.value)}
        placeholder="https://..." />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
        {isEdit ? (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={value.status} onChange={e => set('status', e.target.value)}>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="hidden">Hidden</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <Chip
            label="Status: Pending"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: '0.75rem', height: 28 }}
          />
        )}
        <FormControlLabel
          control={<Switch checked={value.verified} onChange={e => set('verified', e.target.checked)} size="small" />}
          label="Verified Purchase"
        />
        <FormControlLabel
          control={<Switch checked={value.featured} onChange={e => set('featured', e.target.checked)} size="small" />}
          label="Featured"
        />
      </Stack>

      {!isEdit && (
        <Typography variant="caption" color="text.secondary">
          New reviews are saved as <strong>Pending</strong>. Approve them from the Reviews management page.
        </Typography>
      )}
    </Stack>
  );
}

export default function ReviewManagerPanel({ productId }) {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData]     = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [flash, setFlash]           = useState(null);

  const showFlash = (msg, severity = 'success') => {
    setFlash({ msg, severity });
    setTimeout(() => setFlash(null), 3000);
  };

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/reviews?product=${productId}&limit=50`);
      setReviews(data.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const openAdd = () => {
    setEditTarget(null);
    setFormData(BLANK);
    setDialogOpen(true);
  };

  const openEdit = (r) => {
    setEditTarget(r._id);
    setFormData({
      userName: r.userName,
      location: r.location || '',
      rating: r.rating,
      title: r.title || '',
      text: r.text,
      verified: r.verified,
      featured: r.featured || false,
      status: r.status || 'published',
      avatar: r.avatar || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.userName.trim() || !formData.text.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/admin/reviews/${editTarget}`, formData);
        showFlash('Review updated.');
      } else {
        await api.post('/admin/reviews', { ...formData, productId });
        showFlash('Review added.');
      }
      setDialogOpen(false);
      loadReviews();
    } catch {
      showFlash('Failed to save review.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/admin/reviews/${id}`, { status });
      showFlash(`Review ${status}.`);
      loadReviews();
    } catch {
      showFlash('Failed to update status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      showFlash('Review deleted.');
      loadReviews();
    } catch {
      showFlash('Failed to delete.', 'error');
    }
  };

  const published = reviews.filter(r => r.status === 'published').length;
  const pending   = reviews.filter(r => r.status === 'pending').length;

  return (
    <Box>
      {/* Header row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight={700}>
            Reviews ({reviews.length})
          </Typography>
          {published > 0 && (
            <Chip label={`${published} published`} size="small" color="success" sx={{ height: 20, fontSize: '0.68rem' }} />
          )}
          {pending > 0 && (
            <Chip label={`${pending} pending`} size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem' }} />
          )}
        </Stack>
        <Button
          size="small" variant="contained" startIcon={<AddIcon />}
          onClick={openAdd} disabled={!productId}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Add Review
        </Button>
      </Stack>

      {flash && <Alert severity={flash.severity} sx={{ mb: 1.5 }}>{flash.msg}</Alert>}

      {!productId && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Save the product first to manage reviews.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : reviews.length === 0 ? (
        <Box sx={{
          py: 3, textAlign: 'center',
          border: '1px dashed', borderColor: 'divider', borderRadius: 2,
        }}>
          <Typography variant="body2" color="text.secondary">
            {productId ? 'No reviews yet. Add the first one!' : 'Reviews will appear here.'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {reviews.map(r => (
            <Card key={r._id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  {/* Left: author info */}
                  <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                    <Avatar
                      src={r.avatar || undefined}
                      sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'primary.main', flexShrink: 0 }}
                    >
                      {r.userInitial || r.userName?.[0]}
                    </Avatar>
                    <Box minWidth={0}>
                      <Typography variant="body2" fontWeight={700} noWrap>{r.userName}</Typography>
                      {r.location && (
                        <Typography variant="caption" color="text.secondary" noWrap>{r.location}</Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Right: status + actions */}
                  <Stack direction="row" spacing={0.25} alignItems="center" flexShrink={0}>
                    <Chip
                      label={r.status}
                      size="small"
                      color={STATUS_COLOR[r.status] || 'default'}
                      sx={{ height: 20, fontSize: '0.67rem' }}
                    />
                    {r.status !== 'published' && (
                      <Tooltip title="Publish">
                        <IconButton size="small" color="success" onClick={() => handleStatus(r._id, 'published')}>
                          <CheckCircleIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {r.status === 'published' && (
                      <Tooltip title="Hide">
                        <IconButton size="small" color="warning" onClick={() => handleStatus(r._id, 'hidden')}>
                          <VisibilityOffIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(r)}>
                        <EditIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(r._id)}>
                        <DeleteIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Rating value={r.rating} readOnly size="small" precision={0.5} sx={{ mt: 0.75 }} />
                {r.title && (
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{r.title}</Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.8rem', lineHeight: 1.5 }}>
                  {r.text}
                </Typography>

                <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap">
                  {r.verified && (
                    <Chip label="Verified" size="small" variant="outlined" color="primary"
                      sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                  {r.featured && (
                    <Chip label="Featured" size="small" variant="outlined" color="secondary"
                      sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editTarget ? 'Edit Review' : 'Add Review'}
        </DialogTitle>
        <DialogContent dividers>
          <ReviewForm value={formData} onChange={setFormData} isEdit={!!editTarget} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.userName.trim() || !formData.text.trim()}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {saving ? 'Saving…' : (editTarget ? 'Update Review' : 'Add Review')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
