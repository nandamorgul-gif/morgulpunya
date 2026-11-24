/**
 * SEMEISTVO TECH — Cloudflare Pages Functions / D1 API (quote-only MVP).
 * Runs in the Workers runtime; does not require Express, Node or better-sqlite3.
 * Payments/orders creation are intentionally DISABLED until a reviewed gateway
 * implementation handles reservations, callbacks and idempotency on D1.
 */
const encoder = new TextEncoder();
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async text => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))));
const constantTime = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const n = Math.max(a.length, b.length);
  let different = a.length ^ b.length;
  for (let i = 0; i < n; i++) different |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return different === 0;
};
const json = (body, status = 200, extra = {}) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }
});
const failure = (status, msg) => json({ error: msg }, status);
const validString = (value, max, min = 1) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const pathParts = url => {
  const pathname = new URL(url).pathname;
  if (!pathname.startsWith('/api/')) return [];
  return pathname.slice(5).split('/').map(part => decodeURIComponent(part)).filter(Boolean);
};
function sameOrigin(request) {
  const site = new URL(request.url).origin;
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  try {
    if (origin) return new URL(origin).origin === site;
    if (referer) return new URL(referer).origin === site;
    return false;
  } catch { return false; }
}
async function bodyJSON(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 50000 || !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw Object.assign(new Error('Gunakan JSON berukuran maksimal 50KB.'), { status: 400 });
  }
  const text = await request.text();
  if (text.length > 50000) throw Object.assign(new Error('Payload terlalu besar.'), { status: 400 });
  try { return JSON.parse(text); }
  catch { throw Object.assign(new Error('Format JSON tidak valid.'), { status: 400 }); }
}
function getCookie(request, name) {
  const all = request.headers.get('Cookie') || '';
  return all.split(';').map(item => item.trim()).find(item => item.startsWith(name + '='))?.slice(name.length + 1) || '';
}
function setCookie(token, maxAge) {
  const value = token ? 'svo_admin_session=' + token : 'svo_admin_session=';
  return value + '; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge;
}
async function authorize(request, env) {
  const token = getCookie(request, 'svo_admin_session');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = await sha256(token);
  const session = await env.DB.prepare('SELECT email, expires_at FROM admin_sessions WHERE token_hash = ?')
    .bind(hash).first();
  return session && Number(session.expires_at) > Date.now() ? session.email : null;
}
function allowedImage(image) {
  if (typeof image !== 'string' || image.length > 500) return false;
  if (/^images\/(products|catalog)\/[a-z0-9-]+\.svg$/.test(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password && !/\s/.test(image);
  } catch { return false; }
}
async function login(request, env) {
  if (!sameOrigin(request)) return failure(403, 'Origin tidak diizinkan.');
  const emailConfigured = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  const passwordConfigured = String(env.ADMIN_PASSWORD || '');
  if (!emailConfigured || passwordConfigured.length < 16) {
    return failure(503, 'Login admin belum dikonfigurasi pada Cloudflare.');
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await sha256(passwordConfigured + ':' + ip);
  const now = Date.now();
  const resetAt = now + 15 * 60 * 1000;
  await env.DB.prepare(
    'INSERT INTO admin_login_attempts (ip_hash, attempts, reset_at) VALUES (?, 1, ?) ' +
    'ON CONFLICT(ip_hash) DO UPDATE SET attempts = CASE WHEN reset_at <= ? THEN 1 ELSE attempts + 1 END, ' +
    'reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END'
  ).bind(ipHash, resetAt, now, now).run();
  const state = await env.DB.prepare('SELECT attempts FROM admin_login_attempts WHERE ip_hash = ?')
    .bind(ipHash).first();
  if (state && state.attempts > 8) return failure(429, 'Terlalu banyak percobaan login. Coba lagi nanti.');
  const data = await bodyJSON(request);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = data.password;
  if (!validString(email, 150) || !validString(password, 1000)) return failure(400, 'Login tidak valid.');
  const [providedHash, expectedHash] = await Promise.all([sha256(password), sha256(passwordConfigured)]);
  if (!constantTime(email, emailConfigured) || !constantTime(providedHash, expectedHash)) {
    return failure(401, 'Email atau password salah.');
  }
  await env.DB.prepare('DELETE FROM admin_login_attempts WHERE ip_hash = ?').bind(ipHash).run();
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now).run();
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash, email, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), emailConfigured, now + 8 * 3600000).run();
  return json({ ok: true, email: emailConfigured }, 200, { 'Set-Cookie': setCookie(token, 8 * 3600) });
}
async function adminProducts(request, env, path) {
  if (request.method === 'GET' && path.length === 2) {
    const data = await env.DB.prepare('SELECT * FROM products ORDER BY category, name').all();
    return json({ products: data.results || [] });
  }
  if (request.method !== 'PATCH' || path.length !== 3) return failure(405, 'Metode tidak didukung.');
  const id = path[2];
  if (!/^[a-z0-9-]{2,100}$/.test(id)) return failure(400, 'ID produk tidak valid.');
  const payload = await bodyJSON(request);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return failure(400, 'Data tidak valid.');
  const allowed = new Set(['name','brand','description','image','price','stock','active']);
  const entries = Object.entries(payload);
  if (!entries.length || entries.some(([key]) => !allowed.has(key))) return failure(400, 'Field tidak diizinkan.');
  for (const [key, value] of entries) {
    if (key === 'name' || key === 'brand') {
      if (!validString(value, 500)) return failure(400, 'Nama atau brand tidak valid.');
    } else if (key === 'description') {
      if (!validString(value, 1000, 0)) return failure(400, 'Deskripsi tidak valid.');
    } else if (key === 'image') {
      if (!allowedImage(value)) return failure(400, 'Foto harus URL HTTPS atau aset SVG lokal.');
    } else if (key === 'active') {
      if (value !== 0 && value !== 1) return failure(400, 'Status produk tidak valid.');
    } else if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000) {
      return failure(400, 'Harga atau stok tidak valid.');
    }
  }
  const current = await env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (!current) return failure(404, 'Produk tidak ditemukan.');
  const set = entries.map(([key]) => key + ' = ?').join(', ');
  await env.DB.prepare('UPDATE products SET ' + set + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(...entries.map(([,v]) => v), id).run();
  return json({ product: await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first() });
}
async function adminOrders(request, env, path) {
  if (request.method === 'GET' && path.length === 2) {
    const data = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
    const orders = [];
    for (const order of data.results || []) {
      const items = await env.DB.prepare(
        'SELECT product_id, product_name, quantity, unit_price FROM order_items WHERE order_id = ?'
      ).bind(order.id).all();
      const { access_token_hash, ...safe } = order;
      orders.push({ ...safe, items: items.results || [] });
    }
    return json({ orders });
  }
  if (request.method !== 'PATCH' || path.length !== 3) return failure(405, 'Metode tidak didukung.');
  const id = path[2];
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return failure(400, 'ID pesanan tidak valid.');
  const payload = await bodyJSON(request);
  if (!payload || Object.keys(payload).length !== 1) return failure(400, 'Data tidak valid.');
  const order = await env.DB.prepare('SELECT status FROM orders WHERE id = ?').bind(id).first();
  if (!order) return failure(404, 'Pesanan tidak ditemukan.');
  const transitions = {
    paid: ['processing','refunded'], processing: ['shipped','refunded'], shipped: ['completed','refunded']
  };
  if (!transitions[order.status]?.includes(payload.status)) return failure(409, 'Perubahan status tidak diizinkan.');
  await env.DB.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
    .bind(payload.status, Date.now(), id, order.status).run();
  return json({ ok: true, status: payload.status, refund_automatic: false });
}
async function adminRoute(request, env, path) {
  if (path.length === 2 && path[1] === 'login' && request.method === 'POST') return login(request, env);
  const email = await authorize(request, env);
  if (!email) return failure(401, 'Login admin diperlukan.');
  if (request.method !== 'GET' && !sameOrigin(request)) return failure(403, 'Origin tidak diizinkan.');
  if (path.length === 2 && path[1] === 'logout' && request.method === 'POST') {
    const token = getCookie(request, 'svo_admin_session');
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': setCookie('', 0) });
  }
  if (path.length === 2 && path[1] === 'me' && request.method === 'GET') return json({ email });
  if (path[1] === 'products') return adminProducts(request, env, path);
  if (path[1] === 'orders') return adminOrders(request, env, path);
  return failure(404, 'Endpoint admin tidak ditemukan.');
}
// Live wholesale/catalogue feed — source must be configured by the site owner.
// No prices are generated, guessed, or scraped from third-party shops.
// A short edge-isolate cache caps upstream traffic; browsers poll every 2 min.
let supplierCache = { key: '', expires: 0, data: null };
async function supplierPrices(env) {
  if (!env.PRICE_FEED_URL) return { status: 'not_configured', prices: new Map(), updated_at: null };
  const identity = String(env.PRICE_FEED_URL);
  if (supplierCache.key === identity && supplierCache.data && Date.now() < supplierCache.expires)
    return supplierCache.data;
  const missing = { status: 'unavailable', prices: new Map(), updated_at: null };
  try {
    const url = new URL(identity);
    if (url.protocol !== 'https:' || url.username || url.password ||
        /^(localhost|127\\.|10\\.|192\\.168\\.|169\\.254\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.)/i.test(url.hostname))
      return missing;
    const headers = { Accept: 'application/json' };
    if (env.PRICE_FEED_TOKEN) headers.Authorization = 'Bearer ' + String(env.PRICE_FEED_TOKEN);
    const res = await fetch(url.toString(), { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return missing;
    const body = await res.text();
    if (body.length > 250000) return missing;
    const feed = JSON.parse(body);
    const stamped = Date.parse(feed?.updated_at);
    if (!Number.isFinite(stamped) || stamped > Date.now() + 300000 ||
        Date.now() - stamped > 3600000 || feed?.currency !== 'IDR' ||
        !Array.isArray(feed.products) || feed.products.length > 500 || !feed.products.length) return missing;
    const prices = new Map();
    for (const p of feed.products) {
      if (typeof p?.id !== 'string' || !/^[a-z0-9-]{2,100}$/.test(p.id) ||
          !Number.isSafeInteger(p.price) || p.price <= 0 || p.price > 1000000000 ||
          (p.stock !== undefined && (!Number.isSafeInteger(p.stock) || p.stock < 0 || p.stock > 1000000)) ||
          prices.has(p.id)) return missing;
      prices.set(p.id, { price: p.price, stock: p.stock });
    }
    const output = { status: 'live', prices, updated_at: new Date(stamped).toISOString() };
    supplierCache = { key: identity, expires: Date.now() + 60000, data: output };
    return output;
  } catch (error) {
    // A supplier outage does not overwrite D1 prices or invent a new price.
    return missing;
  }
}


/** DPrice snapshots are reference-market estimates, never confirmed inventory.
 * Missing table, unavailable offers and expired observations fall back to D1. */
async function marketReferences(env) {
  const prices = new Map();
  try {
    const result = await env.DB.prepare(
      "SELECT product_query, response_json FROM market_price_snapshots WHERE product_query LIKE 'dprice:%' OR product_query LIKE 'serpapi:%'"
    ).all();
    const now = Date.now();
    for (const row of result.results || []) {
      try {
        const p = JSON.parse(row.response_json);
        const source = p.source;
        const timestamp = source === 'dprice' ? p.observed_at : p.retrieved_at;
        const stamp = Date.parse(timestamp);
        if (!['dprice','serpapi'].includes(source) || typeof p.sku !== 'string' ||
            row.product_query !== source + ':' + p.sku ||
            (source === 'serpapi' && (!Number.isSafeInteger(p.merchant_count) || (p.merchant_count < 2 && !(p.merchant_count === 1 && ['google_search','google_shopping'].includes(p.method) && p.confidence === 'single_source')))) ||
            !Number.isSafeInteger(p.price) || p.price <= 0 || p.price > 1000000000 ||
            !Number.isFinite(stamp) || stamp > now || now - stamp > 7 * 86400000) continue;
        const entries = prices.get(p.sku) || [];
        entries.push({...p, timestamp});
        prices.set(p.sku, entries);
      } catch (_) { /* Ignore malformed snapshots individually. */ }
    }
  } catch (_) { /* Existing installations may not have the snapshot table yet. */ }
  return prices;
}

// Dated single-store references, not live prices or confirmed stock.
// Automated D1 market snapshots and supplier prices always take priority.
const INITIAL_MARKET_REFERENCES = {
  "cpu-r7-9700x": [
    "AMD Ryzen 7 9700X",
    4509000,
    "https://ecommerce.enterkomputer.com/category/desktop-cpus",
    "Tray; SKU 191622"
  ],
  "gpu-rx9060xt16": [
    "AMD Radeon RX 9060 XT 16GB",
    9900000,
    "https://ecommerce.enterkomputer.com/category/graphics-cards-gpu",
    "ASRock Challenger OC; SKU 195965"
  ],
  "gpu-rx9070": [
    "AMD Radeon RX 9070 16GB",
    14800000,
    "https://ecommerce.enterkomputer.com/category/graphics-cards-gpu",
    "Sapphire NITRO+ OC; SKU 194838"
  ],
  "gpu-rx9070xt": [
    "AMD Radeon RX 9070 XT 16GB",
    18500000,
    "https://ecommerce.enterkomputer.com/category/graphics-cards-gpu",
    "Sapphire NITRO+ OC; SKU 194015"
  ],
  "gpu-rtx5060ti16": [
    "NVIDIA GeForce RTX 5060 Ti 16GB",
    15255000,
    "https://ecommerce.enterkomputer.com/product/msi-geforce-rtx-5060-ti-16gb-gddr7-ventus-2x-oc-plus-195146",
    "MSI Ventus 2X OC Plus; SKU 195146"
  ],
  "gpu-rtx5070": [
    "NVIDIA GeForce RTX 5070 12GB",
    16100000,
    "https://ecommerce.enterkomputer.com/category/graphics-cards-gpu",
    "GALAX 1-Click OC; SKU 194846"
  ],
  "gpu-rtx5070ti": [
    "NVIDIA GeForce RTX 5070 Ti 16GB",
    23500000,
    "https://ecommerce.enterkomputer.com/product/inno3d-geforce-rtx-5070-ti-16gb-gddr7-x3-enormous-cooler-with-triple-fan-garansi-3-thn-194518",
    "Inno3D X3; SKU 194518"
  ],
  "gpu-rtx5080": [
    "NVIDIA GeForce RTX 5080 16GB",
    29500000,
    "https://ecommerce.enterkomputer.com/",
    "Inno3D X3; SKU 194014"
  ],
  "cpu-r5-9600x": [
    "AMD Ryzen 5 9600X",
    3400000,
    "https://viraindo.net/proc.html",
    "Tray"
  ],
  "cpu-r7-9850x3d": [
    "AMD Ryzen 7 9850X3D (2026)",
    8700000,
    "https://viraindo.net/proc.html",
    "Tray"
  ],
  "cpu-r9-9950x3d": [
    "AMD Ryzen 9 9950X3D",
    12300000,
    "https://viraindo.net/proc.html",
    "Tray; standard 9950X3D"
  ],
  "cpu-ultra5-250kplus": [
    "Intel Core Ultra 5 250K Plus (2026)",
    5178000,
    "https://impcindonesia.com/product/intel-core-ultra-5-processor-250k-plus-desktop-processor-18-6p12e-cores-1851/",
    "iMPC listed processor"
  ],
  "cpu-ultra7-270kplus": [
    "Intel Core Ultra 7 270K Plus (2026)",
    5849000,
    "https://ecommerce.enterkomputer.com/product/intel-core-ultra-7-270k-plus-32ghz-up-to-55ghz-cache-36mb-tray-socket-lga-1851-arrow-lake-series-new-unit-1-years-warranty-202766",
    "Tray"
  ],
  "cpu-ultra9-285k": [
    "Intel Core Ultra 9 285K",
    8500000,
    "https://viraindo.net/proc.html",
    "Tray"
  ],
  "gpu-rtx5090": [
    "NVIDIA GeForce RTX 5090 32GB",
    58500000,
    "https://viraindo.net/vga.html",
    "Palit GameRock 32GB"
  ],
  "mb-asus-b850": [
    "ASUS TUF GAMING B850-PLUS WIFI",
    4400000,
    "https://viraindo.net/motherboard.html",
    "TUF B850-PLUS WIFI ATX"
  ],
  "mb-msi-b850": [
    "MSI B850 GAMING PLUS WIFI",
    3400000,
    "https://viraindo.net/motherboard.html",
    "B850 GAMING PLUS WIFI"
  ],
  "mb-asrock-b850i": [
    "ASRock B850I Lightning WiFi",
    3690000,
    "https://viraindo.net/motherboard.html",
    "B850I Lightning WIFI"
  ],
  "mb-msi-b860": [
    "MSI MAG B860 TOMAHAWK WIFI",
    4400000,
    "https://viraindo.net/motherboard.html",
    "MAG B860 TOMAHAWK WIFI"
  ],
  "mb-gigabyte-z890": [
    "GIGABYTE Z890 AORUS ELITE WIFI7 ICE",
    5400000,
    "https://viraindo.net/motherboard.html",
    "Z890 Aorus Elite WIFI7 ICE"
  ],
  "ram-16-ddr5": [
    "Kingston FURY Beast 16GB (2×8GB) DDR5-5600",
    6600000,
    "https://viraindo.net/memory.html",
    "KF556C36BBEK2-16; 2x8GB"
  ],
  "ram-32-ddr5": [
    "G.Skill Flare X5 32GB (2×16GB) DDR5-6000",
    5850000,
    "https://viraindo.net/memory.html",
    "F5-6000J3636F16GX2-FX5; 2x16GB"
  ],
  "ram-32-white": [
    "TEAMGROUP T-Force Delta RGB 32GB DDR5-6000 White",
    7800000,
    "https://viraindo.net/memory.html",
    "FF4D532G6000HC38JDC01; 2x16GB White"
  ],
  "ram-64-ddr5": [
    "Corsair Vengeance 64GB (2×32GB) DDR5-6000",
    19900000,
    "https://viraindo.net/memory.html",
    "CMK64GX5M2D6000Z40; 2x32GB"
  ],
  "ssd-wd-sn850x-1t": [
    "WD_BLACK SN850X 1TB NVMe PCIe 4.0",
    4000000,
    "https://viraindo.net/storage.html",
    "SN850X 1TB"
  ],
  "ssd-samsung-990pro-2t": [
    "Samsung 990 PRO 2TB NVMe PCIe 4.0",
    10900000,
    "https://viraindo.net/storage.html",
    "MZ-V9P2T0BW; no heatsink"
  ],
  "ssd-crucial-t705-2t": [
    "Crucial T705 2TB NVMe PCIe 5.0",
    5650000,
    "https://viraindo.net/storage.html",
    "CT2000T705SSD3"
  ],
  "ssd-kingston-kc3000-2t": [
    "Kingston KC3000 2TB NVMe PCIe 4.0",
    3300000,
    "https://viraindo.net/storage.html",
    "SKC3000D/2048G"
  ],
  "psu-msi-650": [
    "MSI MAG A650BN 650W 80+ Bronze",
    800000,
    "https://viraindo.net/psu.html",
    "MAG A650BN 650W Bronze"
  ],
  "psu-corsair-850": [
    "Corsair RM850e 850W 80+ Gold",
    2170000,
    "https://viraindo.net/psu.html",
    "RM850e ATX 3.1 Black"
  ],
  "psu-cm-sfx850": [
    "Cooler Master V SFX Gold 850W White",
    2130000,
    "https://viraindo.net/psu.html",
    "V SFX Gold 850W ATX 3.1 White"
  ],
  "psu-seasonic-1000": [
    "Seasonic FOCUS GX-1000 1000W Gold",
    3150000,
    "https://viraindo.net/psu.html",
    "FOCUS GX-1000 ATX 3.1"
  ],
  "case-ch160-white": [
    "DeepCool CH160 WH Mini-ITX White",
    695000,
    "https://www.enterkomputer.com/detail/189454/Deepcool-CH160-WHITE-Ultra-Portable-Mini-ITX-Case",
    "CH160 White; SKU 189454"
  ],
  "case-air903": [
    "Montech AIR 903 MAX Black",
    999000,
    "https://nanokomputer.com/products/montech-air-903-max?variant=51470286946626",
    "Black; listed sold out"
  ],
  "case-o11": [
    "Lian Li O11D EVO RGB White",
    3050000,
    "https://viraindo.net/casing.html",
    "O11 Dynamic EVO RGB White"
  ],
  "case-nr200p": [
    "Cooler Master NR200P White Mini-ITX",
    1153000,
    "https://www.enterkomputer.com/detail/168124/Cooler-Master-MasterBox-NR200P-White",
    "Original NR200P White; SKU 168124"
  ],
  "cooler-ak400": [
    "DeepCool AK400 Air Cooler",
    350000,
    "https://viraindo.net/cooler.html",
    "AK400 standard"
  ],
  "cooler-ak620": [
    "DeepCool AK620 Dual Tower Air Cooler",
    860000,
    "https://viraindo.net/cooler.html",
    "AK620 standard"
  ],
  "cooler-arctic-240": [
    "ARCTIC Liquid Freezer III 240 AIO",
    965000,
    "https://viraindo.net/cooler.html",
    "Liquid Freezer III 240 non RGB"
  ],
  "cooler-nzxt-360": [
    "NZXT Kraken Elite 360 RGB AIO",
    4680000,
    "https://viraindo.net/cooler.html",
    "Kraken Elite 360 RGB"
  ],
  "acc-arctic-p12": [
    "ARCTIC P12 PWM PST Fan 120mm",
    135000,
    "https://rtcbali.com/product/fan-casing-arctic-p12-pwm-pst-120mm/",
    "ACFAN00120A; single fan"
  ],
  "acc-sleeves": [
    "Custom Sleeved Cable Extension Set",
    287000,
    "https://www.blibli.com/p/ezdiy-fab-16awg-psu-extension-cable-kit-6-cables-white-putih-kabel-sleeved-pc-original-garansi-resmi/ps--FOC-70056-01382",
    "Comparable reference: EZDIY-FAB 16AWG 6 cable kit"
  ],
  "acc-bracket": [
    "GPU Support Bracket Adjustable",
    29999,
    "https://shopee.co.id/list/Graphic%20Card/Bracket",
    "Comparable reference: adjustable metal anti-sag holder listing"
  ]
};
const INITIAL_MARKET_DATE = '2026-11-24';

export async function onRequest(context) {
  const { request, env } = context;
  try {
    const path = pathParts(request.url);
    if (!path.length) return failure(404, 'Endpoint tidak ditemukan.');
    if (!env.DB || typeof env.DB.prepare !== 'function') {
      // No secret values or environment binding names are reflected to clients.
      // This specifically distinguishes a missing PRODUCTION deployment binding
      // from an SQL error in an otherwise connected database.
      return json({
        ok: false,
        error: 'Binding D1 bernama DB belum tersedia pada deployment Cloudflare Pages ini.',
        diagnostic: 'D1_BINDING_MISSING_ON_ACTIVE_DEPLOYMENT',
        next_step: 'Periksa Settings > Production > Bindings, lalu terbitkan deployment Production baru dari branch Cloudflare.'
      }, 503);
    }
    if (path.length === 1 && path[0] === 'health' && request.method === 'GET') {
      await env.DB.prepare('SELECT id FROM products LIMIT 1').first();
      return json({ ok: true, database: 'd1', payment_mode: 'disabled', checkout_enabled: false });
    }
    if (path.length === 1 && path[0] === 'products' && request.method === 'GET') {
      const data = await env.DB.prepare(
        'SELECT id, category, name, brand, description, image, price, stock, active, updated_at FROM products WHERE active = 1 ORDER BY category, name'
      ).all();
      const feed = await supplierPrices(env);
      const market = await marketReferences(env);
      let refreshed = 0, marketCount = 0, dpriceCount = 0, serpCount = 0, initialCount = 0;
      let latestMarket = null;
      const products = (data.results || []).map(row => {
        const entry = feed.prices.get(row.id);
        if (entry) {
          refreshed++;
          return { ...row, price: entry.price, stock: entry.stock ?? row.stock,
            stock_live: entry.stock !== undefined, price_source: 'supplier',
            price_live: true, price_updated_at: feed.updated_at };
        }
        const eligible = (market.get(row.id) || []).filter(p => row.category !== 'software' && p.name === row.name && row.price > 0);
        const estimate = eligible.find(p => p.source === 'dprice') || eligible.find(p => p.source === 'serpapi');
        if (estimate) {
          marketCount++;
          if (estimate.source === 'dprice') dpriceCount++; else serpCount++;
          if (!latestMarket || estimate.timestamp > latestMarket) latestMarket = estimate.timestamp;
          return { ...row, price: estimate.price, price_live: false,
            price_source: estimate.source, price_updated_at: estimate.timestamp,
            price_timestamp_type: estimate.source === 'dprice' ? 'observed' : 'retrieved',
            price_merchant_count: estimate.merchant_count || null,
            price_method: estimate.method || (estimate.source === 'serpapi' ? 'google_shopping' : 'dprice'),
            price_confidence: estimate.confidence || null,
            price_variant: estimate.variant || null };
        }
        const initial = INITIAL_MARKET_REFERENCES[row.id];
        if (row.category !== 'software' && initial && row.name === initial[0]) {
          initialCount++;
          return { ...row, price: initial[1], price_live: false,
            price_source: 'store_reference', price_reference_date: INITIAL_MARKET_DATE,
            price_reference_url: initial[2], price_reference_model: initial[3],
            price_reference_kind: initial[3].startsWith('Comparable reference:') ? 'comparable' : 'listed' };
        }
        return { ...row, price_live: false, price_source: 'reference' };
      });
      return json({
        products,
        pricing: { status: feed.status, updated_at: feed.updated_at,
          live_products: refreshed, market_products: marketCount, dprice_products: dpriceCount, serpapi_products: serpCount, store_reference_products: initialCount, market_updated_at: latestMarket, total_products: products.length,
          refresh_seconds: 120 },
        shipping_flat_idr: 0, checkout_enabled: false
      });
    }
    // Public administrator login and its API are removed at the owner's request.
    if (path[0] === 'admin') return failure(404, 'Endpoint tidak ditemukan.');
    if (path[0] === 'orders' && request.method === 'POST') {
      return failure(503, 'Checkout online belum tersedia. Silakan gunakan permintaan WhatsApp.');
    }
    if (path[0] === 'orders' && request.method === 'GET') return failure(404, 'Pesanan tidak ditemukan.');
    if (path[0] === 'payments') return failure(503, 'Pembayaran online belum tersedia.');
    return failure(404, 'Endpoint tidak ditemukan.');
  } catch (err) {
    if (err?.status === 400) return failure(400, err.message);
    console.error('[SEMEISTVO Pages API]', err?.message || String(err));
    return failure(503, 'API atau database belum siap. Periksa migrasi dan binding D1.');
  }
}
