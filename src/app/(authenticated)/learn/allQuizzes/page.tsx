import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerQuizOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";

export default async function LearnerQuizzesPage() {
  const context =
    await getCurrentRequestContext();
  const overview =
    await getLearnerAssessmentOverview(
      context,
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
    <div className="space-y-6">
      <PageHeader
        title="All Quizzes"
      />
      <LearnerAssessmentOverview
        courses={overview.courses}
        classScope={overview.classScope}
        items={items}
        kind="QUIZ"
        snapshotNowMs={overview.snapshotNowMs}
      />
    </div>
  );
}
