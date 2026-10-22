import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeProfileRetained } from "@/components/college/college-profile-retained";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getOwnAccountSummary } from "@/modules/people/own-account-service";
import { loadCollegeOwnProfile } from "@/modules/people/college-admin-profile-edit-service";
import { CollegeProfileRefresh } from "@/components/college/college-profile-refresh";

export default async function CollegeAdminProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const query = await searchParams;
  if (query.section === "contacts") redirect("/college/profile#contacts");
  if (query.section === "connect-accounts") redirect("/college/profile#social");
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-6"><PageHeader title="Profile"/><ErrorState title="Profile unavailable" description="Admin not assigned to a college. Contact a Super Admin to access college staff profile controls."/></div>;
  if (context.membership.status !== "ACTIVE") redirect("/dashboard");
  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) {
    if(hasMembershipRole(context,"LEARNER"))redirect("/learn/profile");
    if(hasMembershipRole(context,"FACULTY"))redirect("/teacher/profile");
    if(hasMembershipRole(context,"MENTOR"))redirect("/mentor/profile");
    if(hasMembershipRole(context,"TPO"))redirect("/tpo/profile");
    redirect("/dashboard");
  }
  const [accountResult,profileResult]=await Promise.allSettled([
    getOwnAccountSummary(context),
    loadCollegeOwnProfile(context),
  ]);
  const account=accountResult.status==="fulfilled"?accountResult.value:null;
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Profile"
      description="Your personal and contact details. College contact information is managed separately."
      actions={<CollegeProfileRefresh/>}/>
    <section aria-label="Personal profile" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <CollegeProfileRetained key={context.user.id+":"+context.membership.id}
        failed={profileResult.status==="rejected"}
        current={profileResult.status==="fulfilled"?{
          profile:profileResult.value,email:account?.email??null,
          phone:account?.phoneE164??null,college:account?.college?.name??null,
        }:null}/>
    </section>
    <nav aria-label="Related profile links"
      className="flex min-w-0 flex-col items-stretch gap-2 border-t border-border pt-4 md:flex-row md:flex-wrap md:items-center md:gap-4">
      <Link href="/account/security"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Signed-in devices</Link>
      <Link href="/college/domains"
        className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Tenant domains</Link>
      <Link href="/college/college-profile"
        className="inline-flex min-h-11 items-center break-words font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Edit college display and support contacts</Link>
    </nav>
  </div>;
}
