import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { z } from "zod";
import { facultyGradebookPrivateNotFound } from "@/modules/courses/faculty-gradebook-model";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {getFacultyPublishedGradebookLearner} from
  "@/modules/courses/faculty-gradebook-service";

export default async function FacultyLearnerGradebookPage({
  params,
}:{params:Promise<{deliveryId:string;learnerMembershipId:string}>}){
  const query=await params;
  const context=await getCurrentRequestContext();
  if(!z.string().uuid().safeParse(query.deliveryId).success ||
     !z.string().uuid().safeParse(query.learnerMembershipId).success) notFound();
  let data:Awaited<ReturnType<typeof getFacultyPublishedGradebookLearner>>;
  try {
    data=await getFacultyPublishedGradebookLearner(context,query);
  } catch(error) {
    if(facultyGradebookPrivateNotFound(error)) notFound();
    throw error;
  }
  const root="/teacher/courses/"+encodeURIComponent(query.deliveryId)+"/gradebook";
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader eyebrow="Faculty · Published learner scores"
      title={data.learner.displayName||data.learner.email||"Unnamed learner"}
      description={data.delivery.courseName+" · "+data.delivery.sectionName}
      actions={<Link href={root} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">← Published gradebook</Link>} />
    <section className="border-b border-border pb-5" aria-label="Recorded score totals">
      <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Published scores</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{data.learner.gradedCount}/{data.learner.publishedAssessments}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Recorded points</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{data.learner.earned===null?"Unknown":data.learner.earned+" / "+data.learner.possible}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Recorded percentage</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{data.learner.percent===null?"Unknown":data.learner.percent+"%"}</dd></div>
      </dl>
      {data.learner.hasUnknown&&<p className="mt-2 text-xs text-muted-foreground">
        Some published assessments have no published score for this learner.
      </p>}
    </section>
    <section aria-label="Published assessment breakdown" className="space-y-3">
      <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Assessment breakdown</h2>
      {data.assessments.length===0?
        <EmptyState title="No released assessment results"
          description="There are no published assignment or quiz result records for this Section."/>:
        <ul className="divide-y divide-border border-y border-border">
          {data.assessments.map(item=><li key={item.kind+":"+item.assessmentId}
            className="min-w-0 py-4">
            <Badge tone="neutral">{item.kind==="QUIZ"?"Quiz":"Assignment"}</Badge>
            <h3 className="mt-1 break-words font-semibold text-[16px] leading-[1.4] text-[var(--lms-heading)]">{item.title}</h3>
            <p className="mt-2 text-sm text-body">{item.status==="UNKNOWN"?
              "Score unknown — no published learner grade":
              "Published score: "+item.earned+" / "+item.possible+" ("+item.percent+"%)"}</p>
          </li>)}
        </ul>}
    </section>
    <Disclosure title="About published scores" className="border-t border-border">
      <p className="max-w-3xl px-2 pb-2 text-xs leading-5 text-muted-foreground">Only scores explicitly released to learners are displayed. Unknown is not zero; recorded percentages are not weighted final course grades.</p>
    </Disclosure>
  </div>;
}
