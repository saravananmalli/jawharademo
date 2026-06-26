import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DirhamSymbol } from 'dirham/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Diamond, Tag, Sparkles, FolderOpen, Image as ImageIcon,
  Users, Truck, ToggleLeft, Check, Star, Layers, SlidersHorizontal,
  FileText, Search, MessageSquare, Gift, Zap, ExternalLink,
  AlertCircle, ChevronDown, X,
} from 'lucide-react';

import api from '../../services/api';
import ImageUploader from '../../components/admin/ImageUploader';
import ReviewManagerPanel from '../../components/admin/ReviewManagerPanel';
import {
  Input, Select, Textarea, Toggle, Button, Card, CardHeader, CardBody,
} from '../../components/admin/ui/index.js';
// brands loaded dynamically from API — see useBrands hook below
import {
  METAL_OPTIONS, KARAT_OPTIONS, STONE_OPTIONS,
  FORWHO_OPTIONS, BADGE_OPTIONS, BADGE_COLORS, CATEGORY_LIST,
  PRICE_BUCKET_MAP, CATEGORY_FILTER_MAP, SUBCATEGORY_MAP, PRODUCT_FLAGS,
  FLAG_COLLECTIONS,
} from '../../utils/filterConstants';

// ── Form defaults ─────────────────────────────────────────────────────────────
const RING_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

const DELIVERY_OPTIONS = [
  'Next Day Delivery', '1–3 Day Delivery', '2–3 Day Delivery',
];

const AI_COLLECTION_OPTIONS = [
  "Valentine's Day Collection",
  "Mother's Day Collection",
  'New Arrivals',
  'Best Sellers',
  'Bridal Collection',
  'Wedding Collection',
  'Anniversary Collection',
  "Kids' Collection",
  "Men's Collection",
  'Sale Collection',
  'Eid Collection',
  'Ramadan Collection',
  'Christmas Collection',
  'Graduation Collection',
  'Engagement Collection',
  'Festive Collection',
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

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, accentColor = 'indigo', children }) {
  const accentMap = {
    indigo:  'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400',
    violet:  'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800/40 text-violet-600 dark:text-violet-400',
    green:   'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
    blue:    'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40 text-blue-600 dark:text-blue-400',
    orange:  'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/40 text-orange-600 dark:text-orange-400',
    teal:    'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/40 text-teal-600 dark:text-teal-400',
    cyan:    'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-400',
    amber:   'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
    sky:     'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/40 text-sky-600 dark:text-sky-400',
  };
  const accent = accentMap[accentColor] || accentMap.indigo;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${accent}`}>
            <Icon size={15} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// ── Sidebar card ──────────────────────────────────────────────────────────────
function SideCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mb-4">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          {Icon && <Icon size={13} className="text-gray-400 dark:text-gray-500" />}
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest" style={{ letterSpacing: '0.9px', fontSize: '0.62rem' }}>
            {title}
          </span>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// ── Chip toggle group ─────────────────────────────────────────────────────────
function ChipToggle({ label, selected, onClick, color = 'indigo' }) {
  const colorMap = {
    indigo:  { on: 'bg-indigo-600 border-indigo-600 text-white', off: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700' },
    violet:  { on: 'bg-violet-600 border-violet-600 text-white', off: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700' },
    emerald: { on: 'bg-emerald-600 border-emerald-600 text-white', off: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-700' },
    info:    { on: 'bg-sky-600 border-sky-600 text-white', off: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-sky-300 dark:hover:border-sky-700' },
    warning: { on: 'bg-amber-500 border-amber-500 text-white', off: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700' },
    teal:    { on: 'bg-teal-600 border-teal-600 text-white', off: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-teal-300 dark:hover:border-teal-700' },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer ${selected ? c.on : c.off}`}
    >
      {selected && <Check size={10} className="flex-shrink-0" />}
      {label}
    </button>
  );
}

function ChipToggleGroup({ options, selected, onChange, color = 'indigo' }) {
  const toggle = (val) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <ChipToggle key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle(opt)} color={color} />
      ))}
    </div>
  );
}

// ── Tag input (free-form) ─────────────────────────────────────────────────────
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
    <div className="flex flex-wrap gap-1.5 min-h-[42px] w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all duration-150">
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-md px-2 py-0.5 text-xs font-medium">
          {tag}
          <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-red-500 transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
      />
    </div>
  );
}

