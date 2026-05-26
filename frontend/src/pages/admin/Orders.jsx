import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Select, MenuItem, FormControl,
  InputLabel, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, TablePagination, Skeleton,
} from '@mui/material';
import { DirhamSymbol } from 'dirham/react';
import api from '../../services/api';
import { StatusChip } from './adminUtils';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(0);
  const [rowsPerPage]                   = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]           = useState(true);

  const fetchOrders = (p = page, s = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p + 1, limit: rowsPerPage });
    if (s) params.set('status', s);
    api.get(`/admin/orders?${params}`)
      .then(({ data }) => { setOrders(data.data); setTotal(data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(0, ''); }, []);

  const handleFilterChange = (e) => { const v = e.target.value; setStatusFilter(v); setPage(0); fetchOrders(0, v); };
  const handlePageChange   = (_, p) => { setPage(p); fetchOrders(p, statusFilter); };

  const updateStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}`, { status });
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Orders</Typography>
          <Typography variant="body2" color="text.secondary">{total} total orders</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select label="Filter by Status" value={statusFilter} onChange={handleFilterChange}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map(s => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Order Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Update</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                </TableRow>
              )) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 7, color: 'text.secondary' }}>No orders found.</TableCell>
                </TableRow>
              ) : orders.map(o => (
                <TableRow key={o._id}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    #{o._id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>{o.user?.name || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 140 }}>{o.user?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} noWrap><DirhamSymbol size="0.85em" /> {o.totalAmount?.toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell><StatusChip status={o.status} /></TableCell>
                  <TableCell><StatusChip status={o.paymentStatus} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>{new Date(o.createdAt).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select value={o.status} onChange={e => updateStatus(o._id, e.target.value)} sx={{ fontSize: '0.82rem' }}>
                        {STATUSES.map(s => (
                          <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
      </Card>
    </Box>
  );
}
