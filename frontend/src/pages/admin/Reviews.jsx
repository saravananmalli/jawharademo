import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star, RefreshCw, Plus, Edit2, Trash2, CheckCircle,
  EyeOff, Clock, Trash, MessageSquare,
} from 'lucide-react';
import {
  Box, Paper, Grid, Typography, TableHead, TableBody, TableRow, TableCell, IconButton, Chip, MenuItem,
} from '@mui/material';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import ReviewManagerPanel from '../../components/admin/ReviewManagerPanel';
import {
  PageHeader, StatCard, Table, Th, Td, Tr,
  Skeleton, EmptyState, Pagination, SearchInput, Select,
  Button, IconBtn, Modal, Tooltip, Toggle, Textarea, Input,
} from '../../components/admin/ui/index.js';

const UAE_LOCATIONS = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
  'Fujairah', 'Umm Al Quwain', 'Al Ain',
];

const BLANK = {
  userName: '', location: '', rating: 5, title: '',
  text: '', verified: false, featured: false, status: 'published', avatar: '',
};

const STATUS_LABEL = { published: 'Approved', pending: 'Pending', hidden: 'Rejected' };

const PER_PAGE = 15;

function StarRating({ rating }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          color={i <= rating ? '#f59e0b' : undefined}
          fill={i <= rating ? '#f59e0b' : 'none'}
          style={{ opacity: i <= rating ? 1 : 0.25 }}
        />
      ))}
    </Box>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Box
          key={i}
          component="button"
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Star
            size={22}
            color={(hover || value) >= i ? '#f59e0b' : undefined}
            fill={(hover || value) >= i ? '#f59e0b' : 'none'}
            style={{ opacity: (hover || value) >= i ? 1 : 0.25 }}
          />
        </Box>
      ))}
    </Box>
  );
}

function ReviewForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
        <Input
          label="Customer Name"
          required
          value={value.userName}
          onChange={e => set('userName', e.target.value)}
          placeholder="Customer name"
        />
        <Select label="Location (UAE)" value={value.location} onChange={e => set('location', e.target.value)}>
          <MenuItem value="">Select city…</MenuItem>
          {UAE_LOCATIONS.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
        </Select>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 0.75 }}>
          Rating <Box component="span" sx={{ color: 'error.main' }}>*</Box>
        </Typography>
        <StarPicker value={value.rating} onChange={v => set('rating', v)} />
      </Box>

      <Textarea
        label="Review Text"
        required
        value={value.text}
        onChange={e => set('text', e.target.value)}
        placeholder="Review content…"
        rows={3}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 0.75 }}>Status</Typography>
          <Select value={value.status} onChange={e => set('status', e.target.value)}>
            <MenuItem value="published">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="hidden">Rejected</MenuItem>
          </Select>
        </Box>
        <Toggle label="Verified Purchase" checked={value.verified} onChange={e => set('verified', e.target.checked)} />
        <Toggle label="Featured" checked={value.featured} onChange={e => set('featured', e.target.checked)} />
      </Box>
    </Box>
  );
}

