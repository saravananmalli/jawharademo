import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star, RefreshCw, Plus, Edit2, Trash2, CheckCircle,
  EyeOff, Clock, Trash, MessageSquare,
} from 'lucide-react';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import ReviewManagerPanel from '../../components/admin/ReviewManagerPanel';
import {
  PageHeader, StatCard, Card, CardBody, Table, Th, Td, Tr,
  Skeleton, EmptyState, Pagination, SearchInput, Select,
  Button, IconBtn, Modal, Tooltip, Toggle, Textarea,
} from '../../components/admin/ui/index.js';

// ── UAE cities ─────────────────────────────────────────────────────────────────
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

// ── Star rating display ────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );
}

// ── Interactive star picker ────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star
            size={22}
            className={(hover || value) >= i ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review form (used in Add + Edit dialogs) ───────────────────────────────────
function ReviewForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.userName}
            onChange={e => set('userName', e.target.value)}
            placeholder="Customer name"
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location (UAE)</label>
          <select
            value={value.location}
            onChange={e => set('location', e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="">Select city…</option>
            {UAE_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rating <span className="text-red-500">*</span></label>
        <StarPicker value={value.rating} onChange={v => set('rating', v)} />
      </div>

      <Textarea
        label="Review Text"
        required
        value={value.text}
        onChange={e => set('text', e.target.value)}
        placeholder="Review content…"
        rows={3}
      />

      <div className="flex flex-wrap items-center gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select
            value={value.status}
            onChange={e => set('status', e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="published">Approved</option>
            <option value="pending">Pending</option>
            <option value="hidden">Rejected</option>
          </select>
        </div>
        <Toggle
          label="Verified Purchase"
          checked={value.verified}
          onChange={e => set('verified', e.target.checked)}
        />
        <Toggle
          label="Featured"
          checked={value.featured}
          onChange={e => set('featured', e.target.checked)}
        />
      </div>
    </div>
  );
}

// ── Skeleton rows ──────────────────────────────────────────────────────────────
function ReviewsTableSkeleton() {
  return (
    <>
      <thead>
        <tr>
          <Th className="w-8"><Skeleton className="h-4 w-4" /></Th>
          <Th>Customer</Th>
          <Th>Product</Th>
          <Th>Rating</Th>
          <Th>Review</Th>
          <Th>Status</Th>
          <Th>Flags</Th>
          <Th>Date</Th>
          <Th className="text-center">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 8 }).map((_, i) => (
          <Tr key={i}>
            <Td><Skeleton className="h-4 w-4" /></Td>
            <Td>
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Td>
            <Td><Skeleton className="h-4 w-32" /></Td>
            <Td><Skeleton className="h-4 w-20" /></Td>
            <Td><Skeleton className="h-4 w-40" /></Td>
            <Td><Skeleton className="h-5 w-16 rounded-full" /></Td>
            <Td><Skeleton className="h-4 w-12" /></Td>
            <Td><Skeleton className="h-4 w-16" /></Td>
            <Td>
              <div className="flex items-center justify-center gap-1">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </Td>
          </Tr>
        ))}
      </tbody>
    </>
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
  const [page, setPage]                 = useState(1);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Dialog state
  const [dialogMode, setDialogMode] = useState(null); // 'add' | 'edit' | 'confirm'
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData]     = useState(BLANK);
  const [saving, setSaving]         = useState(false);
  const [flash, setFlash]           = useState(null);

  // Add dialog state
  const [addForm, setAddForm]                   = useState(BLANK);
  const [addProduct, setAddProduct]             = useState(null);
  const [productOptions, setProductOptions]     = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productQuery, setProductQuery]         = useState('');
  const addSaving                               = useRef(false);
  const [addSavingState, setAddSavingState]     = useState(false);

  // Confirm payload
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

  // Debounce product search
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
        page: page,
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

  // Selection helpers
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

  // Edit
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

  // Status change (single row)
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

  // Single delete
  const promptDelete = (id) => {
    setConfirmPayload({ ids: [id], action: 'delete' });
    setDialogMode('confirm');
  };

  // Bulk actions
  const promptBulk = (action) => {
    setConfirmPayload({ ids: [...selected], action });
    setDialogMode('confirm');
  };

  // Execute confirm
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
    <div>
      {/* Page header */}
      <PageHeader
        title="Reviews"
        subtitle={`${total} review${total !== 1 ? 's' : ''} total`}
        action={
          <div className="flex items-center gap-2">
            <IconBtn
              icon={RefreshCw}
              label="Refresh"
              onClick={loadReviews}
              disabled={loading}
              className={loading ? '[&>svg]:animate-spin' : ''}
            />
            <Button icon={Plus} onClick={openAddDialog}>
              Add Review
            </Button>
          </div>
        }
      />

      {/* Flash message */}
      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${
          flash.severity === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        }`}>
          {flash.msg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Approved" value={stats.published} icon={CheckCircle}  color="emerald" />
        <StatCard title="Pending"  value={stats.pending}   icon={Clock}        color="amber"   />
        <StatCard title="Rejected" value={stats.hidden}    icon={EyeOff}       color="rose"    />
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput
          value={searchQ}
          onChange={setSearchQ}
          placeholder="Search by customer name…"
          className="min-w-[220px] flex-1"
        />
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="published">Approved</option>
          <option value="pending">Pending</option>
          <option value="hidden">Rejected</option>
        </Select>
        <Select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="min-w-[160px]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
            {selectedCount} Review{selectedCount > 1 ? 's' : ''} Selected
          </span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="success" icon={CheckCircle} onClick={() => promptBulk('published')}>
              Approve
            </Button>
            <Button size="sm" variant="warning" icon={EyeOff} onClick={() => promptBulk('hidden')}>
              Reject
            </Button>
            <Button size="sm" variant="danger" icon={Trash} onClick={() => promptBulk('delete')}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            {loading && reviews.length === 0 ? (
              <ReviewsTableSkeleton />
            ) : (
              <>
                <thead>
                  <tr>
                    <Th className="w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={el => { if (el) el.indeterminate = somePageSelected; }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </Th>
                    <Th>Customer</Th>
                    <Th>Product</Th>
                    <Th>Rating</Th>
                    <Th>Review</Th>
                    <Th>Status</Th>
                    <Th>Flags</Th>
                    <Th>Date</Th>
                    <Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className={loading && reviews.length > 0 ? 'opacity-50 transition-opacity duration-150' : ''}>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon={MessageSquare}
                          title="No reviews found"
                          description="Try adjusting the filters or search query."
                          className="py-16"
                        />
                      </td>
                    </tr>
                  ) : reviews.map(r => {
                    const isSelected = selected.has(r._id);
                    return (
                      <Tr
                        key={r._id}
                        className={isSelected ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : ''}
                      >
                        <Td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(r._id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0 overflow-hidden">
                              {r.avatar
                                ? <img src={r.avatar} alt={r.userName} className="w-full h-full object-cover" />
                                : (r.userInitial || r.userName?.[0])}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                                {r.userName}
                              </p>
                              {r.location && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                  {r.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate block max-w-[160px]">
                            {r.product?.name || '—'}
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap">
                          <StarRating rating={r.rating} />
                        </Td>
                        <Td>
                          {r.title && (
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                              {r.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {r.text}
                          </p>
                        </Td>
                        <Td>
                          <StatusChip status={r.status} label={STATUS_LABEL[r.status] || r.status} />
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {r.verified && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
                                Verified
                              </span>
                            )}
                            {r.featured && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400">
                                Featured
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString('en-AE', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </Td>
                        <Td className="text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {r.status !== 'published' && (
                              <Tooltip content="Approve">
                                <IconBtn
                                  icon={CheckCircle}
                                  label="Approve"
                                  size="sm"
                                  className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  onClick={() => handleStatusChange(r._id, 'published')}
                                />
                              </Tooltip>
                            )}
                            {r.status !== 'hidden' && (
                              <Tooltip content="Reject">
                                <IconBtn
                                  icon={EyeOff}
                                  label="Reject"
                                  size="sm"
                                  className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                  onClick={() => handleStatusChange(r._id, 'hidden')}
                                />
                              </Tooltip>
                            )}
                            {r.status !== 'pending' && (
                              <Tooltip content="Set Pending">
                                <IconBtn
                                  icon={Clock}
                                  label="Set Pending"
                                  size="sm"
                                  onClick={() => handleStatusChange(r._id, 'pending')}
                                />
                              </Tooltip>
                            )}
                            <Tooltip content="Edit">
                              <IconBtn
                                icon={Edit2}
                                label="Edit"
                                size="sm"
                                onClick={() => openEdit(r)}
                              />
                            </Tooltip>
                            <Tooltip content="Delete">
                              <IconBtn
                                icon={Trash2}
                                label="Delete"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => promptDelete(r._id)}
                              />
                            </Tooltip>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </>
            )}
          </Table>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPage={(p) => { setPage(p); setSelected(new Set()); }}
                totalItems={total}
                perPage={PER_PAGE}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* ReviewManagerPanel (still uses MUI internally — keep as-is) */}
      <div className="mt-8">
        <ReviewManagerPanel />
      </div>

      {/* ── Add Review dialog ── */}
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
        <div className="space-y-4">
          {/* Product search */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productQuery}
              onChange={e => setProductQuery(e.target.value)}
              placeholder="Search by name or design code…"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {productSearching && (
              <p className="text-xs text-gray-400">Searching…</p>
            )}
            {productOptions.length > 0 && !addProduct && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                {productOptions.map(p => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => { setAddProduct(p); setProductQuery(p.designCode ? `${p.name} — ${p.designCode}` : p.name); setProductOptions([]); }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    {p.name}{p.designCode ? ` — ${p.designCode}` : ''}
                  </button>
                ))}
              </div>
            )}
            {addProduct && (
              <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                  {addProduct.name}{addProduct.designCode ? ` — ${addProduct.designCode}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => { setAddProduct(null); setProductQuery(''); }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
          <ReviewForm value={addForm} onChange={setAddForm} />
        </div>
      </Modal>

      {/* ── Edit Review dialog ── */}
      <Modal
        open={dialogMode === 'edit'}
        onClose={() => setDialogMode(null)}
        title="Edit Review"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={saving || !canSave}
            >
              {saving ? 'Saving…' : 'Update Review'}
            </Button>
          </>
        }
      >
        <ReviewForm value={formData} onChange={setFormData} />
      </Modal>

      {/* ── Confirm dialog ── */}
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
        <p className="text-sm text-gray-500 dark:text-gray-400">{confirmBody()}</p>
      </Modal>
    </div>
  );
}
