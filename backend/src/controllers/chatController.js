const Anthropic = require('@anthropic-ai/sdk');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { fetchGoldPrices } = require('./goldPriceController');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Intent detection ──────────────────────────────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase();
  if (/where.*order|track.*order|order.*status|order.*update|order.*number|tracking|shipment.*status|delivery.*status/i.test(msg))
    return 'order_tracking';
  if (/what.*bought|i.*bought|purchase.*history|my.*orders?|past.*order|previous.*order|last.*order|order.*list|order.*histor/i.test(msg))
    return 'order_history';
  if (/\breturn\b|refund|exchange|send.*back|return.*policy|can.*i.*return/i.test(msg))
    return 'return_request';
  if (/\bcart\b|checkout|complete.*purchase|items.*waiting|my.*bag/i.test(msg))
    return 'cart';
  if (/wishlist|saved.*item|favourite|wishlisted/i.test(msg))
    return 'wishlist';
  if (/\baddress\b|payment.*method|my.*account|profile.*update|loyalty.*point|saved.*card|invoice/i.test(msg))
    return 'account';
  if (/deliver|shipping.*time|same.?day|when.*arrive|how long.*ship|estimated.*arrival|international.*ship|ship.*international|do.*you.*ship|ship.*abroad|deliver.*abroad|outside.*uae|ship.*to\b/i.test(msg))
    return 'delivery';
  if (/gold.*price|price.*gold|today.*gold|gold.*today|gold.*rate|rate.*gold/i.test(msg))
    return 'gold_price';
  if (
    /installment|instalment|payment.?plan|emi\b|pay.?(?:later|monthly)|financ.*(?:plan|option)|no.?interest|split.?pay/i.test(msg) ||
    /\bcertif(?:y|ied|icate|ication)\b|gia\b|igi\b|appraisal|authenticity/i.test(msg) ||
    /custom(?:ize|ise|ization|isation)|bespoke|engrav(?:e|ing)|personali[sz]e?|monogram|made.?to.?order/i.test(msg) ||
    /\bwarranty\b|\bguarantee\b|after.?(?:sale|service|care)|care.?plan|jewel.*(?:repair|resize|service)|ring.*resize|resize.*ring/i.test(msg) ||
    /gift.?(?:wrap|box|packag|card)/i.test(msg) ||
    /\bpolic(?:y|ies)\b/i.test(msg) ||
    /(?:speak|talk|chat|connect|message).*(?:someone|agent|human|person|representative|consultant|team|you\b)|(?:contact|reach).*(?:team|consultant|specialist|someone|us\b|you\b)/i.test(msg)
  ) return 'customer_service';
  return 'shopping';
}

// ── Order number formatter ────────────────────────────────────────────────────
function fmtOrderNo(id) {
  return '#JW' + id.toString().slice(-6).toUpperCase();
}

// ── Status display map ────────────────────────────────────────────────────────
const STATUS = {
  pending:    { label: 'Order Placed',     emoji: '📋' },
  processing: { label: 'Processing',       emoji: '⚙️'  },
  shipped:    { label: 'Out for Delivery', emoji: '🚚' },
  delivered:  { label: 'Delivered',        emoji: '✅' },
  cancelled:  { label: 'Cancelled',        emoji: '❌' },
};

// ── Build user context string for system prompt ───────────────────────────────
function buildUserContext(user, orders, cartItems, wishlistItems) {
  if (!user) return '';

  let ctx = `\n\nCUSTOMER ACCOUNT:\n• Name: ${user.name}\n• Email: ${user.email}\n`;

  if (orders?.length) {
    ctx += `\nORDER HISTORY (${orders.length} total):\n`;
    orders.slice(0, 5).forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
      const itemList = o.items.map(i => i.name).join(', ');
      const payInfo = o.paymentStatus ? ` | Payment: ${o.paymentStatus.toUpperCase()}` : '';
      ctx += `• ${fmtOrderNo(o._id)}: ${itemList} | ${o.status.toUpperCase()}${payInfo} | ${o.totalAmount} AED | ${date}\n`;
    });
  } else {
    ctx += '\nNo orders placed yet.\n';
  }

  if (cartItems?.length) {
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    ctx += `\nSHOPPING CART (${cartItems.length} items, total ${total.toLocaleString()} AED):\n`;
    cartItems.forEach(i => ctx += `• ${i.name} × ${i.quantity} — ${(i.price * i.quantity).toLocaleString()} AED\n`);
  }

  if (wishlistItems?.length) {
    ctx += `\nWISHLIST (${wishlistItems.length} saved items):\n`;
    wishlistItems.forEach(i => ctx += `• ${i.name} — ${i.price} AED${i.discount ? ` [${i.discount}% OFF NOW]` : ''}\n`);
  }

  return ctx;
}

// ── Build delivery zone context from live settings ────────────────────────────
function buildDeliveryContext(deliveryConfig) {
  if (!deliveryConfig) return '';

  const { enableInternationalDelivery, supportedCountryNames = [], supportedCountryCodes = [] } = deliveryConfig;

  const countryList = supportedCountryNames.length
    ? supportedCountryNames.join(', ')
    : 'UAE';

  let ctx = '\n\nDELIVERY ZONES (live from store settings — use ONLY this data for shipping questions):\n';

  if (enableInternationalDelivery) {
    ctx += '• International delivery is ENABLED — Jawhara ships worldwide to all countries.\n';
  } else {
    ctx += `• Jawhara currently delivers to: ${countryList}.\n`;
    if (supportedCountryCodes.length > 1) {
      ctx += `• Country codes: ${supportedCountryCodes.join(', ')}.\n`;
    }
    ctx += '• Delivery outside these countries is NOT currently available.\n';
  }

  ctx += '\nSTRICT RULE: Answer every shipping / delivery zone question using ONLY the above information. '
       + 'Never mention a country not listed. If the customer asks about a country not on the list, '
       + 'tell them honestly it is not currently supported and invite them to contact our team for updates.';

  return ctx;
}

// ── Build order card data for frontend rendering ──────────────────────────────
function buildOrderCards(orders, limit) {
  return orders.slice(0, limit).map(o => ({
    id: o._id,
    orderNumber: fmtOrderNo(o._id),
    status: o.status,
    statusDisplay: STATUS[o.status] || STATUS.pending,
    items: o.items.map(i => ({ name: i.name, image: i.image, quantity: i.quantity })),
    totalAmount: o.totalAmount,
    createdAt: o.createdAt,
    paymentStatus: o.paymentStatus,
  }));
}

