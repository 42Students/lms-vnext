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
        eyebrow="Faculty"
        title="All Assignments"
        description="Track class assignments, late-submission state and private grading across your authorized teaching Sections."
      />
      <FacultyAssessmentOverview overview={overview} kind="ASSIGNMENT" />
    </div>
  );
}
