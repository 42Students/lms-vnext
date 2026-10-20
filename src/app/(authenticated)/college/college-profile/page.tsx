import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { getOwnCollegeContactProfile } from "@/modules/colleges/college-contact-profile-service";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function CollegeContactProfilePage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const profile = await getOwnCollegeContactProfile(context);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader
      title="College contact profile"
      description="Manage the college display name, public support contacts and policy links."
      actions={<Link href="/college/branding"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">
        Branding workspace
      </Link>}
    />
      <Alert tone="info">
        College profile manages operational contact details. Sign-in branding, domains and logos are managed by a Super Admin.
      </Alert>
    <CollegeContactProfileForm initial={profile} />
  </div>;
}
