import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoPrepReadiness,listTpoPrepCourses} from "@/modules/placements/tpo-configuration-read-service";
import {tpoPrepConfigSchema} from "@/modules/placements/tpo-configuration-model";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {buildTpoPreparationCoursePlan} from "@/modules/placements/tpo-preparation-course-plan-model";
export const dynamic="force-dynamic";
export default async function TpoPreparationCoursePlan(){
 const ctx=await getCurrentRequestContext();
 await requireTpoBatchActor(ctx);
 const [settings,catalog]=await Promise.all([getTpoPrepReadiness(ctx),listTpoPrepCourses(ctx)]);
 const parsed=tpoPrepConfigSchema.safeParse(settings.config??{courseIds:[],minimumCompleted:0});
 const plan=buildTpoPreparationCoursePlan({
  ready:settings.ready&&parsed.success,
  courseIds:parsed.success?parsed.data.courseIds:[],minimumCompleted:parsed.success?parsed.data.minimumCompleted:0,catalog,
 });
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO · Students" title="Preparation course plan" />
  <Link href="/tpo/students/preparation-prep" className="inline-flex min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">Back to learners needing support</Link>
  <p className="text-sm text-body">This lists the college placement cell&apos;s recorded readiness-course selection. It is a planning preview, not a course enrollment, assignment, learner completion record, or outreach workflow.</p>
  {!plan.ready?<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3">{!settings.ready?"Preparation settings storage is unavailable.":"Saved preparation settings could not be validated; ask an administrator to review them."}</p>:<>
    <p role="status" className="text-sm">Configured minimum completed courses: {plan.minimumCompleted}. {plan.courses.length} referenced courses are visible in the first 200 active course records.</p>
    {plan.unresolved>0?<p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border p-4 text-sm">{plan.unresolved} configured course reference(s) are not in this bounded active catalog; their availability is unknown.</p>:null}
    {plan.courses.length===0?<p role="status">No active preparation courses in the configured subset.</p>:<ul className="space-y-2">{plan.courses.map(course=><li key={course.id} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <h2 className="font-semibold">{course.name}</h2><p className="text-xs text-muted-foreground">{course.code}</p>
    </li>)}</ul>}
  </>}
  <Link href="/tpo/settings/prep-readiness" className="inline-flex min-h-9 items-center text-link underline">Open existing preparation settings editor</Link>
 </div>;
}
