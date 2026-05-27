const Anthropic = require('@anthropic-ai/sdk');
const Product = require('../models/Product');
const Order = require('../models/Order');
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
  if (/deliver|shipping.*time|same.?day|when.*arrive|how long.*ship|estimated.*arrival/i.test(msg))
    return 'delivery';
  if (/gold.*price|price.*gold|today.*gold|gold.*today|gold.*rate|rate.*gold/i.test(msg))
    return 'gold_price';
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
      ctx += `• ${fmtOrderNo(o._id)}: ${itemList} | ${o.status.toUpperCase()} | ${o.totalAmount} AED | ${date}\n`;
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
const SUPPORT_INTENTS = new Set(['order_tracking', 'order_history', 'return_request', 'delivery', 'account']);

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

  const occasionKeywords = ['engagement', 'bridal', 'wedding', 'anniversary', 'birthday', 'eid', 'valentine', 'graduation'];
  const occasion = occasionKeywords.find(o => t.includes(o)) || null;

  // \b boundary intentionally omitted after "girl" to also catch "girlfriend"
  const audience = /\b(?:wife|girlfriend|fiancee|fiancée|her|woman|women|female|sister|mother|mom|girl)/.test(t) ? 'female'
    : /\b(?:husband|boyfriend|fiance|him|man|men|male|brother|father|dad)/.test(t) ? 'male'
    : null;

  // Occasion → implied category ONLY when no explicit type was stated
  // wedding/anniversary/valentine/eid → ring (most common gifted piece); bridal/engagement → ring
  const occasionCategoryMap = {
    engagement:  'ring',
    bridal:      'ring',
    wedding:     'ring',
    anniversary: 'ring',
    valentine:   'ring',
    birthday:    null,    // too broad — skip and show top-rated across all
    eid:         null,
    graduation:  null,
  };
  const impliedCategory = !primaryCategory && occasion ? occasionCategoryMap[occasion] ?? null : null;

  return { primaryCategory, impliedCategory, budgetMin, budgetMax, metal, occasion, audience };
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

