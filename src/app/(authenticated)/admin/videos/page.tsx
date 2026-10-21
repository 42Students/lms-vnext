import {redirect} from "next/navigation";
import {SuperAdminContentDirectoryPage} from "@/components/courses/super-admin-content-directory-page";

/** Keep /superadmin/lesson-content?type= links usable in the distinct
 * vNext content workspaces, without changing the college or active tab. */
export default async function SuperAdminVideosPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 if(typeof raw.type==="string"&&["video","live-classes","resources"].includes(raw.type)){
  const query=new URLSearchParams();
  for(const [name,value] of Object.entries(raw)){
   if(name!=="type"&&typeof value==="string")query.set(name,value);
  }
  const dest=raw.type==="video"?"/admin/videos":raw.type==="live-classes"?"/admin/live-classes":"/admin/resources";
  redirect(dest+(query.size?"?"+query.toString():""));
 }
 return <SuperAdminContentDirectoryPage kind="VIDEOS" searchParams={Promise.resolve(raw)}/>;
}
