import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Image, GripVertical, Tag } from 'lucide-react';
import { Box, Paper, Typography, Switch, IconButton } from '@mui/material';
import {
  Button, IconBtn, Input, Toggle, Modal, Skeleton,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const TABS = [
  { key: 'women', label: 'Women' },
  { key: 'kids',  label: 'Kids'  },
];

const EMPTY = { title: '', ctaLink: '', imageUrl: '', active: true };

export default function MobileCategories() {
  const [activeTab, setActiveTab]     = useState('women');
  const [items, setItems]             = useState({ women: null, kids: null }); // null = not loaded yet
  const [loading, setLoading]         = useState(false);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const dragRef                       = useRef(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async (tab) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/mobile-assets', {
        params: { screen: 'category', section: tab },
      });
      setItems(prev => ({ ...prev, [tab]: data.data || [] }));
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (items[activeTab] === null) load(activeTab);
  }, [activeTab, items, load]);

  const activeItems = items[activeTab] || [];

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY, order: activeItems.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ title: item.title, ctaLink: item.ctaLink, imageUrl: item.imageUrl, active: item.active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        screen: 'category',
        section: activeTab,
        slot: activeTab,
        order: editTarget ? editTarget.order : activeItems.length + 1,
      };
      if (editTarget) {
        await api.put(`/admin/mobile-assets/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/mobile-assets', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Category updated.' : 'Category added.');
      setTimeout(() => setSuccess(''), 3000);
      setItems(prev => ({ ...prev, [activeTab]: null }));
      load(activeTab);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/mobile-assets/${deleteTarget._id}`);
      setItems(prev => ({ ...prev, [activeTab]: (prev[activeTab] || []).filter(x => x._id !== deleteTarget._id) }));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/admin/mobile-assets/${item._id}`, { active: !item.active });
      setItems(prev => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).map(x => x._id === item._id ? { ...x, active: !x.active } : x),
      }));
    } catch {
      setError('Could not update.');
    }
  };

  const handleDragStart = (i) => { dragRef.current = i; };
  const handleDrop = async (dropIndex) => {
    if (dragRef.current === null || dragRef.current === dropIndex) return;
    const reordered = [...activeItems];
    const [moved] = reordered.splice(dragRef.current, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((x, i) => ({ ...x, order: i + 1 }));
    setItems(prev => ({ ...prev, [activeTab]: withOrder }));
    dragRef.current = null;
    try {
      await api.put('/admin/mobile-assets/reorder', {
        items: withOrder.map(x => ({ _id: x._id, order: x.order })),
      });
    } catch {
      setError('Reorder failed — please reload.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Tag size={22} style={{ opacity: 0.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Mobile Categories</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Manage the category tiles shown on the mobile app home screen for Women and Kids.
        </Typography>
      </Box>

      {error && (
        <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: 2, border: '1px solid', bgcolor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <Typography sx={{ flex: 1, fontSize: 13, color: 'error.main' }}>{error}</Typography>
          <IconButton size="small" onClick={() => setError('')} sx={{ color: 'error.main', p: 0.25 }}>✕</IconButton>
        </Paper>
      )}
      {success && (
        <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 2, border: '1px solid', bgcolor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
          <Typography sx={{ fontSize: 13, color: 'success.main' }}>{success}</Typography>
        </Paper>
      )}

      {/* Two-panel layout — same as Mobile Dashboard */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* Left sidebar — Women / Kids tabs */}
        <Paper elevation={0} sx={{ width: 200, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Category
            </Typography>
          </Box>
          {TABS.map((tab, idx) => (
            <Box
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1.5, py: 1.5, cursor: 'pointer',
                borderBottom: idx < TABS.length - 1 ? '1px solid' : 'none',
                borderColor: activeTab === tab.key ? 'primary.main' : 'divider',
                bgcolor: activeTab === tab.key ? 'rgba(99,102,241,0.06)' : 'transparent',
                '&:hover': { bgcolor: activeTab === tab.key ? 'rgba(99,102,241,0.06)' : 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              <Tag size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
              <Typography sx={{
                fontSize: 13, flex: 1,
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? 'primary.main' : 'text.primary',
              }}>
                {tab.label}
              </Typography>
              <Box sx={{
                minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                bgcolor: activeTab === tab.key ? 'primary.main' : 'action.selected',
                color: activeTab === tab.key ? '#fff' : 'text.secondary',
              }}>
                {items[tab.key]?.length ?? '…'}
              </Box>
            </Box>
          ))}
        </Paper>

        {/* Right content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Section header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 0.25 }}>
                {TABS.find(t => t.key === activeTab)?.label} Categories
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                Drag to reorder · square icon images (400 × 400 px) recommended
              </Typography>
            </Box>
            <Button icon={Plus} onClick={openAdd}>Add Category</Button>
          </Box>

          {/* Loading skeletons */}
          {loading && activeItems.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Paper key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton height={14} width="55%" sx={{ mb: 0.5 }} />
                      <Skeleton height={11} width="40%" />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : activeItems.length === 0 ? (
            <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, py: 8, textAlign: 'center' }}>
              <Box sx={{ color: 'text.disabled', mb: 1.5, display: 'flex', justifyContent: 'center' }}><Tag size={40} /></Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>No categories yet</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.disabled', mb: 2.5 }}>
                Add the first category for <Box component="strong" sx={{ color: 'text.primary' }}>{TABS.find(t => t.key === activeTab)?.label}</Box>.
              </Typography>
              <Button icon={Plus} onClick={openAdd}>Add Category</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              {activeItems.map((item, index) => (
                <Paper
                  key={item._id}
                  elevation={0}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: 2,
                    cursor: 'grab', '&:active': { cursor: 'grabbing' },
                    opacity: item.active ? 1 : 0.5, transition: 'opacity 0.15s, box-shadow 0.15s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.25, py: 1 }}>
                    {/* Drag handle */}
                    <GripVertical size={14} style={{ opacity: 0.3, flexShrink: 0 }} />

                    {/* Icon thumbnail */}
                    <Box sx={{ width: 44, height: 44, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.imageUrl
                        ? <Box component="img" src={getImageUrl(item.imageUrl)} alt={item.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Image size={18} style={{ opacity: 0.3 }} />}
                    </Box>

                    {/* Name + link */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title || <Box component="em" sx={{ color: 'text.disabled', fontStyle: 'normal', fontWeight: 400 }}>No name</Box>}
                      </Typography>
                      {item.ctaLink && (
                        <Typography sx={{ fontSize: 11, color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.ctaLink}
                        </Typography>
                      )}
                    </Box>

                    {/* Order badge */}
                    <Box sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', flexShrink: 0, px: 0.75 }}>
                      #{index + 1}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      <Switch
                        size="small"
                        checked={item.active}
                        onChange={() => toggleActive(item)}
                        title={item.active ? 'Visible' : 'Hidden'}
                        sx={{ '& .MuiSwitch-thumb': { width: 12, height: 12 } }}
                      />
                      <IconBtn icon={Pencil} size="xs" label="Edit" onClick={() => openEdit(item)} />
                      <IconBtn icon={Trash2} size="xs" label="Delete" onClick={() => setDeleteTarget(item)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Add / Edit modal */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Category' : 'Add Category'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving || !form.imageUrl}>
              {editTarget ? 'Update' : 'Add Category'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Category Icon * <Box component="span" sx={{ fontWeight: 400 }}>(400 × 400 px recommended)</Box>
            </Typography>
            <ImageUploader
              images={form.imageUrl ? [form.imageUrl] : []}
              onChange={urls => setF('imageUrl', urls[0] || '')}
              maxImages={1} category="mobile" single
            />
          </Box>
          <Input
            label="Category Name *"
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            placeholder="e.g. Rings, Earrings, Pendants"
            autoFocus
          />
          <Input
            label="Link"
            value={form.ctaLink}
            onChange={e => setF('ctaLink', e.target.value)}
            placeholder="e.g. /category/rings"
            helper="Deep link used when the user taps this category tile in the app"
          />
          <Toggle
            label="Active (visible in app)"
            checked={form.active}
            onChange={e => setF('active', e.target.checked)}
          />
        </Box>
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
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.6 }}>
          Delete <Box component="strong" sx={{ color: 'text.primary' }}>{deleteTarget?.title}</Box>? This cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
