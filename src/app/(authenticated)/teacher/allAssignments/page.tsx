import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";

export default async function FacultyAllAssignmentsPage() {
  const context = await getCurrentRequestContext();
  const overview = await getFacultyAssessmentOverview(context);
  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="My Assignments" actions={<Link href="/teacher/results"
          className="inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Assessment results overview →
        </Link>} />
      <FacultyAssessmentOverview filesEnabled={assignmentFilesRuntimeEnabled()} overview={overview} kind="ASSIGNMENT" />
    </div>
  );
}
