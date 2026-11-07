import {redirect} from "next/navigation";
import {SuperAdminContentDirectoryPage} from "@/components/courses/super-admin-content-directory-page";
import {legacySuperAdminLessonContentHref} from "@/modules/courses/super-admin-content-directory-model";

/** Keep /superadmin/lesson-content?type= links usable in the distinct
 * vNext content workspaces, without changing the college or active tab. */
export default async function SuperAdminVideosPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 // One allowlisted crosswalk for the old unified content page: discard
 // forged collegeId/returnTo and unsupported filters before redirecting.
 if(typeof raw["type"]==="string"&&
    ["video","live-classes","resources"].includes(raw["type"])){
  const mapped = legacySuperAdminLessonContentHref(raw);
  // The authoring lesson picker has independent, bounded URL state.
  // Preserve its useful search/page while dropping untrusted scope selectors.
  const [pathname, existing] = mapped.split("?");
  const search = new URLSearchParams(existing ?? "");
  const lessonSearch = raw["lessonSearch"];
  const lessonPage = raw["lessonPage"];
  if (typeof lessonSearch === "string" && lessonSearch.trim() && lessonSearch.length <= 100)
    search.set("lessonSearch", lessonSearch.trim());
  if (typeof lessonPage === "string" && /^[1-9][0-9]{0,3}$/.test(lessonPage))
    search.set("lessonPage", lessonPage);
  redirect((pathname ?? "/admin/videos") + (search.size ? "?" + search.toString() : ""));
 }
 return <SuperAdminContentDirectoryPage kind="VIDEOS" searchParams={Promise.resolve(raw)}/>;
}
