import {redirect} from "next/navigation";
import {SuperAdminContentDirectoryPage} from "@/components/courses/super-admin-content-directory-page";
import {legacySuperAdminContentHandoffHref} from "@/modules/courses/super-admin-content-directory-model";

/** Keep /superadmin/lesson-content?type= links usable in the distinct
 * vNext content workspaces, without changing the college or active tab. */
export default async function SuperAdminVideosPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 // One allowlisted crosswalk for the old unified content page: discard
 // forged collegeId/returnTo and unsupported filters before redirecting.
 const legacyType=typeof raw["type"]==="string"?raw["type"].toLowerCase():null;
 if(legacyType&&["video","videos","resource","resources","live-class","live-classes","live_class"].includes(legacyType)){
  redirect(legacySuperAdminContentHandoffHref(raw));
 }
 return <SuperAdminContentDirectoryPage kind="VIDEOS" searchParams={Promise.resolve(raw)}/>;
}
