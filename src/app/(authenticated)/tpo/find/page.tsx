import Link from "next/link";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import {findTpoPeopleAndCompanies} from "@/modules/placements/tpo-find-people-service";
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
 const foundBatches=text?batches.batches.filter(b=>[b.name,b.code,b.program,b.department].some(v=>v.toLocaleLowerCase().includes(text))).slice(0,5):[];
 const named=text?await findTpoPeopleAndCompanies(ctx,ctx.membership!.collegeId,text):
  {students:[],recruiters:[],companies:[]};
 const jobs=operations?operations.jobs.filter(r=>[r.job.title,r.job.company.name].some(v=>v.toLocaleLowerCase().includes(text))).slice(0,5):[];
 const hasMatches=foundBatches.length+named.students.length+named.recruiters.length+named.companies.length+jobs.length>0;
 return <main className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO" title="Find a student, recruiter or company" description="Search your college records. Search does not execute actions or navigate to arbitrary pages."/>
  <form action="/tpo/find" method="get" className="flex min-w-0 flex-wrap gap-2">
   <label className="min-w-0 flex-1 text-sm">Record name
    <input type="search" name="q" defaultValue={rawText??""} maxLength={100} required
     className="mt-1 block min-h-11 w-full min-w-0 rounded border border-border bg-surface px-3" placeholder="Find a student, recruiter, company or drive"/>
   </label><button type="submit" className="min-h-11 self-end rounded bg-primary px-4 text-on-primary">Find</button>
  </form>
  {invalid?<p role="alert">Search must contain 1–100 characters.</p>:!text?<p role="status">Type a name or a roll number, for example 21CS001</p>:<>
   {!hasMatches?<p role="status">No student, recruiter, company or drive matches &quot;{rawText}&quot;</p>:null}
   <section className="space-y-2"><h2 className="font-semibold">Batches ({foundBatches.length}{batches.batches.length>30?"+":""})</h2>
    {foundBatches.length===0?<p className="text-sm">No matching batches.</p>:<ul className="space-y-2">{foundBatches.map(b=><li key={b.id} className="rounded border border-border p-3 text-sm">
      <Link href={"/tpo/batches/"+b.id} className="text-primary-text underline">{b.name} · {b.program}</Link></li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Students ({named.students.length})</h2>
    {named.students.length===0?<p className="text-sm">No matching students.</p>:<ul className="space-y-2">
      {named.students.slice(0,5).map(s=><li key={s.id} className="rounded border border-border p-3 text-sm">
       <Link href={"/tpo/students?q="+encodeURIComponent(s.name??"")+"&student="+encodeURIComponent(s.id)} className="text-primary-text underline">{s.name??"Student"}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Recruiter Leads ({named.recruiters.length})</h2>
    {named.recruiters.length===0?<p className="text-sm">No matching recruiter leads.</p>:<ul className="space-y-2">
      {named.recruiters.slice(0,5).map(lead=><li key={lead.id} className="rounded border border-border p-3 text-sm">
       <Link href={"/tpo/recruiters/"+lead.id} className="text-primary-text underline">{lead.name}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Companies ({named.companies.length})</h2>
    {named.companies.length===0?<p className="text-sm">No matching companies.</p>:<ul className="space-y-2">
      {named.companies.slice(0,5).map(company=><li key={company.id} className="rounded border border-border p-3 text-sm">
       <Link href={"/tpo/companies?name="+encodeURIComponent(company.name)} className="text-primary-text underline">{company.name}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Drives ({jobs.length})</h2>
    {jobs.length===0?<p className="text-sm">No matching drives.</p>:<ul className="space-y-2">{jobs.map(r=><li key={r.job.id} className="rounded border border-border p-3 text-sm">
     <Link href={"/tpo/placements/jobs/"+r.job.id} className="text-primary-text underline">{r.job.title} · {r.job.company.name} · {r.job.status.replaceAll("_"," ")}</Link></li>)}</ul>}
   </section>
  </>}
 </main>;
}
