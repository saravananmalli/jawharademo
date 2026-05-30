import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DirhamSymbol } from 'dirham/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, Select,
  MenuItem, FormControl, InputLabel, FormControlLabel, Switch, Chip,
  IconButton, Alert, CircularProgress, Stack, Tooltip, Avatar,
  InputAdornment, alpha, Autocomplete, Rating, FormHelperText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// ── Section icons ───────────────────────────────────────────────────────────
import DeleteOutlinedIcon  from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon       from '@mui/icons-material/ArrowBack';
import SaveIcon            from '@mui/icons-material/Save';
import DiamondIcon         from '@mui/icons-material/Diamond';
import SellIcon            from '@mui/icons-material/Sell';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';
import CategoryIcon        from '@mui/icons-material/Category';
import ImageIcon           from '@mui/icons-material/Image';
import PeopleIcon          from '@mui/icons-material/People';
import LocalShippingIcon   from '@mui/icons-material/LocalShipping';
import ToggleOnIcon        from '@mui/icons-material/ToggleOn';
import CheckIcon           from '@mui/icons-material/Check';
import StarIcon            from '@mui/icons-material/Star';
import StyleIcon           from '@mui/icons-material/Style';
import TuneIcon            from '@mui/icons-material/Tune';
import EditNoteIcon        from '@mui/icons-material/EditNote';
import ManageSearchIcon    from '@mui/icons-material/ManageSearch';
import RateReviewIcon      from '@mui/icons-material/RateReview';
import NewReleasesIcon     from '@mui/icons-material/NewReleases';
import CardGiftcardIcon    from '@mui/icons-material/CardGiftcard';
import OpenInNewIcon       from '@mui/icons-material/OpenInNew';

import api from '../../services/api';
import ImageUploader from '../../components/admin/ImageUploader';
import ReviewManagerPanel from '../../components/admin/ReviewManagerPanel';
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
  'Same Day', 'Next Day', '1–3 Days', '3–5 Days',
  '5–7 Days', '7–14 Days', '2–3 Weeks',
];

// Predefined collection options — must mirror the COLLECTION_MAP regexes in chatController.js
// so the AI chatbot can find and prioritize products in each collection.
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

