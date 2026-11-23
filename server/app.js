'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('node:crypto');
const path = require('node:path');
const { openStore } = require('./store');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
const dataDir = path.resolve(process.env.DATA_DIR || './runtime-data');
const store = openStore(dataDir);
const { db, sha } = store;
const now = () => Date.now();
const token = () => crypto.randomBytes(32).toString('hex');
const port = Number(process.env.PORT || 3000);
const shipping = Number(process.env.SHIPPING_FLAT_IDR || 0);
const midtransKey = process.env.MIDTRANS_SERVER_KEY || '';
const midtransEnv = process.env.MIDTRANS_ENV || 'sandbox';
const live = midtransEnv === 'production' && process.env.ENABLE_LIVE_PAYMENTS === 'true';
const gatewayReady = Boolean(midtransKey) && (midtransEnv === 'sandbox' || live);
if (!Number.isInteger(shipping) || shipping < 0 || shipping > 10000000) throw Error('Invalid SHIPPING_FLAT_IDR');
if (isProd && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !gatewayReady)) {
  throw Error('Production requires ADMIN_EMAIL, ADMIN_PASSWORD and working payment configuration');
}
if (midtransEnv !== 'sandbox' && midtransEnv !== 'production') throw Error('Unknown MIDTRANS_ENV');
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50kb', strict: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-7', legacyHeaders: false }));
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false });

const scrypt = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
const secretEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const secretPassword = String(process.env.ADMIN_PASSWORD || '');
if (secretEmail && secretPassword && secretPassword !== 'REPLACE_WITH_A_UNIQUE_LONG_PASSWORD') {
  if (secretPassword.length < 16) throw Error('ADMIN_PASSWORD must contain at least 16 characters');
  const old = db.prepare('SELECT email FROM admins WHERE email = ?').get(secretEmail);
  if (!old) {
    const salt = crypto.randomBytes(20).toString('hex');
    db.prepare('INSERT INTO admins (email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(secretEmail, salt, scrypt(secretPassword, salt), now());
  }
}
function fail(res, code, msg) { return res.status(code).json({ error: msg }); }
function publicOrder(order) {
  // Never expose private contact information through the order polling endpoint.
  return store.orderPublic(order);
}
function cookie(req, name) {
  return (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) || '';
}
function requireAdmin(req, res, next) {
  const session = cookie(req, 'svo_admin_session');
  if (!/^[0-9a-f]{64}$/.test(session)) return fail(res, 401, 'Login admin diperlukan.');
  const record = db.prepare('SELECT email, expires_at FROM admin_sessions WHERE token_hash = ?').get(sha(session));
  if (!record || record.expires_at <= now()) return fail(res, 401, 'Sesi admin tidak valid.');
  req.adminEmail = record.email;
  next();
}
function setCookie(res, value, maxAge) {
  res.cookie('svo_admin_session', value, {
    httpOnly: true, secure: isProd, sameSite: 'strict', path: '/api/admin',
    maxAge
  });
}
function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin) {
    try {
      const o = new URL(origin);
      const host = req.get('host');
      if (o.host !== host || !['http:', 'https:'].includes(o.protocol)) return fail(res, 403, 'Origin tidak diizinkan.');
    } catch { return fail(res, 403, 'Origin tidak valid.'); }
  }
  next();
}
const validStr = (v, max, min = 1) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const clean = str => String(str || '').trim();
const safeToken = t => typeof t === 'string' && /^[0-9a-f]{64}$/.test(t);
async function cleanupOrders() {
  const cutoff = now();
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(cutoff);
  if (!gatewayReady) {
    for (const { id } of store.expired(cutoff)) store.releaseOrder(id, 'expired', cutoff);
    return;
  }
  for (const { id } of store.expired(cutoff)) {
    const order = store.getOrder(id);
    if (!order || order.status !== 'pending_payment') continue;
    try {
      await reconcilePayment(order);
      // Remote may still say pending after local expiry. Do not release reserved
      // stock until Midtrans confirms expiration/cancellation.
    } catch (err) {
      console.error('Deferred reservation expiry verification', id, err.message);
    }
  }
}
const cleanupTimer = setInterval(() => { cleanupOrders().catch(err => console.error('Order expiry sweep:', err.message)); }, 60 * 1000);
cleanupTimer.unref();
cleanupOrders().catch(err => console.error('Initial expiry sweep:', err.message));

