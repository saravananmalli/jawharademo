import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  IconButton, Tooltip, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, InputAdornment, CircularProgress, Avatar,
  FormControlLabel, Switch,
} from '@mui/material';
import AddIcon        from '@mui/icons-material/Add';
import EditIcon       from '@mui/icons-material/Edit';
import DeleteIcon     from '@mui/icons-material/Delete';
import SearchIcon     from '@mui/icons-material/Search';
import OpenInNewIcon  from '@mui/icons-material/OpenInNew';
import ImageIcon      from '@mui/icons-material/Image';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { StatusChip } from './adminUtils';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const EMPTY_FORM = {
  name:           '',
  slug:           '',
  logo:           '',
  banner:         '',
  description:    '',
  seoTitle:       '',
  seoDescription: '',
  isActive:       true,
};

export default function BrandsPage() {
  const [brands,       setBrands]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [alert,        setAlert]        = useState(null);

  const flashAlert = (msg, severity = 'success') => {
    setAlert({ msg, severity });
    setTimeout(() => setAlert(null), 3000);
  };

  const fetchBrands = () => {
    setLoading(true);
    api.get('/admin/brands')
      .then(({ data }) => setBrands(data.data || []))
      .catch(() => flashAlert('Failed to load brands.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchBrands, []);

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (b) => {
    setEditTarget(b);
    setForm({
      name:           b.name,
      slug:           b.slug,
      logo:           b.logo || '',
      banner:         b.banner || '',
      description:    b.description || '',
      seoTitle:       b.seoTitle || '',
      seoDescription: b.seoDescription || '',
      isActive:       b.isActive,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (val) => {
    setForm(prev => ({
      ...prev,
      name: val,
      slug: editTarget ? prev.slug : slugify(val),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/admin/brands/${editTarget._id}`, form);
        flashAlert('Brand updated.');
      } else {
        await api.post('/admin/brands', form);
        flashAlert('Brand created.');
      }
      setDialogOpen(false);
      fetchBrands();
    } catch (err) {
      flashAlert(err.response?.data?.message || 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/brands/${deleteTarget._id}`);
      flashAlert('Brand deleted.');
      setDeleteTarget(null);
      fetchBrands();
    } catch {
      flashAlert('Delete failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (brand) => {
    try {
      await api.put(`/admin/brands/${brand._id}`, { isActive: !brand.isActive });
      fetchBrands();
    } catch {
      flashAlert('Update failed.', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Brands</Typography>
          <Typography variant="body2" color="text.secondary">{brands.length} brands in catalogue</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Brand</Button>
      </Box>

      {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      <Card>
        <CardContent>
          <TextField
            placeholder="Search brands…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ mb: 2.5, width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50 }}>#</TableCell>
                    <TableCell sx={{ width: 60 }}>Logo</TableCell>
                    <TableCell>Brand Name</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((b, idx) => (
                    <TableRow key={b._id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.disabled">{idx + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={getImageUrl(b.logo)}
                          alt={b.name}
                          variant="rounded"
                          sx={{ width: 36, height: 36, bgcolor: 'grey.100' }}
                        >
                          <ImageIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{b.name}</Typography>
                        {b.description && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                            {b.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          /brand/{b.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          status={b.isActive ? 'active' : 'blocked'}
                          label={b.isActive ? 'Active' : 'Inactive'}
                          clickable
                          onClick={() => toggleActive(b)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Brand Page">
                            <IconButton
                              size="small"
                              color="default"
                              component="a"
                              href={`/brand/${b.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => openEdit(b)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(b)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                        {search ? `No brands match "${search}".` : 'No brands yet. Click "Add Brand" to get started.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand Name *"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Slug *"
                value={form.slug}
                onChange={e => set('slug', slugify(e.target.value))}
                helperText={`URL: /brand/${form.slug || 'your-brand'}`}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>/brand/</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                multiline
                rows={2}
                placeholder="Short brand description shown on the brand page"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Logo URL"
                value={form.logo}
                onChange={e => set('logo', e.target.value)}
                placeholder="https://… or /uploads/…"
                helperText="Square image recommended (min 200×200)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Banner URL (optional)"
                value={form.banner}
                onChange={e => set('banner', e.target.value)}
                placeholder="https://… or /uploads/…"
                helperText="Wide banner shown at the top of the brand page (min 1440×280)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SEO Meta Title"
                value={form.seoTitle}
                onChange={e => set('seoTitle', e.target.value)}
                placeholder={form.name ? `${form.name} | Jawhara Jewellery` : 'Brand | Jawhara Jewellery'}
                helperText={`${form.seoTitle.length}/70 chars`}
                inputProps={{ maxLength: 70 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SEO Meta Description"
                value={form.seoDescription}
                onChange={e => set('seoDescription', e.target.value)}
                multiline
                rows={2}
                helperText={`${form.seoDescription.length}/160 chars`}
                inputProps={{ maxLength: 160 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={e => set('isActive', e.target.checked)}
                    color="success"
                  />
                }
                label="Active (visible on frontend)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.slug.trim() || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {editTarget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Brand?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete <strong>{deleteTarget?.name}</strong>? This will not delete products associated
            with this brand, but the brand page at <code>/brand/{deleteTarget?.slug}</code> will
            no longer be accessible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
