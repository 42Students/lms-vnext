import {Textarea} from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {tpoPreparationNudgeMessage,tpoPreparationFocusRows} from "@/modules/placements/tpo-student-preparation-nudge-model";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
const querySchema=z.object({page:z.coerce.number().int().min(1).max(100000).default(1)}).strict();
export default async function TpoPreparationNudgePage({searchParams}:{searchParams:Promise<{page?:string|string[]}>}){
 const ctx=await getCurrentRequestContext();const collegeId=await requireTpoBatchActor(ctx);
 const raw=await searchParams;
 const parsed=querySchema.safeParse({page:Array.isArray(raw.page)?raw.page[0]:raw.page});
 if(!parsed.success)return <div role="alert">Invalid page. <Link href="/tpo/students/preparation-prep">Reset</Link></div>;
 const view=await getTpoStudentsIntelligence(ctx,{collegeId,journeyState:"NEEDS_READINESS_SUPPORT",page:parsed.data.page,pageSize:25});
 const rows=tpoPreparationFocusRows(view.roster.items);
 const href=(page:number)=>"/tpo/students/preparation-prep?page="+page;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO · Students" title="Learners needing preparation support" />
  <Link href="/tpo/students" className="inline-flex min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">All students</Link>
  <Link href="/tpo/students/preparation-plan" className="ml-3 text-link underline">View the college preparation course plan</Link>
  <p className="text-sm text-body">{rows.length} evidence-based candidates on the current 25-row page, from {view.roster.total} matching learner journeys. This is not a verified employability, course-assignment or contact/consent list.</p>
  {!view.definitions.registrationsAvailable?<p role="status" className="rounded-[var(--lms-canvas-radius)] border border-border p-4 text-sm">Placement registration records are unavailable; participation evidence may be incomplete.</p>:null}
  {rows.length===0?<p role="status">No preparation-support candidates on this page.</p>:<ul className="space-y-3">{rows.map(row=><li key={row.membershipId} className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
   <h2 className="font-semibold">{row.displayName}</h2>
   <p className="text-xs text-muted-foreground">{row.branchName} · {row.cohortName} · {row.readinessSignal.replaceAll("_"," ").toLowerCase()}</p>
   <label className="mt-3 block text-sm">Manual follow-up draft<Textarea readOnly rows={3} value={tpoPreparationNudgeMessage(row)} className="mt-1"/></label>
   <Link href={"/tpo/students/"+row.membershipId+"/history"} className="mt-2 inline-flex min-h-9 items-center text-link underline">Review recorded placement history</Link>
  </li>)}</ul>}
  <nav aria-label="Preparation candidate pages" className="flex flex-wrap gap-3">
   {view.roster.page>1?<Link href={href(view.roster.page-1)} className="inline-flex min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">Previous page</Link>:null}
   {view.roster.page<view.roster.totalPages?<Link href={href(view.roster.page+1)} className="inline-flex min-h-9 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">Next page</Link>:null}
  </nav>
 </div>;
}
