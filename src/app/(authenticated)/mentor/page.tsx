import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
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
  const failed=access===null;
  // Fail closed on an unavailable policy read, but distinguish it from a
  // college's explicit disabled flag. An authorized reload rechecks policy.
  return <section role={failed?"alert":"status"} aria-live="polite"
    className="mx-auto flex min-h-[320px] w-full max-w-[700px] flex-col items-center justify-center px-4 py-12 text-center md:py-16">
    <span aria-hidden="true"
      className={"mb-5 flex size-16 items-center justify-center rounded-full border text-[32px] "+
       (failed?"border-[var(--lms-warning-border)] bg-[var(--lms-warning-subtle)] text-warning":"border-[var(--lms-info)] bg-[var(--lms-info-subtle)] text-primary-text")}>
      {failed?"!":"ⓘ"}
    </span>
    <h1 className="text-pretty text-2xl font-semibold leading-8 text-[var(--lms-heading)]">
      {failed?"Could not verify Projects access":"Projects is currently unavailable"}
    </h1>
    <p className="mt-3 max-w-[560px] text-pretty text-sm leading-[22px] text-body">
      {failed?"The LMS could not check your college module settings. This does not mean Projects is disabled.":"Projects is disabled for this account. You can still check notifications."}
    </p>
    {failed?
      <a href="/mentor?retry=1" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-5 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Retry access check
      </a>:
      <Link href="/mentor/notifications" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-5 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        View notifications
      </Link>}
  </section>;
}
