import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";

/** Preserve older Super Admin deleted-workspace bookmarks, including query
 * paging and size, without keeping a second truncated 200-row recovery list. */
export default async function DeletedAdminProjectsLegacyRoute({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 await getCurrentRequestContext();
 const raw=await searchParams;
 const allowed=new Set(["page","pageSize"]);
 const params=new URLSearchParams();
 if(Object.keys(raw).some(key=>!allowed.has(key))){
  redirect("/admin/projects/workspaces/deleted?invalid=1");
 }
 for(const name of ["page","pageSize"] as const){
  const value=raw[name];
  if(value===undefined)continue;
  if(typeof value!=="string")redirect("/admin/projects/workspaces/deleted?invalid=1");
  params.set(name,value);
 }
 redirect("/admin/projects/workspaces/deleted"+(params.size?"?"+params:""));
}