const midtransBase = () => midtransEnv === 'production' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
async function midtransRequest(resource, options = {}) {
  const signal = AbortSignal.timeout(12000);
  const response = await fetch(midtransBase() + resource, {
    ...options, signal,
    headers: { 'Authorization': 'Basic ' + Buffer.from(midtransKey + ':').toString('base64'),
      'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json();
  if (!response.ok) {
    const err = new Error('Payment provider error');
    err.statusCode = 502;
    throw err;
  }
  return body;
}
async function fetchPaymentStatus(id) {
  const url = (midtransEnv === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com') + '/v2/' + encodeURIComponent(id) + '/status';
  const resp = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { Authorization: 'Basic ' + Buffer.from(midtransKey + ':').toString('base64') } });
  if (!resp.ok) throw Object.assign(new Error('Payment verification failed'), {statusCode: 502});
  return resp.json();
}
function paymentOutcome(status) {
  const kind = String(status.transaction_status || '');
  if (kind === 'settlement' || (kind === 'capture' && status.fraud_status === 'accept')) return 'paid';
  if (['cancel', 'deny', 'expire'].includes(kind)) return 'expired';
  return 'pending';
}
async function reconcilePayment(order) {
  if (!gatewayReady || order.status !== 'pending_payment') return;
  // Expired locally? Still verify with the payment provider before restoring stock.
  const remote = await fetchPaymentStatus(order.id);
  if (String(remote.order_id) !== order.id || Number(remote.gross_amount) !== order.total) {
    throw Object.assign(new Error('Gateway amount mismatch'), {statusCode: 502});
  }
  const outcome = paymentOutcome(remote);
  if (outcome === 'paid') {
    store.markPaid(order.id, now());
  } else if (outcome === 'expired') {
    store.releaseOrder(order.id, 'expired', now());
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true, payment_mode: gatewayReady ? midtransEnv : 'unconfigured', checkout_enabled: gatewayReady }));
app.get('/api/products', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ products: store.listProducts(), shipping_flat_idr: shipping, checkout_enabled: gatewayReady });
});

