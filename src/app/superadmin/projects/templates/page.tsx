import {redirect} from "next/navigation";
/** Old Super Admin bookmarks always enter the same scoped vNext workspace. */
export default async function LegacyProjectTemplates({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const query=new URLSearchParams();
 for(const key of ["q","search","status","page"]){
  const value=raw[key];
  if(typeof value==="string"&&value.length<=100&&value.length>0)query.set(key,value);
 }
 redirect("/admin/projects/templates"+(query.size?"?"+query:""));
}
