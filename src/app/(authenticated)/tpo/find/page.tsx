import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {redirect} from "next/navigation";
import {hasMembershipRole} from "@/modules/identity/context";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import {findTpoPeopleAndCompanies} from "@/modules/placements/tpo-find-people-service";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
export const dynamic="force-dynamic";
const querySchema=z.string().trim().min(2).max(100);
export default async function TpoRecordFinder({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const ctx=await getCurrentRequestContext();
 if(!ctx.membership || !hasMembershipRole(ctx,"TPO")) redirect("/dashboard");
 await requireTpoBatchActor(ctx);
 const raw=await searchParams;
 // Do not arbitrarily accept the first of several independent search inputs.
 const repeated=Array.isArray(raw.q);
 const rawText=typeof raw.q==="string"?raw.q:undefined;
 const parsed=rawText===undefined?null:querySchema.safeParse(rawText);
 const invalid=repeated||(parsed!==null&&!parsed.success);
 const text=!invalid&&parsed?.success?parsed.data.toLocaleLowerCase():"";
 // The finder does no roster, recruiter, drive or company queries before
 // the user enters a valid explicit search term.
 const batches=text?await listTpoBatches(ctx):{batches:[]};
 const operations=text?await getPlacementTpoOperations(ctx,ctx.membership!.collegeId):null;
 const foundBatches=text?batches.batches.filter(b=>[b.name,b.code,b.program,b.department].some(v=>v.toLocaleLowerCase().includes(text))).slice(0,5):[];
 const named=text?await findTpoPeopleAndCompanies(ctx,ctx.membership!.collegeId,text):
  {students:[],recruiters:[],companies:[]};
 const jobs=operations?operations.jobs.filter(r=>[r.job.title,r.job.company.name].some(v=>v.toLocaleLowerCase().includes(text))).slice(0,5):[];
 const hasMatches=foundBatches.length+named.students.length+named.recruiters.length+named.companies.length+jobs.length>0;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO" title="Find a student, recruiter or company" description="Search your college records. Search does not execute actions or navigate to arbitrary pages."/>
  <form action="/tpo/find" method="get" className="flex min-w-0 flex-wrap gap-2">
   <label className="min-w-0 flex-1 text-sm">Record name
    <Input type="search" name="q" defaultValue={rawText??""} maxLength={100} required
     className="mt-1 block w-full min-w-0" placeholder="Find a student, recruiter, company or drive"/>
   </label><Button type="submit" className="self-end">Find</Button>
  </form>
  {invalid?<p role="alert">Search must contain 2–100 characters.</p>:!text?<p role="status">Type a name or a roll number, for example 21CS001</p>:<>
   {!hasMatches?<p role="status">No student, recruiter, company or drive matches &quot;{rawText}&quot;</p>:null}
   <section className="space-y-2"><h2 className="font-semibold">Batches ({foundBatches.length}{batches.batches.length>30?"+":""})</h2>
    {foundBatches.length===0?<p className="text-sm">No matching batches.</p>:<ul className="divide-y divide-border border-y border-border">{foundBatches.map(b=><li key={b.id} className="p-3 text-sm">
      <Link href={"/tpo/batches/"+b.id} className="text-link underline lms-inline-link">{b.name} · {b.program}</Link></li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Students ({named.students.length})</h2>
    {named.students.length===0?<p className="text-sm">No matching students.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.students.slice(0,5).map(s=><li key={s.id} className="p-3 text-sm">
       <Link href={"/tpo/students?q="+encodeURIComponent(s.rollNumber??s.name??"")+"&student="+encodeURIComponent(s.id)} className="text-link underline lms-inline-link">{s.name??"Student"}{s.rollNumber?" · "+s.rollNumber:""}{s.branch?" · "+s.branch:""}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Recruiter Leads ({named.recruiters.length})</h2>
    {named.recruiters.length===0?<p className="text-sm">No matching recruiter leads.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.recruiters.slice(0,5).map(lead=><li key={lead.id} className="p-3 text-sm">
       <Link href={"/tpo/recruiters/"+lead.id} className="text-link underline lms-inline-link">{lead.name}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Companies ({named.companies.length})</h2>
    {named.companies.length===0?<p className="text-sm">No matching companies.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.companies.slice(0,5).map(company=><li key={company.id} className="p-3 text-sm">
       <Link href={"/tpo/companies?name="+encodeURIComponent(company.name)} className="text-link underline lms-inline-link">{company.name}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold">Drives ({jobs.length})</h2>
    {jobs.length===0?<p className="text-sm">No matching drives.</p>:<ul className="divide-y divide-border border-y border-border">{jobs.map(r=><li key={r.job.id} className="p-3 text-sm">
     <Link href={"/tpo/placements/jobs/"+r.job.id} className="text-link underline lms-inline-link">{r.job.title} · {r.job.company.name} · {r.job.status.replaceAll("_"," ")}</Link></li>)}</ul>}
   </section>
  </>}
 </div>;
}