app.post('/api/orders', strictLimiter, sameOrigin, async (req, res, next) => {
  if (!gatewayReady) return fail(res, 503, 'Pembayaran belum diaktifkan oleh admin. Gunakan konsultasi WhatsApp sementara.');
  const payload = req.body || {};
  const customer = payload.customer || {};
  const items = payload.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 30 ||
      !validStr(customer.name, 100, 2) || !validStr(customer.phone, 20, 8) ||
      !/^\+?[0-9]{8,16}$/.test(clean(customer.phone)) ||
      !validStr(customer.email, 150, 5) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
      !validStr(customer.address, 450, 8) || (customer.notes && !validStr(customer.notes, 350, 0))) {
    return fail(res, 400, 'Data pesanan belum lengkap atau tidak valid.');
  }
  const orderId = 'SVO-' + now().toString(36).toUpperCase() + '-' + crypto.randomBytes(5).toString('hex').toUpperCase();
  const accessToken = token();
  let order;
  try {
    order = store.createOrder({
      items, customer: { name: clean(customer.name), phone: clean(customer.phone), email: clean(customer.email),
        address: clean(customer.address), notes: clean(customer.notes) },
      shipping, now: now(), orderId, tokenHash: sha(accessToken)
    });
    const response = await midtransRequest('/snap/v1/transactions', {
      method: 'POST',
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: order.total },
        customer_details: { first_name: clean(customer.name), email: clean(customer.email), phone: clean(customer.phone) },
        item_details: [
          ...store.itemsFor(orderId).map(i => ({ id: i.product_id, name: i.product_name.slice(0, 50), price: i.unit_price, quantity: i.quantity })),
          ...(shipping > 0 ? [{ id: 'svo-shipping', name: 'Biaya pengiriman flat (estimasi)', price: shipping, quantity: 1 }] : [])
        ],
        expiry: { unit: 'minute', duration: 30 }
      })
    });
    if (!response.redirect_url || !['app.midtrans.com', 'app.sandbox.midtrans.com'].includes(new URL(response.redirect_url).hostname)) throw Error('Invalid gateway redirect');
    store.updatePaymentUrl(orderId, response.redirect_url);
    return res.status(201).json({ order: { ...order, payment_url: response.redirect_url }, access_token: accessToken });
  } catch (err) {
    // No redirect_url is returned. If gateway accepted but response was lost, don't silently claim failure as paid.
    if (order) store.releaseOrder(orderId, 'cancelled', now());
    return next(err);
  }
});
app.get('/api/orders/:id', strictLimiter, async (req, res, next) => {
  const accessToken = String(req.get('x-order-access-token') || '');
  if (!safeToken(accessToken)) return fail(res, 401, 'Token akses pesanan diperlukan.');
  const order = store.getOrder(req.params.id);
  if (!order || sha(accessToken) !== order.access_token_hash) return fail(res, 404, 'Pesanan tidak ditemukan.');
  try {
    if (order.status === 'pending_payment' && gatewayReady) await reconcilePayment(order);
    const latest = store.getOrder(order.id);
    res.set('Cache-Control', 'no-store');
    return res.json({ order: publicOrder(latest) });
  } catch (err) { return next(err); }
});
app.post('/api/payments/midtrans/notification', strictLimiter, async (req, res, next) => {
  if (!gatewayReady) return fail(res, 503, 'Payment integration is disabled.');
  const p = req.body || {};
  if (!validStr(p.order_id, 80) || !validStr(p.status_code, 8) || !validStr(p.gross_amount, 30) ||
      !validStr(p.signature_key, 256)) return fail(res, 400, 'Invalid notification');
  const expected = crypto.createHash('sha512').update(p.order_id + p.status_code + p.gross_amount + midtransKey).digest('hex');
  if (expected.length !== p.signature_key.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(p.signature_key))) return fail(res, 403, 'Invalid signature');
  const order = store.getOrder(p.order_id);
  if (!order) return fail(res, 404, 'Unknown order');
  try {
    await reconcilePayment(order);
    return res.json({ ok: true });
  } catch (err) { return next(err); }
});

app.post('/api/admin/login', adminLimiter, sameOrigin, (req, res) => {
  const email = clean(req.body?.email).toLowerCase();
  const password = req.body?.password;
  if (!validStr(email, 150) || !validStr(password, 1000)) return fail(res, 400, 'Login tidak valid.');
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  // Timing-resistant dummy check for unknown email.
  const salt = admin?.password_salt || 'fake-salt-for-timing';
  const candidate = Buffer.from(scrypt(password, salt), 'hex');
  const expected = Buffer.from(admin?.password_hash || '0'.repeat(128), 'hex');
  if (!admin || !crypto.timingSafeEqual(candidate, expected)) return fail(res, 401, 'Email atau password salah.');
  const session = token();
  db.prepare('INSERT INTO admin_sessions (token_hash, email, expires_at) VALUES (?, ?, ?)').run(sha(session), email, now() + 8 * 3600 * 1000);
  setCookie(res, session, 8 * 3600 * 1000);
  res.json({ ok: true, email });
});
app.post('/api/admin/logout', sameOrigin, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha(cookie(req, 'svo_admin_session')));
  res.clearCookie('svo_admin_session', { path: '/api/admin', sameSite: 'strict', secure: isProd, httpOnly: true });
  res.json({ ok: true });
});
app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ email: req.adminEmail }));
app.get('/api/admin/products', requireAdmin, (req, res) =>
  res.json({ products: db.prepare('SELECT * FROM products ORDER BY category, name').all() }));
