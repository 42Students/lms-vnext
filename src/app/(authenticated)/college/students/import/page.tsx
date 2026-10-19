import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import Link from "next/link";
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
  return <main className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Students"
      title="Import students"
      description="Dry-run validation followed by explicit per-row learner onboarding and enrollment."
      actions={<Link href="/college/students"
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Student directory</Link>} />
    <CollegeStudentCsvImport choices={choices} />
  </main>;
}
