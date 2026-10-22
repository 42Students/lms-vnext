// Optional catch-all: also serves /mentor/courses/<id> itself. Do NOT add a sibling page.tsx or [...courseTab] (Next.js build fails).
import {redirect} from "next/navigation";

/** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
export default function MentorLegacyRedirect(){
  redirect("/mentor/projects");
}
