import { ensureDb, respond } from "../../_lib/store.js";
export async function onRequestGet({ env }) {
  try {
    await ensureDb(env);
    const r = await env.DB.prepare("SELECT id, price, stock, image, source_label, source_url, updated_at FROM catalog_overrides").all();
    return respond({ ok:true, items:r.results || [], generated_at:new Date().toISOString() });
  } catch { return respond({ ok:false, error:"Harga katalog D1 belum dapat dimuat" },503); }
}
