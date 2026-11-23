const COOKIE = "svo_admin";
const maxAge = 8 * 60 * 60;
export function respond(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
export function validOrigin(request) {
  const origin = request.headers.get("Origin");
  const target = new URL(request.url);
  return origin === target.origin;
}
export function configured(env) {
  return typeof env.ADMIN_USERNAME === "string" && env.ADMIN_USERNAME.length >= 3
    && typeof env.ADMIN_PASSWORD === "string" && env.ADMIN_PASSWORD.length >= 12
    && typeof env.ADMIN_SESSION_SECRET === "string" && env.ADMIN_SESSION_SECRET.length >= 32;
}
export async function ensureDb(env) {
  if (!env.DB) throw new Error("D1 DB binding belum tersedia");
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalog_overrides (
    id TEXT PRIMARY KEY, price INTEGER NOT NULL, stock INTEGER,
    image TEXT, source_url TEXT, source_label TEXT NOT NULL DEFAULT 'admin',
    updated_at TEXT NOT NULL
  )`).run();
}
function b64(bytes) {
  let s = "";
  bytes.forEach(byte => s += String.fromCharCode(byte));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
}
function unb64(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded + "=".repeat((4 - padded.length % 4) % 4)), c => c.charCodeAt(0));
}
async function key(env) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function hashString(s) {
  return b64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
}
export async function constantMatch(a,b) {
  return (await hashString(a)) === (await hashString(b));
}
export async function createSession(env) {
  const payload = b64(new TextEncoder().encode(JSON.stringify({
    sub: env.ADMIN_USERNAME, exp: Math.floor(Date.now()/1000) + maxAge, v: 1
  })));
  const sig = b64(new Uint8Array(await crypto.subtle.sign("HMAC", await key(env), new TextEncoder().encode(payload))));
  return payload + "." + sig;
}
export async function isAdmin(request, env) {
  if (!configured(env)) return false;
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token || token.length > 4096) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const verified = await crypto.subtle.verify("HMAC", await key(env), unb64(parts[1]), new TextEncoder().encode(parts[0]));
    if (!verified) return false;
    const obj = JSON.parse(new TextDecoder().decode(unb64(parts[0])));
    return obj.v === 1 && obj.sub === env.ADMIN_USERNAME && Number.isInteger(obj.exp) && obj.exp > Date.now()/1000;
  } catch { return false; }
}
export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${maxAge}`;
}
export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`;
}
export function allowedId(id) { return typeof id === "string" && /^(cpu|gpu|mb|ram|str|psu|case|clr|acc|soft)-[0-9]{1,3}$/.test(id); }
export function allowedPrice(price) { return Number.isSafeInteger(price) && price >= 0 && price <= 1000000000; }
export function allowedStock(stock) { return stock === null || (Number.isSafeInteger(stock) && stock >= 0 && stock <= 1000000); }
export function allowedImage(image) {
  if (image === null) return true;
  if (typeof image !== "string" || image.length > 2048) return false;
  try {
    const u = new URL(image);
    return u.protocol === "https:" && !u.username && !u.password && !/[<>"'\s]/.test(image);
  }
  catch { return false; }
}
export async function writePrice(env, item, sourceLabel) {
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO catalog_overrides(id,price,stock,image,source_url,source_label,updated_at)
    VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
    price=excluded.price, stock=excluded.stock,
    image=COALESCE(excluded.image, catalog_overrides.image),
    source_url=excluded.source_url, source_label=excluded.source_label, updated_at=excluded.updated_at`)
    .bind(item.id,item.price,item.stock ?? null,item.image ?? null,item.source_url ?? null,sourceLabel,now).run();
}
