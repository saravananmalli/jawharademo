import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import { StatusChip } from './adminUtils';

const INITIAL = [
  { id: 1, name: 'Rings',     slug: 'rings',     active: true },
  { id: 2, name: 'Earrings',  slug: 'earrings',  active: true },
  { id: 3, name: 'Necklaces', slug: 'necklaces', active: true },
  { id: 4, name: 'Bracelets', slug: 'bracelets', active: true },
  { id: 5, name: 'Pendants',  slug: 'pendants',  active: true },
  { id: 6, name: 'Sets',      slug: 'sets',      active: true },
];

const EMPTY = { name: '', slug: '' };

export default function Categories() {
  const [categories, setCategories]   = useState(INITIAL);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saved, setSaved]             = useState(false);

  const openAdd  = () => { setEditTarget(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (c) => { setEditTarget(c); setForm({ name: c.name, slug: c.slug }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    if (editTarget) {
      setCategories(prev => prev.map(c => c.id === editTarget.id ? { ...c, name: form.name, slug } : c));
    } else {
      setCategories(prev => [...prev, { id: Date.now(), name: form.name, slug, active: true }]);
    }
    setDialogOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const toggleActive = (id) => setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Categories</Typography>
          <Typography variant="body2" color="text.secondary">{categories.length} product categories</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Category</Button>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Category saved.</Alert>}

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 52 }}></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'rgba(150,113,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                      <CategoryIcon sx={{ fontSize: '1.1rem' }} />
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{cat.name}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{cat.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={cat.active ? 'active' : 'blocked'}
                      label={cat.active ? 'Active' : 'Inactive'}
                      clickable
                      onClick={() => toggleActive(cat.id)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(cat)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                helperText="URL-friendly identifier"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>{editTarget ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Category?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
