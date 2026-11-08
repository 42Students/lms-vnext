// Optional catch-all: also serves /mentor/courses/<id> itself. Do NOT add a sibling page.tsx or [...courseTab] (Next.js build fails).
import {redirect} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";

/** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
export default async function MentorLegacyRedirect(){
  const context=await getCurrentRequestContext();
  if(!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))redirect("/dashboard");
  redirect("/mentor/projects");
}
