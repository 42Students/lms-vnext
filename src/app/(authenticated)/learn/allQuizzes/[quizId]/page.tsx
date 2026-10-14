import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { getMyQuizAttempts } from "@/modules/courses/quiz-attempt-service";
import {
  learnerAttemptResultLabel, ownQuizHistorySelection,
} from "@/modules/courses/learner-quiz-history-model";

type Props={
  params:Promise<{quizId:string}>;
  searchParams:Promise<{deliveryId?:string|string[];attemptId?:string|string[]}>;
};
function date(value:Date) {
  return new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short"}).format(value);
}
export default async function LearnerQuizHistory({params,searchParams}:Props) {
  const [path,query]=await Promise.all([params,searchParams]);
  const context=await getCurrentRequestContext();
  const overview=await getLearnerAssessmentOverview(context);
  const selection=ownQuizHistorySelection(overview.quizzes,{
    quizId:path.quizId,deliveryId:query.deliveryId,attemptId:query.attemptId,
  });
  if(!selection) notFound();
  const {quiz,attemptId}=selection;
  const attempts=await getMyQuizAttempts(context,quiz.id,quiz.deliveryId);
  const selected=attemptId ? attempts.find(attempt=>attempt.id===attemptId) : null;
  if(attemptId && !selected) notFound();
  const historyUrl="/learn/allQuizzes/"+encodeURIComponent(quiz.id)+"?deliveryId="+encodeURIComponent(quiz.deliveryId);
  return <div className="space-y-6">
    <Link href="/learn/allQuizzes" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← All Quizzes</Link>
    <PageHeader eyebrow="Learner · Quiz history" title={quiz.title}
      description={quiz.courseName+" · "+quiz.lessonName} />
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="text-base font-semibold text-foreground">Attempt history</h2>
      <p className="mt-2 text-sm text-body">
        Attempts are recorded against your current college membership. Results appear only after Faculty publishes them.
      </p>
      {attempts.length===0 ? <p className="mt-4 rounded-lg bg-surface-subtle p-4 text-sm text-body">
        No quiz attempt is recorded for you in this course.
      </p> : <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {attempts.map(attempt=><li key={attempt.id} className="min-w-0 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Attempt {attempt.attemptNumber}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{date(attempt.submittedAt)}</p>
          <p className="mt-2 text-sm text-body">{learnerAttemptResultLabel(attempt)}</p>
          <Link href={historyUrl+"&attemptId="+encodeURIComponent(attempt.id)}
            className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
            {attempt.resultsVisible ? "View result" : "View attempt"}
          </Link>
        </li>)}
      </ol>}
    </section>
    {selected ? <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Attempt {selected.attemptNumber} result</h2>
        <Link href={historyUrl} className="text-sm text-primary-text underline">Close detail</Link>
      </div>
      <p role="status" className="mt-3 text-sm font-semibold text-body">{learnerAttemptResultLabel(selected)}</p>
      {selected.resultsVisible ? selected.answers.length===0 ? (
        <p className="mt-4 text-sm text-body">No question-level review was recorded for this attempt.</p>
      ) : <div className="mt-4 space-y-3">
        {selected.answers.map((answer,index)=><article key={answer.id}
          className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Question {index+1}: {answer.prompt}
          </h3>
          <p className="mt-2 text-sm text-body">
            Awarded {answer.pointsAwarded ?? 0} / {answer.pointsPossible} points
          </p>
          <ul className="mt-2 space-y-1 text-sm text-body">
            {(answer.options ?? []).filter(option=>answer.selectedOptionIds.includes(option.id)).map(option=>
              <li className="break-words" key={option.id}>Selected: {option.text}</li>)}
          </ul>
        </article>)}
      </div> : <p className="mt-4 text-sm text-body">
        Question review and scores are withheld until results are published.
      </p>}
    </section> : null}
  </div>;
}