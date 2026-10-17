import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { getOwnCollegeContactProfile } from "@/modules/colleges/college-contact-profile-service";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function CollegeContactProfilePage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const profile = await getOwnCollegeContactProfile(context);
  return <div className="space-y-6">
    <PageHeader
      eyebrow="College Admin · My College"
      title="College contact profile"
      description="Manage the college display name, public support contacts and policy links."
      actions={<Link href="/college/branding"
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
        Branding workspace
      </Link>}
    />
      <p role="status" className="rounded-lg border border-border bg-surface p-3 text-sm text-body">
        College profile manages operational contact details. Sign-in branding, domains and logos are managed by a Super Admin.
      </p>
    <CollegeContactProfileForm initial={profile} />
  </div>;
}
