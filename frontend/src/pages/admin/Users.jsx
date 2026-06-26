import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, ShieldAlert, ShieldCheck, Heart } from 'lucide-react';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import { getImageUrl } from '../../utils/imageUrl';
import {
  PageHeader, StatCard, Card, CardBody, Table, Th, Td, Tr,
  Skeleton, EmptyState, Pagination, SearchInput, Select,
  Button, Tooltip,
} from '../../components/admin/ui/index.js';

const PER_PAGE = 15;

export default function AdminCustomers() {
  const [users, setUsers]               = useState([]);
  const [total, setTotal]               = useState(0);
  const [stats, setStats]               = useState(null);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = useCallback((p = 1, q = search, role = roleFilter, status = statusFilter) => {
    setLoading(true);
    api.get('/admin/users', { params: { page: p, limit: PER_PAGE, search: q, role, status } })
      .then(({ data }) => {
        setUsers(data.data);
        setTotal(data.total);
        if (data.stats) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(1, '', '', ''); }, []);

  const handleSearch = (q) => {
    setSearch(q);
    setPage(1);
    fetchUsers(1, q, roleFilter, statusFilter);
  };

  const handleRoleFilter = (e) => {
    const r = e.target.value;
    setRoleFilter(r);
    setPage(1);
    fetchUsers(1, search, r, statusFilter);
  };

  const handleStatusFilter = (e) => {
    const s = e.target.value;
    setStatusFilter(s);
    setPage(1);
    fetchUsers(1, search, roleFilter, s);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchUsers(p, search, roleFilter, statusFilter);
  };

  const toggleActive = async (id, current) => {
    await api.put(`/admin/users/${id}`, { isActive: !current });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !current } : u));
    setStats(s => s ? { ...s, active: s.active + (current ? -1 : 1), blocked: s.blocked + (current ? 1 : -1) } : s);
  };

  const toggleRole = async (id, current) => {
    const newRole = current === 'admin' ? 'customer' : 'admin';
    await api.put(`/admin/users/${id}`, { role: newRole });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
    setStats(s => s ? { ...s, admin: s.admin + (current === 'admin' ? -1 : 1) } : s);
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const statsLoading = !stats && loading;

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={stats ? `${stats.total} registered users` : 'Manage your registered users'}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Total Users"  value={stats?.total   ?? '—'} icon={Users}        color="indigo"  />
            <StatCard title="Active"        value={stats?.active  ?? '—'} icon={CheckCircle}  color="emerald" />
            <StatCard title="Blocked"       value={stats?.blocked ?? '—'} icon={ShieldAlert}  color="rose"    />
            <StatCard title="Admins"        value={stats?.admin   ?? '—'} icon={ShieldCheck}  color="amber"   />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search name, email or phone…"
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={roleFilter}
          onChange={handleRoleFilter}
          className="min-w-[130px]"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="min-w-[130px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th className="text-center">Wishlist</Th>
                <Th>Status</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody className={loading && users.length > 0 ? 'opacity-50 transition-opacity duration-150' : ''}>
              {loading && users.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <Td key={j}><Skeleton className="h-4 w-full" /></Td>
                    ))}
                  </Tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description="Try adjusting your search or filter."
                      className="py-16"
                    />
                  </td>
                </tr>
              ) : users.map(u => (
                <Tr key={u._id}>
                  {/* Avatar + Name */}
                  <Td>
                    <div className="flex items-center gap-2.5">
                      {u.avatar ? (
                        <img
                          src={getImageUrl(u.avatar)}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                        {u.name}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate block max-w-[200px]">
                      {u.email}
                    </span>
                  </Td>
                  <Td>
                    <span className={`text-sm truncate block max-w-[140px] ${u.phone ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                      {u.phone || '—'}
                    </span>
                  </Td>
                  <Td><StatusChip status={u.role} /></Td>
                  <Td>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-xs font-bold">
                      <Heart size={11} className="fill-pink-500 text-pink-500" />
                      {u.wishlist?.length ?? 0}
                    </span>
                  </Td>
                  <Td>
                    <StatusChip status={u.isActive ? 'active' : 'blocked'} label={u.isActive ? 'Active' : 'Blocked'} />
                  </Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="xs"
                        variant={u.isActive ? 'danger' : 'success'}
                        onClick={() => toggleActive(u._id, u.isActive)}
                      >
                        {u.isActive ? 'Block' : 'Unblock'}
                      </Button>
                      <Tooltip content={u.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}>
                        <Button
                          size="xs"
                          variant={u.role === 'admin' ? 'warning' : 'outline'}
                          onClick={() => toggleRole(u._id, u.role)}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                      </Tooltip>
                    </div>
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
