import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAdminProfileEditor } from "@/components/college/college-admin-profile-editor";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getOwnAccountSummary } from "@/modules/people/own-account-service";
import { loadCollegeOwnProfile } from "@/modules/people/college-admin-profile-edit-service";

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
  if (context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const [accountResult,profileResult]=await Promise.allSettled([
    getOwnAccountSummary(context),
    loadCollegeOwnProfile(context),
  ]);
  if(profileResult.status==="rejected")return <div className="min-w-0 space-y-6">
    <PageHeader title="Profile"/>
    <ErrorState title="Failed to load profile." description="Couldn't refresh profile. Your saved details have not been changed. Retry to load your profile."
      action={<Link href="/college/profile" prefetch={false} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link underline hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry</Link>}/>

  </div>;
  const profile=profileResult.value;
  const account=accountResult.status==="fulfilled"?accountResult.value:null;
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Profile"
      description="Your personal and contact details. College contact information is managed separately." />
    <CollegeAdminProfileEditor initial={profile}
      email={account?.email ?? null} phone={account?.phoneE164 ?? null}
      college={account?.college?.name ?? null} />
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
