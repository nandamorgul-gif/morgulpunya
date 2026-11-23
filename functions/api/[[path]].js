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
    const res = await fetch(url.toString(), { headers, redirect: 'error', signal: AbortSignal.timeout(8000) });
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
      let refreshed = 0;
      const products = (data.results || []).map(row => {
        const entry = feed.prices.get(row.id);
        if (!entry) return { ...row, price_live: false };
        refreshed++;
        return { ...row, price: entry.price, stock: entry.stock ?? row.stock,
          stock_live: entry.stock !== undefined,
          price_live: true, price_updated_at: feed.updated_at };
      });
      return json({
        products,
        pricing: { status: feed.status, updated_at: feed.updated_at,
          live_products: refreshed, total_products: products.length,
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
