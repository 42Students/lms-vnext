import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerQuizOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";

export default async function LearnerQuizzesPage({searchParams}:{searchParams:Promise<{course?:string|string[]}>}) {
  const [context,query] = await Promise.all([getCurrentRequestContext(),searchParams]);
  const overview =
    await getLearnerAssessmentOverview(
      context,{courseId:query.course},
    );

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