// ── Support intents set (used to lock mode) ───────────────────────────────────
const SUPPORT_INTENTS = new Set(['order_tracking', 'order_history', 'return_request', 'delivery', 'account', 'customer_service']);

function resolveMode(intent, sessionMode) {
  if (SUPPORT_INTENTS.has(intent)) return 'support';
  if (intent === 'shopping') return 'shopping';
  // cart / wishlist / ambiguous follow-ups: inherit previous mode
  return sessionMode || 'shopping';
}

// ── Quick replies — no emojis, strictly contextual ────────────────────────────
const QUICK_REPLY_MAP = {
  // Support chips
  order_tracking: ['Track Order',       'Recent Orders',  'Delivery Status',  'Contact Support'],
  order_history:  ['View Orders',       'Return Item',    'Download Invoice',  'Shop Again'],
  return_request: ['Initiate Return',   'Refund Status',  'Exchange Item',     'Contact Support'],
  delivery:       ['Track Package',     'Change Address', 'Delivery Support',  'Contact Support'],
  account:        ['My Orders',         'Update Address', 'Payment Methods',   'Contact Support'],
  customer_service: ['Chat on WhatsApp', 'Installment Plans', 'Customization',   'Warranty & Care'],
  cart:           ['Go to Cart',        'Checkout Now',   'Continue Shopping', 'Save for Later'],
  wishlist:       ['My Wishlist',       'Shop Now',       'Price Drop Alerts', 'Add to Cart'],
  // Shopping chips
  ring:           ['Diamond Ring',      'Gold Ring',      'Engagement Ring',   'Daily Wear'],
  necklace:       ['Diamond Necklace',  'Gold Chain',     'Pendant',           'Luxury Set'],
  bracelet:       ['Gold Bracelet',     'Diamond Bracelet','Bridal Bangle',    'Gift Set'],
  earring:        ['Diamond Earrings',  'Gold Hoops',     'Pearl Earrings',    'Bridal Earrings'],
  bridal:         ['Engagement Ring',   'Wedding Band',   'Diamond Set',       'Bridal Collection'],
  gift:           ['For Her',           'For Him',        'Under 500 AED',     'Luxury Gift'],
  budget:         ['Under 500 AED',     '500-1000 AED',   '1000-3000 AED',     'Premium 3000+'],
  default:        ['Rings',             'Necklaces',      'Bridal Collection', 'Gift Finder', 'Best Sellers'],
};

function getQuickReplies(userMessage, aiReply, intent, sessionMode) {
  const mode = resolveMode(intent, sessionMode);

  // In support mode: always return support-specific chips, never shopping chips
  if (mode === 'support') return QUICK_REPLY_MAP[intent] || QUICK_REPLY_MAP.order_tracking;

  // Cart / wishlist have their own chip sets
  if (intent === 'cart' || intent === 'wishlist') return QUICK_REPLY_MAP[intent];

  // Shopping mode: base chip selection ONLY on what the user asked — never polluted
  // by product names or upsell mentions that appear in the AI reply.
  const u = userMessage.toLowerCase();
  if (/bridal|bride|wedding/.test(u))           return QUICK_REPLY_MAP.bridal;
  if (/earring/.test(u))                        return QUICK_REPLY_MAP.earring;
  if (/bracelet|bangle/.test(u))                return QUICK_REPLY_MAP.bracelet;
  if (/necklace|pendant|chain/.test(u))         return QUICK_REPLY_MAP.necklace;
  if (/ring/.test(u))                           return QUICK_REPLY_MAP.ring;
  if (/gift|birthday|anniversary|eid/.test(u))  return QUICK_REPLY_MAP.gift;
  if (/budget|price|under|aed/.test(u))         return QUICK_REPLY_MAP.budget;
  return QUICK_REPLY_MAP.default;
}

