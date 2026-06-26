import { useState, useEffect } from 'react';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { DirhamSymbol } from 'dirham/react';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import {
  PageHeader, Card, CardBody, Table, Th, Td, Tr,
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

  const handlePageChange = (p) => {
    setPage(p);
    fetchOrders(p, statusFilter);
  };

  const updateStatus = async (id, status) => {
    await api.put(`/admin/orders/${id}`, { status });
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${total} total order${total !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onChange={handleFilterChange}
              className="min-w-[180px]"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </Select>
            <button
              onClick={() => fetchOrders(page, statusFilter)}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Order ID</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Order Status</Th>
                <Th>Payment</Th>
                <Th>Date</Th>
                <Th>Update Status</Th>
              </tr>
            </thead>
            <tbody className={loading && orders.length > 0 ? 'opacity-50 transition-opacity duration-150' : ''}>
              {loading && orders.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <Td key={j}><Skeleton className="h-4 w-full" /></Td>
                    ))}
                  </Tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={ShoppingBag}
                      title="No orders found"
                      description="Try adjusting the status filter to see more orders."
                      className="py-16"
                    />
                  </td>
                </tr>
              ) : orders.map(o => (
                <Tr key={o._id}>
                  <Td>
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      #{o._id.slice(-8).toUpperCase()}
                    </span>
                  </Td>
                  <Td>
                    <div className="max-w-[140px]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{o.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.user?.email}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      <DirhamSymbol size="0.85em" /> {o.totalAmount?.toLocaleString()}
                    </span>
                  </Td>
                  <Td><StatusChip status={o.status} /></Td>
                  <Td><StatusChip status={o.paymentStatus} /></Td>
                  <Td>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                  </Td>
                  <Td>
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o._id, e.target.value)}
                      className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[120px]"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s} className="capitalize">
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPage={handlePageChange}
                totalItems={total}
                perPage={PER_PAGE}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
