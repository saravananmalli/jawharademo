import { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import {
  PageHeader, Button, IconBtn, Input,
  Table, Th, Td, Tr, EmptyState,
  Modal, Toast, useToast, Tooltip,
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

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    setEditTarget(c);
    setForm({ name: c.name, slug: c.slug });
    setDialogOpen(true);
  };

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
    <div>
      <Toast />

      <PageHeader
        title="Categories"
        subtitle={`${categories.length} product categories`}
        action={
          <Button icon={Plus} onClick={openAdd}>Add Category</Button>
        }
      />

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <Table className="rounded-none border-0">
          <thead>
            <tr>
              <Th className="w-14"></Th>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th className="text-center">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={LayoutGrid}
                    title="No categories yet"
                    description="Create your first category to organise products."
                    action={<Button icon={Plus} size="sm" onClick={openAdd}>Add Category</Button>}
                  />
                </td>
              </tr>
            )}

            {categories.map(cat => (
              <Tr key={cat.id}>
                {/* Icon */}
                <Td>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <LayoutGrid size={16} />
                  </div>
                </Td>

                {/* Name */}
                <Td>
                  <span className="font-semibold text-gray-900 dark:text-white">{cat.name}</span>
                </Td>

                {/* Slug */}
                <Td>
                  <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                    {cat.slug}
                  </code>
                </Td>

                {/* Status — clickable toggle */}
                <Td>
                  <button onClick={() => toggleActive(cat.id)} className="cursor-pointer">
                    <StatusChip
                      status={cat.active ? 'active' : 'blocked'}
                      label={cat.active ? 'Active' : 'Inactive'}
                    />
                  </button>
                </Td>

                {/* Actions */}
                <Td className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip content="Edit">
                      <IconBtn
                        icon={Pencil}
                        label="Edit"
                        onClick={() => openEdit(cat)}
                        className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      />
                    </Tooltip>
                    <Tooltip content="Delete">
                      <IconBtn
                        icon={Trash2}
                        label="Delete"
                        onClick={() => setDeleteTarget(cat)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      />
                    </Tooltip>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
            >
              {editTarget ? 'Update' : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Rings"
            value={form.name}
            onChange={e => setForm(f => ({
              ...f,
              name: e.target.value,
              slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
            }))}
            autoFocus
          />
          <Input
            label="Slug"
            placeholder="url-friendly-name"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            helper="URL-friendly identifier"
          />
        </div>
      </Modal>

      {/* Delete confirm modal */}
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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete{' '}
          <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