// ── Extract budget range from natural-language text ──────────────────────────
// Returns { min, max } where either can be null.
// Handles ranges: "1000-3000", "500 to 1000", "between 500 and 1000"
// Handles floors: "premium 3000+", "above 3000", "over 3000", "3000+"
// Handles ceilings: "under AED 1500", "budget AED 1000", "AED 1,500 max", etc.
function extractBudgetRange(t) {
  let m;

  // Range: "1000-3000", "1000–3000", "500 to 1000", "between 500 and 1000", "from 500 to 1000"
  m = t.match(/(?:between\s+|from\s+)?(?:aed\s*)?(\d[\d,]*)\s*(?:-|–|to|and)\s*(?:aed\s*)?(\d[\d,]+)/);
  if (m) {
    const a = parseInt(m[1].replace(/,/g, ''));
    const b = parseInt(m[2].replace(/,/g, ''));
    if (a !== b) return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  // Floor / premium: "premium 3000+", "above 3000", "over 3000", "3000+"
  m = t.match(/(?:premium|above|over|more than)\s*(?:aed\s*)?(\d[\d,]*)|(?:aed\s*)?(\d[\d,]+)\s*\+/);
  if (m) return { min: parseInt((m[1] || m[2]).replace(/,/g, '')), max: null };

  // Ceiling: "budget [only|is|of|just|around]? [AED] 1000"
  m = t.match(/budget\s+(?:only\s+|is\s+|of\s+|just\s+|around\s+)?(?:aed\s*)?(\d[\d,]*)/);
  if (m) return { min: null, max: parseInt(m[1].replace(/,/g, '')) };

  // Ceiling: "under / below / less than / max / within / upto / up to / around / just / only / approx [AED] 1000"
  m = t.match(/(?:under|below|less than|max|within|upto|up to|around|about|just|only|approx(?:imately)?)\s*(?:aed\s*)?(\d[\d,]*)/);
  if (m) return { min: null, max: parseInt(m[1].replace(/,/g, '')) };

  // Ceiling: "[AED] 1000 budget / max / or less / and below"
  m = t.match(/(?:aed\s*)?(\d[\d,]+)\s*(?:aed\s*)?(?:budget|max|or less|and below)/);
  if (m) return { min: null, max: parseInt(m[1].replace(/,/g, '')) };

  // Ceiling: "with/for/have/got/spend/spending [AED] 300" — common purchase-intent phrasing
  // e.g. "What can I buy with AED 300?", "I have 300 AED", "for AED 500"
  // \b after the number prevents "have 18K" from matching as budget=18
  m = t.match(/\b(?:with|for|have|got|spend(?:ing)?)\s+(?:aed\s*)?(\d[\d,]+)\b/);
  if (m) return { min: null, max: parseInt(m[1].replace(/,/g, '')) };

  // Ceiling: "300 AED" — number-first currency format
  // e.g. "I can spend 300 AED", "gifts for 500 AED"
  m = t.match(/\b(\d[\d,]+)\s+aed\b/);
  if (m) return { min: null, max: parseInt(m[1].replace(/,/g, '')) };

  return null;
}

// ── Parse structured shopping intent from a user message ─────────────────────
function parseShoppingIntent(message) {
  const t = message.toLowerCase();

  // Longer/more-specific keywords must come BEFORE shorter ones that they contain.
  // 'earring' must precede 'ring' because "earring".includes('ring') is true.
  const typeKeywords = ['earring', 'necklace', 'bracelet', 'pendant', 'bangle', 'anklet', 'chain', 'ring'];
  const primaryCategory = typeKeywords.find(k => t.includes(k)) || null;

  const budgetRange = extractBudgetRange(t);
  const budgetMin = budgetRange?.min ?? null;
  const budgetMax = budgetRange?.max ?? null;

  const metalMatch = t.match(/\b(gold|silver|platinum|rose gold|white gold|yellow gold)\b/);
  const metal = metalMatch ? metalMatch[1] : null;

  // Extract karat specification: 18K, 21K, 22K, 14K, 24K, 9K, 10K, 12K
  const karatMatch = t.match(/\b(18|21|22|14|24|9|10|12)\s*k(?:t|arat)?\b/);
  const metalKt = karatMatch ? karatMatch[1] + 'K' : null;

  // Stone / gemstone detection — ordered longest-first to avoid partial matches
  const stoneKeywords = [
    'cubic zirconia', 'mixed gemstone', 'aquamarine', 'alexandrite',
    'amethyst', 'sapphire', 'turquoise', 'tanzanite', 'garnet',
    'emerald', 'diamond', 'swarovski', 'topaz', 'coral', 'pearl',
    'opal', 'jade', 'ruby', 'cz',
  ];
  const stone = stoneKeywords.find(s => t.includes(s)) || null;

  const occasionKeywords = ['engagement', 'bridal', 'wedding', 'anniversary', 'birthday', 'eid', 'valentine', 'graduation'];
  const occasion = occasionKeywords.find(o => t.includes(o)) || null;

  // Audience — kids must be checked BEFORE female/male to avoid "girl"/"boy" ambiguity
  const audience = /\bkid(s)?\b|\bchildren\b|\bchild\b|\bbaby\b|\bbabies\b|\btoddler\b/.test(t) ? 'kids'
    : /\b(?:wife|girlfriend|fiancee|fiancée|her|woman|women|female|sister|mother|mom|girl)/.test(t) ? 'female'
    : /\b(?:husband|boyfriend|fiance|him|man|men|male|brother|father|dad)/.test(t) ? 'male'
    : null;

  // Occasion → implied category ONLY when no explicit type was stated
  const occasionCategoryMap = {
    engagement:  'ring',
    bridal:      'ring',
    wedding:     'ring',
    anniversary: 'ring',
    valentine:   'ring',
    birthday:    null,
    eid:         null,
    graduation:  null,
  };
  const impliedCategory = !primaryCategory && occasion ? occasionCategoryMap[occasion] ?? null : null;

  // Size: "size 7", "ring size 7", "size 7.5", "US size 7", "UK size N"
  // \b at the end prevents matching mid-word letters (e.g. "size available" ≠ size "a")
  const sizeMatch =
    t.match(/\b(?:(?:ring|bracelet|necklace|bangle|earring|wrist|finger)\s+)?size\s+([0-9]+(?:[./][0-9]+)?|[a-z]\b)/i) ??
    t.match(/\b(?:us|uk|eu|european|intl?)\s+(?:size\s+)?([0-9]+(?:[./][0-9]+)?|[a-z]\b)/i);
  const requestedSize = sizeMatch ? sizeMatch[1].toUpperCase() : null;

  return { primaryCategory, impliedCategory, budgetMin, budgetMax, metal, metalKt, stone, occasion, audience, requestedSize };
}

// ── Fisher-Yates shuffle ──────────────────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Deduplicate product array by _id ─────────────────────────────────────────
function dedupe(arr) {
  const seen = new Set();
  return arr.filter(p => {
    const id = p._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// ── Collection keyword → DB regex map ────────────────────────────────────────
// Longer / more-specific patterns must come before shorter overlapping ones.
const COLLECTION_MAP = [
  { pattern: /mother'?s?\s*day|for\s+(?:my\s+)?mom|gift.*\bmother\b|\bmother\b.*gift/i, regex: "mother.?s.?day|mother", label: "Mother's Day Collection" },
  { pattern: /new\s+arriv/i,           regex: 'new.?arriv',    label: 'New Arrivals' },
  { pattern: /best\s+sell/i,           regex: 'best.?sell',    label: 'Best Sellers' },
  { pattern: /\bvalentine/i,           regex: 'valentine',     label: "Valentine's Day Collection" },
  { pattern: /\bbridal?\b|\bbride\b/i, regex: 'bridal|bride',  label: 'Bridal Collection' },
  { pattern: /\bwedding\b/i,           regex: 'wedding|bridal',label: 'Wedding Collection' },
  { pattern: /\banniversary\b/i,       regex: 'anniversary',   label: 'Anniversary Collection' },
  { pattern: /\bkids?\b|\bchildren\b|\bchild\b|\bbaby\b/i, regex: 'kid|children|child|baby', label: "Kids' Collection" },
  { pattern: /\bmen'?s?\b.*(?:jewel|gold|ring|bracelet|necklace|collection)|for\s+(?:men|him)\b/i, regex: "men.?s?", label: "Men's Collection" },
  { pattern: /\bsale\b/i,              regex: 'sale',          label: 'Sale Collection' },
  { pattern: /\beid\b/i,               regex: 'eid',           label: 'Eid Collection' },
  { pattern: /\bramadan\b/i,           regex: 'ramadan',       label: 'Ramadan Collection' },
  { pattern: /\bchristmas\b/i,         regex: 'christmas',     label: 'Christmas Collection' },
  { pattern: /\bgraduation\b/i,        regex: 'graduation',    label: 'Graduation Collection' },
  { pattern: /\bengagement\b/i,        regex: 'engagement',    label: 'Engagement Collection' },
  { pattern: /\bfestive\b/i,           regex: 'festive',       label: 'Festive Collection' },
];

function detectCollectionIntent(message) {
  for (const entry of COLLECTION_MAP) {
    if (entry.pattern.test(message)) return { regex: entry.regex, label: entry.label };
  }
  return null;
}

// Merge collection-priority results with regular results, keeping collection products first.
function mergeWithCollection(regular, collectionProds, colName, limit) {
  if (!collectionProds.length) return { products: regular.slice(0, limit), collectionName: null };
  const merged = dedupe([...collectionProds, ...regular]);
  return { products: merged.slice(0, limit), collectionName: colName };
}

// ── Smart product search (skipped for account/order intents) ──────────────────
async function findProducts(userMessage, intent, sessionContext) {
  const skipIntents = ['order_tracking', 'order_history', 'return_request', 'cart', 'wishlist', 'account'];
  if (skipIntents.includes(intent)) return { products: [], collectionName: null };

  const { primaryCategory, impliedCategory, budgetMin, budgetMax, metal, metalKt, stone, occasion, audience, requestedSize } = parseShoppingIntent(userMessage);

  // Detect collection intent early so it can influence effectiveCategory and hasShoppingSignal.
  const collectionMatch = detectCollectionIntent(userMessage);

  // When a named collection is detected, don't force the occasion-implied category (e.g. valentine→ring)
  // because the collection may contain varied jewelry types. An explicit primaryCategory still wins.
  const effectiveCategory = collectionMatch ? primaryCategory : (primaryCategory || impliedCategory);

  const effectiveBudgetMin = budgetMin ?? sessionContext?.budgetMin ?? null;
  const effectiveBudgetMax = budgetMax ?? sessionContext?.budgetMax ?? sessionContext?.budget ?? null;
  const hasBudget = effectiveBudgetMin !== null || effectiveBudgetMax !== null;

  const msg = userMessage.toLowerCase();
  const hasShoppingSignal =
    hasBudget || metal || metalKt || stone || effectiveCategory || audience || requestedSize ||
    !!collectionMatch ||  // collection keywords always trigger a product search
    /ring|necklace|bracelet|earring|pendant|gold|silver|diamond|pearl|emerald|ruby|sapphire|amethyst|jewelry|jewel|jewellery|gift|buy|purchase|show|find|looking|want|need|for her|for him|recommend|suggest|kids|children/i.test(msg);

  if (!hasShoppingSignal) return { products: [], collectionName: null };

  const POOL   = 24;
  const RESULT = 6;
  const productFields = 'name price originalPrice discount images _id category subcategory metal metalKt stone stones rating reviewCount badge arrivesBy createdAt sizes inStock';

  // ── Collection-priority search ────────────────────────────────────────────
  // Searches collection, subcategory, tags, flags, featured, and badge so products
  // are found regardless of which field the admin used to organise the collection.
  let collectionProducts = [];
  let collectionName = null;
  if (collectionMatch) {
    const colSort = hasBudget ? { price: 1 } : { rating: -1, reviewCount: -1 };
    const colConds = [
      { isActive: { $ne: false } },
      {
        $or: [
          { collection:  { $regex: collectionMatch.regex, $options: 'i' } },
          { subcategory: { $regex: collectionMatch.regex, $options: 'i' } },
          { tags:        { $elemMatch: { $regex: collectionMatch.regex, $options: 'i' } } },
          { flags:       { $elemMatch: { $regex: collectionMatch.regex, $options: 'i' } } },
          { featured:    { $elemMatch: { $regex: collectionMatch.regex, $options: 'i' } } },
          { badge:       { $regex: collectionMatch.regex, $options: 'i' } },
        ],
      },
    ];
    if (effectiveBudgetMin !== null) colConds.push({ price: { $gte: effectiveBudgetMin } });
    if (effectiveBudgetMax !== null) colConds.push({ price: { $lte: effectiveBudgetMax } });
    collectionProducts = await Product.find({ $and: colConds }).select(productFields).limit(POOL).sort(colSort).lean();
    if (collectionProducts.length > 0) collectionName = collectionMatch.label;
  }

  // Enough collection products → return them directly without running a wider search.
  if (collectionProducts.length >= RESULT) {
    return { products: shuffleArray(collectionProducts).slice(0, RESULT), collectionName };
  }

  // ── Aggregation $project matching productFields ────────────────────────
  const aggrProject = {
    name: 1, price: 1, originalPrice: 1, discount: 1, images: 1,
    category: 1, subcategory: 1, metal: 1, metalKt: 1, stone: 1, stones: 1,
    rating: 1, reviewCount: 1, badge: 1, arrivesBy: 1, createdAt: 1,
    sizes: 1, inStock: 1,
  };

  // ── Build base conditions (budget + metal, always applied) ──────────────
  const baseConditions = [{ isActive: { $ne: false } }];
  if (effectiveBudgetMin !== null) baseConditions.push({ price: { $gte: effectiveBudgetMin } });
  if (effectiveBudgetMax !== null) baseConditions.push({ price: { $lte: effectiveBudgetMax } });

  if (metal || metalKt) {
    const orClauses = [];
    if (metal) {
      const metalCore = metal.replace(/ gold$/, '');
      orClauses.push(
        { metal:        { $regex: metalCore, $options: 'i' } },
        { metals:       { $regex: metalCore, $options: 'i' } },
        { name:         { $regex: metalCore, $options: 'i' } },
        { description:  { $regex: metalCore, $options: 'i' } },
        { tags:         { $elemMatch: { $regex: metalCore, $options: 'i' } } },
      );
    }
    if (metalKt) {
      orClauses.push(
        { metalKt:     { $regex: metalKt, $options: 'i' } },
        { name:        { $regex: metalKt, $options: 'i' } },
        { description: { $regex: metalKt, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: metalKt, $options: 'i' } } },
      );
    }
    baseConditions.push({ $or: orClauses });
  }

  // Category synonym expansion: bracelet↔bangle, chain↔necklace, pendant↔necklace
  const CATEGORY_SYNONYMS = {
    bracelet: 'bracelet|bangle',
    bangle:   'bangle|bracelet',
    chain:    'chain|necklace',
    pendant:  'pendant|necklace',
  };

  if (effectiveCategory) {
    const catBase = CATEGORY_SYNONYMS[effectiveCategory] || effectiveCategory;
    const catPattern = `\\b(?:${catBase})s?\\b`;
    baseConditions.push({
      $or: [
        { category:    { $regex: catPattern, $options: 'i' } },
        { subcategory: { $regex: catPattern, $options: 'i' } },
        { name:        { $regex: catPattern, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: catPattern, $options: 'i' } } },
        { flags:       { $elemMatch: { $regex: catPattern, $options: 'i' } } },
        { description: { $regex: catPattern, $options: 'i' } },
      ],
    });
  }

  // Stone condition — kept separate so we can drop it in a fallback retry
  const stoneCondition = stone ? {
    $or: [
      { stone:        { $regex: stone, $options: 'i' } },
      { stones:       { $elemMatch: { $regex: stone, $options: 'i' } } },
      { subcategory:  { $regex: stone, $options: 'i' } },
      { name:         { $regex: stone, $options: 'i' } },
      { description:  { $regex: stone, $options: 'i' } },
    ],
  } : null;

  // Audience condition (kids / female / male)
  const audiencePattern = audience === 'kids'   ? 'kid|kids|children|child|baby|toddler'
    : audience === 'female' ? 'women|woman|female|ladies'
    : audience === 'male'   ? 'men|man|male|gentleman'
    : null;
  const audienceCondition = audiencePattern ? {
    $or: [
      { forWho:       { $elemMatch: { $regex: audiencePattern, $options: 'i' } } },
      { tags:         { $elemMatch: { $regex: audiencePattern, $options: 'i' } } },
      { flags:        { $elemMatch: { $regex: audiencePattern, $options: 'i' } } },
      { category:     { $regex: audiencePattern, $options: 'i' } },
      { subcategory:  { $regex: audiencePattern, $options: 'i' } },
      { name:         { $regex: audiencePattern, $options: 'i' } },
      { description:  { $regex: audiencePattern, $options: 'i' } },
    ],
  } : null;

  // Size condition: include products where sizes contains the requested size,
  // OR where sizes is empty/absent (store hasn't filled the field — treated as "all sizes").
  // Products with explicit sizes that do NOT include the requested size are excluded.
  if (requestedSize) {
    baseConditions.push({
      $or: [
        { sizes: { $exists: false } },
        { sizes: null },
        { sizes: { $size: 0 } },
        { sizes: { $elemMatch: { $regex: `^${requestedSize.replace('.', '\\.')}$`, $options: 'i' } } },
      ],
    });
  }

  // isGeneral: true only when there is no specific signal at all
  const isGeneral = !effectiveCategory && !hasBudget && !metal && !metalKt && !stone && !audience && !requestedSize;

  if (isGeneral) {
    const baseMatch = { isActive: { $ne: false } };
    const OCCASION_CAT = {
      engagement: 'ring', bridal: 'ring', wedding: 'ring',
      anniversary: 'ring', valentine: 'ring',
    };
    const occasionCat = occasion ? OCCASION_CAT[occasion] : null;
    if (occasionCat) {
      const pat = `\\b${occasionCat}s?\\b`;
      baseMatch.$or = [
        { category: { $regex: pat, $options: 'i' } },
        { name:     { $regex: pat, $options: 'i' } },
      ];
    }
    const [newest, topRated, sampled] = await Promise.all([
      Product.find(baseMatch).select(productFields).sort({ createdAt: -1 }).limit(8).lean(),
      Product.find(baseMatch).select(productFields).sort({ rating: -1, reviewCount: -1 }).limit(8).lean(),
      Product.aggregate([{ $match: baseMatch }, { $sample: { size: 10 } }, { $project: aggrProject }]),
    ]);
    const generalResults = shuffleArray(dedupe([...newest, ...topRated, ...sampled]));
    return mergeWithCollection(generalResults, collectionProducts, collectionName, RESULT);
  }

  // ── Specific query: combine all conditions ────────────────────────────────
  const allConditions = [...baseConditions];
  if (stoneCondition)    allConditions.push(stoneCondition);
  if (audienceCondition) allConditions.push(audienceCondition);
  const query = allConditions.length === 1 ? allConditions[0] : { $and: allConditions };

  const sort = hasBudget ? { price: 1 } : { rating: -1, reviewCount: -1 };
  let pool = await Product.find(query).select(productFields).limit(POOL).sort(sort).lean();

  // Fallback 1: stone not found → retry without stone so category/audience results still surface
  // The AI will be informed via searchResultNote that the exact stone isn't available.
  if (pool.length === 0 && stoneCondition) {
    const relaxedConditions = [...baseConditions];
    if (audienceCondition) relaxedConditions.push(audienceCondition);
    const relaxedQuery = relaxedConditions.length === 1 ? relaxedConditions[0] : { $and: relaxedConditions };
    pool = await Product.find(relaxedQuery).select(productFields).limit(POOL).sort(sort).lean();
  }

  // Fallback 2: occasion-implied categories not found in DB → try without category
  if (pool.length === 0 && impliedCategory && !primaryCategory) {
    const fallbackConds = baseConditions.filter(c => !c.$or?.some(x => x.category !== undefined));
    if (stoneCondition)    fallbackConds.push(stoneCondition);
    if (audienceCondition) fallbackConds.push(audienceCondition);
    const fallbackQuery = fallbackConds.length === 1 ? fallbackConds[0] : { $and: fallbackConds };
    pool = await Product.find(fallbackQuery).select(productFields).limit(POOL).sort({ rating: -1, reviewCount: -1 }).lean();
  }

  // Hard budget guard: reject any product that violates the price range, even if the DB
  // returned it (e.g. via a fallback query that dropped the category but kept budget in theory).
  if (hasBudget) {
    pool = pool.filter(p => {
      if (effectiveBudgetMin !== null && p.price < effectiveBudgetMin) return false;
      if (effectiveBudgetMax !== null && p.price > effectiveBudgetMax) return false;
      return true;
    });
  }

  // Size guard: when a size was requested, prefer products with that size confirmed.
  // Products with explicit sizes that don't include the requested size are never shown.
  if (requestedSize) {
    const confirmed  = pool.filter(p => Array.isArray(p.sizes) && p.sizes.length > 0 &&
      p.sizes.some(s => s.toUpperCase() === requestedSize.toUpperCase()));
    const noSizeData = pool.filter(p => !Array.isArray(p.sizes) || p.sizes.length === 0);
    // Prefer confirmed; fall back to unconfirmed only if zero confirmed results
    pool = confirmed.length > 0 ? confirmed : noSizeData;
  }

  let specificResults;
  if (hasBudget && pool.length > RESULT) {
    const half = Math.ceil(pool.length / 2);
    specificResults = [...shuffleArray(pool.slice(0, half)), ...shuffleArray(pool.slice(half))];
  } else {
    specificResults = shuffleArray(pool);
  }
  return mergeWithCollection(specificResults, collectionProducts, collectionName, RESULT);
}

// ── Build intent constraint block for system prompt ───────────────────────────
function buildIntentConstraints(shoppingIntent) {
  const { primaryCategory, budgetMin, budgetMax, metal, metalKt, stone, occasion, audience, requestedSize } = shoppingIntent;
  const hasBudget = budgetMin !== null || budgetMax !== null;
  if (!primaryCategory && !hasBudget && !metal && !metalKt && !stone && !occasion && !audience && !requestedSize) return '';

  const lines = ['CUSTOMER REQUEST ANALYSIS:'];
  if (primaryCategory) lines.push(`• Product type requested: ${primaryCategory.toUpperCase()} — show ONLY ${primaryCategory}s`);
  if (stone)           lines.push(`• Stone/gemstone requested: ${stone.toUpperCase()} — show ONLY products featuring ${stone}`);
  if (metal && metalKt) lines.push(`• Metal preference: ${metalKt} ${metal} — show ONLY ${metalKt} ${metal} products`);
  else if (metalKt)     lines.push(`• Karat requested: ${metalKt} — show ONLY ${metalKt} products`);
  else if (metal)       lines.push(`• Metal preference: ${metal}`);
  if (requestedSize)    lines.push(`• Size requested: ${requestedSize} — ONLY reference products confirmed in size ${requestedSize}`);
  if (audience === 'kids')   lines.push('• Audience: KIDS — show ONLY jewelry designed for children');
  if (audience === 'female') lines.push('• Buying for: female — prefer elegant, romantic, gifting-focused styles');
  if (audience === 'male')   lines.push('• Buying for: male — prefer masculine, bold, or classic styles');
  if (hasBudget) {
    if (budgetMin !== null && budgetMax !== null)
      lines.push(`• Budget range: AED ${budgetMin}–${budgetMax} — ONLY recommend products within this exact range`);
    else if (budgetMax !== null)
      lines.push(`• Budget ceiling: AED ${budgetMax} — the customer CANNOT spend more than this`);
    else
      lines.push(`• Budget floor: AED ${budgetMin}+ — customer is looking for premium options`);
  }
  if (occasion) lines.push(`• Occasion: ${occasion}`);

  lines.push('');
  lines.push('STRICT RULES:');

  if (primaryCategory) {
    lines.push(`• Category lock: show ONLY ${primaryCategory}s. Do NOT show other jewelry types first.`);
  }
  if (stone) {
    lines.push(`• Stone lock: ONLY reference products that feature ${stone}. If the search result note says the stone is unavailable, be honest — do NOT invent ${stone} products.`);
  }
  if (audience === 'kids') {
    lines.push("• Kids lock: ONLY reference jewelry from the kids' collection. Do NOT recommend adult jewelry.");
    lines.push("• If no kids jewelry is found, say so honestly and suggest the customer contact us for special orders.");
  }
  if (requestedSize) {
    lines.push(`• Size lock: NEVER confirm or recommend a product unless the search result note says size ${requestedSize} is confirmed.`);
    lines.push(`• If size ${requestedSize} is unavailable, say so clearly and suggest the customer contact our team or check alternative sizes.`);
    lines.push(`• If the search result says size data is unconfirmed for some products, tell the customer to check the product page or message our team to verify before ordering.`);
  }

  if (hasBudget) {
    if (budgetMin !== null && budgetMax !== null) {
      lines.push(`• Budget lock: ONLY reference products priced between AED ${budgetMin} and AED ${budgetMax}. Ignore any card outside this range.`);
      lines.push(`• If no products exist in this range, say so and offer: "Would you like to explore AED ${Math.round(budgetMin * 0.8)}–${Math.round(budgetMax * 1.2)} instead?"`);
    } else if (budgetMax !== null) {
      lines.push(`• Budget lock: NEVER mention, reference, or recommend any product priced above AED ${budgetMax}. This is a hard rule — do not show, name, or imply any product outside this ceiling.`);
      lines.push(`• If no products are available within AED ${budgetMax}, say: "We currently don't have pieces available within AED ${budgetMax}." Then offer: "Would you like to explore options up to AED ${Math.round(budgetMax * 1.5)}?"`);
    }
  }

  return '\n\n' + lines.join('\n');
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { messages, sessionContext, cartItems = [], wishlistItems = [] } = req.body;

    if (!messages?.length) return res.status(400).json({ error: 'messages array is required' });

    const userMessage = messages[messages.length - 1]?.content || '';
    const intent = detectIntent(userMessage);
    const isAuthenticated = !!req.user;

    // ── Gold price short-circuit (no Claude call needed) ──────────────────────
    if (intent === 'gold_price') {
      try {
        const goldData = await fetchGoldPrices();
        return res.json({
          reply: "✨ Today's UAE Gold Rates",
          goldPrices: goldData.prices,
          updatedAt: goldData.updatedAt,
          dateStr: goldData.dateStr,
          products: [],
          orderCards: [],
          quickReplies: ['Gold Jewellery', 'Diamond Jewellery', 'Best Value'],
          intent: 'gold_price',
          mode: 'shopping',
        });
      } catch {
        return res.json({
          reply: 'Gold prices are temporarily unavailable. Please try again shortly.',
          goldPrices: null,
          updatedAt: null,
          products: [],
          orderCards: [],
          quickReplies: ['Gold Jewellery', 'Diamond Jewellery', 'Best Value'],
          intent: 'gold_price',
          mode: 'shopping',
        });
      }
    }

    const mode = resolveMode(intent, sessionContext?.mode);
    const shoppingIntent = mode === 'shopping' ? parseShoppingIntent(userMessage) : {};

    // Fetch orders from DB for order-related intents only
    let userOrders = [];
    if (isAuthenticated && ['order_tracking', 'order_history', 'return_request'].includes(intent)) {
      userOrders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    }

    // Fetch live delivery settings for shipping/delivery questions
    let deliveryConfig = null;
    if (intent === 'delivery') {
      try {
        const s = await Settings.findOne({ key: 'global' }).lean();
        if (s?.delivery) deliveryConfig = s.delivery;
      } catch { /* non-critical — AI will fall back to generic response */ }
    }

    const budgetLabel = sessionContext?.budgetMin != null && sessionContext?.budgetMax != null
      ? `AED ${sessionContext.budgetMin}–${sessionContext.budgetMax}`
      : sessionContext?.budgetMax != null ? `under AED ${sessionContext.budgetMax}`
      : sessionContext?.budget ? `under AED ${sessionContext.budget}` : 'unknown';
    const contextHint = sessionContext
      ? `\nShopping context: budget=${budgetLabel}, occasion=${sessionContext.occasion || 'unknown'}, preference=${sessionContext.category || 'unknown'}.`
      : '';

    const userCtx = buildUserContext(req.user, userOrders, cartItems, wishlistItems);

    const authGuide = isAuthenticated
      ? `The customer IS signed in. Address them by first name (${req.user.name.split(' ')[0]}) when natural.`
      : `The customer is a guest (not signed in). If they ask about orders or account, warmly invite them to sign in — never say you cannot help.`;

    const intentConstraints = buildIntentConstraints(shoppingIntent);

    // ── Run product search BEFORE building AI prompt so the result informs the reply ──
    // For cart/wishlist intents, use the items the frontend already sent — no DB query needed.
    let products;
    let collectionName = null;
    if (intent === 'wishlist') {
      products = wishlistItems.length ? wishlistItems : [];
    } else if (intent === 'cart') {
      products = cartItems.length ? cartItems : [];
    } else {
      const found = await findProducts(userMessage, intent, sessionContext);
      products = found.products;
      collectionName = found.collectionName;
    }

    // Determine whether a budget filter was active for this search
    const { budgetMin: msgBudgetMin, budgetMax: msgBudgetMax, stone: queryStone, audience: queryAudience, requestedSize: querySize, primaryCategory: queryCategory } = shoppingIntent;
    const effectiveBudgetMin = msgBudgetMin ?? sessionContext?.budgetMin ?? null;
    const effectiveBudgetMax = msgBudgetMax ?? sessionContext?.budgetMax ?? sessionContext?.budget ?? null;
    const hasBudget = effectiveBudgetMin !== null || effectiveBudgetMax !== null;

    // Inject the real search result into the system prompt so the AI cannot hallucinate
    let searchResultNote = '';
    if (intent === 'wishlist') {
      searchResultNote = products.length > 0
        ? `\n\nWISHLIST: The customer's ${products.length} saved item(s) are displayed as visual cards below your text automatically. Do NOT list, name, or describe them in your text reply.`
        : `\n\nWISHLIST: The customer's wishlist is empty. Empathize briefly and invite them to explore the collection.`;
    } else if (intent === 'cart') {
      searchResultNote = products.length > 0
        ? `\n\nCART: The customer's ${products.length} cart item(s) are displayed as visual cards below your text automatically. Do NOT list, name, or describe them in your text reply.`
        : `\n\nCART: The customer's cart is empty. Empathize briefly and invite them to explore the collection.`;
    } else if (mode === 'shopping') {
      if (products.length === 0 && hasBudget) {
        const rangeLabel = effectiveBudgetMin != null && effectiveBudgetMax != null
          ? `AED ${effectiveBudgetMin}–${effectiveBudgetMax}`
          : effectiveBudgetMax != null ? `under AED ${effectiveBudgetMax}`
          : `above AED ${effectiveBudgetMin}`;
        const nextMax = effectiveBudgetMax ? effectiveBudgetMax * 2 : (effectiveBudgetMin ? effectiveBudgetMin * 2 : null);
        const suggestion = nextMax ? `AED ${effectiveBudgetMax ?? effectiveBudgetMin}–${nextMax}` : 'a higher range';
        searchResultNote = `\n\nSEARCH RESULT: 0 products found ${rangeLabel}. ` +
          `MANDATORY: Tell the customer HONESTLY that Jawhara currently has no pieces available in this price range. ` +
          `Suggest they explore ${suggestion} instead. ` +
          `NEVER fabricate, invent, or imply any product exists in this range.`;
      } else if (products.length === 0 && queryAudience === 'kids') {
        searchResultNote = `\n\nSEARCH RESULT: 0 kids' jewelry products found. ` +
          `MANDATORY: Tell the customer honestly that our kids' collection is currently very limited or unavailable online, ` +
          `and invite them to WhatsApp us (+971565071902) for assistance with kids' jewelry.`;
      } else if (products.length === 0 && queryStone) {
        searchResultNote = `\n\nSEARCH RESULT: 0 products found featuring ${queryStone}. ` +
          `MANDATORY: Tell the customer honestly that Jawhara does not currently carry ${queryStone} pieces online. ` +
          `The cards shown (if any) are the closest alternatives available. ` +
          `Suggest they explore diamond or pearl options, or contact us via WhatsApp (+971565071902) for special requests.`;
      } else if (querySize && products.length === 0) {
        const catLabel = queryCategory ? `${queryCategory}s` : 'pieces';
        searchResultNote = `\n\nSEARCH RESULT: 0 ${catLabel} found in size ${querySize}. ` +
          `MANDATORY: Tell the customer honestly that size ${querySize} is not currently available for our ${catLabel}. ` +
          `Suggest they contact our team on WhatsApp +971565071902 for size availability or special orders. ` +
          `NEVER recommend or confirm any product for size ${querySize}.`;
      } else if (querySize && products.length > 0) {
        const confirmedCount = products.filter(p => Array.isArray(p.sizes) && p.sizes.length > 0 &&
          p.sizes.some(s => s.toUpperCase() === querySize.toUpperCase())).length;
        const unconfirmedCount = products.length - confirmedCount;
        if (confirmedCount > 0 && unconfirmedCount === 0) {
          searchResultNote = `\n\nSEARCH RESULT: ${products.length} product(s) confirmed in size ${querySize} — they appear as visual cards below your text. ` +
            `You may confirm to the customer that these pieces are available in size ${querySize}. ` +
            `Do NOT name or list them in your text.`;
        } else if (confirmedCount > 0) {
          searchResultNote = `\n\nSEARCH RESULT: ${confirmedCount} product(s) confirmed in size ${querySize}; ${unconfirmedCount} shown without size data. ` +
            `Tell the customer that some pieces are confirmed in size ${querySize} and for others they should verify on the product page or with our team. ` +
            `Product cards appear below your text automatically. Do NOT name them in your text.`;
        } else {
          searchResultNote = `\n\nSEARCH RESULT: ${products.length} product(s) found but size ${querySize} is NOT confirmed for any of them (no size data on file). ` +
            `MANDATORY: Do NOT confirm size ${querySize} availability. Tell the customer the pieces shown look promising but they must verify size ${querySize} availability via the product page or by messaging our team.`;
        }
      } else if (products.length > 0) {
        if (collectionName) {
          searchResultNote = `\n\nSEARCH RESULT: ${products.length} product(s) from the ${collectionName} are shown as visual cards below your text. ` +
            `You MUST mention the "${collectionName}" by name once in your reply as a collection highlight — this is a dedicated curated collection for this occasion. ` +
            `Do NOT name or list any individual products.`;
        } else {
          searchResultNote = `\n\nSEARCH RESULT: ${products.length} product(s) found — they appear as visual cards below your text automatically. ` +
            `Your text reply must NOT describe, name, or list any of them.`;
        }
      } else {
        searchResultNote = `\n\nSEARCH RESULT: No products retrieved for this query. Respond warmly and ask one clarifying question.`;
      }
    }

    const modeRules = mode === 'support'
      ? `ACTIVE MODE: Customer Care

PERSONA:
You are Layla — a Jawhara jewelry consultant speaking directly and personally with the customer.
Speak as a warm, knowledgeable human being. You are looking things up personally on their behalf.
NEVER use any of these words in your responses: admin, backend, system, database, technical, internal, error, escalate, ticket, platform, portal, server. Speak naturally.

STRICT RULES — follow without exception:
- Respond ONLY to the customer's specific request
- Do NOT suggest, mention, or recommend any products or jewelry at any point
- Keep replies short, direct, and reassuring — 2-3 sentences maximum
- After resolving the issue, end with: "Is there anything else I can help you with?"
- For payment disputes or account security concerns, invite the customer to reach our team directly on WhatsApp +971565071902 — do NOT use the word "support" or "admin"
- Everything else — orders, returns, delivery, account details — handle it yourself, warmly

SHIPPING / DELIVERY ZONE GUIDANCE:
- If the "DELIVERY ZONES" block appears in this prompt, use ONLY that data to answer any question about shipping countries, international delivery, or where we deliver.
- If delivery is worldwide: confirm warmly that we ship internationally.
- If delivery is limited: name the supported countries exactly as listed. If the customer asks about a country not on the list, be honest — tell them we don't currently deliver there and invite them to check back or contact our team for updates.
- NEVER invent or assume delivery availability for any country not listed in the DELIVERY ZONES block.

RETURN / REFUND / EXCHANGE GUIDANCE:
- "Initiate Return": Returns are accepted within 14 days of delivery for unused items in original packaging. Invite the customer to message our team on WhatsApp +971565071902 or email support@jawharajewelry.com with their order number and we will take care of it straight away.
- "Refund Status": Check the customer's order history. If a cancelled order exists, confirm the refund timeline (5–7 business days to the original payment method). If no refund is pending, clarify the current status and reassure them.
- "Exchange Item": Exchanges are accepted within 14 days of delivery. Invite the customer to message our team on WhatsApp +971565071902 or email support@jawharajewelry.com with their order number and preferred replacement — we will arrange everything for them.

CUSTOMER SERVICE FAQ GUIDANCE:
For ANY of these topics, give a warm 1–2 sentence answer, then always end by inviting the customer to connect with our team for full details. A WhatsApp button appears automatically — do NOT write the phone number in your text reply. Say "our team" and let them tap the button.
- Installment / Payment Plans: We do offer flexible payment and installment options. Invite the customer to connect with our team for current plans and eligibility.
- Diamond / Stone Certification: Our diamonds and precious stones come with internationally recognised certifications (GIA, IGI, or equivalent) where applicable. Invite the customer to ask our team about a specific piece.
- Customization / Engraving / Bespoke: We love creating personalised pieces — from engraving to fully bespoke designs. Invite the customer to share their vision with our team.
- Warranty / Aftercare: All Jawhara jewelry comes with a quality guarantee and aftercare service. Invite the customer to ask our team about specific terms and servicing options.
- Gift Wrapping / Packaging: We offer beautiful gift packaging for all purchases. Invite the customer to mention it when ordering or to message our team for special arrangements.
- General Policy Questions: Give a brief, reassuring answer, then invite the customer to connect with our team for complete and up-to-date details.
- "Speak to someone / contact team": Warmly acknowledge and immediately invite them to connect with our jewelry specialists via the WhatsApp button below.`
      : `ACTIVE MODE: Shopping Assistant

PERSONA:
You are Layla — a Jawhara jewelry consultant. Speak as a warm, knowledgeable human being, not a system or bot.
NEVER use any of these words: admin, backend, system, database, technical, internal, error, platform, portal.
Use natural consultant language: "our collection", "we carry", "I'd suggest", "let me find that for you".

RESPONSE STRUCTURE — follow this order every time:
1. PRIORITY TEXT (your reply text): 1–2 sentences maximum. Address the customer's core need directly.
2. RECOMMENDATIONS: Product cards appear automatically in the UI below your text. Never list them in plain text.
3. FOLLOW-UP: Quick-reply chips appear automatically below the cards.

STRICT RULES:
- MAXIMUM 2 sentences in your text reply.
- Use the customer's name when you know it.
- One tasteful emoji per reply (✨ 💍 👑) — never more.
- CRITICAL: NEVER write ANY individual product name, price, or AED amount in your text. Only mention a collection name if the search result note explicitly instructs you to.
- CRITICAL: NEVER write lists or bullet points.
- Never ask a follow-up question in text — chips handle that.`;

    const deliveryCtx = buildDeliveryContext(deliveryConfig);

    const systemPrompt = `You are Layla, a personal jewelry consultant at Jawhara Jewelry — a prestigious UAE-based fine jewelry brand. You speak as a warm, knowledgeable human being, not a system or automated tool. Never reference admin, backend, database, or any internal operational concepts in any response.

${modeRules}${intentConstraints}

${authGuide}${userCtx}
Jawhara offers rings, necklaces, bracelets, earrings, bangles, and bridal sets in 18K/21K gold, rose gold, white gold, silver, platinum, and diamond.${contextHint}${searchResultNote}${deliveryCtx}`;

    // Anthropic requires the first message to be role 'user'. Strip any leading
    // assistant messages (e.g. a greeting bubble that leaked from the frontend).
    const firstUserIdx = messages.findIndex(m => m.role === 'user');
    const apiMessages = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

    if (!apiMessages.length) return res.status(400).json({ error: 'No user message found' });

    const aiResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 450,
      system: systemPrompt,
      messages: apiMessages,
    });

    const reply = aiResponse.content[0].text;
    const quickReplies = getQuickReplies(userMessage, reply, intent, sessionContext?.mode);

    const orderCards = isAuthenticated && userOrders.length > 0
      ? buildOrderCards(userOrders, intent === 'order_tracking' ? 1 : 3)
      : [];

    res.json({ reply, products, quickReplies, orderCards, intent, mode });
  } catch (err) {
    console.error('Chat error:', err.status ?? '', err.message);
    const msg = process.env.NODE_ENV === 'development' ? err.message : 'Chat service unavailable. Please try again.';
    res.status(500).json({ error: msg });
  }
};
