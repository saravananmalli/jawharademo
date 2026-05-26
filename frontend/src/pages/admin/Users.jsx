import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Avatar, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, TablePagination, Skeleton,
} from '@mui/material';
import api from '../../services/api';
import { StatusChip } from './adminUtils';

export default function AdminCustomers() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);
  const [rowsPerPage]         = useState(15);
  const [loading, setLoading] = useState(true);

  const fetchUsers = (p = page) => {
    setLoading(true);
    api.get(`/admin/users?page=${p + 1}&limit=${rowsPerPage}`)
      .then(({ data }) => { setUsers(data.data); setTotal(data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(0); }, []);

  const handlePageChange = (_, p) => { setPage(p); fetchUsers(p); };

  const toggleActive = async (id, current) => {
    await api.put(`/admin/users/${id}`, { isActive: !current });
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !current } : u));
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Customers</Typography>
        <Typography variant="body2" color="text.secondary">{total} registered customers</Typography>
      </Box>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton height={20} /></TableCell>)}
                </TableRow>
              )) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 7, color: 'text.secondary' }}>No customers found.</TableCell>
                </TableRow>
              ) : users.map(u => (
                <TableRow key={u._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.82rem', fontWeight: 800, flexShrink: 0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>{u.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{u.email}</Typography>
                  </TableCell>
                  <TableCell><StatusChip status={u.role} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>{new Date(u.createdAt).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={u.isActive ? 'active' : 'blocked'} label={u.isActive ? 'Active' : 'Blocked'} />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color={u.isActive ? 'error' : 'success'}
                      onClick={() => toggleActive(u._id, u.isActive)}
                      sx={{ minWidth: 80, fontSize: '0.78rem', py: 0.4 }}
                    >
                      {u.isActive ? 'Block' : 'Unblock'}
                    </Button>
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
