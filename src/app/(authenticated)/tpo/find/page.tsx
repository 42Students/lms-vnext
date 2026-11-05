import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
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
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader eyebrow="TPO" title="Find a student, recruiter or company" description="Search your college records. Search does not execute actions or navigate to arbitrary pages."/>
  <form action="/tpo/find" method="get" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
   <Label className="min-w-0 w-full flex-1 md:w-auto">Record name<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
    <Input type="search" name="q" defaultValue={rawText??""} minLength={2} maxLength={100} required
     className="mt-[6px] block min-h-11 w-full min-w-0 md:min-h-9" placeholder="Find a student, recruiter, company or drive"/>
   </Label><Button type="submit" className="min-h-11 w-full self-end sm:w-auto md:min-h-9">Find</Button>
  </form>
  {invalid?<Alert tone="error" role="alert">Search must contain 2–100 characters.</Alert>:!text?<EmptyState title="Type a name or a roll number, for example 21CS001"/>:<>
   {!hasMatches?<EmptyState title={"No student, recruiter, company or drive matches \""+(rawText??"")+"\""}
    action={<TextLink href="/tpo/find" className="inline-flex min-h-11 items-center md:min-h-9">Clear search</TextLink>}/>:null}
   {foundBatches.length>0?<section className="min-w-0 space-y-2"><Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">Batches ({foundBatches.length}{batches.batches.length>30?"+":""})</Heading>
    {foundBatches.length===0?<p className="text-sm leading-[22px]">No matching batches.</p>:<ul className="divide-y divide-border border-y border-border">{foundBatches.map(b=><li key={b.id} className="min-w-0 py-2 text-sm">
      <TextLink href={"/tpo/batches/"+b.id} className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9">{b.name} · {b.program}</TextLink></li>)}</ul>}
   </section>:null}
   {named.students.length>0?<section className="min-w-0 space-y-2"><Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">Students ({named.students.length})</Heading>
    {named.students.length===0?<p className="text-sm leading-[22px]">No matching students.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.students.slice(0,5).map(s=><li key={s.id} className="min-w-0 py-2 text-sm">
       <TextLink href={"/tpo/students?q="+encodeURIComponent(s.rollNumber??s.name??"")+"&student="+encodeURIComponent(s.id)} className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9">{s.name??"Student"}{s.rollNumber?" · "+s.rollNumber:""}{s.branch?" · "+s.branch:""}</TextLink>
      </li>)}</ul>}
   </section>:null}
   {named.recruiters.length>0?<section className="min-w-0 space-y-2"><Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">Recruiter Leads ({named.recruiters.length})</Heading>
    {named.recruiters.length===0?<p className="text-sm leading-[22px]">No matching recruiter leads.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.recruiters.slice(0,5).map(lead=><li key={lead.id} className="min-w-0 py-2 text-sm">
       <TextLink href={"/tpo/recruiters/"+lead.id} className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9">{lead.name}</TextLink>
      </li>)}</ul>}
   </section>:null}
   {named.companies.length>0?<section className="min-w-0 space-y-2"><Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">Companies ({named.companies.length})</Heading>
    {named.companies.length===0?<p className="text-sm leading-[22px]">No matching companies.</p>:<ul className="divide-y divide-border border-y border-border">
      {named.companies.slice(0,5).map(company=><li key={company.id} className="min-w-0 py-2 text-sm">
       <TextLink href={"/tpo/companies?name="+encodeURIComponent(company.name)} className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9">{company.name}</TextLink>
      </li>)}</ul>}
   </section>:null}
   {jobs.length>0?<section className="min-w-0 space-y-2"><Heading level={2} size="base" className="leading-6 text-[var(--lms-heading)]">Drives ({jobs.length})</Heading>
    {jobs.length===0?<p className="text-sm leading-[22px]">No matching drives.</p>:<ul className="divide-y divide-border border-y border-border">{jobs.map(r=><li key={r.job.id} className="min-w-0 py-2 text-sm">
     <TextLink href={"/tpo/placements/jobs/"+r.job.id} className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9">{r.job.title} · {r.job.company.name} · {r.job.status.replaceAll("_"," ")}</TextLink></li>)}</ul>}
   </section>:null}
  </>}
 </div>;
}
