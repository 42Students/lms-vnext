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
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
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
  <form action="/tpo/find" method="get" className="flex min-w-0 flex-wrap items-end gap-2 border-b border-border pb-4">
   <label className="min-w-0 w-full flex-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:w-auto">Record name
    <Input type="search" name="q" defaultValue={rawText??""} maxLength={100} required
     className="mt-1 block w-full min-w-0" placeholder="Find a student, recruiter, company or drive"/>
   </label><Button type="submit" className="self-end">Find</Button>
  </form>
  {invalid?<Alert tone="error">Search must contain 2–100 characters.</Alert>:!text?<EmptyState title="Type a name or a roll number, for example 21CS001"/>:<>
   {!hasMatches?<EmptyState title={"No student, recruiter, company or drive matches \""+(rawText??"")+"\""}/>:null}
   <section className="space-y-2"><h2 className="font-semibold text-foreground">Batches ({foundBatches.length}{batches.batches.length>30?"+":""})</h2>
    {foundBatches.length===0?<p className="text-sm">No matching batches.</p>:<ul className="divide-y divide-border border-y border-border">{foundBatches.map(b=><li key={b.id} className="py-3 text-sm">
      <Link href={"/tpo/batches/"+b.id} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{b.name} · {b.program}</Link></li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold text-foreground">Students ({named.students.length})</h2>
    {named.students.length===0?<p className="text-sm">No matching students.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.students.slice(0,5).map(s=><li key={s.id} className="py-3 text-sm">
       <Link href={"/tpo/students?q="+encodeURIComponent(s.rollNumber??s.name??"")+"&student="+encodeURIComponent(s.id)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{s.name??"Student"}{s.rollNumber?" · "+s.rollNumber:""}{s.branch?" · "+s.branch:""}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold text-foreground">Recruiter Leads ({named.recruiters.length})</h2>
    {named.recruiters.length===0?<p className="text-sm">No matching recruiter leads.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.recruiters.slice(0,5).map(lead=><li key={lead.id} className="py-3 text-sm">
       <Link href={"/tpo/recruiters/"+lead.id} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{lead.name}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold text-foreground">Companies ({named.companies.length})</h2>
    {named.companies.length===0?<p className="text-sm">No matching companies.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.companies.slice(0,5).map(company=><li key={company.id} className="py-3 text-sm">
       <Link href={"/tpo/companies?name="+encodeURIComponent(company.name)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{company.name}</Link>
      </li>)}</ul>}
   </section>
   <section className="space-y-2"><h2 className="font-semibold text-foreground">Drives ({jobs.length})</h2>
    {jobs.length===0?<p className="text-sm">No matching drives.</p>:<ul className="divide-y divide-border border-y border-border">{jobs.map(r=><li key={r.job.id} className="py-3 text-sm">
     <Link href={"/tpo/placements/jobs/"+r.job.id} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{r.job.title} · {r.job.company.name} · {r.job.status.replaceAll("_"," ")}</Link></li>)}</ul>}
   </section>
  </>}
 </div>;
}
