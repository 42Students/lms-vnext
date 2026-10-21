import {redirect} from "next/navigation";
import {SuperAdminContentDirectoryPage} from "@/components/courses/super-admin-content-directory-page";

/** The historic lesson-content ?type= links retain the Courses & Content
 * navigation while the canonical vNext pages stay separate per content type. */
export default async function SuperAdminResourcesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const type=raw.type;
 if(typeof type==="string"&&["video","live-classes","resources"].includes(type)){
  const next=new URLSearchParams();
  for(const [key,value] of Object.entries(raw)){
   if(key!=="type"&&typeof value==="string")next.set(key,value);
  }
  const path=type==="video"?"/admin/videos":type==="live-classes"?"/admin/live-classes":"/admin/resources";
  redirect(path+(next.size?"?"+next.toString():""));
 }
 return <SuperAdminContentDirectoryPage kind="RESOURCES" searchParams={Promise.resolve(raw)}/>;
}
