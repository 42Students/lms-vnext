import { Disclosure } from "@/components/ui/disclosure";
import {Textarea} from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
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
 if(!parsed.success)return <div className="min-w-0 space-y-4"><PageHeader title="Learners needing preparation support"/><Alert tone="error">Invalid page. <Link href="/tpo/students/preparation-prep" className="inline-flex min-h-11 items-center font-semibold underline">Reset</Link></Alert></div>;
 const view=await getTpoStudentsIntelligence(ctx,{collegeId,journeyState:"NEEDS_READINESS_SUPPORT",page:parsed.data.page,pageSize:25});
 const rows=tpoPreparationFocusRows(view.roster.items);
 const href=(page:number)=>"/tpo/students/preparation-prep?page="+page;
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Learners needing preparation support" description="Readiness gaps from recorded placement evidence."
   actions={<div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
    <Link href="/tpo/students" className="lms-inline-link inline-flex min-h-11 w-full items-center justify-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">All students</Link>
    <Link href="/tpo/students/preparation-plan" className="lms-inline-link inline-flex min-h-11 w-full items-center justify-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">View the college preparation course plan</Link>
   </div>}/>
  <p className="text-sm text-body">{rows.length} evidence-based candidates on the current 25-row page, from {view.roster.total} matching learner journeys. This is not a verified employability, course-assignment or contact/consent list.</p>
  {!view.definitions.registrationsAvailable?<Alert tone="warning">Placement registration records are unavailable; participation evidence may be incomplete.</Alert>:null}
  {rows.length===0?<EmptyState title="No preparation-support candidates on this page."/>:<ul className="min-w-0 divide-y divide-border border-y border-border">{rows.map(row=><li key={row.membershipId} className="min-w-0 py-4">
   <h2 className="break-words font-semibold">{row.displayName}</h2>
   <p className="text-xs text-muted-foreground">{row.branchName} · {row.cohortName} · {row.readinessSignal.replaceAll("_"," ").toLowerCase()}</p>
   <Disclosure title="Manual follow-up draft" className="mt-3 min-w-0 border-t border-border pt-2" contentClassName="pt-3">
   <Textarea aria-label="Manual follow-up draft" readOnly rows={3} value={tpoPreparationNudgeMessage(row)} className="mt-[6px] min-h-32 w-full resize-y"/>
   </Disclosure>
   <Link href={"/tpo/students/"+row.membershipId+"/history"} className="lms-inline-link mt-2 inline-flex min-h-11 w-full items-center justify-center text-link underline sm:w-auto sm:justify-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Review recorded placement history</Link>
  </li>)}</ul>}
  <nav aria-label="Preparation candidate pages" className="flex flex-wrap gap-3">
   {view.roster.page>1?<Link href={href(view.roster.page-1)} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Previous page</Link>:null}
   {view.roster.page<view.roster.totalPages?<Link href={href(view.roster.page+1)} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Next page</Link>:null}
  </nav>
 </div>;
}
