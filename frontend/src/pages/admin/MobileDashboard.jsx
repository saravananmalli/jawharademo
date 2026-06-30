import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Image, GripVertical, Smartphone,
  Star, Check, Search, Sparkles, Heart, Loader2,
} from 'lucide-react';
import { Box, Paper, Grid, Typography, Switch, IconButton } from '@mui/material';
import {
  Button, IconBtn, Input, Textarea, Toggle,
  Modal, Skeleton,
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

// Aspect ratio per section — matches the actual image dimensions used in the mobile app
const SECTION_ASPECT = {
  banner_slider: '2/1',   // 1080×540 — wide hero banner
  categories:    '1/1',   // 400×400 — square icon tile
  offers:        '4/3',   // offer card
  collections:   '3/2',   // collection landscape card
  most_loved:    '1/1',   // product thumbnail (square)
  gifting:       '3/2',   // gifting banner
  trending:      '3/2',   // trending card
  moodboard:     '4/5',   // portrait moodboard
  iconic:        '1/1',   // iconic square tile
  best_sellers:  '16/9',  // wide diamond banner
  stories:       '1/1',   // customer avatar (square)
};

// Override grid columns per section — smaller tiles use more columns
const SECTION_GRID = {
  categories:  { size: { xs: 6, sm: 4, md: 2 }, spacing: 1.5 }, // 6 col
  collections: { size: { xs: 6, sm: 4, md: 2 }, spacing: 1.5 }, // 6 col
  trending:    { size: { xs: 6, sm: 4, md: 2 }, spacing: 1.5 }, // 6 col
  moodboard:   { size: { xs: 6, sm: 4, md: 2 }, spacing: 1.5 }, // 6 col
  iconic:      { size: { xs: 6, sm: 4, md: 2 }, spacing: 1.5 }, // 6 col
};
const DEFAULT_GRID = { size: { xs: 12, sm: 6, md: 4 }, spacing: 2 };

const EMPTY_ITEM = {
  title: '', subtitle: '', description: '',
  imageUrl: '', ctaText: '', ctaLink: '', badge: '', active: true,
};

const SORT_TABS = [
  { value: 'purchased', label: 'Most Purchased' },
  { value: 'rated',     label: 'Highest Rated'  },
  { value: 'newest',    label: 'Newest'          },
];

function Thumb({ src, alt, size = 40 }) {
  const px = `${size}px`;
  return src ? (
    <Box component="img" src={src} alt={alt} sx={{ width: px, height: px, borderRadius: 2, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
  ) : (
    <Box sx={{ width: px, height: px, borderRadius: 2, flexShrink: 0, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
      <Image size={size * 0.45} />
    </Box>
  );
}

const tableRowSx = {
  borderTop: '1px solid', borderColor: 'divider',
  '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.15s',
};
const thSx = { px: 1.5, py: 1, fontSize: 11, fontWeight: 600, color: 'text.secondary', textAlign: 'left', whiteSpace: 'nowrap' };
const tdSx = { px: 1.5, py: 1, fontSize: 12 };

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
    return suggestions.filter(p => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [suggestions, search]);

  const handleAdd = async (product) => {
    setAdding(product._id);
    await onAdd(product);
    setAdding(null);
  };

  const chipSx = (active) => ({
    px: 1.25, py: 0.25, fontSize: 11, fontWeight: 600, borderRadius: 5,
    border: '1px solid', cursor: 'pointer', background: 'none', fontFamily: 'inherit',
    borderColor: active ? 'primary.main' : 'divider',
    bgcolor: active ? 'primary.main' : 'background.paper',
    color: active ? '#fff' : 'text.secondary',
    '&:hover': { borderColor: 'primary.light' },
    transition: 'all 0.15s',
  });

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      {/* LEFT: Suggestion table */}
      <Paper elevation={0} sx={{ flex: '0 0 62%', border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Product Suggestions</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Browse and pick products to feature. Click Add to pin them to the mobile view.</Typography>
          </Box>
        </Box>

        {/* Search + Sort */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: 'text.disabled', display: 'flex' }}>
              <Search size={14} />
            </Box>
            <Box
              component="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or category…"
              sx={{
                width: '100%', pl: 4.5, pr: 1.5, py: 1, fontSize: 13,
                border: '1px solid', borderColor: 'divider', borderRadius: 2,
                bgcolor: 'background.paper', color: 'text.primary',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                '&:focus': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
                '&::placeholder': { color: 'text.disabled' },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {SORT_TABS.map(t => (
              <Box
                key={t.value}
                component="button"
                onClick={() => { setSortBy(t.value); setSearch(''); }}
                sx={{
                  px: 1.5, py: 0.5, fontSize: 12, fontWeight: 600, borderRadius: 1.5, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  bgcolor: sortBy === t.value ? 'primary.main' : 'transparent',
                  color: sortBy === t.value ? '#fff' : 'text.secondary',
                  '&:hover': { bgcolor: sortBy === t.value ? 'primary.dark' : 'action.hover' },
                }}
              >
                {t.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Category chips */}
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {['all', ...categories].map(cat => (
            <Box key={cat} component="button" onClick={() => { setCategory(cat); setSearch(''); }} sx={chipSx(category === cat)}>
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Box>
          ))}
        </Box>

        {/* Table */}
        <Box sx={{ overflowY: 'auto', maxHeight: 480 }} className="admin-scroll">
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <Box component="thead" sx={{ bgcolor: 'action.hover', position: 'sticky', top: 0, zIndex: 1 }}>
              <Box component="tr">
                <Box component="th" sx={{ ...thSx, width: 36 }}>#</Box>
                <Box component="th" sx={thSx}>Product</Box>
                <Box component="th" sx={{ ...thSx, display: { xs: 'none', md: 'table-cell' } }}>Category</Box>
                <Box component="th" sx={{ ...thSx, display: { xs: 'none', sm: 'table-cell' } }}>Rating</Box>
                <Box component="th" sx={thSx}>Price</Box>
                {sortBy === 'purchased' && <Box component="th" sx={{ ...thSx, display: { xs: 'none', md: 'table-cell' } }}>Sold</Box>}
                <Box component="th" sx={{ ...thSx, textAlign: 'center', width: 80 }}>Action</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {loadingSugg ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Box component="tr" key={i} sx={tableRowSx}>
                    <Box component="td" sx={tdSx}><Skeleton height={12} width={16} /></Box>
                    <Box component="td" sx={tdSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton width={36} height={36} sx={{ borderRadius: 2, flexShrink: 0 }} />
                        <Skeleton height={12} width={96} />
                      </Box>
                    </Box>
                    <Box component="td" sx={{ ...tdSx, display: { xs: 'none', md: 'table-cell' } }}><Skeleton height={12} width={56} /></Box>
                    <Box component="td" sx={{ ...tdSx, display: { xs: 'none', sm: 'table-cell' } }}><Skeleton height={12} width={32} /></Box>
                    <Box component="td" sx={tdSx}><Skeleton height={12} width={56} /></Box>
                    {sortBy === 'purchased' && <Box component="td" sx={{ ...tdSx, display: { xs: 'none', md: 'table-cell' } }}><Skeleton height={12} width={24} /></Box>}
                    <Box component="td" sx={tdSx}><Skeleton height={24} width={48} sx={{ borderRadius: 2, mx: 'auto' }} /></Box>
                  </Box>
                ))
              ) : filtered.length === 0 ? (
                <Box component="tr">
                  <Box component="td" colSpan={7} sx={{ ...tdSx, textAlign: 'center', py: 4, color: 'text.disabled' }}>
                    No products match this filter.
                  </Box>
                </Box>
              ) : (
                filtered.map((product, idx) => {
                  const alreadyAdded = existingProductIds.has(product._id);
                  const isAdding     = adding === product._id;
                  const imgSrc       = getImageUrl(product.images?.[0]);

                  return (
                    <Box
                      component="tr"
                      key={product._id}
                      sx={{
                        ...tableRowSx,
                        bgcolor: alreadyAdded ? 'rgba(16,185,129,0.05)' : undefined,
                      }}
                    >
                      <Box component="td" sx={{ ...tdSx, color: 'text.disabled' }}>{idx + 1}</Box>

                      <Box component="td" sx={tdSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Thumb src={imgSrc} alt={product.name} size={36} />
                            {alreadyAdded && (
                              <Box sx={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, bgcolor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={9} style={{ color: '#fff' }} />
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                              {product.name}
                            </Typography>
                            {product.badge && (
                              <Box sx={{ display: 'inline-block', mt: 0.25, px: 0.75, py: '1px', fontSize: 10, fontWeight: 600, bgcolor: 'rgba(99,102,241,0.1)', color: 'primary.main', borderRadius: 5 }}>
                                {product.badge}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <Box component="td" sx={{ ...tdSx, display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', textTransform: 'capitalize' }}>
                        {product.category}
                      </Box>

                      <Box component="td" sx={{ ...tdSx, display: { xs: 'none', sm: 'table-cell' } }}>
                        {product.rating > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <Star size={11} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{product.rating.toFixed(1)}</Typography>
                            {product.reviewCount > 0 && <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>({product.reviewCount})</Typography>}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>—</Typography>
                        )}
                      </Box>

                      <Box component="td" sx={{ ...tdSx, fontWeight: 700 }}>
                        AED {product.price?.toLocaleString()}
                      </Box>

                      {sortBy === 'purchased' && (
                        <Box component="td" sx={{ ...tdSx, display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary' }}>
                          {product.soldCount > 0 ? product.soldCount : '—'}
                        </Box>
                      )}

                      <Box component="td" sx={{ ...tdSx, textAlign: 'center' }}>
                        {alreadyAdded ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, fontSize: 10, fontWeight: 600, bgcolor: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 5 }}>
                            <Check size={9} /> Added
                          </Box>
                        ) : (
                          <Box
                            component="button"
                            disabled={isAdding}
                            onClick={() => handleAdd(product)}
                            sx={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                              px: 1.25, py: 0.5, fontSize: 12, fontWeight: 600,
                              bgcolor: 'primary.main', color: '#fff', borderRadius: 1.5, border: 'none',
                              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                              '&:hover': { bgcolor: 'primary.dark' },
                              '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                            }}
                          >
                            {isAdding ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : 'Add'}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
            Showing {filtered.length} of {suggestions.length} products
          </Typography>
        </Box>
      </Paper>

      {/* RIGHT: Pinned items list */}
      <Paper elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden', position: 'sticky', top: 80 }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Heart size={16} style={{ color: '#fb7185', flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Pinned in App</Typography>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', px: 0.75, py: '1px', fontSize: 10, fontWeight: 600, borderRadius: 5,
                bgcolor: activeItems.length > 0 ? 'rgba(99,102,241,0.1)' : 'action.hover',
                color: activeItems.length > 0 ? 'primary.main' : 'text.disabled',
              }}>
                {activeItems.length}
              </Box>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Drag rows to reorder</Typography>
          </Box>
        </Box>

        {loadingItems && activeItems.length === 0 ? (
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton width={12} height={12} />
                <Skeleton width={36} height={36} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Skeleton height={12} width={96} />
                  <Skeleton height={10} width={64} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : activeItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
            <Box sx={{ color: 'text.disabled', mb: 1, display: 'flex', justifyContent: 'center' }}><Heart size={32} /></Box>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>No products pinned yet</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.disabled', mt: 0.25 }}>Click Add in the suggestions table to feature a product.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: 'auto', maxHeight: 480 }} className="admin-scroll">
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <Box component="tbody">
                {activeItems.map((item, index) => (
                  <Box
                    component="tr"
                    key={item._id}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(index)}
                    sx={{
                      ...tableRowSx, cursor: 'grab', '&:active': { cursor: 'grabbing' },
                      opacity: item.active ? 1 : 0.5, transition: 'opacity 0.15s, background-color 0.15s',
                    }}
                  >
                    <Box component="td" sx={{ pl: 1, pr: 0.5, py: 1, width: 24, color: 'text.disabled' }}>
                      <GripVertical size={14} />
                    </Box>
                    <Box component="td" sx={{ px: 0.5, py: 1, width: 24, fontWeight: 700, color: 'text.disabled', fontSize: 11 }}>
                      {index + 1}
                    </Box>
                    <Box component="td" sx={{ px: 0.5, py: 1, width: 40 }}>
                      <Thumb src={getImageUrl(item.imageUrl)} alt={item.title} size={34} />
                    </Box>
                    <Box component="td" sx={{ px: 1, py: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {item.title || <Box component="em" sx={{ color: 'text.disabled', fontStyle: 'normal' }}>No title</Box>}
                      </Typography>
                      {item.subtitle && <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{item.subtitle}</Typography>}
                    </Box>
                    <Box component="td" sx={{ px: 0.5, py: 1, width: 40 }}>
                      <Switch size="small" checked={item.active} onChange={() => onToggle(item)} title={item.active ? 'Visible in app' : 'Hidden in app'} sx={{ '& .MuiSwitch-thumb': { width: 12, height: 12 } }} />
                    </Box>
                    <Box component="td" sx={{ pr: 1, py: 1, width: 64 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <IconBtn icon={Pencil} size="xs" label="Edit" onClick={() => onEdit(item)} />
                        <IconBtn icon={Trash2} size="xs" label="Remove" variant="danger" onClick={() => onDelete(item)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Button variant="outline" size="sm" icon={Plus} onClick={onOpenAdd} style={{ width: '100%', justifyContent: 'center' }}>
            Add Custom Item
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

// ── BestSellersPanel ────────────────────────────────────────────────────────────
// Fixed 3-slot layout: 1 wide image on top, 2 side-by-side below.
function BestSellersPanel({ items, loadingItems, onReload, setError }) {
  const [editSlot, setEditSlot]   = useState(null); // 1 | 2 | 3
  const [imgUrl, setImgUrl]       = useState('');
  const [ctaLink, setCtaLink]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);

  const slot = (n) => items.find(i => i.order === n) || null;

  const openSlot = (n) => {
    const existing = slot(n);
    setImgUrl(existing?.imageUrl || '');
    setCtaLink(existing?.ctaLink || '');
    setEditSlot(n);
  };

  const saveSlot = async () => {
    if (!imgUrl) return;
    setSaving(true);
    try {
      const existing = slot(editSlot);
      const payload = {
        screen: 'dashboard', section: 'best_sellers', slot: 'best_sellers',
        imageUrl: imgUrl, ctaLink, order: editSlot, active: true,
        title: `Best Seller ${editSlot}`,
      };
      if (existing) {
        await api.put(`/admin/mobile-assets/${existing._id}`, payload);
      } else {
        await api.post('/admin/mobile-assets', payload);
      }
      setEditSlot(null);
      onReload();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (n) => {
    const existing = slot(n);
    if (!existing) return;
    setDeleting(n);
    try {
      await api.delete(`/admin/mobile-assets/${existing._id}`);
      onReload();
    } catch {
      setError('Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const SlotCard = ({ n, aspect }) => {
    const item = slot(n);
    const labels = { 1: 'Top — full width', 2: 'Bottom left', 3: 'Bottom right' };
    return (
      <Box sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid', borderColor: item ? 'divider' : 'primary.main',
            borderStyle: item ? 'solid' : 'dashed',
            borderRadius: 2.5, overflow: 'hidden', position: 'relative',
            aspectRatio: aspect, bgcolor: 'action.hover',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' },
            transition: 'all 0.15s',
          }}
          onClick={() => openSlot(n)}
        >
          {item?.imageUrl ? (
            <Box component="img" src={getImageUrl(item.imageUrl)} alt={`Slot ${n}`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'text.disabled', userSelect: 'none' }}>
              <Image size={28} />
              <Typography sx={{ fontSize: 11, mt: 0.5 }}>Click to upload</Typography>
            </Box>
          )}

          {/* Slot badge */}
          <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.62)', color: '#fff', fontSize: 10, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 1 }}>
            {labels[n]}
          </Box>
        </Paper>

        {/* Delete button */}
        {item && (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); deleteSlot(n); }}
            disabled={deleting === n}
            sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', p: 0.5, '&:hover': { bgcolor: 'rgba(239,68,68,0.85)' } }}
          >
            <Trash2 size={13} />
          </IconButton>
        )}
      </Box>
    );
  };

  if (loadingItems) {
    return (
      <Box sx={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, aspectRatio: '2/1', width: '100%' }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, aspectRatio: '1/1' }} />
          <Skeleton variant="rectangular" sx={{ borderRadius: 2.5, aspectRatio: '1/1' }} />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
        Upload exactly 3 images. Click any slot to upload or replace its image.
      </Typography>
      <Box sx={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <SlotCard n={1} aspect="2/1" />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <SlotCard n={2} aspect="1/1" />
          <SlotCard n={3} aspect="1/1" />
        </Box>
      </Box>

      <Modal
        open={editSlot !== null}
        onClose={() => setEditSlot(null)}
        title={`Edit Slot ${editSlot} — ${editSlot === 1 ? 'Top (full width)' : editSlot === 2 ? 'Bottom Left' : 'Bottom Right'}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditSlot(null)}>Cancel</Button>
            <Button onClick={saveSlot} loading={saving} disabled={saving || !imgUrl}>Save</Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              {editSlot === 1 ? 'Image * — landscape (1080 × 540 px recommended)' : 'Image * — square (1080 × 1080 px recommended)'}
            </Typography>
            <ImageUploader
              images={imgUrl ? [imgUrl] : []}
              onChange={urls => setImgUrl(urls[0] || '')}
              maxImages={1} category="mobile" single
            />
          </Box>
          <Input
            label="CTA Link (optional)"
            value={ctaLink}
            onChange={e => setCtaLink(e.target.value)}
            placeholder="e.g. /collection/diamond-best-sellers"
          />
        </Box>
      </Modal>
    </>
  );
}

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
        screen: 'dashboard', section: 'most_loved', slot: 'most_loved',
        productId: product._id, title: product.name,
        subtitle:  `AED ${product.price?.toLocaleString() || ''}`,
        imageUrl:  product.images?.[0] || '',
        ctaText:   'Shop Now', ctaLink: `/product/${product._id}`,
        badge:     product.badge || '', active: true, order: currentCount + 1,
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
        [activeKey]: (prev[activeKey] || []).map(x => x._id === item._id ? { ...x, active: !x.active } : x),
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

  const activeSection   = sections.find(s => s.key === activeKey);
  const activeItems     = items[activeKey] || [];
  const isStories       = activeKey === 'stories';
  const isMostLoved     = activeKey === 'most_loved';
  const isBestSellers   = activeKey === 'best_sellers';
  const imgAspect       = SECTION_ASPECT[activeKey] || '3/2';
  const gridCfg         = SECTION_GRID[activeKey] || DEFAULT_GRID;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Smartphone size={22} style={{ opacity: 0.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Mobile App Dashboard</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Manage every section of the mobile app home screen. Toggle sections on/off, reorder them, and add or edit items within each section.
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

      {loadingSec && sections.length === 0 ? (
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Sidebar skeleton */}
          <Paper elevation={0} sx={{ width: 240, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Skeleton height={16} width={80} sx={{ mb: 0.5 }} />
              <Skeleton height={12} width={144} />
            </Box>
            {Array.from({ length: 9 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Skeleton width={12} height={12} />
                <Skeleton height={12} sx={{ flex: 1 }} />
                <Skeleton height={16} width={32} sx={{ borderRadius: 5 }} />
              </Box>
            ))}
          </Paper>
          {/* Content skeleton */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
              <Box>
                <Skeleton height={24} width={144} sx={{ mb: 0.5 }} />
                <Skeleton height={16} width={208} />
              </Box>
              <Skeleton height={36} width={96} sx={{ borderRadius: 2.5 }} />
            </Box>
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ aspectRatio: imgAspect, flexShrink: 0 }}><Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} /></Box>
                    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Skeleton height={16} width="75%" />
                      <Skeleton height={12} width="50%" />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* LEFT: Section list */}
          <Paper elevation={0} sx={{ width: 240, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden', position: 'sticky', top: 80 }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Sections</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Drag to reorder · toggle to show/hide</Typography>
            </Box>

            {sections.map((sec, idx) => (
              <Box
                key={sec._id}
                draggable
                onDragStart={() => handleSecDragStart(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleSecDrop(idx)}
                onClick={() => selectSection(sec.key)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.25,
                  cursor: 'pointer',
                  borderLeft: '3px solid',
                  borderBottom: idx < sections.length - 1 ? '1px solid' : 'none',
                  borderColor: activeKey === sec.key ? 'primary.main' : 'divider',
                  bgcolor: activeKey === sec.key ? 'rgba(99,102,241,0.06)' : 'transparent',
                  '&:hover': { bgcolor: activeKey === sec.key ? 'rgba(99,102,241,0.06)' : 'action.hover' },
                  transition: 'background-color 0.15s',
                }}
              >
                <GripVertical size={14} style={{ opacity: 0.3, cursor: 'grab', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
                    fontWeight: activeKey === sec.key ? 700 : 500,
                    color: activeKey === sec.key ? 'primary.main' : 'text.primary',
                  }}>
                    {sec.label}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                    {items[sec.key] !== undefined
                      ? `${items[sec.key].length} item${items[sec.key].length !== 1 ? 's' : ''}`
                      : '—'}
                  </Typography>
                </Box>
                <Box onClick={e => e.stopPropagation()}>
                  <Switch size="small" checked={sec.enabled} onChange={(e) => toggleSection(e, sec)} title={sec.enabled ? 'Hide section in app' : 'Show section in app'} sx={{ '& .MuiSwitch-thumb': { width: 12, height: 12 } }} />
                </Box>
              </Box>
            ))}
          </Paper>

          {/* RIGHT: Item management */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {activeSection ? (
              <>
                {!isMostLoved && !isBestSellers && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{activeSection.label}</Typography>
                        {!activeSection.enabled && (
                          <Box sx={{ px: 1, py: 0.25, fontSize: 11, fontWeight: 500, border: '1px solid', borderColor: 'warning.main', color: 'warning.main', borderRadius: 5 }}>
                            Hidden in app
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {SECTION_HINTS[activeSection.key] || ''}
                      </Typography>
                    </Box>
                    <Button icon={Plus} onClick={openAdd}>Add Item</Button>
                  </Box>
                )}

                {isBestSellers ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{activeSection.label}</Typography>
                      {!activeSection.enabled && (
                        <Box sx={{ px: 1, py: 0.25, fontSize: 11, fontWeight: 500, border: '1px solid', borderColor: 'warning.main', color: 'warning.main', borderRadius: 5 }}>
                          Hidden in app
                        </Box>
                      )}
                    </Box>
                    <BestSellersPanel
                      items={activeItems}
                      loadingItems={loadingItems}
                      onReload={() => { setItems(prev => { const n = { ...prev }; delete n['best_sellers']; return n; }); loadItems('best_sellers'); }}
                      setError={setError}
                    />
                  </>
                ) : isMostLoved ? (
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
                ) : loadingItems && !(items[activeKey]?.length > 0) ? (
                  <Grid container spacing={gridCfg.spacing}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Grid size={gridCfg.size} key={i}>
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ aspectRatio: imgAspect, flexShrink: 0 }}><Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} /></Box>
                          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                            <Skeleton height={16} width="75%" />
                            <Skeleton height={12} width="50%" />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : activeItems.length === 0 ? (
                  <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3, py: 8, textAlign: 'center' }}>
                    <Box sx={{ color: 'text.disabled', mb: 1.5, display: 'flex', justifyContent: 'center' }}><Image size={40} /></Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>No items yet</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.disabled', mb: 2.5 }}>
                      Add the first item for the <Box component="strong" sx={{ color: 'text.primary' }}>{activeSection.label}</Box> section.
                    </Typography>
                    <Button icon={Plus} onClick={openAdd}>Add Item</Button>
                  </Box>
                ) : (
                  <Grid container spacing={gridCfg.spacing}>
                    {activeItems.map((item, index) => (
                      <Grid size={gridCfg.size} key={item._id}>
                        <Paper
                          elevation={0}
                          draggable
                          onDragStart={() => handleItemDragStart(index)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleItemDrop(index)}
                          sx={{
                            border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', height: '100%',
                            cursor: 'grab', '&:active': { cursor: 'grabbing' },
                            opacity: item.active ? 1 : 0.55, transition: 'opacity 0.15s',
                          }}
                        >
                          <Box sx={{ aspectRatio: imgAspect, bgcolor: 'action.hover', position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.imageUrl ? (
                              <Box component="img" src={getImageUrl(item.imageUrl)} alt={item.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                                <Image size={32} />
                                <Typography sx={{ fontSize: 11, mt: 0.5 }}>No image</Typography>
                              </Box>
                            )}
                            <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 1 }}>
                              #{index + 1}
                            </Box>
                            <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}>
                              <GripVertical size={16} />
                            </Box>
                            {item.badge && (
                              <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'primary.main', color: '#fff', fontSize: 10, fontWeight: 700, px: 1, py: 0.25, borderRadius: 5 }}>
                                {item.badge}
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title || <Box component="em" sx={{ color: 'text.disabled', fontStyle: 'normal', fontWeight: 400 }}>No title</Box>}
                            </Typography>
                            {item.subtitle && <Typography sx={{ fontSize: 12, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</Typography>}
                            {item.description && <Typography sx={{ fontSize: 11.5, color: 'text.disabled', mt: 0.25, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</Typography>}
                            {item.ctaText && <Typography sx={{ fontSize: 11.5, color: 'primary.main', mt: 0.25 }}>CTA: {item.ctaText}</Typography>}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 1.5 }}>
                              <Box
                                component="button"
                                onClick={() => openEdit(item)}
                                sx={{
                                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                                  px: 1.5, py: 0.75, fontSize: 12, fontWeight: 500,
                                  border: '1px solid', borderColor: 'divider', color: 'text.secondary',
                                  borderRadius: 1.5, background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                  '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.15s',
                                }}
                              >
                                <Pencil size={12} /> Edit
                              </Box>
                              <Switch size="small" checked={item.active} onChange={() => toggleItemActive(item)} title={item.active ? 'Hide item' : 'Show item'} sx={{ '& .MuiSwitch-thumb': { width: 12, height: 12 } }} />
                              <IconBtn icon={Trash2} size="sm" label="Delete" onClick={() => setDeleteTarget(item)} sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }} />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, color: 'text.disabled' }}>
                <Image size={40} />
                <Typography sx={{ fontSize: 13, mt: 1, color: 'text.disabled' }}>Select a section from the left to manage its items</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editTarget ? 'Edit Item' : 'Add Item'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={saving || (!isStories && !form.imageUrl)}>
              {editTarget ? 'Update' : 'Add Item'}
            </Button>
          </>
        }
      >
        {activeSection && (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: -1, mb: 2 }}>Section: {activeSection.label}</Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              {isStories ? 'Customer Avatar (optional)' : 'Image *'}
            </Typography>
            <ImageUploader images={form.imageUrl ? [form.imageUrl] : []} onChange={urls => setF('imageUrl', urls[0] || '')} maxImages={1} category="mobile" single />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Input label={isStories ? 'Customer Name' : 'Title'} required={isStories} value={form.title} onChange={e => setF('title', e.target.value)} autoFocus />
            <Input label={isStories ? 'Star Rating (1–5)' : 'Badge / Label'} value={form.badge} onChange={e => setF('badge', e.target.value)} placeholder={isStories ? 'e.g. 5' : 'e.g. BEST SELL · 50% OFF'} />
          </Box>
          <Input label="Subtitle" value={form.subtitle} onChange={e => setF('subtitle', e.target.value)} placeholder="Short supporting text shown below the title" />
          <Textarea label={isStories ? 'Review Text' : 'Description'} value={form.description} onChange={e => setF('description', e.target.value)} placeholder={isStories ? 'What the customer said…' : 'Additional detail or promotional copy'} rows={2} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Input label="CTA Button Text" value={form.ctaText} onChange={e => setF('ctaText', e.target.value)} placeholder="e.g. Shop Now · Explore" />
            <Input label="CTA Link / Deep Link" value={form.ctaLink} onChange={e => setF('ctaLink', e.target.value)} placeholder="e.g. /category/rings" />
          </Box>
          <Toggle label="Active (visible in app)" checked={form.active} onChange={e => setF('active', e.target.checked)} />
        </Box>
      </Modal>

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
        <Typography sx={{ fontSize: '13.5px', color: 'text.secondary', lineHeight: 1.6 }}>
          Remove <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>{deleteTarget?.title || 'this item'}</Box> from the mobile view? This cannot be undone.
        </Typography>
      </Modal>
    </Box>
  );
}
