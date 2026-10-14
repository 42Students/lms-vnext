import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { hidesFacultyQuizRouteError } from "@/modules/courses/faculty-quiz-report-route-errors";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { facultyQuizAttemptsQuerySchema,facultyQuizAttemptSearchSchema,facultyQuizAttemptsHref } from "@/modules/courses/faculty-quiz-attempts-model";
import { getFacultyQuizAttemptDrilldown } from "@/modules/courses/faculty-quiz-attempts-service";

type Query={deliveryId?:string|string[];page?:string|string[]};
export default async function FacultyQuizAttemptPage({
  params,searchParams,
}:{
  params:Promise<{quizId:string}>;searchParams:Promise<Query>;
}) {
  const [{quizId},raw]=await Promise.all([params,searchParams]);
  if (!z.string().uuid().safeParse(quizId).success) notFound();
  const search=facultyQuizAttemptSearchSchema.safeParse(raw);
  const parsed=facultyQuizAttemptsQuerySchema.safeParse({
    quizId,...(search.success?search.data:{deliveryId:undefined}),
  });
  if(!parsed.success)return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid Quiz Section or pagination</h1>
    <Link href="/teacher/allQuizzes" className="text-primary-text underline">All Quizzes</Link>
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
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Quiz Report" title="Individual Quiz attempts"
      description={data.quiz.title+" · "+data.quiz.sectionName}
      actions={<Link href={back}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Full Quiz report
      </Link>} />
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-body">
        {data.quiz.resultsPublished
          ? "Results are published for learners."
          : "Results are private to authorized Faculty; this page does not publish them."}
      </p>
      <p className="mt-2 text-sm text-body">
        {data.total} recorded attempt{data.total===1?"":"s"} in this teaching Section.
        Question accuracy below uses each learner&apos;s latest attempt, not every retake.
      </p>
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Question accuracy (latest attempts)</h2>
      {data.questions.length===0
        ? <p className="mt-3 text-sm text-muted-foreground">No registered Quiz questions.</p>
        : <ul className="mt-3 grid gap-2">{data.questions.map(q=>
          <li key={q.id} className="rounded-lg bg-surface-subtle p-3 text-sm text-body">
            <span className="font-semibold">{q.prompt}</span>
            <span className="mt-1 block">
              {q.correctCount} correct of {q.answeredCount} answered ·{" "}
              {q.accuracyPercent===null?"No recorded answers":q.accuracyPercent+"%"}
            </span>
          </li>)}</ul>}
    </section>
    {data.items.length===0?<EmptyState title="No recorded Quiz attempts"
      description="There are no persisted attempts in your authorized Section. This does not mean that results were published." />
    : <ol className="grid gap-3">{data.items.map(item=>
      <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-semibold text-foreground">{item.learnerName}</h2>
          <span className="text-sm text-body">Attempt {item.attemptNumber}</span>
        </div>
        <p className="mt-2 text-sm text-body">
          Score {item.score}/{item.maxScore} · {item.correct}/{item.answered} answers correct
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Submitted {new Intl.DateTimeFormat("en-IN",{
            dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
          }).format(item.submittedAt)} IST
        </p>
        {item.questionResults.length===0
          ? <p className="mt-2 text-sm text-body">No recorded question answers.</p>
          : <ul className="mt-3 space-y-2">{item.questionResults.map(result=>
            <li key={result.questionId} className="rounded-lg bg-surface-subtle px-3 py-2 text-sm text-body">
              <span>{data.questions.find(q=>q.id===result.questionId)?.prompt??"Recorded question"}</span>
              <span className="ml-2 font-semibold">{result.correct?"Correct":"Incorrect"} ·{" "}
                {result.pointsAwarded}/{result.pointsPossible} points</span>
            </li>)}</ul>}
      </li>)}</ol>}
    <nav aria-label="Quiz attempt pages" className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
      <div className="flex gap-3">
        {data.page>1?<Link href={facultyQuizAttemptsHref(quizId,data.query.deliveryId,data.page-1)}
          className="text-sm font-semibold text-primary-text">Previous</Link>:null}
        {data.page<data.totalPages?<Link href={facultyQuizAttemptsHref(quizId,data.query.deliveryId,data.page+1)}
          className="text-sm font-semibold text-primary-text">Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">
      This report is Faculty-only. Question selections and private learner-facing result links
      are not exposed, and no grade-visibility action is performed.
    </p>
  </div>;
}
