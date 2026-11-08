import { Disclosure } from "@/components/ui/disclosure";
import {Textarea} from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {tpoPreparationNudgeMessage,tpoPreparationFocusRows} from "@/modules/placements/tpo-student-preparation-nudge-model";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
export const dynamic="force-dynamic";
const querySchema=z.object({page:z.coerce.number().int().min(1).max(100000).default(1)}).strict();
export default async function TpoPreparationNudgePage({searchParams}:{searchParams:Promise<{page?:string|string[]}>}){
 const ctx=await getCurrentRequestContext();const collegeId=await requireTpoBatchActor(ctx);
 const raw=await searchParams;
 const parsed=querySchema.safeParse({page:Array.isArray(raw.page)?undefined:raw.page});
 if(Array.isArray(raw.page)||!parsed.success)return <div className="min-w-0 space-y-4"><PageHeader title="Learners needing preparation support"/><Alert tone="error">Invalid or repeated page filter. No learner roster was loaded. <TextLink href="/tpo/students/preparation-prep" className="inline-flex min-h-11 items-center">Reset page</TextLink></Alert></div>;
 const view=await getTpoStudentsIntelligence(ctx,{collegeId,journeyState:"NEEDS_READINESS_SUPPORT",page:parsed.data.page,pageSize:25});
 const rows=tpoPreparationFocusRows(view.roster.items);
 const href=(page:number)=>"/tpo/students/preparation-prep?page="+page;
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Learners needing preparation support" description="Readiness gaps from recorded placement evidence."
   actions={<div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap">
    <TextLink href="/tpo/students" className="inline-flex min-h-11 w-full items-center justify-center md:w-auto md:min-h-9">All students</TextLink>
    <TextLink href="/tpo/students/preparation-plan" className="inline-flex min-h-11 w-full items-center justify-center md:w-auto md:min-h-9">View the college preparation course plan</TextLink>
   </div>}/>
  <p className="text-sm text-body">{rows.length} evidence-based candidates on the current 25-row page, from {view.roster.total} matching learner journeys. This is not a verified employability, course-assignment or contact/consent list.</p>
  {!view.definitions.registrationsAvailable?<Alert tone="warning">Placement registration records are unavailable; participation evidence may be incomplete.</Alert>:null}
  {rows.length===0?<EmptyState title="No preparation-support candidates on this page."/>:<ul className="min-w-0 divide-y divide-border border-y border-border">{rows.map(row=><li key={row.membershipId} className="min-w-0 py-4">
   <Heading level={2} className="break-words">{row.displayName}</Heading>
   <p className="text-xs text-muted-foreground">{row.branchName} · {row.cohortName} · {row.readinessSignal.replaceAll("_"," ").toLowerCase()}</p>
   <Disclosure title="Manual follow-up draft" className="mt-3 min-w-0 border-t border-border pt-2" contentClassName="pt-3">
   <Textarea aria-label="Manual follow-up draft" readOnly rows={3} value={tpoPreparationNudgeMessage(row)} className="mt-[6px] min-h-32 w-full resize-y"/>
   </Disclosure>
   <TextLink href={"/tpo/students/"+row.membershipId+"/history"} className="mt-2 inline-flex min-h-11 w-full items-center justify-center md:w-auto md:justify-start md:min-h-9">Review recorded placement history</TextLink>
  </li>)}</ul>}
  <nav aria-label="Preparation candidate pages" className="flex flex-wrap gap-3">
   {view.roster.page>1?<TextLink href={href(view.roster.page-1)} className="inline-flex min-h-11 items-center md:min-h-9">Previous page</TextLink>:null}
   {view.roster.page<view.roster.totalPages?<TextLink href={href(view.roster.page+1)} className="inline-flex min-h-11 items-center md:min-h-9">Next page</TextLink>:null}
  </nav>
 </div>;
}
