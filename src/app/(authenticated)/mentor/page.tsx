import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";

export const dynamic = "force-dynamic";

/** Legacy /mentor landing: feature enabled -> Projects; disabled -> no 404
 * and Notifications remain reachable. Failure to resolve feature policy fails closed.
 */
export default async function MentorLandingPage() {
  const context = await getCurrentRequestContext();
  if (!hasActiveMembership(context) || !hasMembershipRole(context,"MENTOR")) {
    redirect("/dashboard");
  }
  const access = await resolveOptionalModuleAccess(context).catch(()=>null);
  if (access?.projects.enabled === true) {
    redirect("/mentor/projects");
  }
  return <div className="mx-auto flex min-h-[50vh] max-w-[720px] min-w-0 flex-col items-center justify-center gap-4 px-5 py-12 text-center" role="status">
    <span aria-hidden="true" className={"flex h-16 w-16 items-center justify-center rounded-full text-3xl "+(access===null?"bg-warning-subtle text-warning":"bg-primary-subtle text-primary-text")}>
      {access===null?"!":"i"}
    </span>
    <PageHeader title={access===null?"Could not verify Projects access":"Projects is currently unavailable"}
      description={access===null?"The LMS could not check your college module settings. This does not mean Projects is disabled.":"Projects is disabled for this account. You can still check notifications."}/>
    {access===null?<a href="/mentor?retry=1" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-6 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2">Retry access check</a>:
      <Link href="/mentor/notifications" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-6 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2">View notifications</Link>}
  </div>;
}
