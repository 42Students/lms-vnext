import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { resolveLearnerOfferingDelivery } from "@/modules/courses/learner-offering-delivery-model";
import { getMyQuizAttempts } from "@/modules/courses/quiz-attempt-service";
import {
  learnerAttemptResultLabel, learnerQuizAttemptDateLabel, learnerQuizQuestionAwardLabel, learnerQuizSelectedAnswerMessage, ownQuizHistorySelection,
} from "@/modules/courses/learner-quiz-history-model";

type Props={
  params:Promise<{quizId:string}>;
  searchParams:Promise<{deliveryId?:string|string[];attemptId?:string|string[]}>;
};
function date(value:Date) {
  return learnerQuizAttemptDateLabel(value);
}
export default async function LearnerQuizHistory({params,searchParams}:Props) {
  const [path,query]=await Promise.all([params,searchParams]);
  const context=await getCurrentRequestContext();
  const overview=await getLearnerAssessmentOverview(context);
  const resolution=resolveLearnerOfferingDelivery(overview.quizzes,path.quizId,query.deliveryId);
  if(resolution.kind==="none") notFound();
  if(resolution.kind==="choose") return <div className="min-w-0 space-y-6">
    <PageBackLink href="/learn/allQuizzes" label="All Quizzes" />
    <PageHeader title="Choose a course" description="This quiz is in more than one of your courses." />
    <ul className="divide-y divide-border border-y border-border">
      {resolution.options.map(option=><li key={option.deliveryId} className="p-4">
        <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover md:min-h-9"
          href={"/learn/allQuizzes/"+encodeURIComponent(path.quizId)+"?deliveryId="+encodeURIComponent(option.deliveryId)}>
          {option.courseName}
        </Link>
      </li>)}
    </ul>
  </div>;
  const selection=ownQuizHistorySelection(overview.quizzes,{
    quizId:path.quizId,deliveryId:resolution.deliveryId,attemptId:query.attemptId,
  });
  if(!selection) notFound();
  const {quiz,attemptId}=selection;
  const attempts=await getMyQuizAttempts(context,quiz.id,quiz.deliveryId);
  const selected=attemptId ? attempts.find(attempt=>attempt.id===attemptId) : null;
  if(attemptId && !selected) notFound();
  const historyUrl="/learn/allQuizzes/"+encodeURIComponent(quiz.id)+"?deliveryId="+encodeURIComponent(quiz.deliveryId);
  return <div className="space-y-6">
    <PageBackLink href="/learn/allQuizzes" label="All Quizzes" />
    <PageHeader title={quiz.title} />
    <section className="border-b border-border py-4 md:py-6">
      <h2 className="text-base font-semibold text-foreground">Attempt history</h2>
      <p className="mt-2 text-sm text-body">
        Attempts are recorded against your current college membership. Results appear only after Faculty publishes them.
      </p>
      {attempts.length===0 ? <EmptyState title="Not attempted" description="No quiz attempt is recorded for you in this course." /> : <ol className="mt-4 divide-y divide-border border-y border-border">
        {attempts.map(attempt=><li key={attempt.id} className="min-w-0 py-4">
          <h3 className="text-sm font-semibold text-foreground">Attempt {attempt.attemptNumber}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{date(attempt.submittedAt)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-body"><StatusBadge tone={attempt.resultsVisible?"success":"neutral"}>{attempt.resultsVisible?"Results published":"Results pending"}</StatusBadge>{learnerAttemptResultLabel(attempt)}</p>
          <Link href={historyUrl+"&attemptId="+encodeURIComponent(attempt.id)}
            aria-current={selected?.id===attempt.id?"page":undefined}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
            {attempt.resultsVisible ? "View result" : "View attempt"}
          </Link>
        </li>)}
      </ol>}
    </section>
    {selected ? <section className="border-b border-border py-4 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Attempt {selected.attemptNumber} result</h2>
        <Link href={historyUrl} className="inline-flex min-h-11 items-center text-sm text-primary-text underline hover:text-primary-hover md:min-h-9">Close detail</Link>
      </div>
      <p role="status" className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-body"><StatusBadge tone={selected.resultsVisible?"success":"neutral"}>{selected.resultsVisible?"Published":"Not published"}</StatusBadge>{learnerAttemptResultLabel(selected)}</p>
      {selected.resultsVisible ? selected.answers.length===0 ? (
        <Alert tone="info" role="status" className="mt-4">No question-level review was recorded for this attempt.</Alert>
      ) : <div className="mt-4 divide-y divide-border border-y border-border">
        {selected.answers.map((answer,index)=><article key={answer.id}
          className="py-4">
          <h3 className="text-sm font-semibold text-foreground">
            Question {index+1}: {answer.prompt}
          </h3>
          <p className="mt-2 text-sm text-body">
            {learnerQuizQuestionAwardLabel(answer.pointsAwarded??null,answer.pointsPossible)}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-body">
            {(answer.options ?? []).filter(option=>answer.selectedOptionIds.includes(option.id)).map(option=>
              <li className="break-words" key={option.id}>Selected: {option.text}</li>)}
          </ul>
          {learnerQuizSelectedAnswerMessage(answer.selectedOptionIds,answer.options??[]) ? (
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {learnerQuizSelectedAnswerMessage(answer.selectedOptionIds,answer.options??[])}
            </p>
          ) : null}
        </article>)}
      </div> : <Alert tone="info" role="status" className="mt-4">Question review and scores are withheld until results are published.</Alert>}
    </section> : null}
  </div>;
}