import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
import { FacultyAssessmentCreate } from "@/components/courses/faculty-assessment-create";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
import { TextLink } from "@/components/ui/text-link";

export default async function FacultyAllQuizzesPage({searchParams}:{
 searchParams:Promise<{content?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const rawId=(await searchParams).content;
  // Duplicate or malformed deep-link selectors never preselect a quiz.
  const initialQuizId=typeof rawId==="string"&&/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(rawId)?rawId:null;
  const invalidShortcut=rawId!==undefined&&!initialQuizId;
  const overview = await getFacultyAssessmentOverview(context);
  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="My Quizzes"
        actions={<FacultyAssessmentCreate kind="QUIZ" lessons={overview.lessonChoices} />} />
      {invalidShortcut?<p role="status" className="text-sm text-body">That quiz shortcut is invalid; showing all your authorized quizzes instead.{" "}<TextLink href="/teacher/allQuizzes" className="inline-flex min-h-11 items-center">Clear shortcut</TextLink></p>:null}
      <div aria-label="Quiz totals" className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{overview.quizzes.length} {overview.quizzes.length===1?"Quiz":"Quizzes"}</Badge>
          <Badge tone="neutral">{new Set(overview.quizzes.map(quiz=>quiz.courseCode)).size} {new Set(overview.quizzes.map(quiz=>quiz.courseCode)).size===1?"Course":"Courses"}</Badge>
        </div>
        <TextLink href="/teacher/results"
          className="inline-flex min-h-11 items-center text-sm md:min-h-9">
          Assessment results overview →
        </TextLink>
      </div>
      <FacultyAssessmentOverview filesEnabled={assignmentFilesRuntimeEnabled()} overview={overview} kind="QUIZ" initialQuizId={initialQuizId} />
    </div>
  );
}
