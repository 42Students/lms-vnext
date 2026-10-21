import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerQuizOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";

export default async function LearnerQuizzesPage({searchParams}:{searchParams:Promise<{course?:string|string[]}>}) {
  const [context,query] = await Promise.all([getCurrentRequestContext(),searchParams]);
  let overview:Awaited<ReturnType<typeof getLearnerAssessmentOverview>>;
  try {
    overview=await getLearnerAssessmentOverview(context,{courseId:query.course});
  } catch(error) {
    if(error instanceof AuthorizationError)throw error;
    // Render a genuine failure, not a fabricated empty successful quiz list.
    const course=typeof query.course==="string"&&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query.course)
      ? query.course:null;
    const retryHref="/learn/allQuizzes"+(course?"?course="+encodeURIComponent(course):"");
    return <div className="min-w-0 max-w-full space-y-4">
      <PageHeader title="All Quizzes" />
      <Alert tone="error" role="alert" title="Failed to load quizzes. Please try again.">
        Your quiz records could not be loaded. No empty result has been assumed.
      </Alert>
      <Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>
    </div>;
  }

  const items: LearnerQuizOverviewItem[] =
    overview.quizzes.map((quiz) => ({
      kind: "QUIZ",
      id: quiz.id,
      deliveryId: quiz.deliveryId,
      courseId: quiz.courseId,
      courseName: quiz.courseName,
      courseCode: quiz.courseCode,
      lessonId: quiz.lessonId,
      lessonName: quiz.lessonName,
      title: quiz.title,
      description: quiz.description,
      dueAt:
        quiz.dueAt?.toISOString() ?? null,
      createdAt:
        quiz.createdAt.toISOString(),
      maxAttempts: quiz.maxAttempts,
      totalPoints: quiz.totalPoints,
      status: quiz.status,
      resultsPublished:
        quiz.resultsPublished,
      attemptsUsed: quiz.attemptsUsed,
      attemptsRemaining:
        quiz.attemptsRemaining,
      progressStatus:
        quiz.progress.status,
    }));

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader
        title="All Quizzes"
      />
      <LearnerAssessmentOverview
        key={overview.selectedCourseId??"all"}
        initialCourseId={overview.selectedCourseId??""}
        courses={overview.courses}
        classScope={overview.classScope}
        items={items}
        kind="QUIZ"
        snapshotNowMs={overview.snapshotNowMs}
      />
    </div>
  );
}
