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
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

import { zUuid } from "@/lib/schema-primitives";
export default async function FacultyLearnerGradebookPage({
  params,
}:{params:Promise<{deliveryId:string;learnerMembershipId:string}>}){
  const query=await params;
  const context=await getCurrentRequestContext();
  if(!zUuid.safeParse(query.deliveryId).success ||
     !zUuid.safeParse(query.learnerMembershipId).success) notFound();
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
      actions={<ButtonLink variant="secondary" href={root} className="w-full sm:w-auto">← Published gradebook</ButtonLink>} />
    <section className="border-b border-border pb-5" aria-label="Recorded score totals">
      <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Published scores</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{data.learner.gradedCount}/{data.learner.publishedAssessments}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Recorded points</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{data.learner.earned===null?"Unknown":data.learner.earned+" / "+data.learner.possible}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Recorded percentage</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{data.learner.percent===null?"Unknown":data.learner.percent+"%"}</dd></div>
      </dl>
      {data.learner.hasUnknown&&<p className="mt-2 text-xs text-muted-foreground leading-5">
        Some published assessments have no published score for this learner.
      </p>}
    </section>
    <section aria-label="Published assessment breakdown" className="space-y-3">
      <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Assessment breakdown</Heading>
      {data.assessments.length===0?
        <EmptyState title="No released assessment results"
          description="There are no published assignment or quiz result records for this Section."/>:
        <ul className="divide-y divide-border border-y border-border">
          {data.assessments.map(item=><li key={item.kind+":"+item.assessmentId}
            className="min-w-0 py-4">
            <Badge tone="neutral">{item.kind==="QUIZ"?"Quiz":"Assignment"}</Badge>
            <Heading level={3} size="base" className="mt-1 break-words leading-[1.4] text-[var(--lms-heading)]">{item.title}</Heading>
            <p className="mt-2 text-sm text-body leading-[22px]">{item.status==="UNKNOWN"?
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
