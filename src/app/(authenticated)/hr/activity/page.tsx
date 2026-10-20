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
  <ErrorState title="Invalid activity filters" description="Review the college and event filters." action={<Link href="/hr/activity" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Choose again</Link>}/></div>;
 const result=await listRecruiterJobActivity(context,input.data);
 const fmt=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(date);
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Hiring activity"
   description="Published and closed hiring drives at your authorized college. No private applicant information."/>
  {result.status!=="READY"?
   <EmptyState
    title={result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}
    action={result.choices.length?<NeedsDoingChips label="Authorized colleges:"
     items={result.choices.map(grant=>({
      key:grant.collegeId,label:grant.collegeName,
      href:"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId),
     }))}/>:undefined}
   />:<>
   {result.choices.length>1?
    <div className="min-w-0 border-b border-border pb-4">
     <NeedsDoingChips label="College activity:" selectedKey={result.collegeId}
      items={result.choices.map(grant=>({
       key:grant.collegeId,label:grant.collegeName,
       href:"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId),
      }))}/>
    </div>:null}
   <section className="min-w-0 space-y-4">
    <Tabs ariaLabel="Hiring activity event type" renderPanel={false} value={input.data.kind}
     items={HR_ACTIVITY_FILTER_KINDS.map(kind=>({
      value:kind,
      label:kind==="ALL"?"All events":kind==="PUBLISHED"?"Published":"Closed",
      href:"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+kind+"&q="+encodeURIComponent(input.data.q),
     }))}/>
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
     <form action="/hr/activity" method="get" role="search" aria-label="Search hiring activity"
      className="flex min-w-0 flex-1 flex-col gap-2 max-[767px]:items-stretch min-[768px]:flex-row min-[768px]:items-center">
      <Input type="hidden" name="collegeId" value={result.collegeId}/>
      <Input type="hidden" name="kind" value={input.data.kind}/>
      <label htmlFor="hr-activity-q" className="sr-only">Search authorized drive titles</label>
      <Input id="hr-activity-q" type="search" name="q" defaultValue={input.data.q} maxLength={120}
       placeholder="Search hiring drive titles" className="min-h-11 w-full min-w-0 md:min-h-9 md:max-w-sm md:flex-1"/>
      <Button variant="secondary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
     </form>
     <Link href={"/api/placements/recruiter/activity/export?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)}
      className="inline-flex min-h-11 shrink-0 items-center self-start text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] md:min-h-9 md:self-auto">
      Export activity CSV
     </Link>
    </div>
   </section>
   {result.events.length?
    <ol className="min-w-0 divide-y divide-border border-y border-border">{result.events.map(item=>
     <li key={item.id} className="grid min-w-0 gap-1 py-3 min-[768px]:grid-cols-[minmax(0,1fr)_auto] min-[768px]:items-center min-[768px]:gap-4">
      <Link href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
       className="inline-flex min-h-11 min-w-0 max-w-full items-center break-words font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] md:min-h-9">{item.title}</Link>
      <p className="m-0 flex min-w-0 flex-wrap items-center text-sm text-body min-[768px]:justify-end">
       <StatusBadge tone={item.status==="PUBLISHED"?"success":item.status==="DRAFT"?"warning":"neutral"}>{item.status}</StatusBadge>
       <span className="ml-2">· {fmt(item.occurredAt)} IST</span>
      </p>
     </li>)}</ol>:
    <EmptyState title="No hiring activity"
     description="No visible publication or closure activity at this college."
     action={input.data.kind!=="ALL"||input.data.q?
      <Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind=ALL&q="}
       className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] md:min-h-9">All events</Link>:undefined}/>}
   <footer className="min-w-0 space-y-2">
    <nav aria-label="Activity history pages" className="flex min-w-0 flex-wrap items-center gap-3">
     {result.page>1?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)+"&page="+(result.page-1)}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Previous</Link>:null}
     <span className="text-xs text-muted-foreground">Page {result.page} · up to {input.data.limit} events</span>
     {result.hasNext?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&q="+encodeURIComponent(input.data.q)+"&page="+(result.page+1)}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] md:min-h-9 hover:bg-[rgba(38,186,199,0.07)]">Next</Link>:null}
    </nav>
    <p className="text-xs text-muted-foreground">Read-only hiring history, not the recruiter Messages inbox.</p>
   </footer>
  </>}
 </div>;
}
