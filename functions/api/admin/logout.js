import {clearCookie,respond,validOrigin} from "../../_lib/store.js";
export async function onRequestPost({request}) {
  if(!validOrigin(request)) return respond({error:"Origin tidak sesuai"},403);
  const res=respond({ok:true});res.headers.set("Set-Cookie",clearCookie());return res;
}
