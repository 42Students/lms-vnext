import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
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
 if(!input.success)return <div className="min-w-0 max-w-full space-y-4"><PageHeader title="Hiring activity"/>
  <ErrorState title="Invalid activity filters" description="Review the college and event filters." action={<Link href="/hr/activity" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Choose again</Link>}/></div>;
 const result=await listRecruiterJobActivity(context,input.data);
 const fmt=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(date);
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader title="Hiring activity"
   description="Published and closed hiring drives at your authorized college. No private applicant information."
   actions={result.status==="READY"?<Link
     href={"/api/placements/recruiter/activity/export?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)}
     className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:w-auto"
   >Export activity CSV</Link>:undefined}/>
  {result.status!=="READY"?<section className="space-y-3 border-b border-border pb-5">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}</p>
   <NeedsDoingChips label="Authorized colleges:" items={result.choices.map(grant=>({
    key:grant.collegeId,label:grant.collegeName,
    href:"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId),
   }))}/>
  </section>:<>
   {result.choices.length>1?<NeedsDoingChips label="College activity:"
    selectedKey={result.collegeId}
    items={result.choices.map(grant=>({
     key:grant.collegeId,label:grant.collegeName,
     href:"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId),
    }))}/>:null}
   <form action="/hr/activity" method="get" className="flex min-w-0 flex-wrap items-end gap-2">
     <Input type="hidden" name="collegeId" value={result.collegeId}/>
     <Input type="hidden" name="kind" value={input.data.kind}/>
     <label htmlFor="hr-activity-q" className="sr-only">Search authorized drive titles</label>
     <Input id="hr-activity-q" name="q" defaultValue={input.data.q} maxLength={120}
       placeholder="Search hiring drive titles" className="min-h-11 min-w-0 w-full basis-full md:w-55 md:basis-auto md:flex-none"/>
     <Button variant="secondary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
   </form>
   <Tabs ariaLabel="Hiring activity event type" renderPanel={false} value={input.data.kind}
     items={HR_ACTIVITY_FILTER_KINDS.map(kind=>({
       value:kind,
       label:kind==="ALL"?"All events":kind==="PUBLISHED"?"Published":"Closed",
       href:"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+kind+"&q="+encodeURIComponent(input.data.q),
     }))} />
   {result.events.length?<ol className="divide-y divide-border border-y border-border">{result.events.map(item=>
    <li key={item.id} className="py-4">
     <Link href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
      className="inline-flex min-h-11 max-w-full items-center break-words font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">{item.title}</Link>
     <p className="mt-1 text-sm text-body"><StatusBadge tone={item.status==="PUBLISHED"?"success":"neutral"}>{item.status}</StatusBadge> · {fmt(item.occurredAt)} IST</p>
    </li>)}</ol>:<EmptyState title="No hiring activity" description="No visible publication or closure activity at this college."/>}

   <nav aria-label="Activity history pages" className="flex flex-wrap items-center gap-3">
     {result.page>1?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)+"&page="+(result.page-1)}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Previous</Link>:null}
     <span className="text-xs text-muted-foreground">Page {result.page} · up to {input.data.limit} events</span>
     {result.hasNext?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)+"&page="+(result.page+1)}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Next</Link>:null}
   </nav>
   <p className="text-xs text-muted-foreground">Read-only hiring history, not the recruiter Messages inbox.</p>
  </>}
 </div>;
}
