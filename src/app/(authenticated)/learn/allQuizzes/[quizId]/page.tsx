import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { resolveLearnerOfferingDelivery } from "@/modules/courses/learner-offering-delivery-model";
import { getMyQuizAttempts } from "@/modules/courses/quiz-attempt-service";
import {
  learnerAttemptResultLabel, learnerQuizAttemptDateLabel, learnerQuizQuestionAwardLabel, learnerQuizSelectedAnswerMessage, ownQuizHistorySelection,
} from "@/modules/courses/learner-quiz-history-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

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
  if(resolution.kind==="choose") return <div className="min-w-0 space-y-[16px]">
    <PageBackLink href="/learn/allQuizzes" label="All Quizzes"/>
    <PageHeader title="Choose a course" description="This quiz is in more than one of your courses." />
    <ul className="min-w-0 divide-y divide-border border-y border-border">
      {resolution.options.map(option=><li key={option.deliveryId} className="min-w-0 py-[var(--lms-space-2)]">
        <TextLink className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9"
          href={"/learn/allQuizzes/"+encodeURIComponent(path.quizId)+"?deliveryId="+encodeURIComponent(option.deliveryId)}>
          {option.courseName}
        </TextLink>
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
  return <div className="min-w-0 space-y-[16px]">
    <PageBackLink href="/learn/allQuizzes" label="All Quizzes"/>
    <PageHeader title={quiz.title} />
    <section aria-labelledby="quiz-attempt-history-heading" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
      <Heading level={2} size="base" id="quiz-attempt-history-heading" className="text-[var(--lms-heading)]">Attempt history</Heading>
      <p className="mt-2 max-w-prose text-sm leading-[22px] text-body">
        Attempts are recorded against your current college membership. Results appear only after Faculty publishes them.
      </p>
      {attempts.length===0 ? <p className="border-t border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] text-sm text-body">
        Not attempted · No quiz attempt is recorded for you in this course.
      </p> : <ol className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
        {attempts.map(attempt=><li key={attempt.id} className="flex min-w-0 flex-col gap-[var(--lms-space-2)] py-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1"><Heading level={3} size="sm" className="text-[var(--lms-heading)]">Attempt {attempt.attemptNumber}</Heading>
          <p className="mt-1 text-xs text-muted-foreground">{date(attempt.submittedAt)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-body"><StatusBadge tone={attempt.resultsVisible?"success":"neutral"}>{attempt.resultsVisible?"Results published":"Results pending"}</StatusBadge>{learnerAttemptResultLabel(attempt)}</p></div>
          <TextLink href={historyUrl+"&attemptId="+encodeURIComponent(attempt.id)}
            aria-label={(attempt.resultsVisible?"View result":"View attempt")+" for attempt "+attempt.attemptNumber}
            aria-current={selected?.id===attempt.id?"page":undefined}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center text-sm sm:w-auto md:min-h-9">
            {attempt.resultsVisible ? "View result" : "View attempt"}
          </TextLink>
        </li>)}
      </ol>}
    </section>
    {selected ? <section className="min-w-0 space-y-3 border-b border-border pb-[var(--lms-space-4)]">
      <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Heading level={2} size="base" className="text-[var(--lms-heading)]">Attempt {selected.attemptNumber} result</Heading>
        <TextLink href={historyUrl} className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">Close detail</TextLink>
      </div>
      <p role="status" className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-body leading-[1.6]"><StatusBadge tone={selected.resultsVisible?"success":"neutral"}>{selected.resultsVisible?"Published":"Not published"}</StatusBadge>{learnerAttemptResultLabel(selected)}</p>
      {selected.resultsVisible ? selected.answers.length===0 ? (
        <Alert tone="info" role="status" className="mt-4">No question-level review was recorded for this attempt.</Alert>
      ) : <div className="min-w-0 divide-y divide-border border-y border-border">
        {selected.answers.map((answer,index)=><article key={answer.id}
          className="min-w-0 py-[var(--lms-space-4)]">
          <Heading level={3} size="sm" className="text-[var(--lms-heading)]">
            Question {index+1}: {answer.prompt}
          </Heading>
          <p className="mt-2 max-w-prose text-sm leading-[22px] text-body">
            {learnerQuizQuestionAwardLabel(answer.pointsAwarded??null,answer.pointsPossible)}
          </p>
          <ul className="mt-2 min-w-0 space-y-1 break-words text-sm text-body">
            {(answer.options ?? []).filter(option=>answer.selectedOptionIds.includes(option.id)).map(option=>
              <li className="break-words" key={option.id}>Selected: {option.text}</li>)}
          </ul>
          {learnerQuizSelectedAnswerMessage(answer.selectedOptionIds,answer.options??[]) ? (
            <p role="status" className="mt-2 text-sm text-muted-foreground leading-[1.6]">
              {learnerQuizSelectedAnswerMessage(answer.selectedOptionIds,answer.options??[])}
            </p>
          ) : null}
        </article>)}
      </div> : <Alert tone="info" role="status" className="mt-4">Question review and scores are withheld until results are published.</Alert>}
    </section> : null}
  </div>;
}