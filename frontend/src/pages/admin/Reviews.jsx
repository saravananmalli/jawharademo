import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, Typography, Rating, Avatar, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, TablePagination, IconButton,
  Tooltip, Stack, Select, MenuItem, FormControl, InputLabel, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Chip, CircularProgress, InputAdornment,
  Checkbox, Paper, Autocomplete, Skeleton,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import CancelIcon        from '@mui/icons-material/Cancel';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon        from '@mui/icons-material/Search';
import RefreshIcon       from '@mui/icons-material/Refresh';
import DeleteSweepIcon   from '@mui/icons-material/DeleteSweep';
import PublishIcon       from '@mui/icons-material/Publish';
import { StatusChip }    from './adminUtils';
import api               from '../../services/api';

function ReviewsTableSkeleton() {
  return (
    <Table size="small" sx={{ minWidth: 860 }}>
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox"><Skeleton variant="rounded" width={18} height={18} /></TableCell>
          <TableCell>Customer</TableCell>
          <TableCell>Product</TableCell>
          <TableCell>Rating</TableCell>
          <TableCell>Review</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Flags</TableCell>
          <TableCell>Date</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell padding="checkbox"><Skeleton variant="rounded" width={18} height={18} /></TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={30} height={30} />
                <Skeleton width={90} height={16} />
              </Box>
            </TableCell>
            <TableCell><Skeleton width="70%" height={16} /></TableCell>
            <TableCell><Skeleton width={80} height={16} /></TableCell>
            <TableCell><Skeleton width="80%" height={16} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={64} height={22} /></TableCell>
            <TableCell><Skeleton width={50} height={16} /></TableCell>
            <TableCell><Skeleton width={70} height={16} /></TableCell>
            <TableCell align="center">
              <Stack direction="row" justifyContent="center" spacing={0.5}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const BLANK = {
  userName: '', location: '', rating: 5, title: '',
  text: '', verified: false, featured: false, status: 'published', avatar: '',
};

const STATUS_LABEL = { published: 'Approved', pending: 'Pending', hidden: 'Rejected' };

const UAE_LOCATIONS = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
  'Al Ain',
];

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <Card sx={{ flex: 1, minWidth: 120, p: 2, borderRadius: 2 }}>
      <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Card>
  );
}

