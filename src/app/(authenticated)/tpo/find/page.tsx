import Link from "next/link";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
export const dynamic="force-dynamic";
const querySchema=z.string().trim().min(1).max(100);
export default async function TpoRecordFinder({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const raw=await searchParams;
 const rawText=Array.isArray(raw.q)?raw.q[0]:raw.q;
 const parsed=rawText===undefined?null:querySchema.safeParse(rawText);
 const invalid=parsed!==null&&!parsed.success;
 const text=parsed?.success?parsed.data.toLocaleLowerCase():"";
 const ctx=await getCurrentRequestContext();
 const batches=await listTpoBatches(ctx);
 const operations=text?await getPlacementTpoOperations(ctx,ctx.membership!.collegeId):null;
 const foundBatches=text?batches.batches.filter(b=>[b.name,b.code,b.program,b.department].some(v=>v.toLocaleLowerCase().includes(text))).slice(0,30):[];
 const jobs=operations?operations.jobs.filter(r=>[r.job.title,r.job.company.name].some(v=>v.toLocaleLowerCase().includes(text))).slice(0,30):[];
 return <main className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO" title="Find a record" description="Find placement batch and drive records. Search does not execute actions or navigate to arbitrary pages."/>
  <form action="/tpo/find" method="get" className="flex min-w-0 flex-wrap gap-2">
   <label className="min-w-0 flex-1 text-sm">Record name
    <input type="search" name="q" defaultValue={rawText??""} maxLength={100} required
     className="mt-1 block min-h-11 w-full min-w-0 rounded border border-border bg-surface px-3" placeholder="Batch, program, drive or company"/>
   </label><button type="submit" className="min-h-11 self-end rounded bg-primary px-4 text-on-primary">Find</button>
  </form>
  {invalid?<p role="alert">Search must contain 1–100 characters.</p>:!text?<p role="status">Enter a record name to search.</p>:<>
   <section className="space-y-2"><h2 className="font-semibold">Batches ({foundBatches.length}{batches.batches.length>30?"+":""})</h2>
    {foundBatches.length===0?<p className="text-sm">No matching batches.</p>:<ul className="space-y-2">{foundBatches.map(b=><li key={b.id} className="rounded border border-border p-3 text-sm">
      <Link href={"/tpo/batches/"+b.id} className="text-primary-text underline">{b.name} · {b.program}</Link></li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Drives ({jobs.length})</h2>
    {jobs.length===0?<p className="text-sm">No matching drives.</p>:<ul className="space-y-2">{jobs.map(r=><li key={r.job.id} className="rounded border border-border p-3 text-sm">
     <Link href={"/tpo/placements/jobs/"+r.job.id} className="text-primary-text underline">{r.job.title} · {r.job.company.name}</Link></li>)}</ul>}
   </section>
  </>}
 </main>;
}
