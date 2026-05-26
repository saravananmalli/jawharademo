/**
 * Shared filter option constants used by:
 *  - Admin ProductForm (chip selectors + dynamic category logic)
 *  - FilterSidebar (frontend filter panel)
 *  - Category.jsx (URL ?filter= param matching)
 *  - CategoryMenu.jsx (mega-nav column values)
 */

export const METAL_OPTIONS = [
  'Gold', 'White Gold', 'Rose Gold', 'Yellow Gold',
  'Silver', 'Platinum', 'Two-Tone',
];

export const KARAT_OPTIONS = ['14K', '18K', '21K', '22K', '24K', '925'];

export const STONE_OPTIONS = [
  'Diamond', 'Pearl', 'Ruby', 'Emerald', 'Sapphire',
  'Amethyst', 'Mixed Gemstones', 'Cubic Zirconia', 'Topaz', 'Opal',
];

// Price buckets — slug → label → range — used in admin + auto price-range logic
export const PRICE_BUCKET_MAP = [
  { slug: 'under-1k',  label: 'Under ⃃ 1,000',    min: 0,     max: 1000 },
  { slug: '1k-2.5k',   label: '⃃ 1,000 – 2,500',  min: 1000,  max: 2500 },
  { slug: '2.5k-5k',   label: '⃃ 2,500 – 5,000',  min: 2500,  max: 5000 },
  { slug: '5k-10k',    label: '⃃ 5,000 – 10,000', min: 5000,  max: 10000 },
  { slug: '10k+',      label: 'Above ⃃ 10,000',        min: 10000, max: Infinity },
];

// ── Per-category filter maps ──────────────────────────────────────────────────
// These mirror CategoryMenu.jsx NAV_CATEGORIES *exactly* so admin selections
// stay in sync with what the mega-nav shows.
export const CATEGORY_FILTER_MAP = {
  Rings: {
    featured:   ['Solitaire Rings', 'Halo Rings', 'Eternity Bands', 'Statement Rings', 'Stackable Rings'],
    styles:     ['Classic', 'Modern', 'Vintage', 'Minimalist', 'Cocktail', 'Bohemian'],
    metalStone: ['Diamond', 'Gold 18K', 'Gold 22K', 'White Gold', 'Rose Gold', 'Emerald', 'Ruby', 'Sapphire'],
  },
  Earrings: {
    featured:   ['Diamond Studs', 'Gold Hoops', 'Drop Earrings', 'Chandelier', 'Jhumkas'],
    styles:     ['Stud', 'Hoop', 'Drop', 'Chandelier', 'Jhumka', 'Cluster', 'Threader'],
    metalStone: ['Diamond', 'Gold', 'White Gold', 'Ruby', 'Emerald', 'Sapphire', 'Pearl'],
  },
  Necklaces: {
    featured:   ['Diamond Pendants', 'Gold Chains', 'Pearl Necklaces', 'Layered Sets', 'Chokers'],
    styles:     ['Classic', 'Layered', 'Choker', 'Long Chain', 'Statement', 'Minimal'],
    metalStone: ['Diamond', 'Gold 18K', 'White Gold', 'Rose Gold', 'Pearl', 'Emerald'],
  },
  Bracelets: {
    featured:   ['Tennis Bracelets', 'Gold Bangles', 'Diamond Bangles', 'Charm Bracelets'],
    styles:     ['Tennis', 'Bangle', 'Charm', 'Cuff', 'Chain', 'Beaded', 'Stackable'],
    metalStone: ['Diamond', 'Gold 18K', 'Gold 22K', 'White Gold', 'Rose Gold', 'Silver'],
  },
  Pendants: {
    featured:   ['Diamond Pendants', 'Gold Pendants', 'Pearl Pendants'],
    styles:     ['Classic', 'Statement', 'Minimal', 'Layered'],
    metalStone: ['Diamond', 'Gold 18K', 'White Gold', 'Rose Gold', 'Pearl'],
  },
  Sets: {
    featured:   ['Bridal Sets', 'Gift Sets', 'Matching Sets'],
    styles:     ['Classic', 'Modern', 'Traditional', 'Bridal'],
    metalStone: ['Diamond', 'Gold 18K', 'Gold 22K', 'White Gold', 'Rose Gold'],
  },
};

// Subcategory options per category (mirrors existing product data)
export const SUBCATEGORY_MAP = {
  Rings:     ['Rings diamond', 'Rings gold', 'Rings silver', 'Rings gemstone', 'Rings rose gold', 'Rings solitaire'],
  Earrings:  ['Earrings diamond', 'Earrings pearl', 'Earrings gold', 'Earrings gemstone', 'Earrings traditional'],
  Necklaces: ['Necklaces diamond', 'Necklaces gold', 'Necklaces gemstone', 'Necklaces pearl', 'Necklaces silver'],
  Bracelets: ['Bracelets gold', 'Bracelets silver', 'Bracelets diamond', 'Bracelets gemstone'],
  Pendants:  ['Pendants diamond', 'Pendants gold', 'Pendants pearl'],
  Sets:      ['Sets bridal', 'Sets gift', 'Sets matching'],
};

// Product flags — each flag maps to a dedicated /collection/:slug frontend page
export const PRODUCT_FLAGS = ['Today Deals', 'Gifting', 'New Arrivals', 'Best Seller', 'Trending'];

// Authoritative flag → slug → label mapping used by CollectionPage, ProductForm, and nav menus
export const FLAG_COLLECTIONS = [
  { flag: 'Today Deals',  slug: 'today-deals',  label: "Today's Deals"  },
  { flag: 'Gifting',      slug: 'gifting',       label: 'Gifting'        },
  { flag: 'New Arrivals', slug: 'new-arrivals',  label: 'New Arrivals'   },
  { flag: 'Best Seller',  slug: 'best-seller',   label: 'Best Sellers'   },
  { flag: 'Trending',     slug: 'trending',      label: 'Trending'       },
];

// Lookup helpers
export const flagToSlug  = (flag)  => FLAG_COLLECTIONS.find(c => c.flag  === flag)?.slug;
export const slugToFlag  = (slug)  => FLAG_COLLECTIONS.find(c => c.slug  === slug)?.flag;
export const slugToLabel = (slug)  => FLAG_COLLECTIONS.find(c => c.slug  === slug)?.label;

export const FORWHO_OPTIONS  = ['Women', 'Men', 'Kids', 'Couples', 'Unisex'];
export const BADGE_OPTIONS   = ['Best Seller', 'new', 'sale'];
export const BADGE_COLORS    = { 'Best Seller': 'warning', new: 'info', sale: 'error' };
export const CATEGORY_LIST   = ['Rings', 'Earrings', 'Necklaces', 'Bracelets', 'Pendants', 'Sets'];

// "By Metal & Stone" nav labels — used in matchesFilter URL matching
export const METAL_STONE_NAV = [
  'Diamond', 'Gold 18K', 'Gold 22K', 'White Gold', 'Rose Gold', 'Gold',
  'Emerald', 'Ruby', 'Sapphire', 'Pearl', 'Silver',
];
