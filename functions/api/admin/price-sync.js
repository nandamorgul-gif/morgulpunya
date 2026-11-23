import {allowedId,allowedPrice,allowedStock,ensureDb,respond,writePrice} from "../../_lib/store.js";
export async function onRequestPost({request,env}) {
  const header=request.headers.get("Authorization")||"";
  if(!env.PRICE_SYNC_TOKEN || env.PRICE_SYNC_TOKEN.length<32 || header!=="Bearer "+env.PRICE_SYNC_TOKEN) return respond({error:"Akses sinkronisasi ditolak"},401);
  if(!env.PRICE_FEED_URL) return respond({error:"PRICE_FEED_URL belum disetel. Harga tidak diubah."},503);
  let feedUrl;
  try{feedUrl=new URL(env.PRICE_FEED_URL);if(feedUrl.protocol!=="https:"||feedUrl.username||feedUrl.password||/^(localhost|127\\.|10\\.|192\\.168\\.|169\\.254\\.)/.test(feedUrl.hostname))throw new Error("bad URL");}
  catch{return respond({error:"PRICE_FEED_URL harus URL HTTPS valid"},503);}
  try {
    const response=await fetch(feedUrl.href,{headers:env.PRICE_FEED_TOKEN?{"Authorization":"Bearer "+env.PRICE_FEED_TOKEN}:{},signal:AbortSignal.timeout(12000)});
    if(!response.ok)return respond({error:"Sumber harga mengembalikan status tidak sukses"},502);
    const contentType=response.headers.get("content-type")||"";
    if(!contentType.includes("application/json"))return respond({error:"Sumber harus mengembalikan JSON"},502);
    const data=await response.json();
    const stamp=Date.parse(data?.updated_at);
    if(!Number.isFinite(stamp)||Math.abs(Date.now()-stamp)>7*86400000)return respond({error:"Data feed harus bertanggal dalam 7 hari terakhir. Harga tidak diubah."},422);
    if(!Array.isArray(data.products)||!data.products.length||data.products.length>500) return respond({error:"products harus array berisi 1-500 item"},422);
    const products=[];
    for(const p of data.products) {
      if(!allowedId(p?.id)||!allowedPrice(p?.price)||!allowedStock(p?.stock??null))return respond({error:"Data item feed tidak valid; tidak ada harga diubah"},422);
      if(p.source_url && (typeof p.source_url!=="string"||!p.source_url.startsWith("https://")))return respond({error:"source_url tidak valid"},422);
      products.push({id:p.id,price:p.price,stock:p.stock??null,source_url:p.source_url||null,image:null});
    }
    await ensureDb(env);
    for(const p of products)await writePrice(env,p,"feed");
    return respond({ok:true,updated:products.length,source:feedUrl.hostname,at:new Date().toISOString()});
  } catch {return respond({error:"Sinkronisasi gagal. Data harga lama dipertahankan."},502);}
}
