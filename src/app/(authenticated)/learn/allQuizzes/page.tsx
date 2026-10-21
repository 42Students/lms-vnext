import { getCurrentRequestContext } from "@/auth/request-context";
import {
  LearnerAssessmentOverview,
  type LearnerQuizOverviewItem,
} from "@/components/courses/learner-assessment-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import {hasMembershipRole} from "@/modules/identity/context";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import {redirect} from "next/navigation";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseQuizzes} from "@/db/schema";

export default async function LearnerQuizzesPage({searchParams}:{searchParams:Promise<{course?:string|string[];content?:string|string[]}>}) {
  const [context,query] = await Promise.all([getCurrentRequestContext(),searchParams]);
  let overview:Awaited<ReturnType<typeof getLearnerAssessmentOverview>>;
  try {
    overview=await getLearnerAssessmentOverview(context,{courseId:query.course});
  } catch(error) {
    if(error instanceof AuthorizationError){
      // Old QuizzesContent was shared by faculty and learners. Keep the
      // learner-only route secure while recovering faculty-only bookmarks.
      if(hasMembershipRole(context,"FACULTY")&&!hasMembershipRole(context,"LEARNER"))
        redirect("/teacher/allQuizzes");
      throw error;
    }
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

  // Legacy ?content= opened the learner's submissions. Resolve numeric
  // import IDs only within this authorized overview; never look up other
  // learners' or other colleges' quizzes by an unscoped legacy integer.
  const linkedContent=Array.isArray(query.content)?query.content[0]:query.content;
  let linkedWarning:string|null=null;
  let legacyLookupFailed=false;
  if(linkedContent){
    let linkedQuiz=overview.quizzes.find(item=>item.id===linkedContent);
    if(!linkedQuiz&&/^[1-9][0-9]{0,9}$/.test(linkedContent)&&overview.quizzes.length){
      const [matching]=await getDb().select({id:courseQuizzes.id}).from(courseQuizzes)
       .where(and(eq(courseQuizzes.legacyQuizId,Number(linkedContent)),
        inArray(courseQuizzes.id,overview.quizzes.map(item=>item.id)))).limit(1)
       .catch(()=>{legacyLookupFailed=true;return [] as {id:string}[];});
      if(matching)linkedQuiz=overview.quizzes.find(item=>item.id===matching.id);
    }
    if(linkedQuiz&&linkedQuiz.attemptsUsed>0){
      redirect("/learn/allQuizzes/"+encodeURIComponent(linkedQuiz.id)+
       "?deliveryId="+encodeURIComponent(linkedQuiz.deliveryId));
    }
    linkedWarning=legacyLookupFailed
     ?"Could not resolve the old quiz link right now. Refresh the quiz list and try again."
     :linkedQuiz
     ?"No submitted attempt was found for the linked quiz. You can open it from the list below."
     :"That old quiz link could not be matched in your current courses. Only quizzes assigned to you can be opened.";
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
      {linkedWarning?<Alert tone="info" role="status">{linkedWarning}</Alert>:null}
      <section aria-label="Quiz listing" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <LearnerAssessmentOverview
        key={overview.selectedCourseId??"all"}
        initialCourseId={overview.selectedCourseId??""}
        courses={overview.courses}
        classScope={overview.classScope}
        items={items}
        kind="QUIZ"
        snapshotNowMs={overview.snapshotNowMs}
      />
      </section>
    </div>
  );
}
