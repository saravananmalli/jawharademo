import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DirhamSymbol } from 'dirham/react';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  IconButton, Avatar, Tooltip, Stack, TablePagination, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TableSortLabel, Skeleton, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon         from '@mui/icons-material/Add';
import SearchIcon      from '@mui/icons-material/Search';
import ClearIcon       from '@mui/icons-material/Clear';
import EditIcon        from '@mui/icons-material/Edit';
import DeleteIcon      from '@mui/icons-material/Delete';
import StarIcon        from '@mui/icons-material/Star';
import FilterListIcon  from '@mui/icons-material/FilterList';
import VisibilityIcon  from '@mui/icons-material/Visibility';
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

export default function AdminProducts() {
  const theme = useTheme();

  const [products, setProducts]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(0);
  const [rowsPerPage]                   = useState(15);
  const [searchInput, setSearchInput]   = useState('');
  const [filterBadge, setFilterBadge]   = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [loading, setLoading]           = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debounceRef  = useRef(null);
  const activeParams = useRef({});

  const loadProducts = useCallback((p, q, badge, cat, rating) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p + 1, limit: rowsPerPage });
    if (q)      params.set('q', q);
    if (badge)  params.set('badge', badge);
    if (cat)    params.set('category', cat);
    if (rating) params.set('minRating', rating);
    activeParams.current = { q, badge, cat, rating };
    api.get(`/products?${params}`)
      .then(({ data }) => { setProducts(data.data); setTotal(data.total); setPage(p); })
      .finally(() => setLoading(false));
  }, [rowsPerPage]);

  // Initial load
  useEffect(() => { loadProducts(0, '', '', '', ''); }, [loadProducts]);

  // Debounced search — re-fires when search text OR any filter changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => loadProducts(0, searchInput.trim(), filterBadge, filterCat, filterRating),
      300,
    );
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, filterBadge, filterCat, filterRating, loadProducts]);

  const handlePageChange = (_, newPage) => {
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
    await api.delete(`/admin/products/${deleteTarget._id}`);
    setProducts(prev => prev.filter(p => p._id !== deleteTarget._id));
    setTotal(t => t - 1);
    setDeleteTarget(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Products</Typography>
          <Typography variant="body2" color="text.secondary">{total} products in catalogue</Typography>
        </Box>
        <Button component={Link} to="/admin/products/add" variant="contained" startIcon={<AddIcon />} color="primary">
          Add Product
        </Button>
      </Box>

      <Card>
        <CardContent>
          {/* Search + filter toolbar */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Live search */}
            <TextField
              placeholder="Search by name, SKU, brand, category, flag, tag, collection or ID…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Badge filter */}
            <TextField
              select
              size="small"
              label="Badge"
              value={filterBadge}
              onChange={e => setFilterBadge(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=""><em>All Badges</em></MenuItem>
              {BADGE_OPTIONS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>

            {/* Category filter */}
            <TextField
              select
              size="small"
              label="Category"
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value=""><em>All Categories</em></MenuItem>
              {CATEGORY_LIST.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>

            {/* Rating filter */}
            <TextField
              select
              size="small"
              label="Rating"
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=""><em>All Ratings</em></MenuItem>
              {RATING_OPTIONS.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <StarIcon sx={{ fontSize: '0.8rem', color: '#f59e0b' }} />
                    <span>{r.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            {/* Active filter count + clear all */}
            {(activeFilterCount > 0 || searchInput) && (
              <Stack direction="row" alignItems="center" spacing={1}>
                {activeFilterCount > 0 && (
                  <Chip
                    size="small"
                    icon={<FilterListIcon style={{ fontSize: '0.75rem' }} />}
                    label={`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
                <Button size="small" variant="text" onClick={handleClearAll} sx={{ whiteSpace: 'nowrap' }}>
                  Clear all
                </Button>
              </Stack>
            )}
          </Box>

          {/* Table */}
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>Image</TableCell>
                  <TableCell><TableSortLabel>Name</TableSortLabel></TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price / Discount</TableCell>
                  <TableCell>Badge</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                  </TableRow>
                )) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 7, color: 'text.secondary' }}>
                      {(searchInput || activeFilterCount > 0) ? 'No products match the current search / filters.' : 'No products found.'}
                    </TableCell>
                  </TableRow>
                ) : products.map(p => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <Avatar
                        src={getImageUrl(p.images?.[0])}
                        alt={p.name}
                        variant="rounded"
                        sx={{ width: 42, height: 42, border: '1px solid', borderColor: 'divider' }}
                      >
                        {p.name?.[0]}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                      {p.designCode && (
                        <Typography variant="caption" color="text.secondary">SKU: {p.designCode}</Typography>
                      )}
                    </TableCell>
                    <TableCell><Typography variant="body2">{p.category}</Typography></TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                        <Typography sx={{ fontSize: 12, fontWeight: 700 }} color={p.discount > 0 ? 'error.main' : 'text.primary'} noWrap>
                          <DirhamSymbol size="0.85em" /> {p.price?.toLocaleString()}
                        </Typography>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <Typography sx={{ fontSize: 12, textDecoration: 'line-through' }} color="text.disabled" noWrap>
                            <DirhamSymbol size="0.85em" /> {p.originalPrice?.toLocaleString()}
                          </Typography>
                        )}
                        {p.discount > 0 && (
                          <Chip
                            label={`-${p.discount}%`}
                            size="small"
                            color="error"
                            sx={{ fontSize: 12, fontWeight: 700, height: 18, '& .MuiChip-label': { px: 0.75 } }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {p.badge
                        ? <StatusChip status={p.badge} label={p.badge} />
                        : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell>
                      {p.rating ? (
                        <Stack direction="row" alignItems="center" spacing={0.4}>
                          <StarIcon sx={{ fontSize: '0.85rem', color: '#f59e0b' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {Number(p.rating).toFixed(1)}
                          </Typography>
                          {p.reviewCount > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              ({p.reviewCount})
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={p.inStock ? 'inStock' : 'outOfStock'}
                        label={p.inStock ? 'In Stock' : 'Out'}
                        clickable
                        onClick={() => toggleStock(p._id, p.inStock)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View on storefront">
                          <IconButton
                            size="small"
                            color="default"
                            component="a"
                            href={`/product/${p._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton component={Link} to={`/admin/products/${p._id}/edit`} size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[15]}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
