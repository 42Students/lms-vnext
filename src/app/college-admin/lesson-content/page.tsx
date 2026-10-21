import {redirect} from "next/navigation";
/** The old content index selected videos unless a view type was requested.
 * Preserve those bookmarks while retaining the dedicated vNext modules.
 */
export default async function LegacyCollegeLessonContentPage({
  searchParams,
}:{searchParams:Promise<{type?:string|string[]}>}){
  const {type}=await searchParams;
  const selected=Array.isArray(type)?type[0]:type;
  if(selected==="resources")redirect("/college/resources");
  if(selected==="live-classes"||selected==="live")redirect("/college/live-classes");
  redirect("/college/videos");
}
