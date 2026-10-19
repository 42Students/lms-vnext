import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrActivityQuerySchema} from "@/modules/placements/hr-job-activity-model";
import {listRecruiterJobActivity} from "@/modules/placements/hr-job-activity-service";
const HR_ACTIVITY_FILTER_KINDS=["ALL","PUBLISHED","CLOSED"] as const;
export default async function HrJobActivityPage({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[];kind?:string|string[];page?:string|string[];q?:string|string[]}>
}) {
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const raw=await searchParams;
 const input=hrActivityQuerySchema.safeParse({
  collegeId:raw.collegeId,kind:raw.kind,page:raw.page,q:raw.q,
 });
 if(!input.success)return <div className="min-w-0 max-w-full space-y-4"><PageHeader eyebrow="Recruiter" title="Hiring activity"/>
  <p role="alert">Invalid activity filters.</p><Link href="/hr/activity">Choose again</Link></div>;
 const result=await listRecruiterJobActivity(context,input.data);
 const fmt=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(date);
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader eyebrow="Employer Recruiter" title="Hiring activity"
   description="Published and closed hiring drives at your authorized college. No private applicant information."/>
  {result.status!=="READY"?<section className="space-y-3 border-b border-border pb-5">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}</p>
   {result.choices.map(grant=><Link key={grant.id}
    href={"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId)}
    className="block min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">{grant.collegeName}</Link>)}
  </section>:<>
   {result.choices.length>1?<nav aria-label="College activity filter" className="flex flex-wrap gap-2">
    {result.choices.map(grant=><Link key={grant.id}
     href={"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId)}
     className={grant.collegeId===result.collegeId ? "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-3 py-2 text-sm font-semibold text-on-primary" : "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-primary-text hover:border-primary"}>{grant.collegeName}</Link>)}
   </nav>:null}
   <form action="/hr/activity" method="get" className="flex flex-wrap gap-2">
     <input type="hidden" name="collegeId" value={result.collegeId}/>
     <input type="hidden" name="kind" value={input.data.kind}/>
     <label htmlFor="hr-activity-q" className="sr-only">Search authorized drive titles</label>
     <Input id="hr-activity-q" name="q" defaultValue={input.data.q} maxLength={120}
       placeholder="Search hiring drive titles" className="min-w-48 flex-1"/>
     <Button variant="secondary" type="submit">Search</Button>
   </form>
   <nav aria-label="Hiring activity event type" className="flex flex-wrap gap-3 border-b border-border">
     {HR_ACTIVITY_FILTER_KINDS.map(kind=><Link key={kind}
       href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+kind+"&q="+encodeURIComponent(input.data.q)}
       aria-current={kind===input.data.kind?"page":undefined}
       className={kind===input.data.kind
         ? "inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
         : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}>
       {kind==="ALL"?"All events":kind==="PUBLISHED"?"Published":"Closed"}
     </Link>)}
   </nav>
   {result.events.length?<ol className="divide-y divide-border border-y border-border">{result.events.map(item=>
    <li key={item.id} className="py-4">
     <Link href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
      className="font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{item.title}</Link>
     <p className="mt-1 text-sm text-body">{item.status} · {fmt(item.occurredAt)} IST</p>
    </li>)}</ol>:<p role="status" className="border-y border-border py-5 text-sm text-body">
     No visible publication or closure activity at this college.</p>}
   <div className="flex justify-end">
     <Link href={"/api/placements/recruiter/activity/export?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)}
       className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
       Export activity CSV
     </Link>
   </div>
   <nav aria-label="Activity history pages" className="flex flex-wrap items-center gap-3">
     {result.page>1?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)+"&page="+(result.page-1)}
       className="rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Previous</Link>:null}
     <span className="text-xs text-muted-foreground">Page {result.page} · up to {input.data.limit} events</span>
     {result.hasNext?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)+"&page="+(result.page+1)}
       className="rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Next</Link>:null}
   </nav>
   <p className="text-xs text-muted-foreground">Read-only hiring history, not the recruiter Messages inbox.</p>
  </>}
 </div>;
}
