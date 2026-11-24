// SEMEISTVO TECH — standalone Cloudflare Worker. Deploy to semeistvo-price-engine.
// Bind DB (same D1 as Pages), DPRICE_API_KEY (Secret). Cron: */5 * * * *.
// One SKU, at most 3 DPrice requests per slot; optional budget-limited SerpApi fallback.
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

const SKU_RULES = {
  "cpu-r5-9600x": [
    "amd|ryzen;9600x",
    "9600x3d"
  ],
  "cpu-r7-9700x": [
    "amd|ryzen;9700x",
    ""
  ],
  "cpu-r7-9850x3d": [
    "amd|ryzen;9850x3d",
    ""
  ],
  "cpu-r9-9950x3d": [
    "amd|ryzen;9950x3d",
    ""
  ],
  "cpu-ultra5-250kplus": [
    "intel|core ultra;250k plus|250kplus",
    ""
  ],
  "cpu-ultra7-270kplus": [
    "intel|core ultra;270k plus|270kplus",
    ""
  ],
  "cpu-ultra9-285k": [
    "intel|core ultra;285k",
    "285kf;285k plus;285kplus"
  ],
  "mb-asus-b850": [
    "asus;tuf;b850 plus|b850plus;wifi|wi fi",
    "b850m;b850i;wifi ii;wifi2"
  ],
  "mb-msi-b850": [
    "msi;b850 gaming plus;wifi|wi fi",
    "b850m;b850i;wifi ii;wifi2"
  ],
  "mb-asrock-b850i": [
    "asrock;b850i|b850 i;lightning;wifi|wi fi",
    ""
  ],
  "mb-msi-b860": [
    "msi;b860;tomahawk;wifi|wi fi",
    "b860m;b860i;wifi ii;wifi2"
  ],
  "mb-gigabyte-z890": [
    "gigabyte;z890;aorus elite;wifi7|wifi 7|wi fi 7;ice",
    ""
  ],
  "ram-16-ddr5": [
    "kingston;fury beast;16gb|16 gb;2x8|2x8gb|2 x 8|2 x 8gb;ddr5;5600|5600mhz",
    "rgb;32gb;1x16;1 x 16"
  ],
  "ram-32-ddr5": [
    "g skill|gskill;flare x5;32gb|32 gb;2x16|2x16gb|2 x 16|2 x 16gb;ddr5;6000|6000mhz",
    "64gb;1x32;1 x 32"
  ],
  "ram-32-white": [
    "teamgroup|team group;t force|tforce;delta;rgb;32gb|32 gb;ddr5;6000|6000mhz;white|putih",
    "black;hitam;64gb;1x32;1 x 32"
  ],
  "ram-64-ddr5": [
    "corsair;vengeance;64gb|64 gb;2x32|2x32gb|2 x 32|2 x 32gb;ddr5;6000|6000mhz",
    "rgb;128gb;1x64;1 x 64"
  ],
  "ssd-wd-sn850x-1t": [
    "wd|western digital;sn850x;1tb|1 tb|1000gb",
    "2tb;2 tb;4tb;4 tb;8tb;8 tb"
  ],
  "ssd-samsung-990pro-2t": [
    "samsung;990 pro|990pro;2tb|2 tb|2000gb",
    "1tb;1 tb;4tb;4 tb"
  ],
  "ssd-crucial-t705-2t": [
    "crucial;t705;2tb|2 tb|2000gb",
    "1tb;1 tb;4tb;4 tb"
  ],
  "ssd-kingston-kc3000-2t": [
    "kingston;kc3000;2tb|2 tb|2048gb|2000gb",
    "1tb;1 tb;4tb;4 tb;512gb"
  ],
  "psu-msi-650": [
    "msi;a650bn;650w|650 w",
    "a650bnl;750w"
  ],
  "psu-corsair-850": [
    "corsair;rm850e;850w|850 w",
    "rm850x;750w;1000w"
  ],
  "psu-cm-sfx850": [
    "cooler master|coolermaster;v sfx|vsfx|v850 sfx|v850sfx;850w|850 w|v850;gold;white|putih",
    "black;hitam;sfx l;sfxl;750w;1000w"
  ],
  "psu-seasonic-1000": [
    "seasonic;focus gx;1000w|1000 w|gx1000|gx 1000;gold",
    "850w;750w;1300w"
  ],
  "case-ch160-white": [
    "deepcool|deep cool;ch160;white|putih|wh",
    "ch160 plus;ch160plus;ch160 mesh;black;hitam"
  ],
  "case-air903": [
    "montech;air 903 max|air903 max|air903max;black|hitam|bk",
    "base;white;putih"
  ],
  "case-o11": [
    "lian li|lianli;o11d evo|o11devo;rgb;white|putih",
    "xl;mini;black;hitam"
  ],
  "case-nr200p": [
    "cooler master|coolermaster;nr200p;white|putih",
    "v2;v 2;max;black;hitam"
  ],
  "cooler-ak400": [
    "deepcool|deep cool;ak400",
    "digital;zero dark;plus;white;wh"
  ],
  "cooler-ak620": [
    "deepcool|deep cool;ak620",
    "digital;zero dark;white;wh"
  ],
  "cooler-arctic-240": [
    "arctic;liquid freezer iii|liquid freezer 3;240|240mm",
    "280;360;420;rgb;argb;a rgb;pro;white;putih"
  ],
  "cooler-nzxt-360": [
    "nzxt;kraken elite;360|360mm;rgb",
    "240;280;420"
  ],
  "acc-arctic-p12": [
    "arctic;p12;pwm;pst;120mm|120 mm|120",
    "rgb;argb;a rgb;max;pro;slim;co;5 pack;5pack;3 pack;3pack;value pack;white;putih"
  ]
};
function words(s){return String(s||"").normalize("NFKC").toLowerCase().replace(/×/g,"x").replace(/[^a-z0-9]+/g," ").trim()}
function has(s,t){return (" "+s+" ").includes(" "+words(t)+" ")}
function ruleMatches(rule,name){const s=words(name);return rule[0].split(";").every(group=>group.split("|").some(t=>has(s,t)))&&!rule[1].split(";").filter(Boolean).some(t=>has(s,t))}
function nonGpuMatches(product, name) {
  const s = words(name);
  // Refuse bundle/used/parts-only listings in every physical category.
  if (/\b(?:bekas|second|used|refurbished|refurb|rusak|defect|repair|sparepart|kardus|bundling|bundle|rakitan|paket pc|pc rakitan|pc gaming|fullset|box only|unit rusak|replacement)\b/.test(s)) return false;
  if (product.category === 'cpu' && /\b(?:motherboard|ssd|nvme|ram|rtx|rx|mainboard|mobo)\b/.test(s)) return false;
  if (product.category !== 'cpu' && /\b(?:ryzen|core ultra|intel core)\b/.test(s)) return false;
  const rule = SKU_RULES[product.id];
  // Unmapped or generic items require an exact description; never guess a variant.
  return rule ? ruleMatches(rule, name) : normalize(product.name) === normalize(name);
}
async function recordCheck(env, product, now, status, details) {
  const payload = {sku:product.id, name:product.name, status, ...details};
  await env.DB.prepare(
    'INSERT INTO market_price_snapshots (product_query,response_json,updated_at) VALUES (?,?,?) ' +
    'ON CONFLICT(product_query) DO UPDATE SET response_json=excluded.response_json,updated_at=excluded.updated_at'
  ).bind('dprice-check:' + product.id, JSON.stringify(payload), new Date(now).toISOString()).run();
}

