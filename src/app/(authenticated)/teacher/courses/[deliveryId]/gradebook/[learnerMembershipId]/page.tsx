import Link from "next/link";
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
  return <div className="min-w-0 max-w-full space-y-6">
    <Link href={root} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
      ← Published gradebook
    </Link>
    <PageHeader eyebrow="Faculty · Published learner scores"
      title={data.learner.displayName||data.learner.email||"Unnamed learner"}
      description={data.delivery.courseName+" · "+data.delivery.sectionName}/>
    <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4" aria-label="Recorded score totals">
      <div className="grid gap-3 sm:grid-cols-3">
        <p className="text-sm text-body">Published scores: {data.learner.gradedCount}/{data.learner.publishedAssessments}</p>
        <p className="text-sm text-body">Recorded points: {data.learner.earned===null?
          "Unknown":data.learner.earned+" / "+data.learner.possible}</p>
        <p className="text-sm text-body">Recorded percentage: {data.learner.percent===null?
          "Unknown":data.learner.percent+"%"}</p>
      </div>
      {data.learner.hasUnknown&&<p className="mt-2 text-xs text-muted-foreground">
        Some published assessments have no published score for this learner.
      </p>}
    </section>
    <section aria-label="Published assessment breakdown" className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Assessment breakdown</h2>
      {data.assessments.length===0?
        <EmptyState title="No released assessment results"
          description="There are no published assignment or quiz result records for this Section."/>:
        <ul className="grid gap-3">
          {data.assessments.map(item=><li key={item.kind+":"+item.assessmentId}
            className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-muted-foreground">{item.kind==="QUIZ"?"Quiz":"Assignment"}</p>
            <h3 className="mt-1 break-words font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm text-body">{item.status==="UNKNOWN"?
              "Score unknown — no published learner grade":
              "Published score: "+item.earned+" / "+item.possible+" ("+item.percent+"%)"}</p>
          </li>)}
        </ul>}
    </section>
    <p className="text-xs leading-5 text-muted-foreground">
      Only scores explicitly released to learners are displayed. Unknown is not
      zero; recorded percentages are not weighted final course grades.
    </p>
  </div>;
}
