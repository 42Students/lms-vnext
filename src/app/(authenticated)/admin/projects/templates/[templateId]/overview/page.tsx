import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
/** The canonical detail resolves UUID and legacy numeric/slug bookmarks.
 * Preserve safe version/tab query values across this older Overview alias. */
export default async function TemplateOverviewAlias({params,searchParams}:{
 params:Promise<{templateId:string}>;
 searchParams?:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"project-template.read");
 const id=(await params).templateId;
 if(!id||id.length>100||!(/^[a-z0-9_-]+$/i.test(id)))notFound();
 const raw=await searchParams;
 const query=new URLSearchParams();
 for(const key of ["tab","view","version"]){
  const value=raw?.[key];
  if(typeof value==="string"&&/^[a-z0-9_-]{1,64}$/i.test(value))query.set(key,value);
 }
 redirect("/admin/projects/templates/"+encodeURIComponent(id)+(query.size?"?"+query:""));
}
