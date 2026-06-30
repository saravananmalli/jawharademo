import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Star, Eye, Pencil, Trash2, Package, X, SlidersHorizontal,
} from 'lucide-react';
import {
  Box, Paper, Typography, TableHead, TableBody, TableRow, TableCell, Chip, MenuItem,
} from '@mui/material';
import {
  PageHeader, Button, IconBtn, SearchInput, Select,
  Table, Th, Td, Tr, Skeleton, EmptyState,
  Pagination, Modal, useToast, Tooltip, StatusBadge,
} from '../../components/admin/ui/index.js';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { BADGE_OPTIONS, CATEGORY_LIST } from '../../utils/filterConstants';
import { StatusChip } from './adminUtils';

const RATING_OPTIONS = [
  { label: '4★ & above', value: '4' },
  { label: '3★ & above', value: '3' },
  { label: '2★ & above', value: '2' },
  { label: '1★ & above', value: '1' },
];

const ROWS_PER_PAGE = 15;

function StarDisplay({ rating }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Star size={12} color="#f59e0b" fill="#f59e0b" style={{ flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{Number(rating).toFixed(1)}</Typography>
    </Box>
  );
}

export default function AdminProducts() {
  const toast = useToast();

  const [products, setProducts]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [searchInput, setSearchInput]   = useState('');
  const [filterBadge, setFilterBadge]   = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [loading, setLoading]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const debounceRef  = useRef(null);
  const activeParams = useRef({});

  const loadProducts = useCallback((p, q, badge, cat, rating) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: ROWS_PER_PAGE });
    if (q)      params.set('q', q);
    if (badge)  params.set('badge', badge);
    if (cat)    params.set('category', cat);
    if (rating) params.set('minRating', rating);
    activeParams.current = { q, badge, cat, rating };
    api.get(`/products?${params}`)
      .then(({ data }) => { setProducts(data.data); setTotal(data.total); setPage(p); })
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(1, '', '', '', ''); }, [loadProducts]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => loadProducts(1, searchInput.trim(), filterBadge, filterCat, filterRating), 300,
    );
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, filterBadge, filterCat, filterRating, loadProducts]);

  const handlePageChange = (newPage) => {
    const { q, badge, cat, rating } = activeParams.current;
    loadProducts(newPage, q, badge, cat, rating);
  };

  const activeFilterCount = [filterBadge, filterCat, filterRating].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || searchInput;

  const handleClearAll = () => {
    setSearchInput(''); setFilterBadge(''); setFilterCat(''); setFilterRating('');
  };

  const toggleStock = async (id, current) => {
    await api.put(`/admin/products/${id}`, { inStock: !current });
    setProducts(prev => prev.map(p => p._id === id ? { ...p, inStock: !current } : p));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${deleteTarget._id}`);
      setProducts(prev => prev.filter(p => p._id !== deleteTarget._id));
      setTotal(t => t - 1);
      setDeleteTarget(null);
      toast.success(`"${deleteTarget.name}" deleted.`);
    } catch {
      toast.error('Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / ROWS_PER_PAGE);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Products"
        subtitle={`${total.toLocaleString()} product${total !== 1 ? 's' : ''} in catalogue`}
        action={
          <Link to="/admin/products/add">
            <Button icon={Plus}>Add Product</Button>
          </Link>
        }
      />

      {/* Toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search products…"
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', flexShrink: 0 }} />
          <Select value={filterBadge} onChange={e => setFilterBadge(e.target.value)} sx={{ width: 136, flexShrink: 0 }}>
            <MenuItem value="">All Badges</MenuItem>
            {BADGE_OPTIONS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>
          <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} sx={{ width: 148, flexShrink: 0 }}>
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORY_LIST.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
          <Select value={filterRating} onChange={e => setFilterRating(e.target.value)} sx={{ width: 128, flexShrink: 0 }}>
            <MenuItem value="">All Ratings</MenuItem>
            {RATING_OPTIONS.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={handleClearAll} sx={{ flexShrink: 0 }}>Clear</Button>
          )}
        </Box>
      </Paper>

      {/* Table card */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {loading && products.length === 0
              ? <Skeleton width={100} height={16} />
              : <><Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{products.length}</Box> of <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{total}</Box> products</>
            }
          </Typography>
          {loading && products.length > 0 && (
            <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600 }}>Updating…</Typography>
          )}
        </Box>

        <Box sx={{ opacity: loading && products.length > 0 ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <Table>
            <TableHead>
              <TableRow>
                <Th sx={{ width: 64 }}>Image</Th>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Badge</Th>
                <Th>Rating</Th>
                <Th>Stock</Th>
                <Th align="center">Actions</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && products.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  <Td><Skeleton width={44} height={44} sx={{ borderRadius: 2 }} /></Td>
                  <Td><Skeleton height={14} width={160} sx={{ mb: 0.75 }} /><Skeleton height={12} width={100} /></Td>
                  <Td><Skeleton height={22} width={90} sx={{ borderRadius: 5 }} /></Td>
                  <Td><Skeleton height={14} width={72} /></Td>
                  <Td><Skeleton height={22} width={80} sx={{ borderRadius: 5 }} /></Td>
                  <Td><Skeleton height={14} width={56} /></Td>
                  <Td><Skeleton height={22} width={80} sx={{ borderRadius: 5 }} /></Td>
                  <Td><Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}><Skeleton width={32} height={32} /><Skeleton width={32} height={32} /><Skeleton width={32} height={32} /></Box></Td>
                </Tr>
              ))}

              {!loading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <EmptyState
                      icon={Package}
                      title="No products found"
                      description={hasActiveFilters ? 'No products match the current search or filters.' : 'Get started by adding your first product to the catalogue.'}
                      action={
                        hasActiveFilters
                          ? <Button variant="ghost" onClick={handleClearAll}>Clear filters</Button>
                          : <Link to="/admin/products/add"><Button icon={Plus} size="sm">Add Product</Button></Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {products.map(p => (
                <Tr key={p._id}>
                  <Td>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                      overflow: 'hidden', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {p.images?.[0]
                        ? <Box component="img" src={getImageUrl(p.images[0])} alt={p.name} sx={{ width: 44, height: 44, objectFit: 'cover' }} />
                        : <Package size={15} style={{ opacity: 0.4 }} />
                      }
                    </Box>
                  </Td>
                  <Td sx={{ maxWidth: 240 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Typography>
                    {p.designCode && <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: 'monospace', mt: 0.25 }}>{p.designCode}</Typography>}
                  </Td>
                  <Td>
                    {p.category
                      ? <Chip label={p.category} size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600, fontSize: 11 }} />
                      : <Typography sx={{ color: 'text.disabled' }}>—</Typography>
                    }
                  </Td>
                  <Td>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: p.discount > 0 ? 'error.main' : 'text.primary' }}>
                        AED {p.price?.toLocaleString()}
                      </Typography>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <Typography sx={{ fontSize: 11, color: 'text.disabled', textDecoration: 'line-through' }}>
                          AED {p.originalPrice?.toLocaleString()}
                        </Typography>
                      )}
                      {p.discount > 0 && (
                        <Chip label={`-${p.discount}%`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: 'error.main', fontWeight: 700, fontSize: 10, height: 18, alignSelf: 'flex-start' }} />
                      )}
                    </Box>
                  </Td>
                  <Td>
                    {p.badge ? <StatusChip status={p.badge} label={p.badge} /> : <Typography sx={{ color: 'text.disabled' }}>—</Typography>}
                  </Td>
                  <Td>
                    {p.rating ? (
                      <Box>
                        <StarDisplay rating={p.rating} />
                        {p.reviewCount > 0 && (
                          <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.25 }}>
                            {p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    ) : <Typography sx={{ color: 'text.disabled' }}>—</Typography>}
                  </Td>
                  <Td>
                    <Box component="button" onClick={() => toggleStock(p._id, p.inStock)} sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer' }}>
                      <StatusChip status={p.inStock ? 'inStock' : 'outOfStock'} label={p.inStock ? 'In Stock' : 'Out of Stock'} />
                    </Box>
                  </Td>
                  <Td align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip content="View on storefront">
                        <IconBtn icon={Eye} label="View" variant="ghost" onClick={() => window.open(`/product/${p._id}`, '_blank')} />
                      </Tooltip>
                      <Tooltip content="Edit product">
                        <Link to={`/admin/products/${p._id}/edit`}>
                          <IconBtn icon={Pencil} label="Edit" sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' } }} />
                        </Link>
                      </Tooltip>
                      <Tooltip content="Delete product">
                        <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteTarget(p)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                      </Tooltip>
                    </Box>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
        </Box>

        {totalPages > 1 && (
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} totalItems={total} perPage={ROWS_PER_PAGE} />
          </Box>
        )}
      </Paper>

      {/* Delete confirm modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Are you sure you want to delete{' '}
          <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>"{deleteTarget?.name}"</Box>?{' '}
          This action cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
