import {notFound,redirect} from "next/navigation";
export default async function LegacyProjectTemplateDetail({params,searchParams}:{
 params:Promise<{templateId:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const id=(await params).templateId;
 if(!id||id.length>100||!(/^[a-z0-9_-]+$/i.test(id)))notFound();
 const raw=await searchParams,query=new URLSearchParams();
 for(const key of ["tab","view","version"]){
  const value=raw[key];
  if(typeof value==="string"&&/^[a-z0-9_-]{1,64}$/i.test(value))query.set(key,value);
 }
 redirect("/admin/projects/templates/"+encodeURIComponent(id)+(query.size?"?"+query:""));
}
