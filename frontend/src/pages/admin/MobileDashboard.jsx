import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Image, GripVertical, Smartphone,
  Star, Check, Search, Sparkles, Heart, X, Loader2,
} from 'lucide-react';
import {
  Button, IconBtn, Card, CardBody, Input, Textarea, Toggle,
  Modal, Skeleton, EmptyState, Toast, useToast, Spinner,
} from '../../components/admin/ui/index.js';
import ImageUploader from '../../components/admin/ImageUploader';
import api           from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const SECTION_HINTS = {
  banner_slider: 'Full-width sliding banners at the top of the home screen. Landscape images (1080×540 px) recommended.',
  categories:    'Category quick-links shown as icon tiles. Square thumbnails (400×400 px) recommended.',
  offers:        'Limited-time promotional offer cards with discount badges and CTA buttons.',
  collections:   'Curated jewellery collection cards (Gold Ring, Everyday Studs, etc.).',
  most_loved:    'Best-selling and most popular products shown on the mobile home screen.',
  gifting:       'Gift-idea cards and gifting collection banners.',
  trending:      'Currently trending styles and designs.',
  moodboard:     'Seasonal style moodboard images (e.g. "Your June Style Moodboard").',
  iconic:        'Brand-defining iconic collection tiles.',
  best_sellers:  'Wide banners showcasing diamond best sellers.',
  stories:       'Customer reviews and testimonials. Title = customer name · Badge = star rating (1–5) · Description = review text.',
};

const EMPTY_ITEM = {
  title: '', subtitle: '', description: '',
  imageUrl: '', ctaText: '', ctaLink: '', badge: '', active: true,
};

const SORT_TABS = [
  { value: 'purchased', label: 'Most Purchased' },
  { value: 'rated',     label: 'Highest Rated'  },
  { value: 'newest',    label: 'Newest'          },
];

// ── Thumb helper ──────────────────────────────────────────────────────────────
function Thumb({ src, alt, size = 40 }) {
  const px = `${size}px`;
  return src ? (
    <img
      src={src}
      alt={alt}
      style={{ width: px, height: px }}
      className="rounded-lg object-cover shrink-0 block"
    />
  ) : (
    <div
      style={{ width: px, height: px }}
      className="rounded-lg shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
    >
      <Image size={size * 0.45} className="text-gray-300 dark:text-gray-600" />
    </div>
  );
}

// ── Toggle switch (small inline) ──────────────────────────────────────────────
function SmallToggle({ checked, onChange, title }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer" title={title}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200" />
      <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
    </label>
  );
}

