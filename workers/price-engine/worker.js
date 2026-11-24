// SEMEISTVO TECH — standalone Cloudflare Worker. Deploy to semeistvo-price-engine.
// Bind DB (same D1 as Pages), DPRICE_API_KEY (Secret). Cron: */5 * * * *.
// One SKU and at most 3 API requests per slot (864/day maximum).
const MAX_AGE = 7 * 86400000;
const CATEGORIES = ['cpu','gpu','motherboard','ram','storage','psu','case','cooler','accessories'];
const normalize = s => String(s || '').normalize('NFKC').toLowerCase()
  .replace(/\(2026\)/g,'').replace(/[^a-z0-9]+/g,'');
const priceOK = p => Number.isSafeInteger(p) && p > 0 && p <= 1000000000;
function fresh(date, now) {
  const n = Date.parse(date);
  return Number.isFinite(n) && n <= now && now - n <= MAX_AGE;
}

 // Match GPU family + exact model/suffix + VRAM, not the board partner's name.
function gpuIdentity(name) {
  const s = String(name || '').normalize('NFKC').toLowerCase();
  const models = [...s.matchAll(/\b(rx|rtx)\s*-?\s*(\d{4})(?:\s*(xtx|xt|ti)(?:\s*(super))?|\s*(super))?\b/g)]
    .map(m => m[1]+m[2]+(m[3]||'')+(m[4]||m[5]||''));
  const capacities = [...s.matchAll(/\b(\d+)\s*(?:gb|g)\b/g)].map(m => Number(m[1]));
  const unique = [...new Set(models)], memory = [...new Set(capacities)];
  return unique.length === 1 && memory.length === 1 ? {model:unique[0], vram:memory[0]} : null;
}
function productMatches(product, name) {
  if (product.category !== 'gpu') return normalize(product.name) === normalize(name);
  const s = String(name || '').normalize('NFKC').toLowerCase();
  // Reject bundles, whole computers, used cards and replacement parts.
  if (/\b(?:pc|komputer|computer|desktop|laptop|notebook|bundle|bundling|paket|rakitan|ryzen|core\s+ultra|intel\s+core|ssd|nvme|motherboard|psu|bekas|second|used|refurbished|refurb|rusak|defect|repair|sparepart|heatsink|waterblock|kardus|box\s+only|fan\s+only|kipas|backplate|bracket)\b/.test(s)) return false;
  const a = gpuIdentity(product.name), b = gpuIdentity(s);
  return !!a && !!b && a.model === b.model && a.vram === b.vram;
}
function searchTerm(product) {
  if (product.category === 'gpu') {
    const gpu = gpuIdentity(product.name);
    if (gpu) return gpu.model.replace(/^(rtx|rx)(\d{4})(.*)$/, '$1 $2 $3').trim() + ' ' + gpu.vram + 'GB';
  }
  return product.name.replace(/\(2026\)/g, '').trim();
}

async function get(path, env) {
  const r = await fetch('https://dprice.id/api/v1/' + path, {
    headers: { Authorization: 'Bearer ' + env.DPRICE_API_KEY.trim(), Accept:'application/json' },
    redirect:'manual', signal:AbortSignal.timeout(10000)
  });
  // Workers supports manual/follow. Reject redirects without forwarding the secret.
  if (r.status >= 300 && r.status < 400) throw Error('DPrice unexpected redirect HTTP ' + r.status);
  if (!r.ok) throw Error('DPrice HTTP ' + r.status);
  return r.json();
}
function resolveOffer(body, now) {
  const r = body?.meta?.price_resolution;
  if (!r || r.state === 'unavailable' || !priceOK(r.display_price) ||
      !Array.isArray(r.eligible_offer_ids) || !r.eligible_offer_ids.length ||
      !Array.isArray(body.data)) return null;
  const offer = body.data.find(o => String(o.listing_id) === String(r.winner_offer_id) &&
    r.eligible_offer_ids.some(id => String(id) === String(o.listing_id)) &&
    o.price === r.display_price && o.price_type === 'STANDARD' &&
    !o.variant && fresh(o.observed_at, now));
  if (!offer) return null;
  return { price:offer.price, observed_at:new Date(offer.observed_at).toISOString(),
    platform: String(offer.platform || ''), listing_id:String(offer.listing_id) };
}
async function sync(env, now) {
  if (!env.DB || !env.DPRICE_API_KEY) throw Error('Missing DB or DPRICE_API_KEY');
  const rows = await env.DB.prepare('SELECT id, name, category, price FROM products WHERE active = 1 ORDER BY id').all();
  const products = (rows.results || []).filter(p => CATEGORIES.includes(p.category) && priceOK(p.price));
  if (!products.length) return;
  // Rotate through current catalogue without maintaining a separate cursor.
  const product = products[Math.floor(now / 300000) % products.length];
  const query = searchTerm(product);
  const result = await get('products?query=' + encodeURIComponent(query), env);
  const found = Array.isArray(result.data) ? result.data : [];
  const matched = [...new Map(found.filter(p =>
    /^\d+$/.test(String(p.id)) && productMatches(product, p.name))
    .map(p => [String(p.id), p])).values()];
  // Explore different matched listings on successive catalogue rotations.
  const offset = matched.length ? (Math.floor(Math.floor(now / 300000) / products.length) * 2) % matched.length : 0;
  const matches = [...matched.slice(offset), ...matched.slice(0,offset)].slice(0,2);
  console.log('PRICE_MATCH', product.id, 'found', found.length, 'matched', matched.length, 'checked', matches.length);
  const candidates = [];
  for (const match of matches) {
    const body = await get('products/' + match.id + '/offers', env);
    const offer = resolveOffer(body, now);
    if (!offer) {
      const state = body?.meta?.price_resolution?.state;
      console.log('PRICE_REJECTED', product.id, match.id, state === 'unavailable' ? 'DPRICE_UNAVAILABLE' : 'OFFER_INVALID_OR_STALE');
    } else if (Math.abs(offer.price / product.price - 1) > 0.2) {
      console.log('PRICE_REJECTED', product.id, match.id, 'OUTSIDE_REFERENCE_RANGE');
    } else {
      candidates.push({...offer, product_id:String(match.id)});
    }
  }
  if (!candidates.length) {
    console.log('NO_ELIGIBLE_PRICE', product.id, 'matches', matched.length);
    return; // Never replace catalogue prices with null or old offers.
  }
  candidates.sort((a,b)=>a.price-b.price);
  const snapshot = {source:'dprice', sku:product.id, name:product.name, ...candidates[0]};
  await env.DB.prepare(
    'INSERT INTO market_price_snapshots (product_query,response_json,updated_at) VALUES (?,?,?) ' +
    'ON CONFLICT(product_query) DO UPDATE SET response_json=excluded.response_json,updated_at=excluded.updated_at'
  ).bind('dprice:' + product.id, JSON.stringify(snapshot), new Date(now).toISOString()).run();
  console.log('MARKET_PRICE_SAVED', product.id, snapshot.price, snapshot.observed_at);
}
export default {
  async fetch() {
    // Public health only. No unauthenticated sync endpoint or secrets.
    return Response.json({service:'SEMEISTVO TECH Price Engine',version:'2.1.0',status:'online'});
  },
  async scheduled(controller, env) {
    console.log('PRICE_SYNC_START', '2.1.0');
    try {
      await sync(env, controller.scheduledTime || Date.now());
    } catch (err) {
      console.error('PRICE_SYNC_FAILED', err.message);
      throw err;
    }
  }
};
