import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAdminProfileEditor } from "@/components/college/college-admin-profile-editor";
import { PageHeader } from "@/components/ui/page-header";
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
  if (!context.membership) return <main className="space-y-3 p-6"><PageHeader eyebrow="College Admin" title="Profile"/><p role="alert" className="rounded border border-border p-4">Admin not assigned to a college. Contact a Super Admin to access college staff profile controls.</p></main>;
  if (context.membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const [account, profile] = await Promise.all([
    getOwnAccountSummary(context),
    loadCollegeOwnProfile(context),
  ]);
  return <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6">
    <PageHeader eyebrow="College Admin" title="Profile"
      description="Your personal and contact details. College contact information is managed separately."
      actions={<Link href="/account/security"
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Signed-in devices
      </Link>} />
    <CollegeAdminProfileEditor initial={profile}
      email={account?.email ?? null} phone={account?.phoneE164 ?? null}
      college={account?.college?.name ?? null} />
    <div className="flex flex-wrap gap-3">
      <Link href="/college/domains" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Tenant domains
      </Link>
      <Link href="/college/college-profile" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Edit college display and support contacts
      </Link>
    </div>
  </main>;
}
