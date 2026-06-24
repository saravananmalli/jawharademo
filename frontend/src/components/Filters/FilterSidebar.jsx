import { useState, useEffect, useMemo } from 'react';
import {
  FiChevronDown, FiChevronUp,
  FiPlus, FiMinus,
  FiCheck, FiSliders, FiX, FiSearch,
} from 'react-icons/fi';
import { DirhamSymbol } from 'dirham/react';
import api from '../../services/api';
import './FilterSidebar.scss';

// ── Exported constants (used by Category.jsx) ─────────────────────────────────

const D = <DirhamSymbol size="0.82em" weight="regular" />;

export const PRICE_RANGES = [
  { label: 'under-1000',   node: <>Under {D} 1,000</>,        min: 0,     max: 1000 },
  { label: '1000-2500',    node: <>{D} 1,000 – {D} 2,500</>,  min: 1000,  max: 2500 },
  { label: '2500-5000',    node: <>{D} 2,500 – {D} 5,000</>,  min: 2500,  max: 5000 },
  { label: '5000-10000',   node: <>{D} 5,000 – {D} 10,000</>, min: 5000,  max: 10000 },
  { label: 'above-10000',  node: <>Above {D} 10,000</>,        min: 10000, max: Infinity },
];

export const DEAL_OPTIONS = [
  { label: '20% off or more', value: 20 },
  { label: '25% off or more', value: 25 },
  { label: '30% off or more', value: 30 },
];

export const RATING_OPTIONS = [
  { label: '4 Stars & Above', value: 4 },
  { label: '3 Stars & Above', value: 3 },
  { label: '2 Stars & Above', value: 2 },
];

const ARRIVES_OPTIONS    = ['Delivered Next Day', 'Delivered in 1–3 Days', 'Delivered in 2–3 Days'];
const FULFILLED_OPTIONS  = ['Premium Seller'];

export const EMPTY_FILTERS = {
  fulfilledBy:   [],
  arrivesBy:     [],
  categories:    [],
  subcategories: [],
  metals:        [],
  stones:        [],
  brands:        [],
  priceRanges:   [],
  deals:         [],
  ratings:       [],
  featured:      [],
  styles:        [],
  priceDrop:     false,
  newArrivals:   false,
};

// ── Filter logic (exported for Category.jsx) ──────────────────────────────────

// Check if a product matches a metal filter value, supporting both
// the legacy string field and the new metals[] array field.
function productHasMetal(product, metalValue) {
  if (Array.isArray(product.metals) && product.metals.length > 0)
    return product.metals.includes(metalValue);
  return product.metal === metalValue;
}

// Same dual-field check for stones.
function productHasStone(product, stoneValue) {
  if (Array.isArray(product.stones) && product.stones.length > 0)
    return product.stones.includes(stoneValue);
  return product.stone === stoneValue;
}

// Normalize a category/subcategory string for flexible comparison:
// strips trailing 's' (plural→singular) and lowercases so that
// "Pendant" == "Pendants", "Necklace" == "Necklaces", etc.
function normCat(s) {
  return (s || '').toLowerCase().replace(/s$/, '');
}

