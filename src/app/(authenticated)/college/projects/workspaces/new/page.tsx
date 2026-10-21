import {redirect} from "next/navigation";
/** Retain team-creation bookmarks; the canonical create page now offers
 * single, team and cohort workspace modes side by side.
 */
export default function CollegeClassProjectWorkspacePage(){
  redirect("/college/projects/create?mode=teams");
}
