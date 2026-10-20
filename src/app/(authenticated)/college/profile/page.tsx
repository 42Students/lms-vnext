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
  if (!context.membership) return <div className="min-w-0 space-y-5"><PageHeader title="Profile"/><ErrorState title="Profile unavailable" description="Admin not assigned to a college. Contact a Super Admin to access college staff profile controls."/></div>;
  if (context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const [accountResult,profileResult]=await Promise.allSettled([
    getOwnAccountSummary(context),
    loadCollegeOwnProfile(context),
  ]);
  if(profileResult.status==="rejected")return <div className="min-w-0 space-y-5">
    <PageHeader title="Profile"/>
    <ErrorState title="Failed to load profile" description="Couldn’t refresh profile. Your existing details have not been changed."
      action={<Link href="/college/profile" prefetch={false} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Retry</Link>}/>

  </div>;
  const profile=profileResult.value;
  const account=accountResult.status==="fulfilled"?accountResult.value:null;
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Profile"
      description="Your personal and contact details. College contact information is managed separately."
      actions={<Link href="/account/security"
        className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
        Signed-in devices
      </Link>} />
    <CollegeAdminProfileEditor initial={profile}
      email={account?.email ?? null} phone={account?.phoneE164 ?? null}
      college={account?.college?.name ?? null} />
    <div className="flex flex-wrap gap-3">
      <Link href="/college/domains" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link">
        Tenant domains
      </Link>
      <Link href="/college/college-profile" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link">
        Edit college display and support contacts
      </Link>
    </div>
  </div>;
}