export function applyFilters(products, filters) {
  return products.filter(p => {
    if (filters.fulfilledBy.length > 0 && !filters.fulfilledBy.includes(p.fulfilledBy))
      return false;

    if (filters.arrivesBy.length > 0 && !filters.arrivesBy.includes(p.arrivesBy))
      return false;

    if (filters.categories.length > 0) {
      const pCat = normCat(p.category);
      if (!filters.categories.some(c => normCat(c) === pCat)) return false;
    }
    if (filters.subcategories.length > 0) {
      const pSub = normCat(p.subcategory);
      if (!filters.subcategories.some(s => normCat(s) === pSub)) return false;
    }

    if (filters.metals.length > 0 && !filters.metals.some(m => productHasMetal(p, m)))
      return false;
    if (filters.stones.length > 0 && !filters.stones.some(s => productHasStone(p, s)))
      return false;

    if (filters.brands.length > 0 && !filters.brands.includes(p.brand))
      return false;

    if (filters.priceRanges.length > 0) {
      const ok = filters.priceRanges.some(label => {
        const r = PRICE_RANGES.find(pr => pr.label === label);
        const effectivePrice = p.salePrice ?? p.price;
        return r && effectivePrice >= r.min && effectivePrice < r.max;
      });
      if (!ok) return false;
    }

    if (filters.deals.length > 0) {
      const ok = filters.deals.some(min => (p.discount || 0) >= min);
      if (!ok) return false;
    }

    if (filters.priceDrop && (p.discount || 0) < 25) return false;

    if (filters.ratings.length > 0) {
      const ok = filters.ratings.some(min => (p.rating || 0) >= min);
      if (!ok) return false;
    }

    // Featured filter — matches any value in product.featured[]
    if (filters.featured && filters.featured.length > 0) {
      const pFeatured = Array.isArray(p.featured) ? p.featured : [];
      if (!filters.featured.some(f => pFeatured.includes(f))) return false;
    }

    // Styles filter — matches any value in product.styles[]
    if (filters.styles && filters.styles.length > 0) {
      const pStyles = Array.isArray(p.styles) ? p.styles : [];
      if (!filters.styles.some(s => pStyles.includes(s))) return false;
    }

    if (filters.newArrivals) {
      const cutoff = new Date('2026-05-21');
      cutoff.setDate(cutoff.getDate() - 60);
      if (new Date(p.createdAt) < cutoff) return false;
    }

    return true;
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildCategoryTree(products) {
  const map = {};
  products.forEach(p => {
    const cat = p.category || 'Other';
    if (!map[cat]) map[cat] = { count: 0, subs: {} };
    map[cat].count++;
    if (p.subcategory && p.subcategory !== cat) {
      map[cat].subs[p.subcategory] = (map[cat].subs[p.subcategory] || 0) + 1;
    }
  });
  return Object.entries(map).map(([name, { count, subs }]) => ({
    name,
    count,
    subcategories: Object.entries(subs)
      .map(([subName, subCount]) => ({ name: subName, count: subCount }))
      .sort((a, b) => b.count - a.count),
  }));
}

function buildFieldOptions(products, field) {
  const counts = {};
  products.forEach(p => {
    const val = p[field];
    // Support both string (legacy) and array (new) field format
    const values = Array.isArray(val) ? val : (val ? [val] : []);
    values.forEach(v => {
      if (v && v !== 'None' && v !== 'none') {
        counts[v] = (counts[v] || 0) + 1;
      }
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}

function countActive(f) {
  return (
    f.fulfilledBy.length +
    f.arrivesBy.length +
    f.categories.length +
    f.subcategories.length +
    f.metals.length +
    f.stones.length +
    f.brands.length +
    f.priceRanges.length +
    f.deals.length +
    f.ratings.length +
    (f.featured?.length || 0) +
    (f.styles?.length   || 0) +
    (f.priceDrop    ? 1 : 0) +
    (f.newArrivals  ? 1 : 0)
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, isOpen, onToggle, hasActive, onClear, children }) {
  return (
    <div className="fs-section">
      <button className="fs-section__hdr" onClick={onToggle}>
        <span className="fs-section__name">{title}</span>
        <span className="fs-section__right">
          {hasActive && (
            <span
              className="fs-section__clear"
              onClick={e => { e.stopPropagation(); onClear?.(); }}
            >
              Clear
            </span>
          )}
          <span className="fs-section__icon">
            {isOpen ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </span>
      </button>
      {isOpen && <div className="fs-section__body">{children}</div>}
    </div>
  );
}

function Checkbox({ label, checked, onChange, count }) {
  return (
    <label className={`fs-check${checked ? ' fs-check--on' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="fs-check__box">
        {checked && <FiCheck strokeWidth={3} />}
      </span>
      <span className="fs-check__label">{label}</span>
      {count != null && <span className="fs-check__count">({count})</span>}
    </label>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FilterSidebar({
  allProducts,
  filters,
  onFiltersChange,
  isMobileOpen,
  onClose,
}) {
  const [open, setOpen] = useState({
    fulfilledBy:  true,
    arrivesBy:    true,
    category:     true,
    metal:        true,
    stone:        false,
    brand:        false,
    price:        true,
    deals:        false,
    priceDrop:    false,
    rating:       false,
    newArrivals:  false,
  });
  const [expandedCats,  setExpandedCats]  = useState({});
  const [brandSearch,   setBrandSearch]   = useState('');
  const [apiBrands,     setApiBrands]     = useState([]);

  useEffect(() => {
    api.get('/brands?active=true')
      .then(({ data }) => setApiBrands((data.data || []).map(b => b.name)))
      .catch(() => {});
  }, []);

  // Dynamic options derived from the current base product set
  const categoryTree = useMemo(() => buildCategoryTree(allProducts), [allProducts]);
  // Use plural array field if present, fall back to legacy string field
  const metalOptions  = useMemo(
    () => buildFieldOptions(allProducts, allProducts.some(p => p.metals?.length) ? 'metals' : 'metal'),
    [allProducts],
  );
  const stoneOptions  = useMemo(
    () => buildFieldOptions(allProducts, allProducts.some(p => p.stones?.length) ? 'stones' : 'stone')
            .filter(o => !['None', 'none'].includes(o.value)),
    [allProducts],
  );
  const brandOptions = useMemo(() => {
    const counts = buildFieldOptions(allProducts, 'brand');
    const countMap = Object.fromEntries(counts.map(({ value, count }) => [value, count]));
    // Merge: API brands + any product brands not yet in the API list
    const allBrandNames = [...new Set([...apiBrands, ...counts.map(c => c.value)])];
    const withProducts    = allBrandNames.filter(b => countMap[b]).map(b => ({ value: b, count: countMap[b] }));
    const withoutProducts = allBrandNames.filter(b => !countMap[b]).map(b => ({ value: b, count: 0 }));
    return [...withProducts, ...withoutProducts];
  }, [allProducts, apiBrands]);
  const filteredBrands = useMemo(
    () => brandOptions.filter(({ value }) => value.toLowerCase().includes(brandSearch.toLowerCase())),
    [brandOptions, brandSearch],
  );

  const activeCount = useMemo(() => countActive(filters), [filters]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleOpen = key => setOpen(p => ({ ...p, [key]: !p[key] }));

  const toggleMulti = (key, value) => {
    const arr = filters[key];
    onFiltersChange({
      ...filters,
      [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
    });
  };

  const toggleBool = key => onFiltersChange({ ...filters, [key]: !filters[key] });

  const clearSection = partial => onFiltersChange({ ...filters, ...partial });

  const clearAll = () => {
    onFiltersChange(EMPTY_FILTERS);
    setExpandedCats({});
  };

  const isOn  = (key, val) => filters[key].includes(val);
  const hasCat = filters.categories.length > 0 || filters.subcategories.length > 0;

  // ── Sidebar markup ───────────────────────────────────────────────────────────

  const sidebar = (
    <div className="filter-sidebar">

      {/* Header */}
      <div className="filter-sidebar__head">
        <span className="filter-sidebar__heading">
          <FiSliders />
          Filters
          {activeCount > 0 && (
            <span className="filter-sidebar__badge">{activeCount}</span>
          )}
        </span>
        <div className="filter-sidebar__headbtns">
          {activeCount > 0 && (
            <button className="filter-sidebar__clrall" onClick={clearAll}>
              Clear all
            </button>
          )}
          <button className="filter-sidebar__closebtn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
      </div>


      {/* ─── Arrives By ───────────────────────────────────────── */}
      <Section
        title="Arrives By"
        isOpen={open.arrivesBy}
        onToggle={() => toggleOpen('arrivesBy')}
        hasActive={filters.arrivesBy.length > 0}
        onClear={() => clearSection({ arrivesBy: [] })}
      >
        {ARRIVES_OPTIONS.map(day => {
          const count = allProducts.filter(p => p.arrivesBy === day).length;
          return (
            <Checkbox
              key={day}
              label={day}
              count={count || undefined}
              checked={isOn('arrivesBy', day)}
              onChange={() => toggleMulti('arrivesBy', day)}
            />
          );
        })}
      </Section>

      {/* ─── Category ────────────────────────────────────────── */}
      <Section
        title="Category"
        isOpen={open.category}
        onToggle={() => toggleOpen('category')}
        hasActive={hasCat}
        onClear={() => clearSection({ categories: [], subcategories: [] })}
      >
        {categoryTree.map(cat => (
          <div key={cat.name} className="fs-cat">
            <div className="fs-cat__row">
              <Checkbox
                label={cat.name}
                count={cat.count}
                checked={isOn('categories', cat.name)}
                onChange={() => toggleMulti('categories', cat.name)}
              />
              {cat.subcategories.length > 0 && (
                <button
                  className="fs-cat__toggle"
                  onClick={() => setExpandedCats(p => ({ ...p, [cat.name]: !p[cat.name] }))}
                  aria-label={expandedCats[cat.name] ? 'Collapse' : 'Expand'}
                >
                  {expandedCats[cat.name] ? <FiMinus /> : <FiPlus />}
                </button>
              )}
            </div>

            {expandedCats[cat.name] && cat.subcategories.length > 0 && (
              <div className="fs-cat__subs">
                {cat.subcategories.map(sub => (
                  <Checkbox
                    key={sub.name}
                    label={sub.name}
                    count={sub.count}
                    checked={isOn('subcategories', sub.name)}
                    onChange={() => toggleMulti('subcategories', sub.name)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* ─── Metal ───────────────────────────────────────────── */}
      {metalOptions.length > 0 && (
        <Section
          title="Metal"
          isOpen={open.metal}
          onToggle={() => toggleOpen('metal')}
          hasActive={filters.metals.length > 0}
          onClear={() => clearSection({ metals: [] })}
        >
          {metalOptions.map(({ value, count }) => (
            <Checkbox
              key={value}
              label={value}
              count={count}
              checked={isOn('metals', value)}
              onChange={() => toggleMulti('metals', value)}
            />
          ))}
        </Section>
      )}

      {/* ─── Stone ───────────────────────────────────────────── */}
      {stoneOptions.length > 0 && (
        <Section
          title="Stone"
          isOpen={open.stone}
          onToggle={() => toggleOpen('stone')}
          hasActive={filters.stones.length > 0}
          onClear={() => clearSection({ stones: [] })}
        >
          {stoneOptions.map(({ value, count }) => (
            <Checkbox
              key={value}
              label={value}
              count={count}
              checked={isOn('stones', value)}
              onChange={() => toggleMulti('stones', value)}
            />
          ))}
        </Section>
      )}

      {/* ─── Brand ───────────────────────────────────────────── */}
      <Section
        title="Brand / Collection"
        isOpen={open.brand}
        onToggle={() => toggleOpen('brand')}
        hasActive={filters.brands.length > 0}
        onClear={() => clearSection({ brands: [] })}
      >
        <div className="fs-brand-search">
          <FiSearch className="fs-brand-search__icon" />
          <input
            type="text"
            placeholder="Search brand…"
            value={brandSearch}
            onChange={e => setBrandSearch(e.target.value)}
            className="fs-brand-search__input"
          />
          {brandSearch && (
            <button className="fs-brand-search__clear" onClick={() => setBrandSearch('')} aria-label="Clear">
              <FiX />
            </button>
          )}
        </div>
        <div className="fs-brand-list">
          {filteredBrands.map(({ value, count }) => (
            <Checkbox
              key={value}
              label={value}
              count={count > 0 ? count : undefined}
              checked={isOn('brands', value)}
              onChange={() => toggleMulti('brands', value)}
            />
          ))}
          {filteredBrands.length === 0 && (
            <p className="fs-brand-empty">No brands match "{brandSearch}"</p>
          )}
        </div>
      </Section>

      {/* ─── Price ───────────────────────────────────────────── */}
      <Section
        title="Price"
        isOpen={open.price}
        onToggle={() => toggleOpen('price')}
        hasActive={filters.priceRanges.length > 0}
        onClear={() => clearSection({ priceRanges: [] })}
      >
        {PRICE_RANGES.map(r => (
          <Checkbox
            key={r.label}
            label={r.node}
            checked={isOn('priceRanges', r.label)}
            onChange={() => toggleMulti('priceRanges', r.label)}
          />
        ))}
      </Section>

      {/* ─── Deals ───────────────────────────────────────────── */}
      <Section
        title="Deals"
        isOpen={open.deals}
        onToggle={() => toggleOpen('deals')}
        hasActive={filters.deals.length > 0}
        onClear={() => clearSection({ deals: [] })}
      >
        {DEAL_OPTIONS.map(({ label, value }) => (
          <Checkbox
            key={label}
            label={label}
            checked={isOn('deals', value)}
            onChange={() => toggleMulti('deals', value)}
          />
        ))}
      </Section>

      {/* ─── Price Drop ──────────────────────────────────────── */}
      <Section
        title="Price Drop"
        isOpen={open.priceDrop}
        onToggle={() => toggleOpen('priceDrop')}
        hasActive={filters.priceDrop}
        onClear={() => clearSection({ priceDrop: false })}
      >
        <Checkbox
          label="25% or more off"
          checked={filters.priceDrop}
          onChange={() => toggleBool('priceDrop')}
        />
      </Section>

      {/* ─── Product Rating ──────────────────────────────────── */}
      <Section
        title="Product Rating"
        isOpen={open.rating}
        onToggle={() => toggleOpen('rating')}
        hasActive={filters.ratings.length > 0}
        onClear={() => clearSection({ ratings: [] })}
      >
        {RATING_OPTIONS.map(({ label, value }) => (
          <Checkbox
            key={label}
            label={label}
            checked={isOn('ratings', value)}
            onChange={() => toggleMulti('ratings', value)}
          />
        ))}
      </Section>

      {/* ─── New Arrivals ─────────────────────────────────────── */}
      <Section
        title="New Arrivals"
        isOpen={open.newArrivals}
        onToggle={() => toggleOpen('newArrivals')}
        hasActive={filters.newArrivals}
        onClear={() => clearSection({ newArrivals: false })}
      >
        <Checkbox
          label="Last 60 days"
          checked={filters.newArrivals}
          onChange={() => toggleBool('newArrivals')}
        />
      </Section>

      {/* Mobile sticky footer */}
      {activeCount > 0 && (
        <div className="filter-sidebar__footer">
          <button className="filter-sidebar__apply" onClick={onClose}>
            View Results
          </button>
          <button className="filter-sidebar__reset" onClick={clearAll}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="fsw-desktop">{sidebar}</div>

      {/* Mobile: slide-in drawer */}
      <div className={`fsw-mobile${isMobileOpen ? ' fsw-mobile--open' : ''}`}>
        <div className="fsw-mobile__overlay" onClick={onClose} />
        <div className="fsw-mobile__drawer">{sidebar}</div>
      </div>
    </>
  );
}
