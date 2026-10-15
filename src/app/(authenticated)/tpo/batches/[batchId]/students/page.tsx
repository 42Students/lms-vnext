import Link from "next/link";
import {tpoEligibilityImportScaffoldHref} from "@/modules/placements/tpo-eligibility-import-scaffold-model";
import {TpoAcademicImportPreview} from "@/components/tpo/tpo-academic-import-preview";
import {TpoBatchEligibilityImport} from "@/components/tpo/tpo-batch-eligibility-import";
import {TpoBatchInlineDecision} from "@/components/tpo/tpo-batch-inline-decision";
import { getCurrentRequestContext } from "@/auth/request-context";
import {getTpoBatchStudentRegistrations} from "@/modules/placements/tpo-batch-student-registration-service";
import { z } from "zod";
import {batchStudentViewSchema,filterBatchStudentNames,batchStudentPageHref} from "@/modules/placements/tpo-batch-student-view-model";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export default async function BatchStudents({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{page?:string|string[];q?:string|string[]}>}){
 const {batchId}=await params,raw=await searchParams;
 const parsed=pageSchema.safeParse(Array.isArray(raw.page)?raw.page[0]:raw.page??1);
 if(!parsed.success)return <p role="alert">Invalid page number. <Link href={"/tpo/batches/"+batchId+"/students"}>Start again</Link></p>;
 const view=batchStudentViewSchema.safeParse({q:Array.isArray(raw.q)?raw.q[0]:raw.q});
 if(!view.success)return <p role="alert">Invalid student search. <Link href={"/tpo/batches/"+batchId+"/students"}>Reset filters</Link></p>;
 const result=await getTpoBatchStudentRegistrations(await getCurrentRequestContext(),batchId,parsed.data);
 const visible=filterBatchStudentNames(result.students,view.data.q);
 const href=(page:number)=>batchStudentPageHref(batchId,page,view.data);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{result.batch.name} — Students</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-sm text-primary-text underline">Batch overview</Link>
 <div className="flex flex-wrap items-center justify-between gap-2">
  <p className="text-xs text-muted-foreground">CSV includes only this page (up to 25 students), with decision source and review flags.</p>
  <a href={"/api/placements/tpo/batches/"+batchId+"/students/export?page="+result.page}
   className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm">Export current page CSV</a>
 </div>
 <a href={tpoEligibilityImportScaffoldHref(batchId,result.page)} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Download blank eligibility import CSV (this page)</a>
 <TpoBatchEligibilityImport batchId={batchId}/>
 <TpoAcademicImportPreview activeIds={result.students.map(s=>s.membershipId)}/>
 <Link href={"/tpo/batches/"+batchId+"/nudge-prep"} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Prepare follow-up for unrecorded choices</Link>
 <p className="text-sm text-muted-foreground">Registration choices are separate from eligibility; missing choices do not imply consent.</p>
 {!result.registrationAvailable?<p role="status" className="text-sm">Registration records unavailable.</p>:null}
 <form action={"/tpo/batches/"+batchId+"/students"} method="get" className="flex flex-wrap items-end gap-2 rounded border border-border bg-surface p-3"><label className="min-w-0 flex-1 text-sm">Search names on this page<input type="search" name="q" defaultValue={view.data.q} maxLength={100} className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label><button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Filter</button></form>
 <p className="text-xs text-muted-foreground">Search applies to the currently loaded 25 active learners, not every member of this batch. {visible.length} of {result.students.length} on this page match.</p>
 <p className="text-sm text-muted-foreground">Active learners only. Eligibility decisions inherit from learner, class, then batch; ambiguous class enrollment requires review.</p>
 {visible.length===0?<p role="status">{result.students.length===0?"No active learners found on this page.":"No student names match on this page."}</p>:<ul className="space-y-2">
 {visible.map(s=><li className="min-w-0 rounded-lg border border-border bg-surface p-3 text-sm" key={s.membershipId}>
  <div className="flex flex-wrap justify-between gap-2"><strong className="break-words">{s.name}</strong><span>{s.ambiguous?"Needs review":s.decision.replaceAll("_"," ")}</span></div>
  <p className="text-xs text-muted-foreground">Registration: {s.registration?s.registration.choice?.replaceAll("_"," ")??"Not recorded":"Unavailable"}{s.registration?.source?" · via "+s.registration.source.toLowerCase():""}</p>
  <p className="text-xs text-muted-foreground">Source: {s.source.toLowerCase()}{s.reason?" · "+s.reason:""}</p>
  {!s.ambiguous?<TpoBatchInlineDecision key={s.membershipId+":"+(s.direct.updatedAt??"none")} membershipId={s.membershipId} expected={s.direct}/>:null}
  <Link className="mt-2 inline-flex min-h-10 items-center text-primary-text underline" href={"/tpo/students/"+s.membershipId+"/participation"}>Open learner participation</Link>
 </li>)}</ul>}
 <nav className="flex flex-wrap gap-2" aria-label="Student pages">{result.page>1?<Link href={href(result.page-1)} className="rounded border px-3 py-2">Previous</Link>:null}
 {result.hasMore?<Link href={href(result.page+1)} className="rounded border px-3 py-2">Next</Link>:null}</nav>
 </main>;
}
