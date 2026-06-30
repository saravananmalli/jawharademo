import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DirhamSymbol } from 'dirham/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Diamond, Tag, Sparkles, FolderOpen, Image as ImageIcon,
  Users, Truck, ToggleLeft, Check, Star, Layers, SlidersHorizontal,
  FileText, Search, MessageSquare, Gift, Zap, ExternalLink,
  AlertCircle, ChevronDown, X,
} from 'lucide-react';
import { Box, Paper, Typography, MenuItem } from '@mui/material';

import api from '../../services/api';
import ImageUploader from '../../components/admin/ImageUploader';
import ReviewManagerPanel from '../../components/admin/ReviewManagerPanel';
import {
  Input, Select, Textarea, Toggle, Button, Card, CardHeader, CardBody,
} from '../../components/admin/ui/index.js';
import {
  METAL_OPTIONS, KARAT_OPTIONS, STONE_OPTIONS,
  FORWHO_OPTIONS, BADGE_OPTIONS, BADGE_COLORS, CATEGORY_LIST,
  PRICE_BUCKET_MAP, CATEGORY_FILTER_MAP, SUBCATEGORY_MAP, PRODUCT_FLAGS,
  FLAG_COLLECTIONS,
} from '../../utils/filterConstants';

const RING_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];
const DELIVERY_OPTIONS = ['Next Day Delivery', '1–3 Day Delivery', '2–3 Day Delivery'];
const AI_COLLECTION_OPTIONS = [
  "Valentine's Day Collection", "Mother's Day Collection", 'New Arrivals', 'Best Sellers',
  'Bridal Collection', 'Wedding Collection', 'Anniversary Collection', "Kids' Collection",
  "Men's Collection", 'Sale Collection', 'Eid Collection', 'Ramadan Collection',
  'Christmas Collection', 'Graduation Collection', 'Engagement Collection', 'Festive Collection',
];

const EMPTY = {
  name: '', category: '', subcategory: '', description: '',
  price: '', originalPrice: '', discount: '',
  images: [],
  inStock: true, badge: '', certified: false,
  metals: [], metalKt: '', stones: [],
  weight: '',
  diamondClarity: '', diamondColor: '', diamondCt: '',
  brand: '', collection: [], fulfilledBy: '', arrivesBy: '',
  tags: [], forWho: [],
  priceRange: '',
  featured: [], styles: [],
  flags: [],
  sizes: [], designCode: '',
  seoTitle: '', seoDescription: '', slug: '',
};

function autoPriceRange(price) {
  const n = Number(price);
  if (!n || n <= 0) return '';
  const b = PRICE_BUCKET_MAP.find(b => n >= b.min && n < b.max);
  return b ? b.slug : '';
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function computeMatchedMetalStone(metals, stones, metalKt, category) {
  const catOptions = CATEGORY_FILTER_MAP[category]?.metalStone || [];
  const ms  = metals.map(m => m.toLowerCase());
  const ss  = stones.map(s => s.toLowerCase());
  const kt  = (metalKt || '').toLowerCase().replace(/\s/g, '');
  return catOptions.filter(opt => {
    const o = opt.toLowerCase().replace(/\s/g, '');
    if (o === 'gold18k')   return ms.some(m => m.includes('gold') && !m.includes('white') && !m.includes('rose')) && kt === '18k';
    if (o === 'gold22k')   return ms.some(m => m.includes('gold') && !m.includes('white') && !m.includes('rose')) && kt === '22k';
    if (o === 'whitegold') return ms.includes('white gold');
    if (o === 'rosegold')  return ms.includes('rose gold');
    if (o === 'gold')      return ms.some(m => m === 'gold' || m === 'yellow gold');
    if (o === 'silver')    return ms.includes('silver');
    return ss.includes(opt.toLowerCase());
  });
}

const ACCENT = {
  indigo:  { bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  color: '#6366f1' },
  violet:  { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.2)',  color: '#7c3aed' },
  green:   { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  color: '#059669' },
  blue:    { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  color: '#2563eb' },
  orange:  { bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',  color: '#ea580c' },
  teal:    { bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.2)',  color: '#0d9488' },
  cyan:    { bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.2)',   color: '#0891b2' },
  amber:   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  color: '#d97706' },
  sky:     { bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.2)',  color: '#0284c7' },
};

function Section({ icon: Icon, title, subtitle, accentColor = 'indigo', children }) {
  const a = ACCENT[accentColor] || ACCENT.indigo;
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2.5, bgcolor: 'background.paper' }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {Icon && (
          <Box sx={{ width: 32, height: 32, borderRadius: 2, border: '1px solid', bgcolor: a.bg, borderColor: a.border, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
            <Icon size={15} />
          </Box>
        )}
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
}

function SideCard({ title, icon: Icon, children }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 2, bgcolor: 'background.paper' }}>
      {title && (
        <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          {Icon && <Icon size={13} style={{ opacity: 0.5 }} />}
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled' }}>{title}</Typography>
        </Box>
      )}
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

const CHIP_COLOR = {
  indigo:  { on: '#6366f1', onBorder: '#6366f1' },
  violet:  { on: '#7c3aed', onBorder: '#7c3aed' },
  emerald: { on: '#059669', onBorder: '#059669' },
  info:    { on: '#0284c7', onBorder: '#0284c7' },
  warning: { on: '#f59e0b', onBorder: '#f59e0b' },
  teal:    { on: '#0d9488', onBorder: '#0d9488' },
};

function ChipToggle({ label, selected, onClick, color = 'indigo' }) {
  const c = CHIP_COLOR[color] || CHIP_COLOR.indigo;
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5,
        px: 1.25, py: 0.5, borderRadius: 1.5, border: '1px solid', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        bgcolor: selected ? c.on : 'background.paper',
        borderColor: selected ? c.onBorder : 'divider',
        color: selected ? '#fff' : 'text.secondary',
        '&:hover': { borderColor: c.on, color: selected ? '#fff' : c.on },
      }}
    >
      {selected && <Check size={10} style={{ flexShrink: 0 }} />}
      {label}
    </Box>
  );
}

