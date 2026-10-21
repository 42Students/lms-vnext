import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title={access===null?"Could not verify Projects access":"Projects is currently unavailable"}
      description={access===null?"The LMS could not check your college module settings. This does not mean Projects is disabled.":"Projects is disabled for this account. You can still check notifications."} />
    <div className="min-w-0 space-y-4">
      <Alert tone="warning">
        Contact your college administrator if you need access to Projects.
      </Alert>
      <div className="flex min-w-0 flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
        <Link href="/mentor/notifications"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 py-2 text-sm font-semibold text-on-primary md:min-h-[var(--lms-control-height)] md:w-auto hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          View notifications
        </Link>
        {access===null?<a href="/mentor?retry=1" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] lms-inline-link">Retry access check</a>:null}
      </div>
    </div>
  </div>;
}