function productMatches(product, name) {
  if (product.category !== 'gpu') return nonGpuMatches(product, name);
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

// Optional Google Shopping fallback. Never expose the key or raw upstream JSON.
const SERP_INTERVAL = 7 * 86400000;
function shoppingPrice(item) {
  const raw = String(item?.price || '').trim();
  if (!/^(?:Rp\.?|IDR)\s*[\d.,]+$/i.test(raw) || item?.installment ||
      item?.second_hand_condition || !priceOK(item?.extracted_price)) return null;
  return item.extracted_price;
}
function shoppingEstimate(items, product) {
  const merchants = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!productMatches(product, item?.title)) continue;
    const price = shoppingPrice(item);
    const merchant = words(item?.source);
    if (!merchant || !price || Math.abs(price / product.price - 1) > 0.2 ||
        /\b(?:cicilan|angsuran|deposit|uang muka|dp|preorder|pre order|sewa|rental|bekas|used|refurbished|second)\b/.test(words(item.title))) continue;
    if (!merchants.has(merchant) || price < merchants.get(merchant)) merchants.set(merchant,price);
  }
  const values = [...merchants.values()].sort((a,b)=>a-b);
  // Require at least two distinct named sources with mutually consistent prices.
  if (values.length < 2 || values[values.length-1] / values[0] > 1.2) return null;
  const mid = Math.floor(values.length/2);
  const price = values.length % 2 ? values[mid] : Math.round((values[mid-1]+values[mid])/2);
  return {price, merchant_count:values.length};
}
async function reserveSerp(env, product, now) {
  const limit = Number(env.SERPAPI_MONTHLY_LIMIT || 200);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100000) return 'SERP_LIMIT_INVALID';
  const key = 'serp-attempt:' + product.id;
  const previous = await env.DB.prepare('SELECT updated_at FROM market_price_snapshots WHERE product_query = ?').bind(key).first();
  if (previous && now - Date.parse(previous.updated_at) < SERP_INTERVAL) return 'SERP_COOLDOWN';
  // Atomic reservation per UTC calendar month. Counts attempts, including failures.
  const month = 'serp-quota:' + new Date(now).toISOString().slice(0,7);
  const stamp = new Date(now).toISOString();
  const claim = await env.DB.prepare(
    "INSERT INTO market_price_snapshots (product_query,response_json,updated_at) VALUES (?, '1', ?) " +
    "ON CONFLICT(product_query) DO UPDATE SET response_json=CAST(CAST(response_json AS INTEGER)+1 AS TEXT),updated_at=excluded.updated_at " +
    "WHERE CAST(response_json AS INTEGER) < ?"
  ).bind(month,stamp,limit).run();
  if (!claim.meta?.changes) return 'SERP_MONTHLY_LIMIT';
  await env.DB.prepare(
    "INSERT INTO market_price_snapshots (product_query,response_json,updated_at) VALUES (?, '{}', ?) " +
    "ON CONFLICT(product_query) DO UPDATE SET updated_at=excluded.updated_at"
  ).bind(key,stamp).run();
  return null;
}
async function serpFallback(env, product, now) {
  if (!env.SERPAPI_KEY) return {reason:'SERP_NOT_CONFIGURED'};
  const blocked = await reserveSerp(env,product,now);
  if (blocked) return {reason:blocked};
  const params = new URLSearchParams({engine:'google_shopping',q:searchTerm(product),gl:'id',hl:'id',api_key:env.SERPAPI_KEY.trim(),no_cache:'true'});
  let body;
  try {
    const response = await fetch('https://serpapi.com/search.json?' + params, {
      redirect:'manual', headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)
    });
    if (!response.ok) return {reason:'SERP_HTTP_' + response.status};
    body = await response.json();
  } catch (_) { return {reason:'SERP_REQUEST_FAILED'}; }
  if (body?.error || body?.search_metadata?.status !== 'Success') return {reason:'SERP_SEARCH_FAILED'};
  const estimate = shoppingEstimate(body.shopping_results,product);
  if (!estimate) return {reason:'SERP_NO_CORROBORATED_PRICE'};
  const snapshot = {source:'serpapi',sku:product.id,name:product.name,...estimate,
    retrieved_at:new Date().toISOString(),platform:'Google Shopping'};
  await env.DB.prepare(
    'INSERT INTO market_price_snapshots (product_query,response_json,updated_at) VALUES (?,?,?) ' +
    'ON CONFLICT(product_query) DO UPDATE SET response_json=excluded.response_json,updated_at=excluded.updated_at'
  ).bind('serpapi:' + product.id,JSON.stringify(snapshot),new Date(now).toISOString()).run();
  return {snapshot};
}

