import {isAdmin,respond} from "../../_lib/store.js";
export async function onRequestGet({request,env}) {
  const ok=await isAdmin(request,env);
  return respond({authenticated:ok, username:ok?env.ADMIN_USERNAME:null});
}
