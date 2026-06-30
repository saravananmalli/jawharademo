import { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle, ShieldAlert, ShieldCheck, Heart } from 'lucide-react';
import {
  Box, Grid, Paper, Typography, Avatar, Chip, TableHead, TableBody, TableRow, TableCell, MenuItem,
} from '@mui/material';
import api from '../../services/api';
import { StatusChip } from './adminUtils';
import { getImageUrl } from '../../utils/imageUrl';
import {
  PageHeader, StatCard, Table, Th, Td, Tr,
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

  const handleSearch = (q) => { setSearch(q); setPage(1); fetchUsers(1, q, roleFilter, statusFilter); };
  const handleRoleFilter = (e) => { const r = e.target.value; setRoleFilter(r); setPage(1); fetchUsers(1, search, r, statusFilter); };
  const handleStatusFilter = (e) => { const s = e.target.value; setStatusFilter(s); setPage(1); fetchUsers(1, search, roleFilter, s); };
  const handlePageChange = (p) => { setPage(p); fetchUsers(p, search, roleFilter, statusFilter); };

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Customers"
        subtitle={stats ? `${stats.total?.toLocaleString()} registered users` : 'Manage your registered users'}
      />

      {/* Stats */}
      <Grid container spacing={2.5}>
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 6, sm: 3 }} key={i}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
                <Skeleton height={80} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
          ))
          : [
            { title: 'Total Users', value: stats?.total   ?? '—', icon: Users,        color: 'indigo'  },
            { title: 'Active',       value: stats?.active  ?? '—', icon: CheckCircle,  color: 'emerald' },
            { title: 'Blocked',      value: stats?.blocked ?? '—', icon: ShieldAlert,  color: 'rose'    },
            { title: 'Admins',       value: stats?.admin   ?? '—', icon: ShieldCheck,  color: 'amber'   },
          ].map((s, i) => (
            <Grid size={{ xs: 6, sm: 3 }} key={i}>
              <StatCard {...s} />
            </Grid>
          ))
        }
      </Grid>

      {/* Filter toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search name, email or phone…"
            sx={{ flex: 1, minWidth: 200 }}
          />
          <Select value={roleFilter} onChange={handleRoleFilter} sx={{ minWidth: 130 }}>
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
          <Select value={statusFilter} onChange={handleStatusFilter} sx={{ minWidth: 130 }}>
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* Table card */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '13.5px', color: 'text.secondary' }}>
            {loading && users.length === 0
              ? <Skeleton width={110} height={16} />
              : <><Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{total.toLocaleString()}</Box> user{total !== 1 ? 's' : ''}</>
            }
          </Typography>
          {loading && users.length > 0 && (
            <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600 }}>Updating…</Typography>
          )}
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <Th>User</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Role</Th>
              <Th>Joined</Th>
              <Th align="center">Wishlist</Th>
              <Th>Status</Th>
              <Th align="center">Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody sx={{ opacity: loading && users.length > 0 ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {loading && users.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <Td key={j}><Skeleton height={14} /></Td>
                  ))}
                </Tr>
              ))
              : users.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                      <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filter criteria." />
                    </TableCell>
                  </TableRow>
                )
                : users.map(u => (
                  <Tr key={u._id}>
                    <Td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {u.avatar ? (
                          <Box
                            component="img"
                            src={getImageUrl(u.avatar)}
                            alt={u.name}
                            sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'cover', flexShrink: 0, border: '1px solid', borderColor: 'divider' }}
                          />
                        ) : (
                          <Avatar
                            sx={{ width: 36, height: 36, borderRadius: 2, fontSize: 14, fontWeight: 700, bgcolor: 'rgba(99,102,241,0.12)', color: 'primary.main', flexShrink: 0 }}
                          >
                            {u.name?.[0]?.toUpperCase()}
                          </Avatar>
                        )}
                        <Typography sx={{ fontSize: '13.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {u.name}
                        </Typography>
                      </Box>
                    </Td>
                    <Td>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {u.email}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography sx={{ fontSize: 13, color: u.phone ? 'text.primary' : 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        {u.phone || '—'}
                      </Typography>
                    </Td>
                    <Td><StatusChip status={u.role} /></Td>
                    <Td>
                      <Typography sx={{ fontSize: '12.5px', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Td>
                    <Td align="center">
                      <Chip
                        icon={<Heart size={10} fill="#ec4899" color="#ec4899" />}
                        label={u.wishlist?.length ?? 0}
                        size="small"
                        sx={{ bgcolor: 'rgba(236,72,153,0.1)', color: '#db2777', fontWeight: 700, fontSize: '11.5px', height: 22 }}
                      />
                    </Td>
                    <Td>
                      <StatusChip status={u.isActive ? 'active' : 'blocked'} label={u.isActive ? 'Active' : 'Blocked'} />
                    </Td>
                    <Td align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Button size="xs" variant={u.isActive ? 'danger' : 'success'} onClick={() => toggleActive(u._id, u.isActive)}>
                          {u.isActive ? 'Block' : 'Unblock'}
                        </Button>
                        <Tooltip content={u.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}>
                          <Button size="xs" variant={u.role === 'admin' ? 'warning' : 'outline'} onClick={() => toggleRole(u._id, u.role)}>
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </Button>
                        </Tooltip>
                      </Box>
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