function ChipToggleGroup({ options, selected, onChange, color = 'indigo' }) {
  const toggle = (val) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {options.map(opt => (
        <ChipToggle key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle(opt)} color={color} />
      ))}
    </Box>
  );
}

function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const addTag = (raw) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  };
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0, -1));
  };
  return (
    <Box sx={{
      display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 42,
      border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 1,
      bgcolor: 'background.paper', cursor: 'text',
      '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
      transition: 'all 0.15s',
    }}>
      {value.map(tag => (
        <Box key={tag} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(99,102,241,0.08)', color: 'primary.main', border: '1px solid', borderColor: 'rgba(99,102,241,0.2)', borderRadius: 1, px: 1, py: 0.25, fontSize: 12, fontWeight: 500 }}>
          {tag}
          <Box component="button" type="button" onClick={() => onChange(value.filter(t => t !== tag))} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', p: 0, '&:hover': { color: 'error.main' }, transition: 'color 0.1s' }}>
            <X size={10} />
          </Box>
        </Box>
      ))}
      <Box
        component="input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ''}
        sx={{ flex: 1, minWidth: 120, bgcolor: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'text.primary', fontFamily: 'inherit', '&::placeholder': { color: 'text.disabled' } }}
      />
    </Box>
  );
}

const BADGE_PILL = {
  new:     { bg: 'rgba(16,185,129,0.1)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
  sale:    { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', border: 'rgba(239,68,68,0.25)' },
  hot:     { bg: 'rgba(249,115,22,0.1)',  color: '#ea580c', border: 'rgba(249,115,22,0.25)' },
  limited: { bg: 'rgba(139,92,246,0.1)',  color: '#7c3aed', border: 'rgba(139,92,246,0.25)' },
  default: { bg: 'action.hover',          color: 'text.secondary', border: 'divider' },
};

const priceInputSx = (hasError) => ({
  width: '100%', pl: 5, pr: 1.75, py: 1.25, fontSize: 14,
  border: '1px solid', borderRadius: 2,
  borderColor: hasError ? 'error.main' : 'divider',
  bgcolor: 'background.paper', color: 'text.primary',
  outline: 'none', fontFamily: 'inherit',
  '&:focus': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
  '&::placeholder': { color: 'text.disabled' },
  transition: 'all 0.15s',
});

export default function ProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [brandsList,    setBrandsList]    = useState([]);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [formErrors,    setFormErrors]    = useState({});
  const [productLoaded, setProductLoaded] = useState(!isEdit);

  useEffect(() => {
    api.get('/admin/brands?active=true')
      .then(({ data }) => setBrandsList((data.data || []).map(b => b.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then(({ data }) => {
      const p = data.data;
      setForm({
        ...EMPTY, ...p,
        tags:       Array.isArray(p.tags)       ? p.tags       : (p.tags       ? p.tags.split(',').map(t => t.trim()).filter(Boolean)       : []),
        forWho:     Array.isArray(p.forWho)     ? p.forWho     : (p.forWho     ? p.forWho.split(',').map(t => t.trim()).filter(Boolean)     : []),
        collection: Array.isArray(p.collection) ? p.collection : (p.collection ? [p.collection]                                            : []),
        metals:   p.metals?.length ? p.metals : (p.metal  && p.metal  !== 'None' ? [p.metal]  : []),
        stones:   p.stones?.length ? p.stones : (p.stone  && p.stone  !== 'None' ? [p.stone]  : []),
        featured: p.featured || [],
        styles:   p.styles   || [],
        flags:    p.flags    || [],
        images:   p.images?.filter(Boolean) || [],
        weight:          p.weight          || '',
        diamondClarity:  p.diamondClarity  || '',
        diamondColor:    p.diamondColor    || '',
        diamondCt:       p.diamondCt       || '',
        seoTitle:       p.seoTitle       || p.name       || '',
        seoDescription: p.seoDescription || '',
        slug:           p.slug           || slugify(p.name || ''),
      });
      setProductLoaded(true);
    });
  }, [id]);

  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setFormErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const clearError = useCallback((key) => setFormErrors(prev => { const e = { ...prev }; delete e[key]; return e; }), []);

  function calcDiscount(price, orig) {
    const p = Number(price), o = Number(orig);
    return o > p && p > 0 ? String(Math.round(((o - p) / o) * 100)) : '';
  }

  const setPrice = (val) => {
    const range = autoPriceRange(val);
    setForm(f => ({ ...f, price: val, priceRange: range || f.priceRange, discount: calcDiscount(val, f.originalPrice) }));
  };

  const setOriginalPrice = (val) => {
    setForm(f => ({ ...f, originalPrice: val, discount: calcDiscount(f.price, val) }));
  };

  const setCategory = (cat) => {
    const map = CATEGORY_FILTER_MAP[cat] || { featured: [], styles: [] };
    setForm(f => ({ ...f, category: cat, subcategory: '', featured: f.featured.filter(v => map.featured.includes(v)), styles: f.styles.filter(v => map.styles.includes(v)) }));
    clearError('category');
  };

  const setName = (val) => {
    setForm(f => ({ ...f, name: val, seoTitle: f.seoTitle === f.name || !f.seoTitle ? val : f.seoTitle, slug: f.slug === slugify(f.name) || !f.slug ? slugify(val) : f.slug }));
    clearError('name');
  };

  const toggleSize = (s) => set('sizes', form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);

  const autoDiscount = form.price && form.originalPrice && Number(form.originalPrice) > Number(form.price)
    ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
    : null;

  const categoryMap     = CATEGORY_FILTER_MAP[form.category] || { featured: [], styles: [], metalStone: [] };
  const subcategoryOpts = SUBCATEGORY_MAP[form.category]     || [];
  const matchedNavMS    = useMemo(
    () => computeMatchedMetalStone(form.metals, form.stones, form.metalKt, form.category),
    [form.metals, form.stones, form.metalKt, form.category],
  );

  function validate(currentForm) {
    const catMap = CATEGORY_FILTER_MAP[currentForm.category] || { featured: [], styles: [] };
    const errors = {};
    if (!currentForm.name.trim())       errors.name        = 'Product name is required';
    if (!currentForm.designCode.trim()) errors.designCode  = 'SKU / Design Code is required';
    if (!currentForm.category)          errors.category    = 'Category is required';
    if (!currentForm.brand)             errors.brand       = 'Brand is required';
    if (!currentForm.arrivesBy)         errors.arrivesBy   = 'Delivery time is required';
    if (!(currentForm.description || '').trim()) errors.description = 'Product description is required';
    if (!currentForm.price || Number(currentForm.price) <= 0) errors.price = 'Sale price is required';
    if (!currentForm.images.filter(Boolean).length) errors.images = 'At least one product image is required';
    if (!currentForm.metals.length)     errors.metals      = 'At least one metal type is required';
    if (!currentForm.metalKt)           errors.metalKt     = 'Metal karat is required';
    if (!currentForm.flags.length)      errors.flags       = 'At least one product flag is required';
    if (catMap.featured.length > 0 && !currentForm.featured.length)
      errors.featured = 'Select at least one Featured In option';
    if (catMap.styles.length > 0 && !currentForm.styles.length)
      errors.styles   = 'Select at least one By Style option';
    if (!currentForm.forWho.length)     errors.forWho      = 'Target audience is required';
    return errors;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setError('Please fill in all required fields highlighted below.');
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const hasDiamond = form.stones.includes('Diamond');
    const payload = {
      ...form,
      description:   form.description || '',
      price:         Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      discount:      form.discount ? Number(form.discount) : (autoDiscount ?? 0),
      metal:  form.metals[0] || '',
      stone:  form.stones[0] || '',
      weight: form.weight ? Number(form.weight) : undefined,
      diamondClarity: hasDiamond ? form.diamondClarity : '',
      diamondColor:   hasDiamond ? form.diamondColor   : '',
      diamondCt:      hasDiamond && form.diamondCt ? Number(form.diamondCt) : undefined,
      tags:   form.tags,
      forWho: form.forWho,
      images: form.images.filter(Boolean),
      slug:   form.slug || slugify(form.name),
      seoTitle:       form.seoTitle       || form.name,
      seoDescription: form.seoDescription || (form.description || '').slice(0, 160).trim(),
    };
    try {
      if (isEdit) await api.put(`/admin/products/${id}`, payload);
      else        await api.post('/admin/products', payload);
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const saveBtnSx = {
    display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.5, height: 36,
    fontSize: 14, fontWeight: 600, color: '#fff', bgcolor: 'primary.main', border: 'none',
    borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
    '&:hover': { bgcolor: 'primary.dark' },
    '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
    transition: 'background-color 0.15s',
  };

  const discardBtnSx = {
    display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, height: 36,
    fontSize: 14, fontWeight: 500, color: 'text.secondary', bgcolor: 'background.paper',
    border: '1px solid', borderColor: 'divider', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit',
    '&:hover': { bgcolor: 'action.hover' },
    transition: 'background-color 0.15s',
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ pb: 12 }}>

      {/* Sticky page header */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 20, bgcolor: 'background.default', pt: 0.5, pb: 2.5, mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/admin/products')}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 500,
              color: 'text.secondary', border: '1px solid', borderColor: 'divider',
              borderRadius: 2, px: 1.5, height: 32, bgcolor: 'background.paper', cursor: 'pointer', fontFamily: 'inherit',
              '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }, flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <ArrowLeft size={14} /> Products
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              {isEdit ? 'Update product listing details' : 'Fill in all details to publish a new product'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Box component="button" type="button" onClick={() => navigate('/admin/products')} sx={discardBtnSx}>Discard</Box>
            <Box component="button" type="submit" disabled={saving} sx={saveBtnSx}>
              {saving ? (
                <svg style={{ animation: 'spin 1s linear infinite' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : <Save size={14} />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Product'}
            </Box>
          </Box>
        </Box>

        {error && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1, bgcolor: 'rgba(239,68,68,0.08)', border: '1px solid', borderColor: 'rgba(239,68,68,0.3)', borderRadius: 2, px: 2, py: 1.25 }}>
            <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <Typography sx={{ fontSize: 13, color: 'error.main', flex: 1 }}>{error}</Typography>
            <Box component="button" type="button" onClick={() => setError('')} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'error.light', display: 'flex', p: 0 }}><X size={14} /></Box>
          </Box>
        )}
      </Box>

      {/* Two-column body */}
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>

        {/* LEFT COLUMN */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>

          {/* 1 – Product Information */}
          <Section icon={Diamond} title="Product Information" subtitle="Product name and unique SKU / design code" accentColor="indigo">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
              <Input label="Product Name" required value={form.name} onChange={e => setName(e.target.value)} placeholder="e.g. 18K Gold Diamond Solitaire Ring" error={formErrors.name} helper="A clear, descriptive name (also pre-fills SEO title and URL slug)" />
              <Input label="SKU / Design Code" required value={form.designCode} onChange={e => set('designCode', e.target.value)} placeholder="e.g. RNG-001" error={formErrors.designCode} helper="Unique product identifier" />
            </Box>
          </Section>

          {/* 2 – Product Description */}
          <Section icon={FileText} title="Product Description" subtitle="Plain text description shown on the product page" accentColor="violet">
            <Textarea rows={6} placeholder="Write your product description here…" value={form.description} onChange={e => set('description', e.target.value)} maxLength={2000} error={formErrors.description} helper={`${(form.description || '').length} / 2000`} />
          </Section>

          {/* 3 – Pricing */}
          <Section icon={Tag} title="Pricing" subtitle="Sale price auto-assigns the price range bucket — override if needed" accentColor="green">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
              {/* Sale Price */}
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>
                  Sale Price <Box component="span" sx={{ color: 'error.main', ml: 0.25 }}>*</Box>
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'text.disabled', fontSize: 14 }}>
                    <DirhamSymbol size="0.9em" />
                  </Box>
                  <Box component="input" type="number" min={0} step={0.01} value={form.price} onChange={e => { setPrice(e.target.value); clearError('price'); }} placeholder="0.00" sx={priceInputSx(!!formErrors.price)} />
                </Box>
                {formErrors.price
                  ? <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.5 }}>{formErrors.price}</Typography>
                  : <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>Current selling price</Typography>
                }
              </Box>

              {/* Original Price */}
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>Original Price</Typography>
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'text.disabled', fontSize: 14 }}>
                    <DirhamSymbol size="0.9em" />
                  </Box>
                  <Box component="input" type="number" min={0} step={0.01} value={form.originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="0.00" sx={priceInputSx(false)} />
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>Shown struck-through when higher than sale price</Typography>
              </Box>

              {/* Discount % */}
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>Discount %</Typography>
                <Box sx={{ position: 'relative' }}>
                  <Box component="input" type="number" readOnly value={form.discount} sx={{ ...priceInputSx(false), pl: 1.75, pr: 5, bgcolor: 'action.hover', color: 'text.disabled', cursor: 'default' }} />
                  <Box sx={{ position: 'absolute', inset: '0 12px 0 auto', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'text.disabled', fontSize: 14 }}>%</Box>
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>Auto-calculated from sale & original price</Typography>
              </Box>
            </Box>

            {autoDiscount !== null && (
              <Box sx={{ mt: 2.5, display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid', borderColor: 'rgba(16,185,129,0.3)', borderRadius: 2.5, px: 2, py: 1 }}>
                <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>
                  Customer saves AED {(Number(form.originalPrice) - Number(form.price)).toLocaleString()} · {autoDiscount}% off
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>Price Range Bucket</Typography>
                <Box sx={{ px: 1.75, py: 1.25, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 2, fontSize: 14, color: 'text.secondary' }}>
                  {form.priceRange ? PRICE_BUCKET_MAP.find(b => b.slug === form.priceRange)?.label || form.priceRange : 'Auto-assigned from price'}
                </Box>
              </Box>
            </Box>
          </Section>

          {/* 4 – Product Images */}
          <Section icon={ImageIcon} title="Product Images" subtitle="Upload from device — first is the primary cover, second is the hover view" accentColor="blue">
            {productLoaded && (
              <ImageUploader images={form.images} onChange={urls => { set('images', urls); clearError('images'); }} maxImages={10} category="products" />
            )}
            {formErrors.images && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 1 }}>{formErrors.images}</Typography>}
          </Section>

          {/* 5 – Ring Sizes (conditional) */}
          {form.category === 'Rings' && (
            <Section icon={Sparkles} title="Product Variants" subtitle="Select available ring sizes" accentColor="orange">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {RING_SIZES.map(s => {
                  const on = form.sizes.includes(s);
                  return (
                    <Box
                      key={s}
                      component="button"
                      type="button"
                      onClick={() => toggleSize(s)}
                      sx={{
                        width: 48, height: 48, borderRadius: 2, border: '2px solid',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        bgcolor: on ? 'rgba(99,102,241,0.06)' : 'background.paper',
                        borderColor: on ? 'primary.main' : 'divider',
                        color: on ? 'primary.main' : 'text.secondary',
                        '&:hover': { borderColor: 'primary.light' },
                      }}
                    >
                      {s}
                    </Box>
                  );
                })}
              </Box>
              {form.sizes.length > 0 && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1.5 }}>
                  Selected: {[...form.sizes].sort((a, b) => Number(a) - Number(b)).join(', ')}
                </Typography>
              )}
            </Section>
          )}

          {/* 6 – Jewellery Specifications */}
          <Section icon={Sparkles} title="Jewellery Specifications" subtitle="Metal, karat, stone — multiple selections allowed" accentColor="violet">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                  Metal Type <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <ChipToggleGroup options={METAL_OPTIONS} selected={form.metals} onChange={val => { set('metals', val); clearError('metals'); }} color="indigo" />
                {formErrors.metals && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.75 }}>{formErrors.metals}</Typography>}
              </Box>

              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                  Metal Karat <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <ChipToggleGroup options={KARAT_OPTIONS} selected={form.metalKt ? [form.metalKt] : []} onChange={val => { set('metalKt', val[val.length - 1] || ''); clearError('metalKt'); }} color="violet" />
                {formErrors.metalKt && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.75 }}>{formErrors.metalKt}</Typography>}
              </Box>

              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                  Stone / Gemstone <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>(optional)</Box>
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.disabled', mb: 1 }}>Leave empty for plain metal products (e.g. gold chains, plain bangles)</Typography>
                <ChipToggleGroup options={STONE_OPTIONS} selected={form.stones} onChange={val => set('stones', val)} color="info" />
              </Box>

              {form.stones.includes('Diamond') && (
                <Box sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'rgba(139,92,246,0.3)', bgcolor: 'rgba(139,92,246,0.04)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Diamond size={14} style={{ color: '#7c3aed' }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Diamond Specifications</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
                    <Select label="Clarity" value={form.diamondClarity} onChange={e => set('diamondClarity', e.target.value)}>
                      <MenuItem value="">Not specified</MenuItem>
                      {['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </Select>
                    <Select label="Color Grade" value={form.diamondColor} onChange={e => set('diamondColor', e.target.value)}>
                      <MenuItem value="">Not specified</MenuItem>
                      {['D','E','F','G','H','I','J','K','L','M','N'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </Select>
                    <Input label="Carat Weight (ct.)" type="number" min={0} step={0.01} value={form.diamondCt} onChange={e => set('diamondCt', e.target.value)} placeholder="e.g. 0.50" />
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Input label="Product Weight (g)" type="number" min={0} step={0.01} value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 4.20" />
              </Box>

              {matchedNavMS.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 12, color: 'text.disabled', mb: 1 }}>
                    This product will appear in "By Metal & Stone" filter for:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {matchedNavMS.map(opt => (
                      <Box key={opt} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid', borderColor: 'rgba(16,185,129,0.25)', borderRadius: 1.5, px: 1, py: 0.25, fontSize: 12, fontWeight: 600 }}>
                        <Check size={10} /> {opt}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Section>

          {/* 7 – Frontend Filter Mapping */}
          <Section icon={SlidersHorizontal} title="Frontend Filter Mapping"
            subtitle={form.category
              ? `Mega-nav options for "${form.category}" — selections control which storefront filters show this product`
              : 'Select a category first to see the relevant filter options'}
            accentColor="cyan">

            {!form.category ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Box sx={{ color: 'text.disabled', mb: 1, display: 'flex', justifyContent: 'center' }}><SlidersHorizontal size={36} /></Box>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Choose a category in the sidebar to unlock category-specific filter chips.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Star size={13} style={{ color: '#f59e0b' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Featured In</Typography>
                    {form.featured.length > 0 && (
                      <Box sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid', borderColor: 'rgba(245,158,11,0.25)', fontSize: 11, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 1 }}>
                        {form.featured.length} selected
                      </Box>
                    )}
                  </Box>
                  <ChipToggleGroup options={categoryMap.featured} selected={form.featured} onChange={val => set('featured', val)} color="warning" />
                  <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.75 }}>Controls which "Featured" column items this product appears under in the mega-nav</Typography>
                  {formErrors.featured && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.5 }}>{formErrors.featured}</Typography>}
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Layers size={13} style={{ color: '#0ea5e9' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>By Style</Typography>
                    {form.styles.length > 0 && (
                      <Box sx={{ bgcolor: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid', borderColor: 'rgba(14,165,233,0.25)', fontSize: 11, fontWeight: 700, px: 0.75, py: 0.25, borderRadius: 1 }}>
                        {form.styles.length} selected
                      </Box>
                    )}
                  </Box>
                  <ChipToggleGroup options={categoryMap.styles} selected={form.styles} onChange={val => set('styles', val)} color="info" />
                  <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.75 }}>Controls "By Style" filter column in the mega-nav</Typography>
                  {formErrors.styles && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.5 }}>{formErrors.styles}</Typography>}
                </Box>
              </Box>
            )}
          </Section>

          {/* 8 – Tags & Audience */}
          <Section icon={Users} title="Tags & Audience" subtitle="Searchable keywords and target customer segments" accentColor="teal">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>Search Tags</Typography>
                <TagInput value={form.tags} onChange={val => set('tags', val)} placeholder="Type a tag, press Enter…" />
                <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5 }}>e.g. diamond, ring, engagement, anniversary</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                  Target Audience <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <ChipToggleGroup options={FORWHO_OPTIONS} selected={form.forWho} onChange={val => { set('forWho', val); clearError('forWho'); }} color="emerald" />
                {formErrors.forWho && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 0.75 }}>{formErrors.forWho}</Typography>}
              </Box>
            </Box>

            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>
                Collection Tags <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>(optional)</Box>
              </Typography>
              <TagInput value={form.collection} onChange={val => set('collection', val)} placeholder="e.g. Valentine's Day Collection…" />
              <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5 }}>
                The AI chatbot will prioritize this product for each tagged collection. Pick from the suggestions below or type a custom name and press Enter.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                {AI_COLLECTION_OPTIONS.filter(o => !form.collection.includes(o)).map(opt => (
                  <Box
                    key={opt}
                    component="button"
                    type="button"
                    onClick={() => set('collection', [...form.collection, opt])}
                    sx={{
                      display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25,
                      borderRadius: 1, border: '1px dashed', borderColor: 'divider',
                      fontSize: 12, color: 'text.secondary', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      '&:hover': { borderColor: 'primary.light', color: 'primary.main' }, transition: 'all 0.15s',
                    }}
                  >
                    + {opt}
                  </Box>
                ))}
              </Box>
            </Box>
          </Section>

          {/* 9 – SEO */}
          <Section icon={Search} title="SEO" subtitle="Search engine metadata — pre-filled from product name and description" accentColor="sky">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Input label="Meta Title" value={form.seoTitle || form.name} onChange={e => set('seoTitle', e.target.value)} maxLength={80} helper={`${(form.seoTitle || form.name).length} / 60 characters recommended`} />
              <Textarea label="Meta Description" rows={2} value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} placeholder="Brief description for search engines…" maxLength={200} helper={`${form.seoDescription.length} / 160 characters recommended`} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 0.75 }}>URL Slug</Typography>
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, border: '1px solid', borderRight: 'none', borderColor: 'divider', bgcolor: 'action.hover', fontSize: 13, color: 'text.disabled', borderRadius: '8px 0 0 8px', whiteSpace: 'nowrap' }}>
                    /products/
                  </Box>
                  <Box
                    component="input"
                    type="text"
                    value={form.slug || slugify(form.name)}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    sx={{
                      flex: 1, minWidth: 0, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                      borderRadius: '0 8px 8px 0', px: 1.75, py: 1.25, fontSize: 14, color: 'text.primary',
                      outline: 'none', fontFamily: 'inherit',
                      '&:focus': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(99,102,241,0.15)' },
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5 }}>Auto-generated from product name — edit to customise</Typography>
              </Box>
            </Box>
          </Section>

          {/* 10 – Reviews */}
          <Section icon={MessageSquare} title="Reviews & Ratings"
            subtitle={isEdit ? 'Add and manage reviews for this product' : 'Save product first to manage reviews'}
            accentColor="amber">

            {isEdit && form.reviewCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{(form.rating || 0).toFixed(1)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, justifyContent: 'center', mt: 0.5 }}>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={13} style={{ fill: (form.rating || 0) >= i ? '#f59e0b' : '#e5e7eb', color: (form.rating || 0) >= i ? '#f59e0b' : '#e5e7eb' }} />
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.25 }}>{form.reviewCount} published review{form.reviewCount !== 1 ? 's' : ''}</Typography>
                </Box>
                <Box
                  component="button"
                  type="button"
                  onClick={() => navigate('/admin/reviews')}
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 13, fontWeight: 500, color: 'primary.main', border: '1px solid', borderColor: 'rgba(99,102,241,0.3)', borderRadius: 2, px: 1.5, py: 0.75, background: 'none', cursor: 'pointer', fontFamily: 'inherit', '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' }, transition: 'background-color 0.15s' }}
                >
                  View All Reviews <ExternalLink size={12} />
                </Box>
              </Box>
            )}
            <ReviewManagerPanel productId={isEdit ? id : null} />
          </Section>

        </Box>

        {/* RIGHT SIDEBAR */}
        <Box sx={{ width: { xs: '100%', lg: 288, xl: 320 }, flexShrink: 0, position: { lg: 'sticky' }, top: { lg: 80 }, alignSelf: { lg: 'flex-start' } }}>

          {/* Status & Visibility */}
          <SideCard title="Status & Visibility" icon={ToggleLeft}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { key: 'inStock',   label: 'In Stock',  desc: v => v ? 'Available for purchase' : 'Out of stock',       activeBg: 'rgba(16,185,129,0.06)',  activeBorder: 'rgba(16,185,129,0.2)' },
                { key: 'certified', label: 'Certified', desc: v => v ? 'Has quality certification' : 'No certification', activeBg: 'rgba(14,165,233,0.06)', activeBorder: 'rgba(14,165,233,0.2)' },
              ].map(({ key, label, desc, activeBg, activeBorder }) => (
                <Box
                  key={key}
                  component="label"
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', bgcolor: form[key] ? activeBg : 'transparent', borderColor: form[key] ? activeBorder : 'divider' }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>{desc(form[key])}</Typography>
                  </Box>
                  <Toggle checked={form[key]} onChange={e => set(key, e.target.checked)} />
                </Box>
              ))}

              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', mb: 1 }}>Product Badge</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => set('badge', '')}
                    sx={{ px: 1.25, py: 0.5, borderRadius: 1.5, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', bgcolor: !form.badge ? '#374151' : 'background.paper', borderColor: !form.badge ? '#374151' : 'divider', color: !form.badge ? '#fff' : 'text.secondary' }}
                  >
                    None
                  </Box>
                  {BADGE_OPTIONS.map(b => {
                    const active = form.badge === b;
                    const p = BADGE_PILL[b?.toLowerCase()] || BADGE_PILL.default;
                    return (
                      <Box
                        key={b}
                        component="button"
                        type="button"
                        onClick={() => set('badge', b)}
                        sx={{ px: 1.25, py: 0.5, borderRadius: 1.5, border: '1px solid', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s', bgcolor: active ? p.bg : 'background.paper', borderColor: active ? p.border : 'divider', color: active ? p.color : 'text.secondary' }}
                      >
                        {b}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </SideCard>

          {/* Product Flags */}
          <SideCard title="Product Flags *" icon={Zap}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled', mb: 1.5 }}>
              Each flag creates a dedicated collection page (e.g.{' '}
              <Box component="code" sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5 }}>/collection/new-arrivals</Box>
              ). Products appear on that page automatically once flagged.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {PRODUCT_FLAGS.map(flag => {
                const on = form.flags.includes(flag);
                const col = FLAG_COLLECTIONS.find(c => c.flag === flag);
                return (
                  <Box key={flag} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => set('flags', on ? form.flags.filter(f => f !== flag) : [...form.flags, flag])}
                      sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                        px: 1.25, py: 0.5, borderRadius: 1.5, border: '1px solid', fontSize: 12, fontWeight: on ? 600 : 500,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        bgcolor: on ? '#f59e0b' : 'background.paper',
                        borderColor: on ? '#f59e0b' : 'divider',
                        color: on ? '#fff' : 'text.secondary',
                        '&:hover': { borderColor: '#f59e0b', color: on ? '#fff' : '#d97706' },
                      }}
                    >
                      {on && <Check size={10} />} {flag}
                    </Box>
                    {col && (
                      <Box component="a" href={`/collection/${col.slug}`} target="_blank" rel="noopener noreferrer" title={`View /collection/${col.slug}`} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' }, display: 'flex', transition: 'color 0.1s' }}>
                        <ExternalLink size={11} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
            {formErrors.flags && <Typography sx={{ fontSize: 11, color: 'error.main', mt: 1 }}>{formErrors.flags}</Typography>}
          </SideCard>

          {/* Category */}
          <SideCard title="Category" icon={FolderOpen}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Select label="Category" required value={form.category} onChange={e => setCategory(e.target.value)} error={formErrors.category}>
                <MenuItem value="">Select category</MenuItem>
                {CATEGORY_LIST.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
              {subcategoryOpts.length > 0 ? (
                <Select label="Subcategory" value={form.subcategory} onChange={e => set('subcategory', e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {subcategoryOpts.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              ) : (
                <Input label="Subcategory" value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="e.g. Diamond Rings" />
              )}
            </Box>
          </SideCard>

          {/* Brand */}
          <SideCard title="Brand" icon={Diamond}>
            <Select label="Brand" required value={form.brand} onChange={e => set('brand', e.target.value)} error={formErrors.brand}>
              <MenuItem value="">Select brand</MenuItem>
              {brandsList.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
          </SideCard>

          {/* Fulfillment */}
          <SideCard title="Fulfillment" icon={Truck}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Input label="Fulfilled By" value={form.fulfilledBy} onChange={e => set('fulfilledBy', e.target.value)} placeholder="e.g. Jawhara" helper="Who ships this product" />
              <Select label="Delivery Time" required value={form.arrivesBy} onChange={e => set('arrivesBy', e.target.value)} error={formErrors.arrivesBy}>
                <MenuItem value="">Select delivery time</MenuItem>
                {DELIVERY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </Box>
          </SideCard>

        </Box>
        {/* END RIGHT SIDEBAR */}

      </Box>

      {/* Floating save bar */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, bgcolor: 'background.paper', backdropFilter: 'blur(8px)', borderTop: '1px solid', borderColor: 'divider', px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography sx={{ fontSize: 12, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
          {isEdit ? 'You are editing an existing product' : 'New product — fill all required fields to publish'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          <Box component="button" type="button" onClick={() => navigate('/admin/products')} sx={discardBtnSx}>Discard</Box>
          <Box component="button" type="submit" disabled={saving} sx={saveBtnSx}>
            {saving ? (
              <svg style={{ animation: 'spin 1s linear infinite' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : <Save size={14} />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Product'}
          </Box>
        </Box>
      </Box>

    </Box>
  );
}
