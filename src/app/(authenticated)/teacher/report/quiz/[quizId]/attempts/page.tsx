import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { notFound } from "next/navigation";
import { z } from "zod";
import { hidesFacultyQuizRouteError } from "@/modules/courses/faculty-quiz-report-route-errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { facultyQuizAttemptsQuerySchema,facultyQuizAttemptSearchSchema,facultyQuizAttemptsHref } from "@/modules/courses/faculty-quiz-attempts-model";
import { getFacultyQuizAttemptDrilldown } from "@/modules/courses/faculty-quiz-attempts-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";

import { zUuid } from "@/lib/schema-primitives";
type Query={deliveryId?:string|string[];page?:string|string[];order?:string|string[];q?:string|string[];view?:string|string[]};
export default async function FacultyQuizAttemptPage({
  params,searchParams,
}:{
  params:Promise<{quizId:string}>;searchParams:Promise<Query>;
}) {
  const [{quizId},raw]=await Promise.all([params,searchParams]);
  if (!zUuid.safeParse(quizId).success) notFound();
  const search=facultyQuizAttemptSearchSchema.safeParse(raw);
  const parsed=facultyQuizAttemptsQuerySchema.safeParse({
    quizId,...(search.success?search.data:{deliveryId:undefined}),
  });
  if(!parsed.success)return <section className="min-w-0 space-y-3">
    <PageHeader title="Individual Quiz attempts" />
    <ErrorState title="Invalid quiz attempt filters" description="The section, search, sort or page information in this link could not be verified. No learner attempt details were loaded."
      action={<TextLink href="/teacher/allQuizzes" className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center">Choose a Quiz again</TextLink>}/>
  </section>;
  const context=await getCurrentRequestContext();
  let data: Awaited<ReturnType<typeof getFacultyQuizAttemptDrilldown>>;
  try {
    data = await getFacultyQuizAttemptDrilldown(context, parsed.data);
  } catch (error) {
    if (hidesFacultyQuizRouteError(error)) notFound();
    throw error;
  }
  const back="/teacher/report/quiz/"+encodeURIComponent(quizId)+
    "?deliveryId="+encodeURIComponent(data.query.deliveryId);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Quiz Report" title="Individual Quiz attempts"
      description={data.quiz.title+" · "+data.quiz.sectionName}
      actions={<ButtonLink variant="secondary" href={back}
        className="w-full sm:w-auto">
        Full Quiz report
      </ButtonLink>} />
    <section className="min-w-0 border-b border-border py-4">
      <p className="text-sm text-body leading-[22px]">
        {data.quiz.resultsPublished
          ? "Results are published for learners."
          : "Results are private to authorized Faculty; this page does not publish them."}
      </p>
      <p className="mt-2 text-sm text-body leading-[22px]">
        {formatNumberIN(data.total)} recorded attempt{data.total===1?"":"s"} in this teaching Section.
        Question accuracy below uses each learner&apos;s latest attempt, not every retake.
      </p>
    </section>
    <Disclosure title="Question accuracy (latest attempts)" className="min-w-0 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 pb-4">
      {data.questions.length===0
        ? <p className="mt-3 text-sm text-muted-foreground leading-[22px]">No registered Quiz questions.</p>
        : <ul className="mt-3 grid gap-2">{data.questions.map(q=>
          <li key={q.id} className="min-w-0 border-b border-border py-3 text-sm text-body">
            <span className="font-semibold">{q.prompt}</span>
            <span className="mt-1 block">
              {q.correctCount} correct of {q.answeredCount} answered ·{" "}
              {q.accuracyPercent===null?"No recorded answers":q.accuracyPercent+"%"}
            </span>
          </li>)}</ul>}
    </Disclosure>
    <Tabs ariaLabel="Quiz attempt view" value={data.query.view} renderPanel={false}
      items={[
        {value:"ALL", label:"All attempts", href:facultyQuizAttemptsHref(quizId,data.query.deliveryId,1,data.query.order,data.query.q,"ALL")},
        {value:"LATEST", label:"Latest per learner", href:facultyQuizAttemptsHref(quizId,data.query.deliveryId,1,data.query.order,data.query.q,"LATEST")},
      ]} />
    <Disclosure title="Sort attempts" className="min-w-0 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 py-3">
    <Tabs ariaLabel="Quiz attempt order" value={data.query.order} renderPanel={false}
      items={[
        {value:"NEWEST", label:"Newest first", href:facultyQuizAttemptsHref(quizId,data.query.deliveryId,1,"NEWEST",data.query.q,data.query.view)},
        {value:"OLDEST", label:"Oldest first", href:facultyQuizAttemptsHref(quizId,data.query.deliveryId,1,"OLDEST",data.query.q,data.query.view)},
      ]} />
    </Disclosure>
    <form method="get" role="search" aria-label="Find learner quiz attempts" className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <Input type="hidden" name="deliveryId" value={data.query.deliveryId} />
      {data.query.order!=="NEWEST"?<Input type="hidden" name="order" value={data.query.order}/>:null}
      {data.query.view!=="ALL"?<Input type="hidden" name="view" value={data.query.view}/>:null}
      <Label stack className="min-w-0 w-full">
        Search learner attempts
        <Input type="search" name="q" defaultValue={data.query.q} maxLength={120}
          placeholder="Learner Name" className="min-h-11 md:min-h-[var(--lms-control-height)] w-full max-md:text-[16px]" />
      </Label>
      <Button type="submit" variant="primary" className="w-full sm:w-auto">Search</Button>
      <TextLink href={facultyQuizAttemptsHref(quizId,data.query.deliveryId,1,data.query.order,"",data.query.view)}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-[var(--lms-control-height)]">Clear search</TextLink>
    </form>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p role="status" aria-live="polite" className="text-sm leading-6 text-body">
        Showing {data.items.length} of {data.total} recorded attempt{data.total===1?"":"s"}
        {" · "}{data.query.view==="LATEST"?"Latest attempt per learner":"All attempts"}
        {" · "}{data.query.order==="OLDEST"?"Oldest first":"Newest first"}
        {data.query.q?" · Search: "+data.query.q:""}
      </p>
      {(data.query.q||data.query.view!=="ALL"||data.query.order!=="NEWEST")?
        <TextLink href={facultyQuizAttemptsHref(quizId,data.query.deliveryId,1,"NEWEST","","ALL")}
          className="inline-flex min-h-11 items-center text-sm md:min-h-9">Reset all attempt filters</TextLink>:null}
    </div>
    {data.items.length===0?<EmptyState title="No matching Quiz attempts"
      description={data.query.q||data.query.view!=="ALL"?"No attempts match these filters in your authorized Section. Clear the filters to see the full history.":"There are no persisted attempts in your authorized Section. This does not mean that results were published."} />
    : <ol className="divide-y divide-border border-y border-border">{data.items.map(item=>
      <li key={item.id} className="min-w-0 py-4 focus-within:focus-outline">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <Heading level={2} size="base" className="break-words leading-6 text-[var(--lms-heading)]">{item.learnerName}</Heading>
          <span className="text-sm text-body">Attempt {item.attemptNumber}</span>
        </div>
        <p className="mt-2 text-sm text-body leading-[22px]">
          Score {item.score}/{item.maxScore} · {item.correct}/{item.answered} answers correct
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-5">
          Submitted {istDateTimeFormatter.format(item.submittedAt)} IST
        </p>
        {item.questionResults.length===0
          ? <p className="mt-2 text-sm text-body leading-[22px]">No recorded question answers.</p>
          : <Disclosure title={"Question results ("+item.questionResults.length+")"} className="mt-3 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 pb-3"><ul className="divide-y divide-[var(--lms-canvas-border)]">{item.questionResults.map(result=>
            <li key={result.questionId} className="min-w-0 py-3 text-sm leading-6 text-body">
              <span>{data.questions.find(q=>q.id===result.questionId)?.prompt??"Recorded question"}</span>
              <span className="ml-2 font-semibold">{result.correct?"Correct":"Incorrect"} ·{" "}
                {result.pointsAwarded}/{result.pointsPossible} points</span>
            </li>)}</ul></Disclosure>}
      </li>)}</ol>}
    {data.totalPages > 1 ? <Pagination label="Quiz attempt pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>facultyQuizAttemptsHref(quizId,data.query.deliveryId,page,data.query.order,data.query.q,data.query.view)} /> : null}
    <p className="max-w-prose text-xs leading-5 text-muted-foreground">
      This report is Faculty-only. Question selections and private learner-facing result links
      are not exposed, and no grade-visibility action is performed.
    </p>
  </div>;
}
