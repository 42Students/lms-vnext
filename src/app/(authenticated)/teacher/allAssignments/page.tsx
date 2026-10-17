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
    <div className="space-y-6">
      <PageHeader
        title="My Assignments"
      />
      <nav aria-label="Assignment report shortcuts" className="flex justify-end">
        <Link href="/teacher/results"
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
          Assessment results overview →
        </Link>
      </nav>
      <FacultyAssessmentOverview filesEnabled={assignmentFilesRuntimeEnabled()} overview={overview} kind="ASSIGNMENT" />
    </div>
  );
}