export default function Reviews() {
  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState({ published: 0, pending: 0, hidden: 0 });
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy]             = useState('newest');
  const [searchQ, setSearchQ]           = useState('');
  const [page, setPage]                 = useState(1);

  const [selected, setSelected] = useState(new Set());

  const [dialogMode, setDialogMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData]     = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [flash, setFlash]           = useState(null);

  const [addForm, setAddForm]                   = useState(BLANK);
  const [addProduct, setAddProduct]             = useState(null);
  const [productOptions, setProductOptions]     = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productQuery, setProductQuery]         = useState('');
  const addSaving                               = useRef(false);
  const [addSavingState, setAddSavingState]     = useState(false);

  const [confirmPayload, setConfirmPayload] = useState(null);

  const showFlash = (msg, severity = 'success') => {
    setFlash({ msg, severity });
    setTimeout(() => setFlash(null), 3500);
  };

  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setProductOptions([]); return; }
    setProductSearching(true);
    try {
      const { data } = await api.get(`/products?q=${encodeURIComponent(query.trim())}&limit=10`);
      setProductOptions(data.data || []);
    } catch {
      setProductOptions([]);
    } finally {
      setProductSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productQuery), 300);
    return () => clearTimeout(t);
  }, [productQuery, searchProducts]);

  const openAddDialog = () => {
    setAddForm(BLANK);
    setAddProduct(null);
    setProductOptions([]);
    setProductQuery('');
    setDialogMode('add');
  };

  const handleAddSave = async () => {
    if (!addProduct || !addForm.userName.trim() || !addForm.text.trim()) return;
    if (addSaving.current) return;
    addSaving.current = true;
    setAddSavingState(true);
    try {
      await api.post('/admin/reviews', { ...addForm, productId: addProduct._id });
      setDialogMode(null);
      loadReviews();
      showFlash('Review added successfully.');
    } catch {
      showFlash('Failed to add review.', 'error');
    } finally {
      addSaving.current = false;
      setAddSavingState(false);
    }
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: PER_PAGE,
        sort: sortBy,
        ...(statusFilter && { status: statusFilter }),
        ...(searchQ.trim() && { q: searchQ.trim() }),
      });
      const { data } = await api.get(`/admin/reviews?${params}`);
      setReviews(data.data || []);
      setTotal(data.total || 0);
      if (data.stats) setStats(data.stats);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sortBy, searchQ]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [statusFilter, sortBy, searchQ]);

  const pageIds = reviews.map(r => r._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id)) && !allPageSelected;

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
    setDialogMode('edit');
  };

  const handleSave = async () => {
    if (!formData.userName.trim() || !formData.text.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/reviews/${editTarget}`, formData);
      setReviews(prev => prev.map(r => r._id === editTarget ? data.data : r));
      showFlash('Review updated.');
      setDialogMode(null);
      loadReviews();
    } catch {
      showFlash('Failed to save review.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/admin/reviews/${id}`, { status: newStatus });
      setReviews(prev => prev.map(r => r._id === id ? data.data : r));
      loadReviews();
      showFlash(`Review marked as ${newStatus}.`);
    } catch {
      showFlash('Failed to update status.', 'error');
    }
  };

  const promptDelete = (id) => {
    setConfirmPayload({ ids: [id], action: 'delete' });
    setDialogMode('confirm');
  };

  const promptBulk = (action) => {
    setConfirmPayload({ ids: [...selected], action });
    setDialogMode('confirm');
  };

  const executeConfirm = async () => {
    const { ids, action } = confirmPayload;
    setDialogMode(null);
    try {
      if (action === 'delete') {
        await api.delete('/admin/reviews/bulk', { data: { ids } });
        setReviews(prev => prev.filter(r => !ids.includes(r._id)));
        setTotal(prev => prev - ids.length);
        setSelected(new Set());
        showFlash(`${ids.length} review${ids.length > 1 ? 's' : ''} deleted.`);
        api.get('/admin/reviews?page=1&limit=1').then(({ data }) => {
          if (data.stats) setStats(data.stats);
        }).catch(() => {});
      } else {
        await api.put('/admin/reviews/bulk', { ids, status: action });
        setReviews(prev => prev.map(r => ids.includes(r._id) ? { ...r, status: action } : r));
        setSelected(new Set());
        showFlash(`${ids.length} review${ids.length > 1 ? 's' : ''} set to ${action}.`);
        api.get('/admin/reviews?page=1&limit=1').then(({ data }) => {
          if (data.stats) setStats(data.stats);
        }).catch(() => {});
      }
    } catch {
      showFlash('Operation failed. Please try again.', 'error');
    }
  };

  const canSave = formData.userName.trim() && formData.text.trim();
  const selectedCount = selected.size;
  const totalPages = Math.ceil(total / PER_PAGE);

  const confirmTitle = () => {
    if (!confirmPayload) return '';
    const { ids, action } = confirmPayload;
    const count = ids.length;
    if (action === 'delete') return `Delete ${count} Review${count > 1 ? 's' : ''}?`;
    return `Mark ${count} Review${count > 1 ? 's' : ''} as ${action}?`;
  };

  const confirmBody = () => {
    if (!confirmPayload) return '';
    const { ids, action } = confirmPayload;
    const count = ids.length;
    if (action === 'delete')
      return `Are you sure you want to permanently delete ${count === 1 ? 'this review' : `these ${count} reviews`}? This will also recalculate affected product ratings. This action cannot be undone.`;
    return `Are you sure you want to set ${count === 1 ? 'this review' : `these ${count} reviews`} to "${action}"? Product ratings will be recalculated.`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Reviews"
        subtitle={`${total} review${total !== 1 ? 's' : ''} total`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={loadReviews}
              disabled={loading}
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
            <Button icon={Plus} onClick={openAddDialog}>Add Review</Button>
          </Box>
        }
      />

      {/* Flash */}
      {flash && (
        <Paper
          elevation={0}
          sx={{
            px: 2, py: 1.5, borderRadius: 2, border: '1px solid',
            bgcolor: flash.severity === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            borderColor: flash.severity === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: flash.severity === 'error' ? 'error.main' : 'success.main' }}>
            {flash.msg}
          </Typography>
        </Paper>
      )}

      {/* Stats row */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Approved" value={stats.published} icon={CheckCircle} color="emerald" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard title="Rejected" value={stats.hidden} icon={EyeOff} color="rose" />
        </Grid>
      </Grid>

      {/* Filter toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <SearchInput value={searchQ} onChange={setSearchQ} placeholder="Search by customer name…" sx={{ flex: 1, minWidth: 220 }} />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="published">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="hidden">Rejected</MenuItem>
          </Select>
          <Select value={sortBy} onChange={e => setSortBy(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="highest">Highest Rating</MenuItem>
            <MenuItem value="lowest">Lowest Rating</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <Paper
          elevation={0}
          sx={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5,
            px: 2.5, py: 1.5, borderRadius: 2.5, border: '1px solid',
            bgcolor: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.25)',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
            {selectedCount} Review{selectedCount > 1 ? 's' : ''} Selected
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button size="sm" variant="success" icon={CheckCircle} onClick={() => promptBulk('published')}>Approve</Button>
            <Button size="sm" variant="warning" icon={EyeOff} onClick={() => promptBulk('hidden')}>Reject</Button>
            <Button size="sm" variant="danger" icon={Trash} onClick={() => promptBulk('delete')}>Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </Box>
        </Paper>
      )}

      {/* Table card */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <Th sx={{ width: 40 }}>
                <Box
                  component="input"
                  type="checkbox"
                  checked={allPageSelected}
                  ref={el => { if (el) el.indeterminate = somePageSelected; }}
                  onChange={toggleAll}
                  sx={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }}
                />
              </Th>
              <Th>Customer</Th>
              <Th>Product</Th>
              <Th>Rating</Th>
              <Th>Review</Th>
              <Th>Status</Th>
              <Th>Flags</Th>
              <Th>Date</Th>
              <Th align="center">Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody sx={{ opacity: loading && reviews.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s' }}>
            {loading && reviews.length === 0 && Array.from({ length: 8 }).map((_, i) => (
              <Tr key={i}>
                <Td><Skeleton width={16} height={16} /></Td>
                <Td>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton width={32} height={32} sx={{ borderRadius: '50%', flexShrink: 0 }} />
                    <Skeleton height={14} width={96} />
                  </Box>
                </Td>
                <Td><Skeleton height={14} width={128} /></Td>
                <Td><Skeleton height={14} width={80} /></Td>
                <Td><Skeleton height={14} width={160} /></Td>
                <Td><Skeleton height={22} width={64} sx={{ borderRadius: 5 }} /></Td>
                <Td><Skeleton height={14} width={48} /></Td>
                <Td><Skeleton height={14} width={64} /></Td>
                <Td>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Skeleton width={28} height={28} /><Skeleton width={28} height={28} /><Skeleton width={28} height={28} />
                  </Box>
                </Td>
              </Tr>
            ))}

            {!loading && reviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                  <EmptyState icon={MessageSquare} title="No reviews found" description="Try adjusting the filters or search query." />
                </TableCell>
              </TableRow>
            )}

            {reviews.map(r => {
              const isSelected = selected.has(r._id);
              return (
                <Tr key={r._id} sx={{ bgcolor: isSelected ? 'rgba(99,102,241,0.06)' : undefined }}>
                  <Td>
                    <Box
                      component="input"
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(r._id)}
                      sx={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                  </Td>
                  <Td>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%',
                        bgcolor: 'rgba(99,102,241,0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'primary.main',
                        flexShrink: 0, overflow: 'hidden',
                      }}>
                        {r.avatar
                          ? <Box component="img" src={r.avatar} alt={r.userName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (r.userInitial || r.userName?.[0])
                        }
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                          {r.userName}
                        </Typography>
                        {r.location && (
                          <Typography sx={{ fontSize: 11, color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                            {r.location}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Td>
                  <Td>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {r.product?.name || '—'}
                    </Typography>
                  </Td>
                  <Td sx={{ whiteSpace: 'nowrap' }}>
                    <StarRating rating={r.rating} />
                  </Td>
                  <Td>
                    {r.title && (
                      <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {r.title}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                      {r.text}
                    </Typography>
                  </Td>
                  <Td>
                    <StatusChip status={r.status} label={STATUS_LABEL[r.status] || r.status} />
                  </Td>
                  <Td>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {r.verified && (
                        <Chip label="Verified" size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, bgcolor: 'rgba(99,102,241,0.08)', color: 'primary.main', border: '1px solid', borderColor: 'rgba(99,102,241,0.25)' }} />
                      )}
                      {r.featured && (
                        <Chip label="Featured" size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, bgcolor: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: '1px solid', borderColor: 'rgba(139,92,246,0.25)' }} />
                      )}
                    </Box>
                  </Td>
                  <Td>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                  </Td>
                  <Td align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                      {r.status !== 'published' && (
                        <Tooltip content="Approve">
                          <IconBtn icon={CheckCircle} label="Approve" size="sm" sx={{ color: 'success.main', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' } }} onClick={() => handleStatusChange(r._id, 'published')} />
                        </Tooltip>
                      )}
                      {r.status !== 'hidden' && (
                        <Tooltip content="Reject">
                          <IconBtn icon={EyeOff} label="Reject" size="sm" sx={{ color: 'warning.main', '&:hover': { bgcolor: 'rgba(245,158,11,0.08)' } }} onClick={() => handleStatusChange(r._id, 'hidden')} />
                        </Tooltip>
                      )}
                      {r.status !== 'pending' && (
                        <Tooltip content="Set Pending">
                          <IconBtn icon={Clock} label="Set Pending" size="sm" onClick={() => handleStatusChange(r._id, 'pending')} />
                        </Tooltip>
                      )}
                      <Tooltip content="Edit">
                        <IconBtn icon={Edit2} label="Edit" size="sm" sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' } }} onClick={() => openEdit(r)} />
                      </Tooltip>
                      <Tooltip content="Delete">
                        <IconBtn icon={Trash2} label="Delete" size="sm" sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} onClick={() => promptDelete(r._id)} />
                      </Tooltip>
                    </Box>
                  </Td>
                </Tr>
              );
            })}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={(p) => { setPage(p); setSelected(new Set()); }}
              totalItems={total}
              perPage={PER_PAGE}
            />
          </Box>
        )}
      </Paper>

      {/* ReviewManagerPanel */}
      <Box sx={{ mt: 2 }}>
        <ReviewManagerPanel />
      </Box>

      {/* Add Review dialog */}
      <Modal
        open={dialogMode === 'add'}
        onClose={() => setDialogMode(null)}
        title="Add Review"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleAddSave}
              loading={addSavingState}
              disabled={addSavingState || !addProduct || !addForm.userName.trim() || !addForm.text.trim()}
            >
              {addSavingState ? 'Adding…' : 'Add Review'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Product search */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', mb: 0.75 }}>
              Product <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <Input
              value={productQuery}
              onChange={e => setProductQuery(e.target.value)}
              placeholder="Search by name or design code…"
            />
            {productSearching && (
              <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5 }}>Searching…</Typography>
            )}
            {productOptions.length > 0 && !addProduct && (
              <Paper elevation={0} sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {productOptions.map(p => (
                  <Box
                    key={p._id}
                    component="button"
                    type="button"
                    onClick={() => { setAddProduct(p); setProductQuery(p.designCode ? `${p.name} — ${p.designCode}` : p.name); setProductOptions([]); }}
                    sx={{
                      display: 'block', width: '100%', textAlign: 'left',
                      px: 1.75, py: 1.25, fontSize: 13, color: 'text.primary',
                      background: 'none', border: 'none', borderBottom: '1px solid', borderColor: 'divider',
                      cursor: 'pointer', '&:last-child': { border: 0 },
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {p.name}{p.designCode ? ` — ${p.designCode}` : ''}
                  </Box>
                ))}
              </Paper>
            )}
            {addProduct && (
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                mt: 0.75, px: 1.75, py: 1, borderRadius: 2, border: '1px solid',
                bgcolor: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.25)',
              }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'primary.main' }}>
                  {addProduct.name}{addProduct.designCode ? ` — ${addProduct.designCode}` : ''}
                </Typography>
                <Box
                  component="button"
                  type="button"
                  onClick={() => { setAddProduct(null); setProductQuery(''); }}
                  sx={{ background: 'none', border: 'none', fontSize: 12, color: 'primary.main', cursor: 'pointer', textDecoration: 'underline', p: 0, ml: 1 }}
                >
                  Change
                </Box>
              </Box>
            )}
          </Box>
          <ReviewForm value={addForm} onChange={setAddForm} />
        </Box>
      </Modal>

      {/* Edit Review dialog */}
      <Modal
        open={dialogMode === 'edit'}
        onClose={() => setDialogMode(null)}
        title="Edit Review"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving || !canSave}>
              {saving ? 'Saving…' : 'Update Review'}
            </Button>
          </>
        }
      >
        <ReviewForm value={formData} onChange={setFormData} />
      </Modal>

      {/* Confirm dialog */}
      <Modal
        open={dialogMode === 'confirm'}
        onClose={() => setDialogMode(null)}
        title={confirmTitle()}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button
              variant={confirmPayload?.action === 'delete' ? 'danger' : 'primary'}
              onClick={executeConfirm}
            >
              {confirmPayload?.action === 'delete' ? 'Delete' : 'Confirm'}
            </Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          {confirmBody()}
        </Typography>
      </Modal>
    </Box>
  );
}
