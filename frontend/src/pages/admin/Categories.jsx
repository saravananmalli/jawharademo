import { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import { Box, Paper, Typography, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import {
  PageHeader, Button, IconBtn, Input,
  Table, Th, Td, Tr, EmptyState,
  Modal, useToast, Tooltip,
} from '../../components/admin/ui/index.js';
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
  const toast = useToast();

  const [categories, setCategories]     = useState(INITIAL);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (c) => { setEditTarget(c); setForm({ name: c.name, slug: c.slug }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    if (editTarget) {
      setCategories(prev => prev.map(c => c.id === editTarget.id ? { ...c, name: form.name, slug } : c));
      toast.success('Category updated.');
    } else {
      setCategories(prev => [...prev, { id: Date.now(), name: form.name, slug, active: true }]);
      toast.success('Category added.');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" deleted.`);
    setDeleteTarget(null);
  };

  const toggleActive = (id) =>
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} product categor${categories.length !== 1 ? 'ies' : 'y'}`}
        action={<Button icon={Plus} onClick={openAdd}>Add Category</Button>}
      />

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <Th sx={{ width: 56 }}></Th>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th align="center">Actions</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                  <EmptyState
                    icon={LayoutGrid}
                    title="No categories yet"
                    description="Create your first category to organise products."
                    action={<Button icon={Plus} size="sm" onClick={openAdd}>Add Category</Button>}
                  />
                </TableCell>
              </TableRow>
            )}
            {categories.map(cat => (
              <Tr key={cat.id}>
                <Td>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                    <LayoutGrid size={15} strokeWidth={1.75} />
                  </Box>
                </Td>
                <Td>
                  <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>{cat.name}</Typography>
                </Td>
                <Td>
                  <Box component="code" sx={{ fontSize: 12, fontFamily: 'monospace', color: 'text.secondary', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    {cat.slug}
                  </Box>
                </Td>
                <Td>
                  <Box component="button" onClick={() => toggleActive(cat.id)} sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer' }}>
                    <StatusChip status={cat.active ? 'active' : 'blocked'} label={cat.active ? 'Active' : 'Inactive'} />
                  </Box>
                </Td>
                <Td align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip content="Edit category">
                      <IconBtn icon={Pencil} label="Edit" onClick={() => openEdit(cat)} sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' } }} />
                    </Tooltip>
                    <Tooltip content="Delete category">
                      <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteTarget(cat)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                    </Tooltip>
                  </Box>
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editTarget ? 'Update' : 'Add'}</Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Input
            label="Category Name"
            required
            placeholder="e.g. Rings"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
            autoFocus
          />
          <Input
            label="Slug"
            placeholder="url-friendly-name"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            helper="URL-friendly identifier"
          />
        </Box>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Are you sure you want to delete{' '}
          <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>"{deleteTarget?.name}"</Box>?
          This action cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