// ── Badge color utility for product badge chips ───────────────────────────────
const BADGE_PILL_MAP = {
  new:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  sale:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  hot:     'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  limited: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [brandsList,    setBrandsList]    = useState([]);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [formErrors,    setFormErrors]    = useState({});
  // productLoaded gates the ImageUploader so it mounts exactly once with the
  // correct initial images (either immediately for new, or after API fetch for edit)
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
    setForm(f => ({
      ...f,
      price: val,
      priceRange: range || f.priceRange,
      discount: calcDiscount(val, f.originalPrice),
    }));
  };

  const setOriginalPrice = (val) => {
    setForm(f => ({
      ...f,
      originalPrice: val,
      discount: calcDiscount(f.price, val),
    }));
  };

  const setCategory = (cat) => {
    const map = CATEGORY_FILTER_MAP[cat] || { featured: [], styles: [] };
    setForm(f => ({
      ...f,
      category:    cat,
      subcategory: '',
      featured:    f.featured.filter(v => map.featured.includes(v)),
      styles:      f.styles.filter(v => map.styles.includes(v)),
    }));
    clearError('category');
  };

  const setName = (val) => {
    setForm(f => ({
      ...f,
      name:     val,
      seoTitle: f.seoTitle === f.name || !f.seoTitle ? val : f.seoTitle,
      slug:     f.slug === slugify(f.name) || !f.slug ? slugify(val) : f.slug,
    }));
    clearError('name');
  };

  const toggleSize  = (s) => set('sizes', form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24">

      {/* ── Sticky page header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 pt-1 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-3 h-8 bg-white dark:bg-gray-900 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={14} />
            Products
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight truncate">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {isEdit ? 'Update product listing details' : 'Fill in all details to publish a new product'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl px-4 h-9 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 h-9 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Two-column body ────────────────────────────────────────────────── */}
      <div className="flex gap-5 items-start flex-col lg:flex-row">

        {/* ════ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 w-full lg:w-auto">

          {/* 1 ─ Product Information ──────────────────────────────────────── */}
          <Section icon={Diamond} title="Product Information" subtitle="Product name and unique SKU / design code" accentColor="indigo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Product Name"
                  required
                  value={form.name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 18K Gold Diamond Solitaire Ring"
                  error={formErrors.name}
                  helper="A clear, descriptive name (also pre-fills SEO title and URL slug)"
                />
              </div>
              <div>
                <Input
                  label="SKU / Design Code"
                  required
                  value={form.designCode}
                  onChange={e => set('designCode', e.target.value)}
                  placeholder="e.g. RNG-001"
                  error={formErrors.designCode}
                  helper="Unique product identifier"
                />
              </div>
            </div>
          </Section>

          {/* 2 ─ Product Description ──────────────────────────────────────── */}
          <Section icon={FileText} title="Product Description" subtitle="Plain text description shown on the product page" accentColor="violet">
            <Textarea
              rows={6}
              placeholder="Write your product description here…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              maxLength={2000}
              error={formErrors.description}
              helper={`${(form.description || '').length} / 2000`}
            />
          </Section>

          {/* 3 ─ Pricing ──────────────────────────────────────────────────── */}
          <Section icon={Tag} title="Pricing" subtitle="Sale price auto-assigns the price range bucket — override if needed" accentColor="green">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Sale Price <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">
                    <DirhamSymbol size="0.9em" />
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={e => { setPrice(e.target.value); clearError('price'); }}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-gray-900 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${formErrors.price ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                </div>
                {formErrors.price
                  ? <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>
                  : <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current selling price</p>
                }
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Original Price</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">
                    <DirhamSymbol size="0.9em" />
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shown struck-through when higher than sale price</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount %</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    readOnly
                    value={form.discount}
                    className="w-full pr-8 pl-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-default focus:outline-none"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-sm pointer-events-none">%</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-calculated from sale &amp; original price</p>
              </div>
            </div>

            {/* Savings callout */}
            {autoDiscount !== null && (
              <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5">
                <Check size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  Customer saves AED {(Number(form.originalPrice) - Number(form.price)).toLocaleString()} · {autoDiscount}% off
                </span>
              </div>
            )}

            {/* Price range bucket (read-only) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price Range Bucket</label>
                <div className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-default">
                  {form.priceRange
                    ? PRICE_BUCKET_MAP.find(b => b.slug === form.priceRange)?.label || form.priceRange
                    : 'Auto-assigned from price'
                  }
                </div>
              </div>
            </div>
          </Section>

          {/* 4 ─ Product Images ───────────────────────────────────────────── */}
          <Section icon={ImageIcon} title="Product Images" subtitle="Upload from device — first is the primary cover, second is the hover view" accentColor="blue">
            {productLoaded && (
              <ImageUploader
                images={form.images}
                onChange={urls => { set('images', urls); clearError('images'); }}
                maxImages={10}
                category="products"
              />
            )}
            {formErrors.images && (
              <p className="text-xs text-red-500 mt-2">{formErrors.images}</p>
            )}
          </Section>

          {/* 5 ─ Ring Sizes (conditional) ────────────────────────────────── */}
          {form.category === 'Rings' && (
            <Section icon={Sparkles} title="Product Variants" subtitle="Select available ring sizes" accentColor="orange">
              <div className="flex flex-wrap gap-2">
                {RING_SIZES.map(s => {
                  const on = form.sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`w-12 h-12 rounded-xl border-2 text-sm font-semibold transition-all duration-150 ${
                        on
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {form.sizes.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Selected: {[...form.sizes].sort((a, b) => Number(a) - Number(b)).join(', ')}
                </p>
              )}
            </Section>
          )}

          {/* 6 ─ Jewellery Specifications ─────────────────────────────────── */}
          <Section icon={Sparkles} title="Jewellery Specifications" subtitle="Metal, karat, stone — multiple selections allowed" accentColor="violet">
            <div className="space-y-5">
              {/* Metal Type */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Metal Type <span className="text-red-500">*</span>
                </p>
                <ChipToggleGroup options={METAL_OPTIONS} selected={form.metals}
                  onChange={val => { set('metals', val); clearError('metals'); }} color="indigo" />
                {formErrors.metals && <p className="text-xs text-red-500 mt-1.5">{formErrors.metals}</p>}
              </div>

              {/* Metal Karat */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Metal Karat <span className="text-red-500">*</span>
                </p>
                <ChipToggleGroup
                  options={KARAT_OPTIONS}
                  selected={form.metalKt ? [form.metalKt] : []}
                  onChange={val => { set('metalKt', val[val.length - 1] || ''); clearError('metalKt'); }}
                  color="violet"
                />
                {formErrors.metalKt && <p className="text-xs text-red-500 mt-1.5">{formErrors.metalKt}</p>}
              </div>

              {/* Stone / Gemstone */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Stone / Gemstone{' '}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Leave empty for plain metal products (e.g. gold chains, plain bangles)</p>
                <ChipToggleGroup options={STONE_OPTIONS} selected={form.stones}
                  onChange={val => set('stones', val)} color="info" />
              </div>

              {/* Diamond-specific attributes */}
              {form.stones.includes('Diamond') && (
                <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Diamond size={14} className="text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-bold text-violet-700 dark:text-violet-300">Diamond Specifications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      label="Clarity"
                      value={form.diamondClarity}
                      onChange={e => set('diamondClarity', e.target.value)}
                    >
                      <option value="">Not specified</option>
                      {['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </Select>
                    <Select
                      label="Color Grade"
                      value={form.diamondColor}
                      onChange={e => set('diamondColor', e.target.value)}
                    >
                      <option value="">Not specified</option>
                      {['D','E','F','G','H','I','J','K','L','M','N'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </Select>
                    <Input
                      label="Carat Weight (ct.)"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.diamondCt}
                      onChange={e => set('diamondCt', e.target.value)}
                      placeholder="e.g. 0.50"
                    />
                  </div>
                </div>
              )}

              {/* Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product Weight (g)"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.weight}
                  onChange={e => set('weight', e.target.value)}
                  placeholder="e.g. 4.20"
                />
              </div>

              {/* Metal & Stone nav match preview */}
              {matchedNavMS.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    This product will appear in "By Metal &amp; Stone" filter for:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedNavMS.map(opt => (
                      <span key={opt} className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-lg px-2 py-0.5 text-xs font-semibold">
                        <Check size={10} />
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* 7 ─ Frontend Filter Mapping ──────────────────────────────────── */}
          <Section icon={SlidersHorizontal} title="Frontend Filter Mapping"
            subtitle={form.category
              ? `Mega-nav options for "${form.category}" — selections control which storefront filters show this product`
              : 'Select a category first to see the relevant filter options'}
            accentColor="cyan">

            {!form.category ? (
              <div className="py-8 text-center">
                <SlidersHorizontal size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a category in the sidebar to unlock category-specific filter chips.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Featured In */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={13} className="text-amber-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Featured In</span>
                    {form.featured.length > 0 && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-md">
                        {form.featured.length} selected
                      </span>
                    )}
                  </div>
                  <ChipToggleGroup options={categoryMap.featured} selected={form.featured}
                    onChange={val => set('featured', val)} color="warning" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Controls which "Featured" column items this product appears under in the mega-nav
                  </p>
                  {formErrors.featured && <p className="text-xs text-red-500 mt-1">{formErrors.featured}</p>}
                </div>

                {/* By Style */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={13} className="text-sky-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">By Style</span>
                    {form.styles.length > 0 && (
                      <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 text-xs font-bold px-1.5 py-0.5 rounded-md">
                        {form.styles.length} selected
                      </span>
                    )}
                  </div>
                  <ChipToggleGroup options={categoryMap.styles} selected={form.styles}
                    onChange={val => set('styles', val)} color="info" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Controls "By Style" filter column in the mega-nav
                  </p>
                  {formErrors.styles && <p className="text-xs text-red-500 mt-1">{formErrors.styles}</p>}
                </div>
              </div>
            )}
          </Section>

          {/* 8 ─ Tags & Audience ──────────────────────────────────────────── */}
          <Section icon={Users} title="Tags & Audience" subtitle="Searchable keywords and target customer segments" accentColor="teal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Tags</label>
                <TagInput
                  value={form.tags}
                  onChange={val => set('tags', val)}
                  placeholder="Type a tag, press Enter…"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">e.g. diamond, ring, engagement, anniversary</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Target Audience <span className="text-red-500">*</span>
                </p>
                <ChipToggleGroup options={FORWHO_OPTIONS} selected={form.forWho}
                  onChange={val => { set('forWho', val); clearError('forWho'); }} color="emerald" />
                {formErrors.forWho && <p className="text-xs text-red-500 mt-1.5">{formErrors.forWho}</p>}
              </div>
            </div>

            {/* AI Collection Tags */}
            <div className="mt-5 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Collection Tags{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <TagInput
                value={form.collection}
                onChange={val => set('collection', val)}
                placeholder="e.g. Valentine's Day Collection…"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                The AI chatbot will prioritize this product for each tagged collection. Pick from the suggestions below or type a custom name and press Enter.
              </p>
              {/* Suggestion pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AI_COLLECTION_OPTIONS.filter(o => !form.collection.includes(o)).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('collection', [...form.collection, opt])}
                    className="inline-flex items-center px-2 py-0.5 rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* 9 ─ SEO ──────────────────────────────────────────────────────── */}
          <Section icon={Search} title="SEO" subtitle="Search engine metadata — pre-filled from product name and description" accentColor="sky">
            <div className="space-y-4">
              <Input
                label="Meta Title"
                value={form.seoTitle || form.name}
                onChange={e => set('seoTitle', e.target.value)}
                maxLength={80}
                helper={`${(form.seoTitle || form.name).length} / 60 characters recommended`}
              />
              <Textarea
                label="Meta Description"
                rows={2}
                value={form.seoDescription}
                onChange={e => set('seoDescription', e.target.value)}
                placeholder="Brief description for search engines…"
                maxLength={200}
                helper={`${form.seoDescription.length} / 160 characters recommended`}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL Slug</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    /products/
                  </span>
                  <input
                    type="text"
                    value={form.slug || slugify(form.name)}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-r-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Auto-generated from product name — edit to customise</p>
              </div>
            </div>
          </Section>

          {/* 10 ─ Reviews ─────────────────────────────────────────────────── */}
          <Section icon={MessageSquare} title="Reviews & Ratings"
            subtitle={isEdit ? 'Add and manage reviews for this product' : 'Save product first to manage reviews'}
            accentColor="amber">

            {isEdit && form.reviewCount > 0 && (
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {(form.rating || 0).toFixed(1)}
                  </div>
                  <div className="flex items-center gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i}
                        size={13}
                        className={(form.rating || 0) >= i ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {form.reviewCount} published review{form.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/reviews')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  View All Reviews
                  <ExternalLink size={12} />
                </button>
              </div>
            )}

            <ReviewManagerPanel productId={isEdit ? id : null} />
          </Section>

        </div>
        {/* ════ END LEFT COLUMN ════════════════════════════════════════════ */}

        {/* ════ RIGHT SIDEBAR ══════════════════════════════════════════════ */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-20 lg:self-start">

          {/* Status & Visibility ────────────────────────────────────────── */}
          <SideCard title="Status & Visibility" icon={ToggleLeft}>
            <div className="space-y-3">
              {[
                { key: 'inStock',   label: 'In Stock',  desc: v => v ? 'Available for purchase' : 'Out of stock',       activeClass: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/40' },
                { key: 'certified', label: 'Certified', desc: v => v ? 'Has quality certification' : 'No certification', activeClass: 'bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/40' },
              ].map(({ key, label, desc, activeClass }) => (
                <label key={key} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form[key] ? activeClass : 'border-gray-100 dark:border-gray-800'}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{desc(form[key])}</p>
                  </div>
                  <Toggle
                    checked={form[key]}
                    onChange={e => set(key, e.target.checked)}
                  />
                </label>
              ))}

              {/* Product Badge */}
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2" style={{ letterSpacing: '0.9px', fontSize: '0.63rem' }}>
                  Product Badge
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => set('badge', '')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${!form.badge ? 'bg-gray-700 dark:bg-gray-200 border-gray-700 dark:border-gray-200 text-white dark:text-gray-900' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}
                  >
                    None
                  </button>
                  {BADGE_OPTIONS.map(b => {
                    const active = form.badge === b;
                    const pillCls = BADGE_PILL_MAP[b?.toLowerCase()] || BADGE_PILL_MAP.default;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => set('badge', b)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold capitalize transition-all ${active ? pillCls + ' font-bold' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SideCard>

          {/* Product Flags ──────────────────────────────────────────────── */}
          <SideCard title="Product Flags *" icon={Zap}>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Each flag creates a dedicated collection page (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/collection/new-arrivals</code>). Products appear on that page automatically once flagged.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_FLAGS.map(flag => {
                const on = form.flags.includes(flag);
                const col = FLAG_COLLECTIONS.find(c => c.flag === flag);
                return (
                  <div key={flag} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => set('flags', on ? form.flags.filter(f => f !== flag) : [...form.flags, flag])}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-150 ${
                        on
                          ? 'bg-amber-500 border-amber-500 text-white font-semibold'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
                    >
                      {on && <Check size={10} />}
                      {flag}
                    </button>
                    {col && (
                      <a
                        href={`/collection/${col.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View /collection/${col.slug}`}
                        className="text-gray-300 dark:text-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
            {formErrors.flags && <p className="text-xs text-red-500 mt-2">{formErrors.flags}</p>}
          </SideCard>

          {/* Category ───────────────────────────────────────────────────── */}
          <SideCard title="Category" icon={FolderOpen}>
            <div className="space-y-3">
              <Select
                label="Category"
                required
                value={form.category}
                onChange={e => setCategory(e.target.value)}
                error={formErrors.category}
              >
                <option value="">Select category</option>
                {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>

              {subcategoryOpts.length > 0 ? (
                <Select
                  label="Subcategory"
                  value={form.subcategory}
                  onChange={e => set('subcategory', e.target.value)}
                >
                  <option value="">None</option>
                  {subcategoryOpts.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              ) : (
                <Input
                  label="Subcategory"
                  value={form.subcategory}
                  onChange={e => set('subcategory', e.target.value)}
                  placeholder="e.g. Diamond Rings"
                />
              )}
            </div>
          </SideCard>

          {/* Brand ──────────────────────────────────────────────────────── */}
          <SideCard title="Brand" icon={Diamond}>
            <Select
              label="Brand"
              required
              value={form.brand}
              onChange={e => set('brand', e.target.value)}
              error={formErrors.brand}
            >
              <option value="">Select brand</option>
              {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
            </Select>
          </SideCard>

          {/* Fulfillment ────────────────────────────────────────────────── */}
          <SideCard title="Fulfillment" icon={Truck}>
            <div className="space-y-3">
              <Input
                label="Fulfilled By"
                value={form.fulfilledBy}
                onChange={e => set('fulfilledBy', e.target.value)}
                placeholder="e.g. Jawhara"
                helper="Who ships this product"
              />
              <Select
                label="Delivery Time"
                required
                value={form.arrivesBy}
                onChange={e => set('arrivesBy', e.target.value)}
                error={formErrors.arrivesBy}
              >
                <option value="">Select delivery time</option>
                {DELIVERY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </div>
          </SideCard>

        </div>
        {/* ════ END RIGHT SIDEBAR ══════════════════════════════════════════ */}

      </div>

      {/* ── Floating save bar ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          {isEdit ? 'You are editing an existing product' : 'New product — fill all required fields to publish'}
        </p>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl px-4 h-9 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl px-5 h-9 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <Save size={14} />
            )}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </div>

    </form>
  );
}
