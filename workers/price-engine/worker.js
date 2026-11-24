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
async function get(path, env) {
  const r = await fetch('https://dprice.id/api/v1/' + path, {
    headers: { Authorization: 'Bearer ' + env.DPRICE_API_KEY.trim(), Accept:'application/json' },
    redirect:'error', signal:AbortSignal.timeout(10000)
  });
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
  const query = product.name.replace(/\(2026\)/g, '').trim();
  const result = await get('products?query=' + encodeURIComponent(query), env);
  const matches = (Array.isArray(result.data) ? result.data : []).filter(p =>
    /^\d+$/.test(String(p.id)) && normalize(p.name) === normalize(query)).slice(0,2);
  const candidates = [];
  for (const match of matches) {
    const offer = resolveOffer(await get('products/' + match.id + '/offers', env), now);
    // Prevent abrupt moves against the original catalogue estimate.
    if (offer && Math.abs(offer.price / product.price - 1) <= 0.2) {
      candidates.push({...offer, product_id:String(match.id)});
    }
  }
  if (!candidates.length) {
    console.log('NO_ELIGIBLE_PRICE', product.id, 'exact matches', matches.length);
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
    return Response.json({service:'SEMEISTVO TECH Price Engine',version:'2.0.0',status:'online'});
  },
  async scheduled(controller, env) {
    await sync(env, controller.scheduledTime || Date.now());
  }
};