// ── Smart product search (skipped for account/order intents) ──────────────────
async function findProducts(userMessage, intent, sessionContext) {
  const skipIntents = ['order_tracking', 'order_history', 'return_request', 'cart', 'wishlist', 'account'];
  if (skipIntents.includes(intent)) return [];

  const { primaryCategory, impliedCategory, budgetMin, budgetMax, metal, occasion, audience } = parseShoppingIntent(userMessage);
  const effectiveCategory = primaryCategory || impliedCategory;

  const effectiveBudgetMin = budgetMin ?? sessionContext?.budgetMin ?? null;
  const effectiveBudgetMax = budgetMax ?? sessionContext?.budgetMax ?? sessionContext?.budget ?? null;
  const hasBudget = effectiveBudgetMin !== null || effectiveBudgetMax !== null;

  const msg = userMessage.toLowerCase();
  const hasShoppingSignal =
    hasBudget ||
    metal ||
    effectiveCategory ||
    audience ||
    /ring|necklace|bracelet|earring|pendant|gold|silver|diamond|pearl|jewelry|jewel|gift|buy|purchase|show|find|looking|want|need|for her|for him|recommend/i.test(msg);

  if (!hasShoppingSignal) return [];

  const POOL     = 24; // fetch a larger pool, then shuffle + slice to 6
  const RESULT   = 6;
  const productFields = 'name price originalPrice discount images _id category metal metalKt rating reviewCount badge arrivesBy createdAt';

  // ── Build filter conditions ───────────────────────────────────────────────
  const conditions = [{ isActive: { $ne: false } }];

  if (effectiveBudgetMin !== null) conditions.push({ price: { $gte: effectiveBudgetMin } });
  if (effectiveBudgetMax !== null) conditions.push({ price: { $lte: effectiveBudgetMax } });

  if (metal) {
    const metalCore = metal.replace(/ gold$/, '');
    conditions.push({ metal: { $regex: metalCore, $options: 'i' } });
  }

  if (effectiveCategory) {
    const catPattern = `\\b${effectiveCategory}s?\\b`;
    conditions.push({
      $or: [
        { category: { $regex: catPattern, $options: 'i' } },
        { name:     { $regex: catPattern, $options: 'i' } },
      ],
    });
  }

  const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

  // ── Aggregation $project matching .select() fields ───────────────────────
  const aggrProject = {
    name: 1, price: 1, originalPrice: 1, discount: 1, images: 1,
    category: 1, metal: 1, metalKt: 1, rating: 1, reviewCount: 1,
    badge: 1, arrivesBy: 1, createdAt: 1,
  };

  // ── General / gift queries: mix newest + top-rated + random sample ────────
  // Triggers when the user has no specific category, budget, or metal constraint.
  // This guarantees different products on every call.
  const isGeneral = !effectiveCategory && !hasBudget && !metal;

  if (isGeneral) {
    const baseMatch = { isActive: { $ne: false } };

    // Occasion → category hint (e.g. "anniversary gift" → rings)
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

    // Parallel fetch from three distinct pools
    const [newest, topRated, sampled] = await Promise.all([
      Product.find(baseMatch).select(productFields).sort({ createdAt: -1 }).limit(8).lean(),
      Product.find(baseMatch).select(productFields).sort({ rating: -1, reviewCount: -1 }).limit(8).lean(),
      Product.aggregate([{ $match: baseMatch }, { $sample: { size: 10 } }, { $project: aggrProject }]),
    ]);

    // Merge pools, deduplicate, shuffle, return RESULT items
    const pool = dedupe([...newest, ...topRated, ...sampled]);
    return shuffleArray(pool).slice(0, RESULT);
  }

  // ── Specific queries (has category / budget / metal) ─────────────────────
  // Fetch a larger pool sorted by relevance, then randomise within it so
  // different products surface on repeat clicks of the same suggestion.
  const sort = hasBudget ? { price: 1 } : { rating: -1, reviewCount: -1 };

  let pool = await Product.find(query)
    .select(productFields).limit(POOL).sort(sort).lean();

  // Fallback for occasion-implied categories not found in DB
  if (pool.length === 0 && impliedCategory && !primaryCategory) {
    const fallbackConds = conditions.filter(c => !c.$or);
    const fallbackQuery = fallbackConds.length === 1 ? fallbackConds[0] : { $and: fallbackConds };
    pool = await Product.find(fallbackQuery)
      .select(productFields).limit(POOL).sort({ rating: -1, reviewCount: -1 }).lean();
  }

  // Shuffle within the pool — budget queries keep top half weighted toward cheaper,
  // others get true randomisation across the pool
  if (hasBudget && pool.length > RESULT) {
    // Split pool: shuffle top half separately so cheapest options still surface
    const half = Math.ceil(pool.length / 2);
    return [...shuffleArray(pool.slice(0, half)), ...shuffleArray(pool.slice(half))].slice(0, RESULT);
  }

  return shuffleArray(pool).slice(0, RESULT);
}

