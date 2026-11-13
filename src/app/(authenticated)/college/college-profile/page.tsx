import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { getOwnCollegeContactProfile } from "@/modules/colleges/college-contact-profile-service";
import { hasMembershipRole } from "@/modules/identity/context";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
export default async function CollegeContactProfilePage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, ROLE.COLLEGE_ADMIN)) redirect("/dashboard");
  const profile = await getOwnCollegeContactProfile(context);
  return <div className="min-w-0 max-w-full space-y-[var(--lms-space-4)]">
    <PageHeader
      title="College contact profile"
      description="Manage the college display name, public support contacts and policy links."
      actions={<TextLink href="/college/branding"
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Branding workspace
      </TextLink>}
    />
      <Alert tone="info" className="max-w-[80ch]">
        College profile manages operational contact details. Sign-in branding, domains and logos are managed by a Super Admin.
      </Alert>
    <CollegeContactProfileForm initial={profile} />
  </div>;
}
