import { useState, useEffect } from 'react';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { DirhamSymbol } from 'dirham/react';
import {
  Box, Paper, Typography, IconButton, TableHead, TableBody, TableRow, TableCell, MenuItem,
} from '@mui/material';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import {
  PageHeader, Table, Th, Td, Tr,
  Skeleton, EmptyState, Pagination, Select,
} from '../../components/admin/ui/index.js';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PER_PAGE = 15;

export default function AdminOrders() {
  const [orders, setOrders]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]           = useState(false);

  const fetchOrders = (p = page, s = statusFilter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: PER_PAGE });
    if (s) params.set('status', s);
    api.get(`/admin/orders?${params}`)
      .then(({ data }) => { setOrders(data.data); setTotal(data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(1, ''); }, []);

  const handleFilterChange = (e) => {
    const v = e.target.value;
    setStatusFilter(v);
    setPage(1);
    fetchOrders(1, v);
  };

  const handlePageChange = (p) => { setPage(p); fetchOrders(p, statusFilter); };

  const updateStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}`, { status });
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Orders"
        subtitle={`${total.toLocaleString()} total order${total !== 1 ? 's' : ''}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Select value={statusFilter} onChange={handleFilterChange} sx={{ minWidth: 160 }}>
              <MenuItem value="">All Statuses</MenuItem>
              {STATUSES.map(s => (
                <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
              ))}
            </Select>
            <IconButton
              onClick={() => fetchOrders(page, statusFilter)}
              disabled={loading}
              size="small"
              title="Refresh"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Box>
        }
      />

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '13.5px', color: 'text.secondary' }}>
            {loading && orders.length === 0
              ? <Skeleton width={96} height={16} />
              : <><Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{total.toLocaleString()}</Box> order{total !== 1 ? 's' : ''}{statusFilter ? ` · ${statusFilter}` : ''}</>
            }
          </Typography>
          {loading && orders.length > 0 && (
            <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600 }}>Updating…</Typography>
          )}
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <Th>Order ID</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Order Status</Th>
              <Th>Payment</Th>
              <Th>Date</Th>
              <Th>Update Status</Th>
            </TableRow>
          </TableHead>
          <TableBody sx={{ opacity: loading && orders.length > 0 ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {loading && orders.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => <Td key={j}><Skeleton height={14} /></Td>)}
                </Tr>
              ))
              : orders.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                      <EmptyState icon={ShoppingBag} title="No orders found" description="Try adjusting the status filter to see more orders." />
                    </TableCell>
                  </TableRow>
                )
                : orders.map(o => (
                  <Tr key={o._id}>
                    <Td>
                      <Box
                        component="span"
                        sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}
                      >
                        #{o._id.slice(-8).toUpperCase()}
                      </Box>
                    </Td>
                    <Td>
                      <Box sx={{ maxWidth: 160 }}>
                        <Typography sx={{ fontSize: '13.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.user?.name || '—'}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.25 }}>{o.user?.email}</Typography>
                      </Box>
                    </Td>
                    <Td>
                      <Typography sx={{ fontSize: '13.5px' }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</Typography>
                    </Td>
                    <Td>
                      <Typography sx={{ fontSize: '13.5px', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DirhamSymbol size="0.85em" /> {o.totalAmount?.toLocaleString()}
                      </Typography>
                    </Td>
                    <Td><StatusChip status={o.status} /></Td>
                    <Td><StatusChip status={o.paymentStatus} /></Td>
                    <Td>
                      <Typography sx={{ fontSize: '12.5px', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Td>
                    <Td>
                      <Select value={o.status} onChange={e => updateStatus(o._id, e.target.value)} sx={{ minWidth: 130 }}>
                        {STATUSES.map(s => (
                          <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                        ))}
                      </Select>
                    </Td>
                  </Tr>
                ))
            }
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination page={page} totalPages={totalPages} onPage={handlePageChange} totalItems={total} perPage={PER_PAGE} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