// ── Most Loved: side-by-side split panel ──────────────────────────────────────
function MostLovedPanel({ activeItems, loadingItems, onAdd, onEdit, onDelete, onToggle, onDragStart, onDrop, onOpenAdd }) {
  const [sortBy,      setSortBy]      = useState('purchased');
  const [category,    setCategory]    = useState('all');
  const [categories,  setCategories]  = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [adding,      setAdding]      = useState(null);
  const [search,      setSearch]      = useState('');

  const existingProductIds = useMemo(
    () => new Set(activeItems.map(x => x.productId).filter(Boolean)),
    [activeItems]
  );

  useEffect(() => {
    api.get('/admin/products/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingSugg(true);
    api.get('/admin/products/suggestions', { params: { sortBy, category, limit: 30 } })
      .then(({ data }) => { if (!cancelled) setSuggestions(data.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSugg(false); });
    return () => { cancelled = true; };
  }, [sortBy, category]);

  const filtered = useMemo(() => {
    if (!search.trim()) return suggestions;
    const q = search.trim().toLowerCase();
    return suggestions.filter(p =>
      p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  }, [suggestions, search]);

  const handleAdd = async (product) => {
    setAdding(product._id);
    await onAdd(product);
    setAdding(null);
  };

  return (
    <div className="flex gap-4 items-start">

      {/* ── LEFT: Suggestion table ───────────────────────────────────── */}
      <div className="flex-[0_0_62%] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Product Suggestions</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Browse and pick products to feature. Click Add to pin them to the mobile view.</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              placeholder="Search by name or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Sort tabs */}
          <div className="flex gap-1">
            {SORT_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => { setSortBy(t.value); setSearch(''); }}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  sortBy === t.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-1.5 flex-wrap">
          {['all', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setSearch(''); }}
              className={`px-2.5 py-0.5 text-xs rounded-full border font-medium transition-colors ${
                category === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[480px] admin-scroll">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 w-9">#</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Category</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Rating</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Price</th>
                {sortBy === 'purchased' && (
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Sold</th>
                )}
                <th className="text-center px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingSugg ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2"><Skeleton className="h-3 w-4" /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell"><Skeleton className="h-3 w-14" /></td>
                    <td className="px-3 py-2 hidden sm:table-cell"><Skeleton className="h-3 w-8" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-3 w-14" /></td>
                    {sortBy === 'purchased' && <td className="px-3 py-2 hidden md:table-cell"><Skeleton className="h-3 w-6" /></td>}
                    <td className="px-3 py-2"><Skeleton className="h-6 w-12 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 dark:text-gray-600">
                    No products match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((product, idx) => {
                  const alreadyAdded = existingProductIds.has(product._id);
                  const isAdding     = adding === product._id;
                  const imgSrc       = getImageUrl(product.images?.[0]);

                  return (
                    <tr
                      key={product._id}
                      className={`border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${
                        alreadyAdded ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0">
                            <Thumb src={imgSrc} alt={product.name} size={36} />
                            {alreadyAdded && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                <Check size={9} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">
                              {product.name}
                            </p>
                            {product.badge && (
                              <span className="inline-block mt-0.5 px-1.5 py-px text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                                {product.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2 hidden md:table-cell text-gray-500 dark:text-gray-400 capitalize">
                        {product.category}
                      </td>

                      <td className="px-3 py-2 hidden sm:table-cell">
                        {product.rating > 0 ? (
                          <div className="flex items-center gap-0.5">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                            {product.reviewCount > 0 && (
                              <span className="text-gray-400 text-[10px]">({product.reviewCount})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>

                      <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-100">
                        AED {product.price?.toLocaleString()}
                      </td>

                      {sortBy === 'purchased' && (
                        <td className="px-3 py-2 hidden md:table-cell text-gray-500 dark:text-gray-400">
                          {product.soldCount > 0 ? product.soldCount : '—'}
                        </td>
                      )}

                      <td className="px-3 py-2 text-center">
                        {alreadyAdded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                            <Check size={9} /> Added
                          </span>
                        ) : (
                          <button
                            disabled={isAdding}
                            onClick={() => handleAdd(product)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {isAdding ? <Loader2 size={11} className="animate-spin" /> : 'Add'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {suggestions.length} products
          </p>
        </div>
      </div>

      {/* ── RIGHT: Pinned items list ──────────────────────────────────── */}
      <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden sticky top-20">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <Heart size={16} className="text-rose-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Pinned in App</p>
              <span className={`inline-flex items-center px-1.5 py-px text-[10px] font-semibold rounded-full ${
                activeItems.length > 0
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
                {activeItems.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Drag rows to reorder</p>
          </div>
        </div>

        {/* Pinned list */}
        {loadingItems && activeItems.length === 0 ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Heart size={32} className="mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No products pinned yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">Click Add in the suggestions table to feature a product.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[480px] admin-scroll">
            <table className="w-full text-xs">
              <tbody>
                {activeItems.map((item, index) => (
                  <tr
                    key={item._id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(index)}
                    className={`border-t border-gray-100 dark:border-gray-800 cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all ${
                      item.active ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <td className="pl-2 pr-1 py-2 w-6 text-gray-300 dark:text-gray-600">
                      <GripVertical size={14} />
                    </td>
                    <td className="px-1 py-2 w-6 font-bold text-gray-400">{index + 1}</td>
                    <td className="px-1 py-2 w-10">
                      <Thumb src={getImageUrl(item.imageUrl)} alt={item.title} size={34} />
                    </td>
                    <td className="px-2 py-2 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[120px]">
                        {item.title || <em className="text-gray-400">No title</em>}
                      </p>
                      {item.subtitle && (
                        <p className="text-gray-400 dark:text-gray-500 text-[10px]">{item.subtitle}</p>
                      )}
                    </td>
                    <td className="px-1 py-2 w-10">
                      <SmallToggle
                        checked={item.active}
                        onChange={() => onToggle(item)}
                        title={item.active ? 'Visible in app' : 'Hidden in app'}
                      />
                    </td>
                    <td className="pr-2 py-2 w-16">
                      <div className="flex items-center gap-0.5">
                        <IconBtn icon={Pencil} size="xs" label="Edit" onClick={() => onEdit(item)} />
                        <IconBtn icon={Trash2} size="xs" label="Remove" variant="danger" onClick={() => onDelete(item)}
                          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: Add custom item */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="outline" size="sm" icon={Plus} onClick={onOpenAdd} className="w-full justify-center">
            Add Custom Item
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MobileDashboard() {
  const [sections, setSections]         = useState([]);
  const [activeKey, setActiveKey]       = useState(null);
  const [items, setItems]               = useState({});
  const [loadingSec, setLoadingSec]     = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_ITEM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const dragItemRef                     = useRef(null);
  const dragSecRef                      = useRef(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Sections ──────────────────────────────────────────────────────────────

  const loadSections = useCallback(async () => {
    try {
      setLoadingSec(true);
      const { data } = await api.get('/admin/dashboard-sections');
      const secs = data.data || [];
      setSections(secs);
      if (secs.length > 0) setActiveKey(k => k || secs[0].key);
    } catch {
      setError('Failed to load dashboard sections.');
    } finally {
      setLoadingSec(false);
    }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  const toggleSection = async (e, sec) => {
    e.stopPropagation();
    try {
      await api.put(`/admin/dashboard-sections/${sec._id}`, { enabled: !sec.enabled });
      setSections(prev => prev.map(s => s._id === sec._id ? { ...s, enabled: !s.enabled } : s));
    } catch {
      setError('Could not update section.');
    }
  };

  const handleSecDragStart = (index) => { dragSecRef.current = index; };
  const handleSecDrop = async (dropIndex) => {
    if (dragSecRef.current === null || dragSecRef.current === dropIndex) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(dragSecRef.current, 1);
    reordered.splice(dropIndex, 0, moved);
    const withOrder = reordered.map((s, i) => ({ ...s, order: i + 1 }));
    setSections(withOrder);
    dragSecRef.current = null;
    try {
      await api.put('/admin/dashboard-sections/reorder', {
        items: withOrder.map(s => ({ _id: s._id, order: s.order })),
      });
    } catch {
      setError('Section reorder failed.');
    }
  };

  // ── Items ─────────────────────────────────────────────────────────────────

  const loadItems = useCallback(async (sectionKey) => {
    try {
      setLoadingItems(true);
      const { data } = await api.get('/admin/mobile-assets', {
        params: { screen: 'dashboard', section: sectionKey },
      });
      setItems(prev => ({ ...prev, [sectionKey]: data.data || [] }));
    } catch {
      setError('Failed to load items.');
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const selectSection = (key) => {
    setActiveKey(key);
    if (!items[key]) loadItems(key);
  };

  useEffect(() => {
    if (activeKey && !items[activeKey]) loadItems(activeKey);
  }, [activeKey, items, loadItems]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_ITEM, order: (items[activeKey]?.length || 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      title:       item.title       || '',
      subtitle:    item.subtitle    || '',
      description: item.description || '',
      imageUrl:    item.imageUrl    || '',
      ctaText:     item.ctaText     || '',
      ctaLink:     item.ctaLink     || '',
      badge:       item.badge       || '',
      active:      item.active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, screen: 'dashboard', section: activeKey, slot: activeKey };
      if (editTarget) {
        await api.put(`/admin/mobile-assets/${editTarget._id}`, payload);
      } else {
        await api.post('/admin/mobile-assets', payload);
      }
      setDialogOpen(false);
      setSuccess(editTarget ? 'Item updated.' : 'Item added.');
      setTimeout(() => setSuccess(''), 3000);
      setItems(prev => { const n = { ...prev }; delete n[activeKey]; return n; });
      loadItems(activeKey);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromSuggestion = async (product) => {
    try {
      const currentCount = items[activeKey]?.length || 0;
      await api.post('/admin/mobile-assets', {
        screen:    'dashboard',
        section:   'most_loved',
        slot:      'most_loved',
        productId: product._id,
        title:     product.name,
        subtitle:  `AED ${product.price?.toLocaleString() || ''}`,
        imageUrl:  product.images?.[0] || '',
        ctaText:   'Shop Now',
        ctaLink:   `/product/${product._id}`,
        badge:     product.badge || '',
        active:    true,
        order:     currentCount + 1,
      });
      setSuccess(`"${product.name}" added to Most Loved.`);
      setTimeout(() => setSuccess(''), 3000);
      setItems(prev => { const n = { ...prev }; delete n['most_loved']; return n; });
      loadItems('most_loved');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add product.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/mobile-assets/${deleteTarget._id}`);
      setItems(prev => ({
        ...prev,
        [activeKey]: (prev[activeKey] || []).filter(x => x._id !== deleteTarget._id),
      }));
      setDeleteTarget(null);
    } catch {
      setError('Delete failed.');
    }
  };

  const toggleItemActive = async (item) => {
    try {
      await api.put(`/admin/mobile-assets/${item._id}`, { active: !item.active });
      setItems(prev => ({
        ...prev,
        [activeKey]: (prev[activeKey] || []).map(x =>
          x._id === item._id ? { ...x, active: !x.active } : x
        ),
      }));
    } catch {
      setError('Could not update item.');
    }
  };

  const handleItemDragStart = (index) => { dragItemRef.current = index; };
  const handleItemDrop = async (dropIndex) => {
    if (dragItemRef.current === null || dragItemRef.current === dropIndex) return;
    const sectionItems = [...(items[activeKey] || [])];
    const [moved] = sectionItems.splice(dragItemRef.current, 1);
    sectionItems.splice(dropIndex, 0, moved);
    const withOrder = sectionItems.map((item, i) => ({ ...item, order: i + 1 }));
    setItems(prev => ({ ...prev, [activeKey]: withOrder }));
    dragItemRef.current = null;
    try {
      await api.put('/admin/mobile-assets/reorder', {
        items: withOrder.map(x => ({ _id: x._id, order: x.order })),
      });
    } catch {
      setError('Reorder failed — please reload.');
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeSection = sections.find(s => s.key === activeKey);
  const activeItems   = items[activeKey] || [];
  const isStories     = activeKey === 'stories';
  const isMostLoved   = activeKey === 'most_loved';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={22} className="text-gray-400" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Mobile App Dashboard</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage every section of the mobile app home screen. Toggle sections on/off, reorder them, and add or edit items within each section.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="shrink-0 hover:opacity-70"><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}

      {loadingSec && sections.length === 0 ? (
        <div className="flex gap-6 items-start">
          {/* Sidebar skeleton */}
          <div className="w-60 shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-36" />
            </div>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
            ))}
          </div>
          {/* Content skeleton */}
          <div className="flex-1">
            <div className="flex justify-between mb-5">
              <div><Skeleton className="h-6 w-36 mb-1" /><Skeleton className="h-4 w-52" /></div>
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <Skeleton className="h-36 w-full" />
                  <div className="p-3 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 items-start">

          {/* ── Left: section list ─────────────────────────────────────── */}
          <div className="w-60 shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Sections</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Drag to reorder · toggle to show/hide</p>
            </div>

            {sections.map((sec, idx) => (
              <div
                key={sec._id}
                draggable
                onDragStart={() => handleSecDragStart(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleSecDrop(idx)}
                onClick={() => selectSection(sec.key)}
                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-[3px] transition-colors ${
                  idx < sections.length - 1 ? 'border-b border-b-gray-100 dark:border-b-gray-800' : ''
                } ${
                  activeKey === sec.key
                    ? 'border-l-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                <GripVertical size={14} className="text-gray-300 dark:text-gray-600 cursor-grab shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate leading-tight ${
                    activeKey === sec.key ? 'font-bold text-indigo-700 dark:text-indigo-300' : 'font-medium text-gray-700 dark:text-gray-300'
                  }`}>
                    {sec.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    {items[sec.key] !== undefined
                      ? `${items[sec.key].length} item${items[sec.key].length !== 1 ? 's' : ''}`
                      : '—'}
                  </p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <SmallToggle
                    checked={sec.enabled}
                    onChange={(e) => toggleSection(e, sec)}
                    title={sec.enabled ? 'Hide section in app' : 'Show section in app'}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ── Right: item management ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {activeSection ? (
              <>
                {/* Section header — hidden for Most Loved (panel has its own header) */}
                {!isMostLoved && (
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeSection.label}</h2>
                        {!activeSection.enabled && (
                          <span className="px-2 py-0.5 text-xs font-medium border border-amber-400 text-amber-600 dark:text-amber-400 rounded-full">
                            Hidden in app
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {SECTION_HINTS[activeSection.key] || ''}
                      </p>
                    </div>
                    <Button icon={Plus} onClick={openAdd}>Add Item</Button>
                  </div>
                )}

                {/* ── Most Loved: split panel ── */}
                {isMostLoved ? (
                  <MostLovedPanel
                    activeItems={activeItems}
                    loadingItems={loadingItems}
                    onAdd={handleAddFromSuggestion}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onToggle={toggleItemActive}
                    onDragStart={handleItemDragStart}
                    onDrop={handleItemDrop}
                    onOpenAdd={openAdd}
                  />
                ) : (
                  /* ── All other sections: card grid ── */
                  loadingItems && !(items[activeKey]?.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          <Skeleton className="h-36 w-full" />
                          <div className="p-3 space-y-1.5">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeItems.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-16 text-center">
                      <Image size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">No items yet</h3>
                      <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">
                        Add the first item for the <strong>{activeSection.label}</strong> section.
                      </p>
                      <Button icon={Plus} onClick={openAdd}>Add Item</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeItems.map((item, index) => (
                        <div
                          key={item._id}
                          draggable
                          onDragStart={() => handleItemDragStart(index)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleItemDrop(index)}
                          className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing transition-opacity ${
                            item.active ? 'opacity-100' : 'opacity-55'
                          }`}
                        >
                          {/* Image area */}
                          <div className="h-36 bg-gray-100 dark:bg-gray-800 relative overflow-hidden shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={getImageUrl(item.imageUrl)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center text-gray-400 dark:text-gray-600">
                                <Image size={32} className="mx-auto" />
                                <span className="text-xs block mt-1">No image</span>
                              </div>
                            )}
                            {/* Position badge */}
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              #{index + 1}
                            </div>
                            {/* Drag handle */}
                            <div className="absolute top-2 right-2 text-white/70">
                              <GripVertical size={16} />
                            </div>
                            {/* Badge chip */}
                            {item.badge && (
                              <div className="absolute bottom-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.badge}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-3 flex-1 flex flex-col">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                              {item.title || <em className="text-gray-400 font-normal">No title</em>}
                            </p>
                            {item.subtitle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
                            )}
                            {item.description && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                            )}
                            {item.ctaText && (
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">CTA: {item.ctaText}</p>
                            )}
                            <div className="flex items-center gap-2 mt-auto pt-3">
                              <button
                                onClick={() => openEdit(item)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <SmallToggle
                                checked={item.active}
                                onChange={() => toggleItemActive(item)}
                                title={item.active ? 'Hide item' : 'Show item'}
                              />
                              <IconBtn
                                icon={Trash2}
                                size="sm"
                                label="Delete"
                                onClick={() => setDeleteTarget(item)}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
                <Image size={40} className="mb-2" />
                <p className="text-sm">Select a section from the left to manage its items</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit dialog ─────────────────────────────────────────────── */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Item' : 'Add Item'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={saving || (!isStories && !form.imageUrl)}
            >
              {editTarget ? 'Update' : 'Add Item'}
            </Button>
          </>
        }
      >
        {activeSection && (
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4">Section: {activeSection.label}</p>
        )}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {isStories ? 'Customer Avatar (optional)' : 'Image *'}
            </p>
            <ImageUploader
              images={form.imageUrl ? [form.imageUrl] : []}
              onChange={urls => setF('imageUrl', urls[0] || '')}
              maxImages={1}
              category="mobile"
              single
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isStories ? 'Customer Name' : 'Title'}
              required={isStories}
              value={form.title}
              onChange={e => setF('title', e.target.value)}
              autoFocus
            />
            <Input
              label={isStories ? 'Star Rating (1–5)' : 'Badge / Label'}
              value={form.badge}
              onChange={e => setF('badge', e.target.value)}
              placeholder={isStories ? 'e.g. 5' : 'e.g. BEST SELL · 50% OFF'}
            />
          </div>
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={e => setF('subtitle', e.target.value)}
            placeholder="Short supporting text shown below the title"
          />
          <Textarea
            label={isStories ? 'Review Text' : 'Description'}
            value={form.description}
            onChange={e => setF('description', e.target.value)}
            placeholder={isStories ? 'What the customer said…' : 'Additional detail or promotional copy'}
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CTA Button Text"
              value={form.ctaText}
              onChange={e => setF('ctaText', e.target.value)}
              placeholder="e.g. Shop Now · Explore"
            />
            <Input
              label="CTA Link / Deep Link"
              value={form.ctaLink}
              onChange={e => setF('ctaLink', e.target.value)}
              placeholder="e.g. /category/rings"
            />
          </div>
          <Toggle
            label="Active (visible in app)"
            checked={form.active}
            onChange={e => setF('active', e.target.checked)}
          />
        </div>
      </Modal>

      {/* ── Delete confirm dialog ──────────────────────────────────────────── */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Item?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Remove <strong>{deleteTarget?.title || 'this item'}</strong> from the mobile view? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
