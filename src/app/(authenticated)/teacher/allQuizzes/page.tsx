import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
import { FacultyAssessmentCreate } from "@/components/courses/faculty-assessment-create";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";

export default async function FacultyAllQuizzesPage({searchParams}:{
 searchParams:Promise<{content?:string}>;
}) {
  const context = await getCurrentRequestContext();
  const rawId=(await searchParams).content;
  const initialQuizId=rawId&&/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(rawId)?rawId:null;
  const overview = await getFacultyAssessmentOverview(context);
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="My Quizzes"
        actions={<FacultyAssessmentCreate kind="QUIZ" lessons={overview.lessonChoices} />} />
      <div aria-label="Quiz totals" className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{overview.quizzes.length} {overview.quizzes.length===1?"Quiz":"Quizzes"}</Badge>
          <Badge tone="neutral">{new Set(overview.quizzes.map(quiz=>quiz.courseCode)).size} {new Set(overview.quizzes.map(quiz=>quiz.courseCode)).size===1?"Course":"Courses"}</Badge>
        </div>
        <Link href="/teacher/results"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] md:min-h-9">
          Assessment results overview →
        </Link>
      </div>
      <FacultyAssessmentOverview filesEnabled={assignmentFilesRuntimeEnabled()} overview={overview} kind="QUIZ" initialQuizId={initialQuizId} />
    </div>
  );
}
