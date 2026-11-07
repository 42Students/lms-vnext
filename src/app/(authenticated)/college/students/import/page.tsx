import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeStudentCsvImport } from "@/components/college/college-student-csv-import";
import { listCollegeStudentImportOptions } from "@/modules/people/college-student-import-options";

export default async function CollegeStudentsImportPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "people.manage", { collegeId: membership.collegeId,
      organizationId: membership.organizationId })) redirect("/dashboard");
  const choices = await listCollegeStudentImportOptions(context);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader
      title="Import students"
      description="Dry-run validation followed by explicit per-row learner onboarding and enrollment."
      actions={<div className="flex min-w-0 flex-wrap gap-2"><PageBackLink href="/college/students" label="Student directory"/><ButtonLink variant="secondary" href="/college/students/register" className="w-full sm:w-auto">Register one student</ButtonLink></div>} />
    <CollegeStudentCsvImport choices={choices} />
  </div>;
}