app.patch('/api/admin/products/:id', sameOrigin, requireAdmin, (req, res) => {
  const payload = req.body || {};
  const allowed = ['name', 'brand', 'description', 'image', 'price', 'stock', 'active'];
  if (!Object.keys(payload).length || Object.keys(payload).some(key => !allowed.includes(key))) return fail(res, 400, 'Invalid fields.');
  for (const [key, value] of Object.entries(payload)) {
    if (['price', 'stock'].includes(key) && (!Number.isSafeInteger(value) || value < 0 || value > 1000000000)) return fail(res, 400, 'Invalid price/stock.');
    if (key === 'active' && value !== 0 && value !== 1) return fail(res, 400, 'Invalid active flag.');
    if (['name', 'brand', 'description', 'image'].includes(key) && !validStr(value, key === 'description' ? 1000 : 500, key === 'name' || key === 'brand' ? 1 : 0)) return fail(res, 400, 'Invalid product field.');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'image')) {
    const image = payload.image.trim();
    let valid = /^images\/products\/[a-z0-9-]+\.svg$/.test(image);
    if (!valid) {
      try {
        const parsed = new URL(image);
        valid = parsed.protocol === 'https:' && !!parsed.hostname && !parsed.username && !parsed.password && !/\s/.test(image);
      } catch (_) { valid = false; }
    }
    if (!valid) return fail(res, 400, 'Gambar wajib URL HTTPS atau ilustrasi lokal yang didukung.');
  }
  const result = store.updateProduct(req.params.id, payload);
  if (!result) return fail(res, 404, 'Product not found.');
  res.json({ product: result });
});
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all()
    .map(o => ({ ...o, access_token_hash: undefined, items: store.itemsFor(o.id) }));
  res.json({ orders });
});
app.patch('/api/admin/orders/:id', sameOrigin, requireAdmin, (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return fail(res, 404, 'Order not found.');
  const allowed = { paid: ['processing', 'refunded'], processing: ['shipped', 'refunded'], shipped: ['completed', 'refunded'] };
  const status = req.body?.status;
  if (!allowed[order.status]?.includes(status)) return fail(res, 409, 'Invalid status transition.');
  // Refund status here is administrative only; issue refunds through provider dashboard separately.
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), order.id);
  res.json({ ok: true, status, refund_automatic: false });
});

// Allow-list public assets. Never expose the SQLite DB, .env, server code or node_modules.
const publicRoot = path.resolve(__dirname, '..');
const staticOptions = { dotfiles: 'deny', fallthrough: false, setHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
}};
for (const dir of ['css', 'js', 'images']) {
  app.use('/' + dir, express.static(path.join(publicRoot, dir), staticOptions));
}
app.get('/site.webmanifest', (req, res) => res.type('application/manifest+json').sendFile(path.join(publicRoot, 'site.webmanifest')));
app.get('/', (req, res) => res.sendFile(path.join(publicRoot, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(publicRoot, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicRoot, 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(publicRoot, 'admin.html')));
app.use((req, res) => fail(res, 404, 'Halaman tidak ditemukan.'));
app.use((err, req, res, next) => {
  console.error('[SEMEISTVO API]', err.message);
  if (res.headersSent) return next(err);
  fail(res, err.statusCode || 500, err.statusCode === 400 || err.statusCode === 409 ? err.message : 'Terjadi kesalahan server. Silakan coba lagi.');
});
if (require.main === module) {
  app.listen(port, () => console.log('SEMEISTVO TECH listening on http://localhost:' + port));
}
module.exports = { app, store };
