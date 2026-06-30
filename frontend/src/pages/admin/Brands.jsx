import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon, Tag } from 'lucide-react';
import { Box, Paper, Typography, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import {
  PageHeader, Button, IconBtn, SearchInput,
  Input, Textarea, Toggle,
  Table, Th, Td, Tr, Skeleton, EmptyState,
  Modal, useToast, Tooltip,
} from '../../components/admin/ui/index.js';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { StatusChip } from './adminUtils';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const EMPTY_FORM = {
  name: '', slug: '', logo: '', banner: '', description: '',
  seoTitle: '', seoDescription: '', isActive: true,
};

export default function BrandsPage() {
  const toast = useToast();

  const [brands,       setBrands]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const fetchBrands = () => {
    setLoading(true);
    api.get('/admin/brands')
      .then(({ data }) => setBrands(data.data || []))
      .catch(() => toast.error('Failed to load brands.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchBrands, []);

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (b) => {
    setEditTarget(b);
    setForm({ name: b.name, slug: b.slug, logo: b.logo || '', banner: b.banner || '', description: b.description || '', seoTitle: b.seoTitle || '', seoDescription: b.seoDescription || '', isActive: b.isActive });
    setDialogOpen(true);
  };
  const handleNameChange = (val) => setForm(prev => ({ ...prev, name: val, slug: editTarget ? prev.slug : slugify(val) }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/admin/brands/${editTarget._id}`, form);
        toast.success('Brand updated.');
      } else {
        await api.post('/admin/brands', form);
        toast.success('Brand created.');
      }
      setDialogOpen(false);
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/brands/${deleteTarget._id}`);
      toast.success('Brand deleted.');
      setDeleteTarget(null);
      fetchBrands();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (brand) => {
    try {
      await api.put(`/admin/brands/${brand._id}`, { isActive: !brand.isActive });
      fetchBrands();
    } catch { toast.error('Update failed.'); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Brands"
        subtitle={`${brands.length} brand${brands.length !== 1 ? 's' : ''} in catalogue`}
        action={<Button icon={Plus} onClick={openAdd}>Add Brand</Button>}
      />

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search brands by name or slug…" sx={{ maxWidth: 400 }} />
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ opacity: loading && brands.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s' }}>
          <Table>
            <TableHead>
              <TableRow>
                <Th sx={{ width: 48 }}>#</Th>
                <Th sx={{ width: 56 }}>Logo</Th>
                <Th>Brand Name</Th>
                <Th>Slug</Th>
                <Th>Status</Th>
                <Th align="center">Actions</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && brands.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  <Td><Skeleton width={20} height={14} /></Td>
                  <Td><Skeleton width={40} height={40} sx={{ borderRadius: 2 }} /></Td>
                  <Td><Skeleton height={14} width={140} sx={{ mb: 0.75 }} /><Skeleton height={12} width={100} /></Td>
                  <Td><Skeleton height={14} width={120} /></Td>
                  <Td><Skeleton height={22} width={64} sx={{ borderRadius: 5 }} /></Td>
                  <Td><Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}><Skeleton width={32} height={32} /><Skeleton width={32} height={32} /><Skeleton width={32} height={32} /></Box></Td>
                </Tr>
              ))}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                    <EmptyState
                      icon={Tag}
                      title="No brands found"
                      description={search ? 'No brands match your search.' : 'Add your first brand to get started.'}
                      action={
                        search
                          ? <Button variant="ghost" onClick={() => setSearch('')}>Clear search</Button>
                          : <Button icon={Plus} size="sm" onClick={openAdd}>Add Brand</Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((b, idx) => (
                <Tr key={b._id}>
                  <Td><Typography sx={{ fontSize: 13, color: 'text.disabled' }}>{idx + 1}</Typography></Td>
                  <Td>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {b.logo
                        ? <Box component="img" src={getImageUrl(b.logo)} alt={b.name} sx={{ width: 40, height: 40, objectFit: 'contain' }} />
                        : <ImageIcon size={15} style={{ opacity: 0.4 }} />
                      }
                    </Box>
                  </Td>
                  <Td>
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>{b.name}</Typography>
                    {b.description && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {b.description}
                      </Typography>
                    )}
                  </Td>
                  <Td>
                    <Box component="code" sx={{ fontSize: 12, fontFamily: 'monospace', color: 'text.secondary', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      /brand/{b.slug}
                    </Box>
                  </Td>
                  <Td>
                    <Box component="button" onClick={() => toggleActive(b)} sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer' }}>
                      <StatusChip status={b.isActive ? 'active' : 'blocked'} label={b.isActive ? 'Active' : 'Inactive'} />
                    </Box>
                  </Td>
                  <Td align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip content="View Brand Page">
                        <IconBtn icon={ExternalLink} label="View" variant="ghost" onClick={() => window.open(`/brand/${b.slug}`, '_blank')} />
                      </Tooltip>
                      <Tooltip content="Edit">
                        <IconBtn icon={Pencil} label="Edit" onClick={() => openEdit(b)} sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' } }} />
                      </Tooltip>
                      <Tooltip content="Delete">
                        <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteTarget(b)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                      </Tooltip>
                    </Box>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Brand' : 'Add Brand'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button loading={saving} disabled={!form.name.trim() || !form.slug.trim()} onClick={handleSave}>
              {editTarget ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <Input label="Brand Name" required placeholder="e.g. Jawhara Gold" value={form.name} onChange={e => handleNameChange(e.target.value)} autoFocus />
            <Input label="Slug" required placeholder="your-brand" value={form.slug} onChange={e => set('slug', slugify(e.target.value))} helper={`URL: /brand/${form.slug || 'your-brand'}`} />
          </Box>
          <Textarea label="Description" placeholder="Short brand description shown on the brand page" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
          <Input label="Logo URL" placeholder="https://… or /uploads/…" value={form.logo} onChange={e => set('logo', e.target.value)} helper="Square image recommended (min 200×200)" />
          <Input label="Banner URL" placeholder="https://… or /uploads/…" value={form.banner} onChange={e => set('banner', e.target.value)} helper="Wide banner shown at the top of the brand page (min 1440×280)" />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <Input label="SEO Meta Title" placeholder={form.name ? `${form.name} | Jawhara Jewellery` : ''} value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} maxLength={70} helper={`${form.seoTitle.length}/70 chars`} />
            <Textarea label="SEO Meta Description" value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} rows={2} maxLength={160} helper={`${form.seoDescription.length}/160 chars`} />
          </Box>
          <Toggle label="Active (visible on frontend)" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
        </Box>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Brand?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Delete <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>{deleteTarget?.name}</Box>? This will not delete products associated with this brand, but the brand page at{' '}
          <Box component="code" sx={{ fontSize: 11, bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: 1 }}>/brand/{deleteTarget?.slug}</Box>{' '}
          will no longer be accessible.
        </Typography>
      </Modal>
    </Box>
  );
}
