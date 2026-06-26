import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star, Filter, Eye, Pencil, Trash2, Package } from 'lucide-react';
import {
  PageHeader, Button, IconBtn, SearchInput, Select,
  Table, Th, Td, Tr, Skeleton, EmptyState,
  Pagination, Modal, Toast, useToast, Tooltip, StatusBadge,
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

  // Initial load
  useEffect(() => { loadProducts(1, '', '', '', ''); }, [loadProducts]);

  // Debounced search — re-fires when search text OR any filter changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => loadProducts(1, searchInput.trim(), filterBadge, filterCat, filterRating),
      300,
    );
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, filterBadge, filterCat, filterRating, loadProducts]);

  const handlePageChange = (newPage) => {
    const { q, badge, cat, rating } = activeParams.current;
    loadProducts(newPage, q, badge, cat, rating);
  };

  const activeFilterCount = [filterBadge, filterCat, filterRating].filter(Boolean).length;

  const handleClearAll = () => {
    setSearchInput('');
    setFilterBadge('');
    setFilterCat('');
    setFilterRating('');
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
    <div>
      <Toast />

      <PageHeader
        title="Products"
        subtitle={`${total} products in catalogue`}
        action={
          <Button
            icon={Plus}
            onClick={() => {}}
            // Use a wrapping Link since Button renders <button>
          >
            <Link to="/admin/products/add" className="contents">Add Product</Link>
          </Button>
        }
      />

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Search + filter toolbar */}
        <div className="flex flex-wrap gap-3 items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by name, SKU, brand, category…"
            className="flex-1 min-w-[220px]"
          />

          {/* Badge filter */}
          <Select
            value={filterBadge}
            onChange={e => setFilterBadge(e.target.value)}
            className="w-36"
          >
            <option value="">All Badges</option>
            {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </Select>

          {/* Category filter */}
          <Select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="w-40"
          >
            <option value="">All Categories</option>
            {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          {/* Rating filter */}
          <Select
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
            className="w-36"
          >
            <option value="">All Ratings</option>
            {RATING_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>

          {/* Active filter count + clear all */}
          {(activeFilterCount > 0 || searchInput) && (
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                  <Filter size={11} />
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors whitespace-nowrap underline underline-offset-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className={`transition-opacity duration-150 ${loading && products.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
          <Table className="rounded-none border-0">
            <thead>
              <tr>
                <Th className="w-16">Image</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Badge</Th>
                <Th>Rating</Th>
                <Th>Stock</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {/* Skeleton rows */}
              {loading && products.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  <Td><Skeleton className="w-10 h-10 rounded-lg" /></Td>
                  <Td>
                    <Skeleton className="h-4 w-40 mb-1.5" />
                    <Skeleton className="h-3 w-24" />
                  </Td>
                  <Td><Skeleton className="h-4 w-24" /></Td>
                  <Td><Skeleton className="h-4 w-20" /></Td>
                  <Td><Skeleton className="h-5 w-16 rounded-full" /></Td>
                  <Td><Skeleton className="h-4 w-12" /></Td>
                  <Td><Skeleton className="h-5 w-16 rounded-full" /></Td>
                  <Td>
                    <div className="flex justify-center gap-1">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                    </div>
                  </Td>
                </Tr>
              ))}

              {/* Empty state */}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Package}
                      title="No products found"
                      description={
                        searchInput || activeFilterCount > 0
                          ? 'No products match the current search / filters.'
                          : 'Get started by adding your first product.'
                      }
                      action={
                        searchInput || activeFilterCount > 0
                          ? <button onClick={handleClearAll} className="text-sm text-indigo-600 hover:underline">Clear filters</button>
                          : null
                      }
                    />
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {products.map(p => (
                <Tr key={p._id}>
                  {/* Thumbnail */}
                  <Td>
                    <div className="w-10 h-10 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      {p.images?.[0]
                        ? <img src={getImageUrl(p.images[0])} alt={p.name} className="w-10 h-10 object-cover" />
                        : <Package size={16} className="text-gray-400" />
                      }
                    </div>
                  </Td>

                  {/* Name + SKU */}
                  <Td className="max-w-[220px]">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                    {p.designCode && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">SKU: {p.designCode}</p>
                    )}
                  </Td>

                  {/* Category */}
                  <Td>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{p.category}</span>
                  </Td>

                  {/* Price */}
                  <Td>
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className={`text-sm font-bold ${p.discount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        AED {p.price?.toLocaleString()}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-gray-400 line-through">
                          AED {p.originalPrice?.toLocaleString()}
                        </span>
                      )}
                      {p.discount > 0 && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          -{p.discount}%
                        </span>
                      )}
                    </div>
                  </Td>

                  {/* Badge */}
                  <Td>
                    {p.badge
                      ? <StatusChip status={p.badge} label={p.badge} />
                      : <span className="text-gray-300 dark:text-gray-600">—</span>
                    }
                  </Td>

                  {/* Rating */}
                  <Td>
                    {p.rating ? (
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {Number(p.rating).toFixed(1)}
                        </span>
                        {p.reviewCount > 0 && (
                          <span className="text-xs text-gray-400">({p.reviewCount})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </Td>

                  {/* Stock toggle */}
                  <Td>
                    <button onClick={() => toggleStock(p._id, p.inStock)} className="cursor-pointer">
                      <StatusChip
                        status={p.inStock ? 'inStock' : 'outOfStock'}
                        label={p.inStock ? 'In Stock' : 'Out'}
                      />
                    </button>
                  </Td>

                  {/* Actions */}
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip content="View on storefront">
                        <IconBtn
                          icon={Eye}
                          label="View"
                          variant="ghost"
                          as="a"
                          href={`/product/${p._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => { window.open(`/product/${p._id}`, '_blank'); }}
                        />
                      </Tooltip>
                      <Tooltip content="Edit">
                        <Link to={`/admin/products/${p._id}/edit`}>
                          <IconBtn
                            icon={Pencil}
                            label="Edit"
                            className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          />
                        </Link>
                      </Tooltip>
                      <Tooltip content="Delete">
                        <IconBtn
                          icon={Trash2}
                          label="Delete"
                          onClick={() => setDeleteTarget(p)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        />
                      </Tooltip>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={handlePageChange}
              totalItems={total}
              perPage={ROWS_PER_PAGE}
            />
          </div>
        )}
      </div>

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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{' '}
          <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong>?{' '}
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
