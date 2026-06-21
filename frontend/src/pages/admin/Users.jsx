import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Avatar, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, TablePagination, Skeleton,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Grid, Chip, Stack, Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon              from '@mui/icons-material/Search';
import PeopleIcon              from '@mui/icons-material/People';
import CheckCircleIcon         from '@mui/icons-material/CheckCircle';
import BlockIcon               from '@mui/icons-material/Block';
import AdminPanelSettingsIcon  from '@mui/icons-material/AdminPanelSettings';
import FavoriteIcon            from '@mui/icons-material/Favorite';
import api from '../../services/api';
import { StatusChip, getKpiColors } from './adminUtils';
import { getImageUrl } from '../../utils/imageUrl';

function StatCard({ title, value, icon: Icon, variant, loading }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { bg, color } = getKpiColors(variant, isDark);

  if (loading) return (
    <Card sx={{ height: '100%' }}>
      <Box sx={{ p: 2.5 }}><Skeleton variant="rectangular" height={68} sx={{ borderRadius: 1.5 }} /></Box>
    </Card>
  );

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', bgcolor: color }} />
      <Box sx={{ pl: 2.5, pr: 2.5, pt: 2.25, pb: 2.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, fontSize: '0.62rem' }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color }}>
            {value ?? '—'}
          </Typography>
        </Box>
        <Box sx={{ width: 38, height: 38, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: bg }}>
          <Icon sx={{ fontSize: '1.2rem', color }} />
        </Box>
      </Box>
    </Card>
  );
}

export default function AdminCustomers() {
  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [stats, setStats]           = useState(null);
  const [page, setPage]             = useState(0);
  const [rowsPerPage]               = useState(15);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = useCallback((p = 0, q = search, role = roleFilter, status = statusFilter) => {
    setLoading(true);
    api.get('/admin/users', { params: { page: p + 1, limit: rowsPerPage, search: q, role, status } })
      .then(({ data }) => {
        setUsers(data.data);
        setTotal(data.total);
        if (data.stats) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, [rowsPerPage, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(0, '', '', ''); }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    setPage(0);
    fetchUsers(0, q, roleFilter, statusFilter);
  };

  const handleRoleFilter = (e) => {
    const r = e.target.value;
    setRoleFilter(r);
    setPage(0);
    fetchUsers(0, search, r, statusFilter);
  };

  const handleStatusFilter = (e) => {
    const s = e.target.value;
    setStatusFilter(s);
    setPage(0);
    fetchUsers(0, search, roleFilter, s);
  };

  const handlePageChange = (_, p) => {
    setPage(p);
    fetchUsers(p);
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Customers</Typography>
        <Typography variant="body2" color="text.secondary">
          {stats ? `${stats.total} registered users` : 'Manage your registered users'}
        </Typography>
      </Box>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Users"  value={stats?.total}   icon={PeopleIcon}             variant="blue"   loading={!stats && loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active"       value={stats?.active}  icon={CheckCircleIcon}        variant="green"  loading={!stats && loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Blocked"      value={stats?.blocked} icon={BlockIcon}              variant="maroon" loading={!stats && loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Admins"       value={stats?.admin}   icon={AdminPanelSettingsIcon} variant="gold"   loading={!stats && loading} />
        </Grid>
      </Grid>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search name, email or phone…"
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} label="Role" onChange={handleRoleFilter}>
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={handleStatusFilter}>
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="center">Wishlist</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 7, color: 'text.secondary' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              ) : users.map(u => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={u.avatar ? getImageUrl(u.avatar) : undefined}
                        sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.82rem', fontWeight: 800, flexShrink: 0 }}
                      >
                        {!u.avatar && u.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 150 }}>
                        {u.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={u.phone ? 'text.primary' : 'text.disabled'} noWrap sx={{ maxWidth: 140 }}>
                      {u.phone || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={u.role} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<FavoriteIcon sx={{ fontSize: '0.82rem !important', color: '#db2777 !important' }} />}
                      label={u.wishlist?.length ?? 0}
                      size="small"
                      sx={{ bgcolor: 'rgba(219,39,119,0.08)', color: '#db2777', fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={u.isActive ? 'active' : 'blocked'} label={u.isActive ? 'Active' : 'Blocked'} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.75} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color={u.isActive ? 'error' : 'success'}
                        onClick={() => toggleActive(u._id, u.isActive)}
                        sx={{ minWidth: 76, fontSize: '0.74rem', py: 0.35, textTransform: 'none' }}
                      >
                        {u.isActive ? 'Block' : 'Unblock'}
                      </Button>
                      <Tooltip title={u.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}>
                        <Button
                          size="small"
                          variant="outlined"
                          color={u.role === 'admin' ? 'warning' : 'primary'}
                          onClick={() => toggleRole(u._id, u.role)}
                          sx={{ minWidth: 76, fontSize: '0.74rem', py: 0.35, textTransform: 'none' }}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
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
      </Card>
    </Box>
  );
}