// ── Build intent constraint block for system prompt ───────────────────────────
function buildIntentConstraints(shoppingIntent) {
  const { primaryCategory, budgetMin, budgetMax, metal, occasion, audience } = shoppingIntent;
  const hasBudget = budgetMin !== null || budgetMax !== null;
  if (!primaryCategory && !hasBudget && !metal && !occasion && !audience) return '';

  const lines = ['CUSTOMER REQUEST ANALYSIS:'];
  if (primaryCategory) lines.push(`• Product type requested: ${primaryCategory.toUpperCase()} — recommend ONLY ${primaryCategory}s`);
  if (metal)           lines.push(`• Metal preference: ${metal}`);
  if (hasBudget) {
    if (budgetMin !== null && budgetMax !== null)
      lines.push(`• Budget range: AED ${budgetMin}–${budgetMax} — ONLY recommend products within this exact range`);
    else if (budgetMax !== null)
      lines.push(`• Budget ceiling: AED ${budgetMax} — the customer CANNOT spend more than this`);
    else
      lines.push(`• Budget floor: AED ${budgetMin}+ — customer is looking for premium options`);
  }
  if (occasion)        lines.push(`• Occasion: ${occasion}`);
  if (audience === 'female') lines.push('• Buying for: female — prefer elegant, romantic, gifting-focused styles');
  if (audience === 'male')   lines.push('• Buying for: male — prefer masculine, bold, or classic styles');

  lines.push('');
  lines.push('STRICT RULES:');

  if (primaryCategory) {
    lines.push(`• Category lock: recommend ONLY ${primaryCategory}s as primary results. Do NOT show other jewelry types first.`);
    lines.push(`• You MAY offer matching pieces ONLY after the main ${primaryCategory} recommendations.`);
  }

  if (hasBudget) {
    if (budgetMin !== null && budgetMax !== null) {
      lines.push(`• Budget lock: ONLY reference products priced between AED ${budgetMin} and AED ${budgetMax}. Ignore any card outside this range.`);
      lines.push(`• If no products exist in this range, say so and offer: "Would you like to explore AED ${Math.round(budgetMin * 0.8)}–${Math.round(budgetMax * 1.2)} instead?"`);
    } else if (budgetMax !== null) {
      lines.push(`• Budget lock: NEVER mention, reference, or recommend any product priced above AED ${budgetMax}.`);
      lines.push(`• If no budget-matching products are available, say so honestly and offer: "Would you like to explore options up to AED ${Math.round(budgetMax * 1.25)}?" instead.`);
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
    if (intent === 'wishlist') {
      products = wishlistItems.length ? wishlistItems : [];
    } else if (intent === 'cart') {
      products = cartItems.length ? cartItems : [];
    } else {
      products = await findProducts(userMessage, intent, sessionContext);
    }

    // Determine whether a budget filter was active for this search
    const { budgetMin: msgBudgetMin, budgetMax: msgBudgetMax } = shoppingIntent;
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
      } else if (products.length > 0) {
        searchResultNote = `\n\nSEARCH RESULT: ${products.length} product(s) found — they appear as visual cards below your text automatically. ` +
          `Your text reply must NOT describe, name, or list any of them.`;
      } else {
        searchResultNote = `\n\nSEARCH RESULT: No products retrieved for this query. Respond warmly and ask one clarifying question.`;
      }
    }

    const modeRules = mode === 'support'
      ? `ACTIVE MODE: Customer Support

STRICT SUPPORT RULES — follow without exception:
- Respond ONLY to the customer's specific support request
- Do NOT suggest, mention, or recommend any products or jewelry at any point
- Do NOT upsell, cross-sell, or hint at shopping
- Keep replies short, direct, and actionable — 2-3 sentences maximum
- After resolving the issue, end with exactly: "Anything else you need help with?"
- Only refer to human support for: payment failure, account fraud, or technical system errors
- Everything else — orders, returns, delivery, account details — solve it yourself`
      : `ACTIVE MODE: Shopping Assistant

RESPONSE STRUCTURE — follow this order every time:
1. PRIORITY TEXT (your reply text): 1–2 sentences maximum. Address the customer's core need directly.
2. RECOMMENDATIONS: Product cards appear automatically in the UI below your text. Never list them in plain text.
3. FOLLOW-UP: Quick-reply chips appear automatically below the cards.

STRICT RULES:
- MAXIMUM 2 sentences in your text reply.
- Use the customer's name when you know it.
- One tasteful emoji per reply (✨ 💍 👑) — never more.
- CRITICAL: NEVER write ANY product name, collection name, price, or AED amount in your text.
- CRITICAL: NEVER write lists or bullet points.
- Never ask a follow-up question in text — chips handle that.`;

    const systemPrompt = `You are Layla, a premium luxury jewelry concierge and intelligent customer assistant at Jawhara Jewelry — a prestigious UAE-based fine jewelry brand.

${modeRules}${intentConstraints}

${authGuide}${userCtx}
Jawhara offers rings, necklaces, bracelets, earrings, bangles, and bridal sets in 18K/21K gold, rose gold, white gold, silver, platinum, and diamond.${contextHint}${searchResultNote}`;

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