// ── Review form ────────────────────────────────────────────────────────────────
function ReviewForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <Stack spacing={2} sx={{ pt: 0.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField fullWidth size="small" label="Customer Name *"
          value={value.userName} onChange={e => set('userName', e.target.value)} />
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
        <Rating value={value.rating} onChange={(_, v) => set('rating', v || 1)} precision={0.5} size="large" />
      </Box>
      <TextField fullWidth multiline rows={3} size="small" label="Review Text *"
        value={value.text} onChange={e => set('text', e.target.value)} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={value.status} onChange={e => set('status', e.target.value)}>
            <MenuItem value="published">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="hidden">Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={value.verified} onChange={e => set('verified', e.target.checked)} size="small" />}
          label="Verified Purchase"
        />
        <FormControlLabel
          control={<Switch checked={value.featured} onChange={e => set('featured', e.target.checked)} size="small" />}
          label="Featured"
        />
      </Stack>
    </Stack>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Reviews() {
  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState({ published: 0, pending: 0, hidden: 0 });
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy]             = useState('newest');
  const [searchQ, setSearchQ]           = useState('');
  const [page, setPage]                 = useState(0);
  const rowsPerPage                     = 15;

  // Selection state
  const [selected, setSelected] = useState(new Set());

  // Dialog state — covers add/edit form AND confirm dialogs
  const [dialogMode, setDialogMode] = useState(null); // 'add' | 'edit' | 'confirm'
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData]     = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [flash, setFlash]           = useState(null);

  // Add Review dialog state
  const [addForm, setAddForm]                   = useState(BLANK);
  const [addProduct, setAddProduct]             = useState(null);
  const [productOptions, setProductOptions]     = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const addSaving                               = useRef(false);
  const [addSavingState, setAddSavingState]     = useState(false);

  // What the confirm dialog will act on
  const [confirmPayload, setConfirmPayload] = useState(null); // { ids, action }

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

  const openAddDialog = () => {
    setAddForm(BLANK);
    setAddProduct(null);
    setProductOptions([]);
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
        page: page + 1,
        limit: rowsPerPage,
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
  }, [page, rowsPerPage, statusFilter, sortBy, searchQ]);

  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => { setPage(0); setSelected(new Set()); }, [statusFilter, sortBy, searchQ]);

  // ── Selection helpers ────────────────────────────────────────────────────────
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

  // ── Edit ─────────────────────────────────────────────────────────────────────
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

  // ── Status change (single row quick-action) ──────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/admin/reviews/${id}`, { status: newStatus });
      setReviews(prev => prev.map(r => r._id === id ? data.data : r));
      // refresh stats
      loadReviews();
      showFlash(`Review marked as ${newStatus}.`);
    } catch {
      showFlash('Failed to update status.', 'error');
    }
  };

  // ── Single delete (opens confirm dialog) ────────────────────────────────────
  const promptDelete = (id) => {
    setConfirmPayload({ ids: [id], action: 'delete' });
    setDialogMode('confirm');
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const promptBulk = (action) => {
    setConfirmPayload({ ids: [...selected], action });
    setDialogMode('confirm');
  };

  // ── Execute confirmed action ─────────────────────────────────────────────────
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
        // Refresh stats after deletion
        api.get(`/admin/reviews?page=1&limit=1`).then(({ data }) => {
          if (data.stats) setStats(data.stats);
        }).catch(() => {});
      } else {
        // 'published' | 'hidden' | 'pending'
        await api.put('/admin/reviews/bulk', { ids, status: action });
        setReviews(prev => prev.map(r => ids.includes(r._id) ? { ...r, status: action } : r));
        setSelected(new Set());
        showFlash(`${ids.length} review${ids.length > 1 ? 's' : ''} set to ${action}.`);
        api.get(`/admin/reviews?page=1&limit=1`).then(({ data }) => {
          if (data.stats) setStats(data.stats);
        }).catch(() => {});
      }
    } catch {
      showFlash('Operation failed. Please try again.', 'error');
    }
  };

  const canSave = formData.userName.trim() && formData.text.trim();

  const selectedCount = selected.size;

  // ── Confirm dialog copy ──────────────────────────────────────────────────────
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
    <Box>
      {/* ── Page header ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
        alignItems={{ sm: 'center' }} mb={3} gap={2} >
        <Box>
          <Typography variant="h5" fontWeight={800}>Reviews</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} review{total !== 1 ? 's' : ''} total
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={loadReviews} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {flash && <Alert severity={flash.severity} sx={{ mb: 2 }}>{flash.msg}</Alert>}

      {/* ── Stats row ── */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <StatCard label="Approved" value={stats.published} color="success.main" />
        <StatCard label="Pending"  value={stats.pending}   color="warning.main" />
        <StatCard label="Rejected" value={stats.hidden}    color="text.disabled" />
      </Stack>

      {/* ── Filter toolbar ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} flexWrap="wrap">
        <TextField
          size="small" placeholder="Search by customer name…" value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="published">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="hidden">Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="highest">Highest Rating</MenuItem>
            <MenuItem value="lowest">Lowest Rating</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* ── Bulk action bar (visible when rows are selected) ── */}
      {selectedCount > 0 && (
        <Paper
          elevation={2}
          sx={{
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            px: 2.5, py: 1.5, mb: 2, borderRadius: 2,
            bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200',
          }}
        >
          <Typography fontWeight={700} color="primary.main">
            {selectedCount} Review{selectedCount > 1 ? 's' : ''} Selected
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small" variant="contained" color="success"
              startIcon={<PublishIcon />}
              onClick={() => promptBulk('published')}
              sx={{ textTransform: 'none', borderRadius: '6px' }}
            >
              Approve Selected
            </Button>
            <Button
              size="small" variant="outlined" color="warning"
              startIcon={<VisibilityOffIcon />}
              onClick={() => promptBulk('hidden')}
              sx={{ textTransform: 'none', borderRadius: '6px' }}
            >
              Reject Selected
            </Button>
            <Button
              size="small" variant="contained" color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => promptBulk('delete')}
              sx={{ textTransform: 'none', borderRadius: '6px' }}
            >
              Delete Selected
            </Button>
            <Button
              size="small" variant="text"
              onClick={() => setSelected(new Set())}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Table ── */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          {loading && reviews.length === 0 && <ReviewsTableSkeleton />}
          {(!loading || reviews.length > 0) && (
            <Table size="small" sx={{ minWidth: 860, opacity: loading && reviews.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Review</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Flags</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map(r => {
                  const isSelected = selected.has(r._id);
                  return (
                    <TableRow
                      key={r._id}
                      hover
                      selected={isSelected}
                      sx={{ '&.Mui-selected': { bgcolor: 'primary.50' } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => toggleOne(r._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            src={r.avatar || undefined}
                            sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}
                          >
                            {r.userInitial || r.userName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
                              {r.userName}
                            </Typography>
                            {r.location && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                                {r.location}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                          {r.product?.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Rating value={r.rating} readOnly size="small" precision={0.5} />
                      </TableCell>
                      <TableCell>
                        {r.title && (
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                            {r.title}
                          </Typography>
                        )}
                        <Typography variant="body2" noWrap color="text.secondary" sx={{ maxWidth: 200 }}>
                          {r.text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={r.status} label={STATUS_LABEL[r.status] || r.status} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {r.verified && (
                            <Chip label="Verified" size="small" color="primary" variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                          {r.featured && (
                            <Chip label="Featured" size="small" color="secondary" variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {new Date(r.createdAt).toLocaleDateString('en-AE', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          {r.status !== 'published' && (
                            <Tooltip title="Approve">
                              <IconButton size="small" color="success" onClick={() => handleStatusChange(r._id, 'published')}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {r.status !== 'hidden' && (
                            <Tooltip title="Reject">
                              <IconButton size="small" color="warning" onClick={() => handleStatusChange(r._id, 'hidden')}>
                                <VisibilityOffIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {r.status !== 'pending' && (
                            <Tooltip title="Set Pending">
                              <IconButton size="small" onClick={() => handleStatusChange(r._id, 'pending')}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(r)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => promptDelete(r._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {reviews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 7, color: 'text.secondary' }}>
                      No reviews found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[15]}
          onPageChange={(_, p) => { setPage(p); setSelected(new Set()); }}
        />
      </Card>

      {/* ── Add Review dialog ── */}
      <Dialog open={dialogMode === 'add'} onClose={() => setDialogMode(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Review</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Autocomplete
              options={productOptions}
              filterOptions={(x) => x}
              getOptionLabel={(opt) =>
                opt.designCode ? `${opt.name} — ${opt.designCode}` : opt.name
              }
              isOptionEqualToValue={(opt, val) => opt._id === val._id}
              value={addProduct}
              onChange={(_, val) => setAddProduct(val)}
              onInputChange={(_, val) => searchProducts(val)}
              loading={productSearching}
              noOptionsText="Type a product name or design code…"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product *"
                  size="small"
                  placeholder="Search by name or design code…"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {productSearching ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <ReviewForm value={addForm} onChange={setAddForm} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogMode(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSave}
            disabled={addSavingState || !addProduct || !addForm.userName.trim() || !addForm.text.trim()}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {addSavingState ? 'Adding…' : 'Add Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={dialogMode === 'edit'} onClose={() => setDialogMode(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Review</DialogTitle>
        <DialogContent dividers>
          <ReviewForm value={formData} onChange={setFormData} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogMode(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !canSave}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {saving ? 'Saving…' : 'Update Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm dialog (single delete + bulk actions) ── */}
      <Dialog open={dialogMode === 'confirm'} onClose={() => setDialogMode(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmTitle()}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmBody()}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogMode(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmPayload?.action === 'delete' ? 'error' : 'primary'}
            onClick={executeConfirm}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {confirmPayload?.action === 'delete' ? 'Delete' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
