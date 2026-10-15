import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatchStudents } from "@/modules/placements/tpo-batch-workspace-read-service";
import { z } from "zod";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export default async function BatchStudents({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{page?:string|string[]}>}){
 const {batchId}=await params,raw=await searchParams;
 const parsed=pageSchema.safeParse(Array.isArray(raw.page)?raw.page[0]:raw.page??1);
 if(!parsed.success)return <p role="alert">Invalid page number. <Link href={"/tpo/batches/"+batchId+"/students"}>Start again</Link></p>;
 const result=await getTpoBatchStudents(await getCurrentRequestContext(),batchId,parsed.data);
 const href=(page:number)=>"/tpo/batches/"+batchId+"/students?page="+page;
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{result.batch.name} — Students</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-sm text-primary-text underline">Batch overview</Link>
 <p className="text-sm text-muted-foreground">Active learners only. Eligibility decisions inherit from learner, class, then batch; ambiguous class enrollment requires review.</p>
 {result.students.length===0?<p role="status">No active learners found on this page.</p>:<ul className="space-y-2">
 {result.students.map(s=><li className="min-w-0 rounded-lg border border-border bg-surface p-3 text-sm" key={s.membershipId}>
  <div className="flex flex-wrap justify-between gap-2"><strong className="break-words">{s.name}</strong><span>{s.ambiguous?"Needs review":s.decision.replaceAll("_"," ")}</span></div>
  <p className="text-xs text-muted-foreground">Source: {s.source.toLowerCase()}{s.reason?" · "+s.reason:""}</p>
  <Link className="mt-2 inline-flex min-h-10 items-center text-primary-text underline" href={"/tpo/students/"+s.membershipId}>Student detail and eligibility decision</Link>
 </li>)}</ul>}
 <nav className="flex flex-wrap gap-2" aria-label="Student pages">{result.page>1?<Link href={href(result.page-1)} className="rounded border px-3 py-2">Previous</Link>:null}
 {result.hasMore?<Link href={href(result.page+1)} className="rounded border px-3 py-2">Next</Link>:null}</nav>
 </main>;
}
