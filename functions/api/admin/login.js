import { configured, createSession, hashString, respond, sessionCookie, validOrigin } from "../../_lib/store.js";
async function ensureAttempts(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
    key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, blocked_until INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
  )`).run();
}
export async function onRequestPost({ request,env }) {
  if (!validOrigin(request)) return respond({ error:"Origin tidak cocok" },403);
  if (!configured(env) || !env.DB) return respond({ error:"Admin belum dikonfigurasi. Set ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET dan DB di Cloudflare." },503);
  let data;
  try { data=await request.json(); } catch { return respond({ error:"Data login tidak valid" },400); }
  if (typeof data?.username!=="string" || typeof data?.password!=="string" || data.username.length>200 || data.password.length>500) return respond({ error:"Data login tidak valid" },400);
  const ip=request.headers.get("CF-Connecting-IP") || "unknown";
  const ipKey=await hashString(ip + ":" + env.ADMIN_SESSION_SECRET);
  const now=Date.now();
  try {
    await ensureAttempts(env);
    const record=await env.DB.prepare("SELECT attempts,blocked_until,updated_at FROM admin_login_attempts WHERE key=?").bind(ipKey).first();
    if (record?.blocked_until > now) return respond({error:"Terlalu banyak percobaan. Coba lagi setelah 15 menit."},429);
    const validUser=await hashString(data.username) === await hashString(env.ADMIN_USERNAME);
    const validPass=await hashString(data.password) === await hashString(env.ADMIN_PASSWORD);
    if (!(validUser && validPass)) {
      const count=record && now-record.updated_at < 15*60*1000 ? record.attempts+1 : 1;
      await env.DB.prepare("INSERT INTO admin_login_attempts(key,attempts,blocked_until,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at")
       .bind(ipKey,count,count>=5?now+15*60*1000:0,now).run();
      return respond({error:"Username atau password tidak sesuai."},401);
    }
    await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key=?").bind(ipKey).run();
    const res=respond({ok:true, username:env.ADMIN_USERNAME});
    res.headers.set("Set-Cookie",sessionCookie(await createSession(env)));
    return res;
  } catch { return respond({error:"Layanan admin belum siap. Periksa database D1."},503); }
}
