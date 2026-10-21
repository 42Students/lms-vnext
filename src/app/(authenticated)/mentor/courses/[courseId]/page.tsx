import {redirect} from "next/navigation";

/** Keep old mentor course bookmarks working without exposing retired courses. */
export default function MentorLegacyCourseRedirect(){
  redirect("/mentor/projects");
}
