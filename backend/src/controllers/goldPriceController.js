const https = require('https');

const CACHE_TTL  = 10 * 60 * 1000; // 10 minutes
const TROY_OZ_TO_G = 31.1035;

let _cache = { data: null, ts: 0 };

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'jawhara-jewelry/1.0', ...headers } }, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('Invalid JSON from gold price API')); }
      });
    }).on('error', reject);
  });
}

function toQuarter(n) { return Math.round(n * 4) / 4; }

function fmtDate(ts) {
  const d  = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function buildPrices(aedPerGram24K) {
  return [
    { karat: '24K', price: toQuarter(aedPerGram24K * (24 / 24)) },
    { karat: '22K', price: toQuarter(aedPerGram24K * (22 / 24)) },
    { karat: '21K', price: toQuarter(aedPerGram24K * (21 / 24)) },
    { karat: '18K', price: toQuarter(aedPerGram24K * (18 / 24)) },
    { karat: '14K', price: toQuarter(aedPerGram24K * (14 / 24)) },
  ];
}

async function fetchGoldPrices() {
  if (_cache.data && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  const metalKey  = process.env.METAL_PRICE_API_KEY;
  const goldioKey = process.env.GOLD_API_KEY;

  let prices;

  // ── 1. MetalPriceAPI.com (base=AED, currencies=XAU) ──────────────────────────
  if (metalKey) {
    try {
      const url  = `https://api.metalpriceapi.com/v1/latest?api_key=${metalKey}&base=AED&currencies=XAU`;
      const json = await httpsGet(url);

      if (json.success && json.rates?.XAU) {
        // rates.XAU = troy oz per 1 AED  →  invert to get AED per troy oz
        const aedPerOz      = 1 / json.rates.XAU;
        const aedPerGram24K = aedPerOz / TROY_OZ_TO_G;
        prices = buildPrices(aedPerGram24K);
      }
    } catch (e) {
      console.warn('MetalPriceAPI failed:', e.message);
    }
  }

  // ── 2. GoldAPI.io (returns per-gram AED values directly) ─────────────────────
  if (!prices && goldioKey) {
    try {
      const json = await httpsGet('https://www.goldapi.io/api/XAU/AED', {
        'x-access-token': goldioKey,
        'Content-Type': 'application/json',
      });

      if (!json.error && json.price_gram_24k) {
        prices = [
          { karat: '24K', price: toQuarter(json.price_gram_24k) },
          { karat: '22K', price: toQuarter(json.price_gram_22k) },
          { karat: '21K', price: toQuarter(json.price_gram_21k) },
          { karat: '18K', price: toQuarter(json.price_gram_18k) },
          { karat: '14K', price: toQuarter(json.price_gram_14k) },
        ];
      }
    } catch (e) {
      console.warn('GoldAPI.io failed:', e.message);
    }
  }

  // ── 3. metals.live (free, no key, USD spot) ───────────────────────────────────
  if (!prices) {
    try {
      const json   = await httpsGet('https://api.metals.live/v1/spot');
      const usdOz  = parseFloat(Array.isArray(json) ? json[0]?.gold : json?.gold);
      if (usdOz && !isNaN(usdOz)) {
        prices = buildPrices((usdOz / TROY_OZ_TO_G) * 3.6725);
      }
    } catch { /* fall through */ }
  }

  // ── 4. Coinbase (free, no key, USD spot) ──────────────────────────────────────
  if (!prices) {
    const json  = await httpsGet('https://api.coinbase.com/v2/prices/XAU-USD/spot');
    const usdOz = parseFloat(json?.data?.amount);
    if (!usdOz || isNaN(usdOz)) throw new Error('All gold price sources failed');
    prices = buildPrices((usdOz / TROY_OZ_TO_G) * 3.6725);
  }

  const now    = Date.now();
  const result = { prices, updatedAt: now, dateStr: fmtDate(now) };
  _cache = { data: result, ts: now };
  return result;
}

exports.fetchGoldPrices = fetchGoldPrices;

exports.getGoldPrice = async (req, res) => {
  try {
    const data = await fetchGoldPrices();
    res.json(data);
  } catch (err) {
    console.error('Gold price fetch error:', err.message);
    res.status(503).json({ error: 'Gold prices temporarily unavailable' });
  }
};
