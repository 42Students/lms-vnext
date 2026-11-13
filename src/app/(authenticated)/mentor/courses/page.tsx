import {redirect} from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";

import { ROLE } from "@/modules/identity/roles";
/** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
export default async function MentorLegacyRedirect(){
  const context=await getCurrentRequestContext();
  if(!hasActiveMembership(context)||!hasMembershipRole(context,ROLE.MENTOR))redirect("/dashboard");
  redirect("/mentor/projects");
}