async function sync(env, now) {
  if (!env.DB || (!env.DPRICE_API_KEY && !env.SERPAPI_KEY)) throw Error('Missing DB or price API key');
  const rows = await env.DB.prepare('SELECT id, name, category, price FROM products WHERE active = 1 ORDER BY id').all();
  const products = (rows.results || []).filter(p => CATEGORIES.includes(p.category) && priceOK(p.price));
  if (!products.length) return;
  // Rotate through current catalogue without maintaining a separate cursor.
  const product = products[Math.floor(now / 300000) % products.length];
  const query = searchTerm(product);
  console.log('PRICE_CHECK_SKU', product.id, product.category);
  const rejections = [];
  let result = {};
  if (env.DPRICE_API_KEY) {
    try { result = await get('products?query=' + encodeURIComponent(query), env); }
    catch (_) { rejections.push('DPRICE_SEARCH_FAILED'); }
  } else rejections.push('DPRICE_NOT_CONFIGURED');
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
    let body;
    try { body = await get('products/' + match.id + '/offers', env); }
    catch (_) { rejections.push('DPRICE_OFFER_FAILED'); continue; }
    const offer = resolveOffer(body, now);
    if (!offer) {
      const state = body?.meta?.price_resolution?.state;
      const reason = state === 'unavailable' ? 'DPRICE_UNAVAILABLE' : 'OFFER_INVALID_OR_STALE';
      rejections.push(reason);
      console.log('PRICE_REJECTED', product.id, match.id, reason);
    } else if (Math.abs(offer.price / product.price - 1) > 0.2) {
      rejections.push('OUTSIDE_REFERENCE_RANGE');
      console.log('PRICE_REJECTED', product.id, match.id, 'OUTSIDE_REFERENCE_RANGE');
    } else {
      candidates.push({...offer, product_id:String(match.id)});
    }
  }
  if (!candidates.length) {
    const fallback = await serpFallback(env,product,now);
    if (fallback.snapshot) {
      await recordCheck(env,product,now,'saved',{source:'serpapi',price:fallback.snapshot.price,merchant_count:fallback.snapshot.merchant_count,rejections});
      console.log('MARKET_PRICE_SAVED',product.id,fallback.snapshot.price,'serpapi');
      return;
    }
    rejections.push(fallback.reason);
    await recordCheck(env, product, now, matched.length ? 'no_eligible_offer' : 'no_match', {found:found.length, matched:matched.length, checked:matches.length, rejections});
    console.log('NO_ELIGIBLE_PRICE', product.id, 'matches', matched.length);
    return; // Never replace catalogue prices with null or old offers.
  }
  candidates.sort((a,b)=>a.price-b.price);
  const snapshot = {source:'dprice', sku:product.id, name:product.name, ...candidates[0]};
  await env.DB.prepare(
    'INSERT INTO market_price_snapshots (product_query,response_json,updated_at) VALUES (?,?,?) ' +
    'ON CONFLICT(product_query) DO UPDATE SET response_json=excluded.response_json,updated_at=excluded.updated_at'
  ).bind('dprice:' + product.id, JSON.stringify(snapshot), new Date(now).toISOString()).run();
  await recordCheck(env, product, now, 'saved', {found:found.length, matched:matched.length, checked:matches.length, price:snapshot.price, observed_at:snapshot.observed_at});
  console.log('MARKET_PRICE_SAVED', product.id, snapshot.price, snapshot.observed_at);
}
export default {
  async fetch(request, env) {
    // Public health only. No unauthenticated sync endpoint or secrets.
    return Response.json({service:'SEMEISTVO TECH Price Engine',version:'3.0.0',status:'online',dprice_configured:!!env.DPRICE_API_KEY,serpapi_configured:!!env.SERPAPI_KEY});
  },
  async scheduled(controller, env) {
    console.log('PRICE_SYNC_START', '3.0.0');
    try {
      await sync(env, controller.scheduledTime || Date.now());
    } catch (err) {
      console.error('PRICE_SYNC_FAILED', err.message);
      throw err;
    }
  }
};
