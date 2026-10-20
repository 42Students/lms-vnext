import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { FacultyAssessmentOverview } from "@/components/courses/faculty-assessment-overview";
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
      <PageHeader title="My Quizzes" actions={<Link href="/teacher/results"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-[var(--lms-control-height)]">
          Assessment results overview →
        </Link>} />
      <FacultyAssessmentOverview filesEnabled={assignmentFilesRuntimeEnabled()} overview={overview} kind="QUIZ" initialQuizId={initialQuizId} />
    </div>
  );
}
