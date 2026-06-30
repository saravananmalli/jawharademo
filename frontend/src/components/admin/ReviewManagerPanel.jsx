import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, EyeOff, Star } from 'lucide-react';
import { Box, Paper, Typography, MenuItem } from '@mui/material';
import api from '../../services/api';
import { Modal } from './ui/Modal';
import { Button, IconBtn } from './ui/Button';
import { Input, Textarea, Select, Toggle } from './ui/Input';

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

const STATUS_DEF = {
  published: { bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  hidden:    { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
};

function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Box
          key={n}
          component="button"
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          sx={{ background: 'none', border: 'none', p: 0, cursor: readOnly ? 'default' : 'pointer' }}
        >
          <Star
            size={readOnly ? 13 : 20}
            style={{
              fill: n <= (hovered || value) ? '#fbbf24' : 'transparent',
              color: n <= (hovered || value) ? '#fbbf24' : '#d1d5db',
              transition: 'all 0.1s',
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

function FlashAlert({ flash }) {
  if (!flash) return null;
  const isError = flash.severity === 'error';
  return (
    <Paper elevation={0} sx={{
      display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderRadius: 2, mb: 1.5,
      border: '1px solid',
      bgcolor:     isError ? 'rgba(239,68,68,0.08)'  : 'rgba(16,185,129,0.08)',
      borderColor: isError ? 'rgba(239,68,68,0.3)'   : 'rgba(16,185,129,0.3)',
      color:       isError ? 'error.main'              : 'success.main',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'inherit' }}>{flash.msg}</Typography>
    </Paper>
  );
}

function ReviewForm({ value, onChange, isEdit }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <Input label="Customer Name" required value={value.userName} onChange={e => set('userName', e.target.value)} placeholder="e.g. Sara M." />
        <Select label="Location (UAE)" value={value.location} onChange={e => set('location', e.target.value)}>
          <MenuItem value="">Select city…</MenuItem>
          {UAE_LOCATIONS.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
        </Select>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>
          Rating <Box component="span" sx={{ color: 'error.main' }}>*</Box>
        </Typography>
        <StarRating value={value.rating} onChange={v => set('rating', v)} />
      </Box>

      <Input label="Review Title" value={value.title} onChange={e => set('title', e.target.value)} placeholder="Optional headline" />
      <Textarea label="Review Text" required rows={3} value={value.text} onChange={e => set('text', e.target.value)} placeholder="What did the customer say?" />

      {isEdit && (
        <Select label="Status" value={value.status} onChange={e => set('status', e.target.value)}>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="hidden">Hidden</MenuItem>
        </Select>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, pt: 0.5 }}>
        <Toggle label="Verified Purchase" checked={value.verified} onChange={e => set('verified', e.target.checked)} />
        <Toggle label="Featured" checked={value.featured} onChange={e => set('featured', e.target.checked)} />
      </Box>

      {!isEdit && (
        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
          New reviews are saved as <Box component="strong" sx={{ fontWeight: 600 }}>Pending</Box>. Approve them from the Reviews page.
        </Typography>
      )}
    </Box>
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
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const openAdd = () => { setEditTarget(null); setFormData(BLANK); setDialogOpen(true); };
  const openEdit = (r) => {
    setEditTarget(r._id);
    setFormData({ userName: r.userName, location: r.location || '', rating: r.rating, title: r.title || '', text: r.text, verified: r.verified, featured: r.featured || false, status: r.status || 'published', avatar: r.avatar || '' });
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
    } catch { showFlash('Failed to update status.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      showFlash('Review deleted.');
      loadReviews();
    } catch { showFlash('Failed to delete.', 'error'); }
  };

  const published = reviews.filter(r => r.status === 'published').length;
  const pending   = reviews.filter(r => r.status === 'pending').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Reviews ({reviews.length})</Typography>
          {published > 0 && (
            <Box sx={{ px: 1, py: 0.25, borderRadius: 5, fontSize: 11, fontWeight: 600, bgcolor: 'rgba(16,185,129,0.1)', color: '#059669' }}>
              {published} published
            </Box>
          )}
          {pending > 0 && (
            <Box sx={{ px: 1, py: 0.25, borderRadius: 5, fontSize: 11, fontWeight: 600, bgcolor: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
              {pending} pending
            </Box>
          )}
        </Box>
        <Button size="sm" icon={Plus} onClick={openAdd} disabled={!productId}>Add Review</Button>
      </Box>

      <FlashAlert flash={flash} />

      {!productId && (
        <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, mb: 1.5, border: '1px solid', bgcolor: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <Typography sx={{ fontSize: 13, color: '#2563eb' }}>Save the product first to manage reviews.</Typography>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map(i => (
            <Paper elevation={0} key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'action.hover', flexShrink: 0 }} />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ height: 12, bgcolor: 'action.hover', borderRadius: 1, width: '33%' }} />
                  <Box sx={{ height: 10, bgcolor: 'action.hover', borderRadius: 1, width: '25%' }} />
                </Box>
              </Box>
              <Box sx={{ height: 10, bgcolor: 'action.hover', borderRadius: 1, width: '100%', mb: 0.75 }} />
              <Box sx={{ height: 10, bgcolor: 'action.hover', borderRadius: 1, width: '75%' }} />
            </Paper>
          ))}
        </Box>
      ) : reviews.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2.5 }}>
          <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
            {productId ? 'No reviews yet. Add the first one!' : 'Reviews will appear here.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {reviews.map(r => {
            const statusDef = STATUS_DEF[r.status] || STATUS_DEF.hidden;
            return (
              <Paper elevation={0} key={r._id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.1)', color: 'primary.main', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textTransform: 'uppercase' }}>
                      {r.userName?.[0] || '?'}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.userName}</Typography>
                      {r.location && <Typography sx={{ fontSize: 11, color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location}</Typography>}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
                    <Box sx={{ px: 1, py: 0.25, borderRadius: 5, fontSize: 10, fontWeight: 600, textTransform: 'capitalize', bgcolor: statusDef.bg, color: statusDef.color }}>
                      {r.status}
                    </Box>
                    {r.status !== 'published' && (
                      <IconBtn icon={CheckCircle} label="Publish" size="sm" onClick={() => handleStatus(r._id, 'published')} sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' } }} />
                    )}
                    {r.status === 'published' && (
                      <IconBtn icon={EyeOff} label="Hide" size="sm" onClick={() => handleStatus(r._id, 'hidden')} sx={{ color: '#d97706', '&:hover': { bgcolor: 'rgba(245,158,11,0.08)' } }} />
                    )}
                    <IconBtn icon={Edit2} label="Edit" size="sm" onClick={() => openEdit(r)} />
                    <IconBtn icon={Trash2} label="Delete" size="sm" onClick={() => handleDelete(r._id)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                  </Box>
                </Box>

                <StarRating value={r.rating} readOnly />
                {r.title && <Typography sx={{ fontSize: 12.5, fontWeight: 600, mt: 0.75 }}>{r.title}</Typography>}
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5, lineHeight: 1.6 }}>{r.text}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {r.verified && (
                    <Box sx={{ px: 0.75, py: 0.25, borderRadius: 5, fontSize: 10, fontWeight: 600, border: '1px solid', borderColor: 'rgba(99,102,241,0.3)', color: 'primary.main' }}>Verified</Box>
                  )}
                  {r.featured && (
                    <Box sx={{ px: 0.75, py: 0.25, borderRadius: 5, fontSize: 10, fontWeight: 600, border: '1px solid', borderColor: 'rgba(139,92,246,0.3)', color: '#7c3aed' }}>Featured</Box>
                  )}
                  <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Review' : 'Add Review'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!formData.userName.trim() || !formData.text.trim()}>
              {editTarget ? 'Update Review' : 'Add Review'}
            </Button>
          </>
        }
      >
        <ReviewForm value={formData} onChange={setFormData} isEdit={!!editTarget} />
      </Modal>
    </Box>
  );
}
