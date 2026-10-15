import Link from "next/link";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoBatchStudentRegistrations} from "@/modules/placements/tpo-batch-student-registration-service";
import {prepareTpoUnrecordedNudges,tpoBatchNudgeDraft} from "@/modules/placements/tpo-batch-nudge-prep-model";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export default async function BatchNudgePrep({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{page?:string|string[]}>}){
 const {batchId}=await params;
 const raw=await searchParams;const selected=Array.isArray(raw.page)?raw.page[0]:raw.page;
 const parsed=pageSchema.safeParse(selected);
 if(!parsed.success)return <main role="alert">Invalid page. <Link href={"/tpo/batches/"+batchId+"/nudge-prep"}>Start again</Link></main>;
 const data=await getTpoBatchStudentRegistrations(await getCurrentRequestContext(),batchId,parsed.data);
 const nudgeRows=prepareTpoUnrecordedNudges(data.students,data.registrationAvailable);
 const href=(p:number)=>"/tpo/batches/"+batchId+"/nudge-prep?page="+p;
 return <main className="min-w-0 space-y-4">
  <h1 className="text-xl font-semibold">{data.batch.name} — Reminder preparation</h1>
  <Link href={"/tpo/batches/"+batchId+"/students"} className="text-primary-text underline">Back to students</Link>
  {!data.registrationAvailable?<p role="status" className="rounded border border-border p-4">Registration storage is unavailable. No learner follow-up list is inferred.</p>:<p className="text-sm text-body">{nudgeRows.length} of the {data.students.length} learners on this page have no recorded choice. This is not a full-batch count or a delivery list.</p>}
  <label className="block text-sm">Copyable manual reminder draft<textarea readOnly rows={4} className="mt-1 w-full rounded border border-border bg-surface p-3" value={tpoBatchNudgeDraft(data.batch.name)}/></label>
  {nudgeRows.length===0?<p role="status" className="rounded border border-border p-4">No eligible unrecorded-choice rows on this page.</p>:
   <ul className="space-y-2">{nudgeRows.map(row=><li key={row.membershipId} className="rounded border border-border bg-surface p-3">
    <p className="font-semibold">{row.name}</p>
    <p className="text-xs text-muted-foreground">No recorded choice. The placement cell must use its approved communication process; this page does not contact the learner.</p>
   </li>)}</ul>}
  <nav aria-label="Batch reminder pages" className="flex flex-wrap gap-3">
   {data.page>1?<Link className="text-primary-text underline" href={href(data.page-1)}>Previous page</Link>:null}
   {data.hasMore?<Link className="text-primary-text underline" href={href(data.page+1)}>Next page</Link>:null}
  </nav>
 </main>;
}
