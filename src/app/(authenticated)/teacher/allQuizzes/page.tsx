import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";

export default async function FacultyAllQuizzesPage() {
  const context = await getCurrentRequestContext();
  const overview = await getFacultyAssessmentOverview(context);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faculty"
        title="All Quizzes"
        description="View quizzes across your active teaching Sections, review attempts and publish results with your existing Course permissions."
      />
      <FacultyAssessmentOverview overview={overview} kind="QUIZ" />
    </div>
  );
}
