import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveMembership,hasMembershipRole } from "@/modules/identity/context";

import { ROLE } from "@/modules/identity/roles";
/** Keep the legacy index alias as a server redirect (no client history entry),
 * and validate role before forwarding to the
 * persisted college-scoped Contacts service. Selected admin/mentor role is
 * not an implicit Faculty grant. */
export default async function FacultyContactsIndexPage() {
  const context=await getCurrentRequestContext();
  if(!hasActiveMembership(context)||!hasMembershipRole(context,ROLE.FACULTY)){
    if(hasActiveMembership(context)&&hasMembershipRole(context,ROLE.LEARNER))redirect("/learn");
    if(hasActiveMembership(context)&&hasMembershipRole(context,ROLE.MENTOR))redirect("/mentor/projects");
    if(hasActiveMembership(context)&&hasMembershipRole(context,ROLE.TPO))redirect("/tpo");
    if(hasActiveMembership(context)&&hasMembershipRole(context,ROLE.COLLEGE_ADMIN))redirect("/college");
    redirect("/dashboard");
  }
  redirect("/teacher/contacts/allContacts");
}
