import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CollegeStudentCsvImport } from "@/components/college/college-student-csv-import";

export default async function CollegeStudentsImportPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "people.manage", { collegeId: membership.collegeId,
      organizationId: membership.organizationId })) redirect("/dashboard");
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Students"
      title="Student CSV Import"
      description="Dry-run validation followed by explicit per-row learner onboarding and enrollment."
      actions={<Link href="/college/students"
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">Student directory</Link>} />
    <CollegeStudentCsvImport />
  </div>;
}