// Compute which "By Metal & Stone" nav labels this product matches
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, accent }) {
  const theme = useTheme();
  const color = accent || theme.palette.primary.main;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
      <Box sx={{
        width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
        bgcolor: alpha(color, 0.1), border: `1px solid ${alpha(color, 0.22)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon sx={{ fontSize: '1.15rem', color }} />
      </Box>
      <Box sx={{ pt: 0.25 }}>
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function SidebarCard({ title, icon: Icon, accent, children }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const color  = accent || theme.palette.text.secondary;
  return (
    <Card sx={{
      mb: 1.75,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
    }}>
      {title && (
        <Box sx={{
          px: 2, pt: 1.5, pb: 0.9,
          display: 'flex', alignItems: 'center', gap: 0.75,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
        }}>
          {Icon && <Icon sx={{ fontSize: '0.82rem', color }} />}
          <Typography variant="caption" fontWeight={700} sx={{
            textTransform: 'uppercase', letterSpacing: '0.9px', fontSize: '0.62rem', color: 'text.secondary',
          }}>
            {title}
          </Typography>
        </Box>
      )}
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

function ChipToggleGroup({ options, selected, onChange, color = 'primary', size = 'small' }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const toggle = (val) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <Chip
            key={opt} label={opt} size={size}
            onClick={() => toggle(opt)}
            variant={on ? 'filled' : 'outlined'}
            color={on ? color : 'default'}
            icon={on ? <CheckIcon style={{ fontSize: '0.78rem' }} /> : undefined}
            sx={{
              cursor: 'pointer', fontWeight: on ? 700 : 400, fontSize: '0.76rem',
              transition: 'all 0.15s',
              borderColor: on ? undefined : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'),
            }}
          />
        );
      })}
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const isEdit   = !!id;

  const [brandsList,  setBrandsList]  = useState([]);
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [formErrors,  setFormErrors]  = useState({});
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

  const cardSx = {
    mb: 2.5,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ pb: 6 }}>

      {/* ── Sticky page header ─────────────────────────────────────────────── */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 20, bgcolor: 'background.default',
        pt: 0.5, pb: 1.75, mb: 3,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e9eaec'}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} size="small"
            onClick={() => navigate('/admin/products')}
            sx={{ borderRadius: '8px', height: 34, flexShrink: 0 }}>
            Products
          </Button>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} noWrap>
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit ? 'Update product listing details' : 'Fill in all details to publish a new product'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0 }}>
            <Button variant="outlined" onClick={() => navigate('/admin/products')}
              sx={{ borderRadius: '8px', height: 38 }}>
              Discard
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon />}
              disabled={saving}
              sx={{ borderRadius: '10px', fontWeight: 700, height: 38, px: 3 }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Product'}
            </Button>
          </Stack>
        </Box>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mt: 1.5, borderRadius: 2 }}>{error}</Alert>
        )}
      </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          TWO-COLUMN BODY — flex row on ≥900 px, stacked on mobile
      ══════════════════════════════════════════════════════════════════════ */}
      <Box sx={{
        display: 'flex',
        gap: 2.5,
        alignItems: 'flex-start',
        flexDirection: { xs: 'column', md: 'row' },
      }}>

        {/* ════ LEFT COLUMN — grows to fill available space ══════════════ */}
        <Box sx={{ flex: '1 1 0', minWidth: 0, width: { xs: '100%', md: 'auto' } }}>

          {/* 1 ─ Product Information ──────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={DiamondIcon} title="Product Information"
                subtitle="Product name and unique SKU / design code" />
              <Grid container spacing={2.25}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Product Name *"
                    value={form.name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. 18K Gold Diamond Solitaire Ring"
                    error={!!formErrors.name}
                    helperText={formErrors.name || 'A clear, descriptive name (also pre-fills SEO title and URL slug)'} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="SKU / Design Code *"
                    value={form.designCode} onChange={e => set('designCode', e.target.value)}
                    placeholder="e.g. RNG-001"
                    error={!!formErrors.designCode}
                    helperText={formErrors.designCode || 'Unique product identifier'} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 2 ─ Product Description ──────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={EditNoteIcon} title="Product Description"
                subtitle="Plain text description shown on the product page"
                accent="#7c3aed" />
              <TextField
                fullWidth multiline rows={6}
                placeholder="Write your product description here…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                inputProps={{ maxLength: 2000 }}
                error={!!formErrors.description}
                helperText={formErrors.description || `${(form.description || '').length} / 2000`}
              />
            </CardContent>
          </Card>

          {/* 3 ─ Pricing ──────────────────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={SellIcon} title="Pricing"
                subtitle="Sale price auto-assigns the price range bucket — override if needed"
                accent="#16a34a" />
              <Grid container spacing={2.25}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Sale Price *" type="number"
                    value={form.price} onChange={e => { setPrice(e.target.value); clearError('price'); }}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><DirhamSymbol size="0.9em" /></InputAdornment> }}
                    error={!!formErrors.price}
                    helperText={formErrors.price || 'Current selling price'} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Original Price" type="number"
                    value={form.originalPrice} onChange={e => setOriginalPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><DirhamSymbol size="0.9em" /></InputAdornment> }}
                    helperText="Shown struck-through when higher than sale price" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Discount %" type="number"
                    value={form.discount}
                    inputProps={{ min: 0, max: 100, readOnly: true }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    helperText="Auto-calculated from sale & original price"
                    sx={{ '& .MuiInputBase-input': { bgcolor: 'action.hover', cursor: 'default' } }} />
                </Grid>

                {autoDiscount !== null && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1,
                      px: 2, py: 0.9, borderRadius: 2,
                      bgcolor: alpha('#16a34a', 0.08), border: `1px solid ${alpha('#16a34a', 0.2)}` }}>
                      <CheckIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                      <Typography variant="caption" color="success.main" fontWeight={600}>
                        Customer saves AED {(Number(form.originalPrice) - Number(form.price)).toLocaleString()} · {autoDiscount}% off
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Price Range Bucket</InputLabel>
                    <Select label="Price Range Bucket" value={form.priceRange}
                      inputProps={{ readOnly: true }}
                      sx={{ bgcolor: 'action.hover', pointerEvents: 'none' }}>
                      <MenuItem value="">None</MenuItem>
                      {PRICE_BUCKET_MAP.map(b => (
                        <MenuItem key={b.slug} value={b.slug}>{b.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 4 ─ Product Images ───────────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={ImageIcon} title="Product Images"
                subtitle="Upload from device — first is the primary cover, second is the hover view"
                accent="#2563eb" />
              {productLoaded && (
                <ImageUploader
                  images={form.images}
                  onChange={urls => { set('images', urls); clearError('images'); }}
                  maxImages={10}
                  category="products"
                />
              )}
              {formErrors.images && (
                <FormHelperText error sx={{ mt: 1, fontSize: '0.82rem' }}>{formErrors.images}</FormHelperText>
              )}
            </CardContent>
          </Card>

          {/* 5 ─ Product Variants (ring sizes — conditional) ──────────── */}
          {form.category === 'Rings' && (
            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <SectionHeader icon={AutoAwesomeIcon} title="Product Variants"
                  subtitle="Select available ring sizes"
                  accent="#e5780b" />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {RING_SIZES.map(s => {
                    const on = form.sizes.includes(s);
                    return (
                      <Box key={s} onClick={() => toggleSize(s)} sx={{
                        width: 52, height: 52, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                        border: `2px solid ${on ? theme.palette.primary.main : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}`,
                        bgcolor: on ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}>
                        <Typography fontWeight={on ? 700 : 500} fontSize="0.9rem"
                          color={on ? 'primary.main' : 'text.secondary'}>{s}</Typography>
                      </Box>
                    );
                  })}
                </Box>
                {form.sizes.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Selected: {[...form.sizes].sort((a, b) => Number(a) - Number(b)).join(', ')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* 6 ─ Jewellery Specifications ───────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={AutoAwesomeIcon} title="Jewellery Specifications"
                subtitle="Metal, karat, stone — multiple selections allowed"
                accent="#9c6fda" />
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Metal Type <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                  <ChipToggleGroup options={METAL_OPTIONS} selected={form.metals}
                    onChange={val => { set('metals', val); clearError('metals'); }} color="primary" />
                  {formErrors.metals && (
                    <FormHelperText error sx={{ mt: 0.5 }}>{formErrors.metals}</FormHelperText>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Metal Karat <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                  <ChipToggleGroup
                    options={KARAT_OPTIONS}
                    selected={form.metalKt ? [form.metalKt] : []}
                    onChange={val => { set('metalKt', val[val.length - 1] || ''); clearError('metalKt'); }}
                    color="secondary" />
                  {formErrors.metalKt && (
                    <FormHelperText error sx={{ mt: 0.5 }}>{formErrors.metalKt}</FormHelperText>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Stone / Gemstone
                    <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary', ml: 0.75 }}>
                      (optional)
                    </Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Leave empty for plain metal products (e.g. gold chains, plain bangles)
                  </Typography>
                  <ChipToggleGroup options={STONE_OPTIONS} selected={form.stones}
                    onChange={val => set('stones', val)} color="info" />
                </Box>

                {/* ── Diamond-specific attributes (shown only when Diamond is selected) ── */}
                {form.stones.includes('Diamond') && (
                  <Box sx={{
                    p: 2, borderRadius: 2,
                    border: `1px solid ${isDark ? 'rgba(185,150,255,0.22)' : 'rgba(139,92,246,0.2)'}`,
                    bgcolor: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                      <DiamondIcon sx={{ fontSize: '0.95rem', color: '#8b5cf6' }} />
                      <Typography variant="body2" fontWeight={700} color="#8b5cf6">Diamond Specifications</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Clarity</InputLabel>
                          <Select label="Clarity" value={form.diamondClarity}
                            onChange={e => set('diamondClarity', e.target.value)}>
                            <MenuItem value=""><em>Not specified</em></MenuItem>
                            {['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'].map(v => (
                              <MenuItem key={v} value={v}>{v}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Color Grade</InputLabel>
                          <Select label="Color Grade" value={form.diamondColor}
                            onChange={e => set('diamondColor', e.target.value)}>
                            <MenuItem value=""><em>Not specified</em></MenuItem>
                            {['D','E','F','G','H','I','J','K','L','M','N'].map(v => (
                              <MenuItem key={v} value={v}>{v}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label="Carat Weight (ct.)"
                          type="number" value={form.diamondCt}
                          onChange={e => set('diamondCt', e.target.value)}
                          inputProps={{ min: 0, step: 0.01 }}
                          placeholder="e.g. 0.50" />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Product Weight (g)"
                      type="number" value={form.weight}
                      onChange={e => set('weight', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      placeholder="e.g. 4.20" />
                  </Grid>
                </Grid>

                {matchedNavMS.length > 0 && (
                  <Box sx={{ pt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                      This product will appear in "By Metal &amp; Stone" filter for:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {matchedNavMS.map(opt => (
                        <Chip key={opt} label={opt} size="small" color="success" variant="outlined"
                          icon={<CheckIcon style={{ fontSize: '0.75rem' }} />}
                          sx={{ fontSize: '0.72rem', height: 24, fontWeight: 600 }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* 7 ─ Frontend Filter Mapping ──────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={TuneIcon} title="Frontend Filter Mapping"
                subtitle={form.category
                  ? `Mega-nav options for "${form.category}" — selections control which storefront filters show this product`
                  : 'Select a category first to see the relevant filter options'}
                accent="#0891b2" />

              {!form.category ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <TuneIcon sx={{ fontSize: '2.5rem', color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Choose a category in the sidebar to unlock category-specific filter chips.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <StarIcon sx={{ fontSize: '0.88rem', color: 'warning.main' }} />
                      <Typography variant="body2" fontWeight={700}>Featured In</Typography>
                      {form.featured.length > 0 && (
                        <Chip label={`${form.featured.length} selected`} size="small" color="warning" variant="outlined"
                          sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700 }} />
                      )}
                    </Box>
                    <ChipToggleGroup options={categoryMap.featured} selected={form.featured}
                      onChange={val => set('featured', val)} color="warning" />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                      Controls which "Featured" column items this product appears under in the mega-nav
                    </Typography>
                    {formErrors.featured && (
                      <FormHelperText error sx={{ mt: 0.5 }}>{formErrors.featured}</FormHelperText>
                    )}
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <StyleIcon sx={{ fontSize: '0.88rem', color: '#0891b2' }} />
                      <Typography variant="body2" fontWeight={700}>By Style</Typography>
                      {form.styles.length > 0 && (
                        <Chip label={`${form.styles.length} selected`} size="small" color="info" variant="outlined"
                          sx={{ height: 20, fontSize: '0.67rem', fontWeight: 700 }} />
                      )}
                    </Box>
                    <ChipToggleGroup options={categoryMap.styles} selected={form.styles}
                      onChange={val => set('styles', val)} color="info" />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                      Controls "By Style" filter column in the mega-nav
                    </Typography>
                    {formErrors.styles && (
                      <FormHelperText error sx={{ mt: 0.5 }}>{formErrors.styles}</FormHelperText>
                    )}
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* 8 ─ Tags & Audience ──────────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={PeopleIcon} title="Tags & Audience"
                subtitle="Searchable keywords and target customer segments"
                accent="#0e9f8c" />
              <Grid container spacing={2.25}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete multiple freeSolo options={[]}
                    value={form.tags} onChange={(_, val) => set('tags', val)}
                    renderTags={(tags, getTagProps) => tags.map((tag, i) => (
                      <Chip {...getTagProps({ index: i })} key={tag} label={tag} size="small" variant="outlined"
                        sx={{ fontSize: '0.72rem', height: 24 }} />
                    ))}
                    renderInput={params => (
                      <TextField {...params} label="Search Tags" size="small"
                        placeholder="Type a tag, press Enter…"
                        helperText="e.g. diamond, ring, engagement, anniversary" />
                    )} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
                    Target Audience <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                  <ChipToggleGroup options={FORWHO_OPTIONS} selected={form.forWho}
                    onChange={val => { set('forWho', val); clearError('forWho'); }} color="success" />
                  {formErrors.forWho && (
                    <FormHelperText error sx={{ mt: 0.5 }}>{formErrors.forWho}</FormHelperText>
                  )}
                </Grid>

                {/* Collection Tags — optional, drives AI chatbot priority recommendations */}
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={AI_COLLECTION_OPTIONS}
                    value={form.collection}
                    onChange={(_, val) => set('collection', val)}
                    renderTags={(tags, getTagProps) => tags.map((tag, i) => (
                      <Chip
                        {...getTagProps({ index: i })}
                        key={tag}
                        label={tag}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem', height: 24 }}
                      />
                    ))}
                    renderInput={params => (
                      <TextField
                        {...params}
                        size="small"
                        label="Collection Tags (optional)"
                        placeholder={form.collection.length ? '' : "e.g. Valentine's Day Collection"}
                        helperText="The AI chatbot will prioritize this product for each tagged collection. Pick from the list or type a custom name and press Enter."
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 9 ─ SEO ──────────────────────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={ManageSearchIcon} title="SEO"
                subtitle="Search engine metadata — pre-filled from product name and description"
                accent="#0369a1" />
              <Grid container spacing={2.25}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Meta Title"
                    value={form.seoTitle || form.name}
                    onChange={e => set('seoTitle', e.target.value)}
                    helperText={`${(form.seoTitle || form.name).length} / 60 characters recommended`}
                    inputProps={{ maxLength: 80 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" multiline rows={2} label="Meta Description"
                    value={form.seoDescription}
                    onChange={e => set('seoDescription', e.target.value)}
                    placeholder="Brief description for search engines…"
                    helperText={`${form.seoDescription.length} / 160 characters recommended`}
                    inputProps={{ maxLength: 200 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="URL Slug"
                    value={form.slug || slugify(form.name)}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    InputProps={{ startAdornment: <InputAdornment position="start">/products/</InputAdornment> }}
                    helperText="Auto-generated from product name — edit to customise" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 10 ─ Reviews ─────────────────────────────────────────────── */}
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <SectionHeader icon={RateReviewIcon} title="Reviews & Ratings"
                subtitle={isEdit ? 'Add and manage reviews for this product' : 'Save product first to manage reviews'}
                accent="#f59e0b" />

              {/* Rating summary row — only when reviews exist */}
              {isEdit && form.reviewCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={800}>{(form.rating || 0).toFixed(1)}</Typography>
                    <Rating value={form.rating || 0} precision={0.5} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {form.reviewCount} published review{form.reviewCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small"
                    onClick={() => navigate('/admin/reviews')}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}>
                    View All Reviews →
                  </Button>
                </Box>
              )}

              <ReviewManagerPanel productId={isEdit ? id : null} />
            </CardContent>
          </Card>

        </Box>
        {/* ════ END LEFT COLUMN ════════════════════════════════════════════ */}

        {/* ════ RIGHT SIDEBAR — fixed width, sticky on desktop ═══════════ */}
        <Box sx={{
          width: { xs: '100%', md: 320 },
          flexShrink: 0,
          position: { md: 'sticky' },
          top: { md: 80 },
          alignSelf: 'flex-start',
        }}>

          {/* Status & Visibility ────────────────────────────────────────── */}
          <SidebarCard title="Status & Visibility" icon={ToggleOnIcon} accent="#16a34a">
            <Stack spacing={1.5}>
              {[
                { key: 'inStock',   label: 'In Stock',   desc: v => v ? 'Available for purchase' : 'Out of stock',        color: 'success' },
                { key: 'certified', label: 'Certified',  desc: v => v ? 'Has quality certification' : 'No certification', color: 'info' },
              ].map(({ key, label, desc, color }) => (
                <Box key={key} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1.25, borderRadius: 1.5,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  bgcolor: form[key] ? alpha(theme.palette[color].main, 0.06) : 'transparent',
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600} fontSize="0.82rem">{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{desc(form[key])}</Typography>
                  </Box>
                  <Switch checked={form[key]} onChange={e => set(key, e.target.checked)} color={color} size="small" />
                </Box>
              ))}

              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.63rem', mb: 0.75, display: 'block' }}>
                  Product Badge
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  <Chip label="None" size="small" variant={!form.badge ? 'filled' : 'outlined'}
                    onClick={() => set('badge', '')} sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem' }} />
                  {BADGE_OPTIONS.map(b => (
                    <Chip key={b} label={b} size="small"
                      color={BADGE_COLORS[b] || 'default'}
                      variant={form.badge === b ? 'filled' : 'outlined'}
                      onClick={() => set('badge', b)}
                      sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', textTransform: 'capitalize' }} />
                  ))}
                </Box>
              </Box>
            </Stack>
          </SidebarCard>

          {/* Product Flags ──────────────────────────────────────────────── */}
          <SidebarCard title="Product Flags *" icon={NewReleasesIcon} accent="#f59e0b">
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25, display: 'block' }}>
              Each flag creates a dedicated collection page (e.g. <code>/collection/new-arrivals</code>).
              Products appear on that page automatically once flagged.
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {PRODUCT_FLAGS.map(flag => {
                const on = form.flags.includes(flag);
                const iconMap = {
                  'Today Deals':  <SellIcon style={{ fontSize: '0.75rem' }} />,
                  'Gifting':      <CardGiftcardIcon style={{ fontSize: '0.75rem' }} />,
                  'New Arrivals': <NewReleasesIcon style={{ fontSize: '0.75rem' }} />,
                  'Best Seller':  <StarIcon style={{ fontSize: '0.75rem' }} />,
                  'Trending':     <AutoAwesomeIcon style={{ fontSize: '0.75rem' }} />,
                };
                const col = FLAG_COLLECTIONS.find(c => c.flag === flag);
                return (
                  <Box key={flag} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip label={flag} size="small"
                      icon={on ? iconMap[flag] : undefined}
                      variant={on ? 'filled' : 'outlined'}
                      color={on ? 'warning' : 'default'}
                      onClick={() => set('flags', on ? form.flags.filter(f => f !== flag) : [...form.flags, flag])}
                      sx={{
                        cursor: 'pointer', fontWeight: on ? 700 : 400, fontSize: '0.72rem',
                        borderColor: on ? undefined : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'),
                      }} />
                    {col && (
                      <Tooltip title={`View /collection/${col.slug}`}>
                        <IconButton
                          size="small"
                          component="a"
                          href={`/collection/${col.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ p: 0.25, opacity: 0.55, '&:hover': { opacity: 1 } }}
                        >
                          <OpenInNewIcon style={{ fontSize: '0.8rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Box>
            {formErrors.flags && (
              <FormHelperText error sx={{ mt: 0.75 }}>{formErrors.flags}</FormHelperText>
            )}
          </SidebarCard>

          {/* Category ───────────────────────────────────────────────────── */}
          <SidebarCard title="Category" icon={CategoryIcon}>
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small" error={!!formErrors.category}>
                <InputLabel>Category *</InputLabel>
                <Select label="Category *" value={form.category} onChange={e => setCategory(e.target.value)}>
                  <MenuItem value=""><em>Select category</em></MenuItem>
                  {CATEGORY_LIST.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
                {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
              </FormControl>

              {subcategoryOpts.length > 0 ? (
                <FormControl fullWidth size="small">
                  <InputLabel>Subcategory</InputLabel>
                  <Select label="Subcategory" value={form.subcategory}
                    onChange={e => set('subcategory', e.target.value)}>
                    <MenuItem value=""><em>None</em></MenuItem>
                    {subcategoryOpts.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : (
                <TextField fullWidth size="small" label="Subcategory"
                  value={form.subcategory} onChange={e => set('subcategory', e.target.value)}
                  placeholder="e.g. Diamond Rings" />
              )}
            </Stack>
          </SidebarCard>

          {/* Brand ──────────────────────────────────────────────────────── */}
          <SidebarCard title="Brand" icon={DiamondIcon} accent="#967123">
            <FormControl fullWidth size="small" error={!!formErrors.brand}>
              <InputLabel>Brand *</InputLabel>
              <Select label="Brand *" value={form.brand} onChange={e => set('brand', e.target.value)}>
                <MenuItem value=""><em>Select brand</em></MenuItem>
                {brandsList.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </Select>
              {formErrors.brand && <FormHelperText>{formErrors.brand}</FormHelperText>}
            </FormControl>
          </SidebarCard>

          {/* Fulfillment ────────────────────────────────────────────────── */}
          <SidebarCard title="Fulfillment" icon={LocalShippingIcon} accent="#e5780b">
            <Stack spacing={1.5}>
              <TextField fullWidth size="small" label="Fulfilled By"
                value={form.fulfilledBy} onChange={e => set('fulfilledBy', e.target.value)}
                placeholder="e.g. Jawhara" helperText="Who ships this product" />
              <FormControl fullWidth size="small" error={!!formErrors.arrivesBy}>
                <InputLabel>Delivery Time *</InputLabel>
                <Select label="Delivery Time *" value={form.arrivesBy}
                  onChange={e => set('arrivesBy', e.target.value)}>
                  <MenuItem value=""><em>Select delivery time</em></MenuItem>
                  {DELIVERY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
                {formErrors.arrivesBy && <FormHelperText>{formErrors.arrivesBy}</FormHelperText>}
              </FormControl>
            </Stack>
          </SidebarCard>

        </Box>
        {/* ════ END RIGHT SIDEBAR ══════════════════════════════════════════ */}

      </Box>
    </Box>
  );
}
