import Link from "next/link";
import {TpoAcademicImportPreview} from "@/components/tpo/tpo-academic-import-preview";
import {TpoBatchEligibilityImport} from "@/components/tpo/tpo-batch-eligibility-import";
import {TpoBatchInlineDecision} from "@/components/tpo/tpo-batch-inline-decision";
import { getCurrentRequestContext } from "@/auth/request-context";
import {getTpoBatchStudentRegistrations} from "@/modules/placements/tpo-batch-student-registration-service";
import { z } from "zod";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export default async function BatchStudents({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{page?:string|string[]}>}){
 const {batchId}=await params,raw=await searchParams;
 const parsed=pageSchema.safeParse(Array.isArray(raw.page)?raw.page[0]:raw.page??1);
 if(!parsed.success)return <p role="alert">Invalid page number. <Link href={"/tpo/batches/"+batchId+"/students"}>Start again</Link></p>;
 const result=await getTpoBatchStudentRegistrations(await getCurrentRequestContext(),batchId,parsed.data);
 const href=(page:number)=>"/tpo/batches/"+batchId+"/students?page="+page;
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{result.batch.name} — Students</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-sm text-primary-text underline">Batch overview</Link>
 <div className="flex flex-wrap items-center justify-between gap-2">
  <p className="text-xs text-muted-foreground">CSV includes only this page (up to 25 students), with decision source and review flags.</p>
  <a href={"/api/placements/tpo/batches/"+batchId+"/students/export?page="+result.page}
   className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm">Export current page CSV</a>
 </div>
 <TpoBatchEligibilityImport batchId={batchId}/>
 <TpoAcademicImportPreview activeIds={result.students.map(s=>s.membershipId)}/>
 <Link href={"/tpo/batches/"+batchId+"/nudge-prep"} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-primary-text">Prepare follow-up for unrecorded choices</Link>
 <p className="text-sm text-muted-foreground">Registration choices are separate from eligibility; missing choices do not imply consent.</p>
 {!result.registrationAvailable?<p role="status" className="text-sm">Registration records unavailable.</p>:null}
 <p className="text-sm text-muted-foreground">Active learners only. Eligibility decisions inherit from learner, class, then batch; ambiguous class enrollment requires review.</p>
 {result.students.length===0?<p role="status">No active learners found on this page.</p>:<ul className="space-y-2">
 {result.students.map(s=><li className="min-w-0 rounded-lg border border-border bg-surface p-3 text-sm" key={s.membershipId}>
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
