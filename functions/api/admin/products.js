import {allowedId,allowedPrice,allowedStock,allowedImage,ensureDb,isAdmin,respond,validOrigin,writePrice} from "../../_lib/store.js";
export async function onRequestGet({request,env}) {
  if(!await isAdmin(request,env))return respond({error:"Login admin diperlukan"},401);
  try {await ensureDb(env);const r=await env.DB.prepare("SELECT * FROM catalog_overrides ORDER BY id").all();return respond({ok:true,items:r.results||[]});}
  catch{return respond({error:"D1 tidak tersedia"},503);}
}
export async function onRequestPatch({request,env}) {
  if(!validOrigin(request))return respond({error:"Origin tidak sesuai"},403);
  if(!await isAdmin(request,env))return respond({error:"Login admin diperlukan"},401);
  let body;try{body=await request.json();}catch{return respond({error:"JSON tidak valid"},400);}
  const item={id:body?.id,price:body?.price,stock:body?.stock ?? null,image:body?.image || null,source_url:null};
  if(!allowedId(item.id)||!allowedPrice(item.price)||!allowedStock(item.stock)||!allowedImage(item.image))return respond({error:"ID, harga, stok atau URL gambar tidak valid"},400);
  try{await ensureDb(env);await writePrice(env,item,"admin");return respond({ok:true,id:item.id});}
  catch{return respond({error:"Gagal menyimpan ke D1"},500);}
}
