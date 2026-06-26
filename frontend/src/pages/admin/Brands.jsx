import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon, Tag } from 'lucide-react';
import {
  PageHeader, Button, IconBtn, SearchInput,
  Input, Textarea, Toggle,
  Table, Th, Td, Tr, Skeleton, EmptyState,
  Modal, Toast, useToast, Tooltip,
} from '../../components/admin/ui/index.js';
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
    } catch {
      toast.error('Update failed.');
    }
  };

  return (
    <div>
      <Toast />

      <PageHeader
        title="Brands"
        subtitle={`${brands.length} brands in catalogue`}
        action={
          <Button icon={Plus} onClick={openAdd}>Add Brand</Button>
        }
      />

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search brands…"
            className="w-full sm:w-72"
          />
        </div>

        {/* Table */}
        <div className={`transition-opacity duration-150 ${loading && brands.length > 0 ? 'opacity-50' : 'opacity-100'}`}>
          <Table className="rounded-none border-0">
            <thead>
              <tr>
                <Th className="w-12">#</Th>
                <Th className="w-14">Logo</Th>
                <Th>Brand Name</Th>
                <Th>Slug</Th>
                <Th>Status</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {/* Skeleton loading */}
              {loading && brands.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  <Td><Skeleton className="h-4 w-5" /></Td>
                  <Td><Skeleton className="w-9 h-9 rounded-lg" /></Td>
                  <Td>
                    <Skeleton className="h-4 w-40 mb-1.5" />
                    <Skeleton className="h-3 w-28" />
                  </Td>
                  <Td><Skeleton className="h-4 w-32" /></Td>
                  <Td><Skeleton className="h-5 w-16 rounded-full" /></Td>
                  <Td>
                    <div className="flex justify-center gap-1">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-lg" />
                    </div>
                  </Td>
                </Tr>
              ))}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Tag}
                      title="No brands found"
                      description={search ? 'No brands match your search.' : 'Add your first brand to get started.'}
                      action={
                        search
                          ? <button onClick={() => setSearch('')} className="text-sm text-indigo-600 hover:underline">Clear search</button>
                          : <Button icon={Plus} size="sm" onClick={openAdd}>Add Brand</Button>
                      }
                    />
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {filtered.map((b, idx) => (
                <Tr key={b._id}>
                  {/* Index */}
                  <Td>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{idx + 1}</span>
                  </Td>

                  {/* Logo */}
                  <Td>
                    <div className="w-9 h-9 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      {b.logo
                        ? <img src={getImageUrl(b.logo)} alt={b.name} className="w-9 h-9 object-contain" />
                        : <ImageIcon size={15} className="text-gray-400" />
                      }
                    </div>
                  </Td>

                  {/* Name + description */}
                  <Td>
                    <p className="font-semibold text-gray-900 dark:text-white">{b.name}</p>
                    {b.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 max-w-[200px] truncate">{b.description}</p>
                    )}
                  </Td>

                  {/* Slug */}
                  <Td>
                    <code className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      /brand/{b.slug}
                    </code>
                  </Td>

                  {/* Status toggle */}
                  <Td>
                    <button onClick={() => toggleActive(b)} className="cursor-pointer">
                      <StatusChip
                        status={b.isActive ? 'active' : 'blocked'}
                        label={b.isActive ? 'Active' : 'Inactive'}
                      />
                    </button>
                  </Td>

                  {/* Actions */}
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip content="View Brand Page">
                        <IconBtn
                          icon={ExternalLink}
                          label="View"
                          variant="ghost"
                          onClick={() => window.open(`/brand/${b.slug}`, '_blank')}
                        />
                      </Tooltip>
                      <Tooltip content="Edit">
                        <IconBtn
                          icon={Pencil}
                          label="Edit"
                          onClick={() => openEdit(b)}
                          className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        />
                      </Tooltip>
                      <Tooltip content="Delete">
                        <IconBtn
                          icon={Trash2}
                          label="Delete"
                          onClick={() => setDeleteTarget(b)}
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
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Brand' : 'Add Brand'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              loading={saving}
              disabled={!form.name.trim() || !form.slug.trim()}
              onClick={handleSave}
            >
              {editTarget ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand Name"
              required
              placeholder="e.g. Jawhara Gold"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              autoFocus
            />
            <Input
              label="Slug"
              required
              placeholder="your-brand"
              value={form.slug}
              onChange={e => set('slug', slugify(e.target.value))}
              helper={`URL: /brand/${form.slug || 'your-brand'}`}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Short brand description shown on the brand page"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={2}
          />

          <Input
            label="Logo URL"
            placeholder="https://… or /uploads/…"
            value={form.logo}
            onChange={e => set('logo', e.target.value)}
            helper="Square image recommended (min 200×200)"
          />

          <Input
            label="Banner URL"
            placeholder="https://… or /uploads/…"
            value={form.banner}
            onChange={e => set('banner', e.target.value)}
            helper="Wide banner shown at the top of the brand page (min 1440×280)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SEO Meta Title"
              placeholder={form.name ? `${form.name} | Jawhara Jewellery` : 'Brand | Jawhara Jewellery'}
              value={form.seoTitle}
              onChange={e => set('seoTitle', e.target.value)}
              maxLength={70}
              helper={`${form.seoTitle.length}/70 chars`}
            />
            <Textarea
              label="SEO Meta Description"
              value={form.seoDescription}
              onChange={e => set('seoDescription', e.target.value)}
              rows={2}
              maxLength={160}
              helper={`${form.seoDescription.length}/160 chars`}
            />
          </div>

          <Toggle
            label="Active (visible on frontend)"
            checked={form.isActive}
            onChange={e => set('isActive', e.target.checked)}
          />
        </div>
      </Modal>

      {/* Delete confirm modal */}
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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Delete <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong>? This
          will not delete products associated with this brand, but the brand page at{' '}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            /brand/{deleteTarget?.slug}
          </code>{' '}
          will no longer be accessible.
        </p>
      </Modal>
    </div>
  );
}
