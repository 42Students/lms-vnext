import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrActivityQuerySchema} from "@/modules/placements/hr-job-activity-model";
import {listRecruiterJobActivity} from "@/modules/placements/hr-job-activity-service";
export default async function HrJobActivityPage({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[];kind?:string|string[]}>
}) {
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
 const input=hrActivityQuerySchema.safeParse({collegeId:first(raw.collegeId),kind:first(raw.kind),page:first(raw.page)});
 if(!input.success)return <div className="space-y-4"><PageHeader eyebrow="Recruiter" title="Hiring activity"/>
  <p role="alert">Invalid college filter.</p><Link href="/hr/activity">Choose again</Link></div>;
 const result=await listRecruiterJobActivity(context,input.data);
 const fmt=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(date);
 return <div className="space-y-6">
  <PageHeader eyebrow="Employer Recruiter" title="Hiring activity"
   description="Published and closed hiring drives at your authorized college. No private applicant information."/>
  {result.status!=="READY"?<section className="space-y-3 rounded-xl border border-border bg-surface p-5">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}</p>
   {result.choices.map(grant=><Link key={grant.id}
    href={"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId)}
    className="block rounded-md border border-border px-3 py-3 text-primary-text">{grant.collegeName}</Link>)}
  </section>:<>
   {result.choices.length>1?<nav aria-label="College activity filter" className="flex flex-wrap gap-2">
    {result.choices.map(grant=><Link key={grant.id}
     href={"/hr/activity?collegeId="+encodeURIComponent(grant.collegeId)}
     className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">{grant.collegeName}</Link>)}
   </nav>:null}
   <nav aria-label="Hiring activity event type" className="flex flex-wrap gap-2">
     {(["ALL","PUBLISHED","CLOSED"] as const).map(kind=><Link key={kind}
       href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+kind}
       aria-current={kind===input.data.kind?"page":undefined}
       className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">
       {kind==="ALL"?"All events":kind==="PUBLISHED"?"Published":"Closed"}
     </Link>)}
   </nav>
   {result.events.length?<ol className="grid gap-3">{result.events.map(item=>
    <li key={item.id} className="rounded-lg border border-border bg-surface p-4">
     <Link href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
      className="font-semibold text-primary-text">{item.title}</Link>
     <p className="mt-1 text-sm text-body">{item.status} · {fmt(item.occurredAt)} IST</p>
    </li>)}</ol>:<p role="status" className="rounded-lg border border-border p-5 text-sm text-body">
     No visible publication or closure activity at this college.</p>}
   <nav aria-label="Activity history pages" className="flex flex-wrap items-center gap-3">
     {input.data.page>1?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&page="+(input.data.page-1)}
       className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Previous</Link>:null}
     <span className="text-xs text-muted-foreground">Page {input.data.page} · up to {input.data.limit} events</span>
     {result.hasNext?<Link href={"/hr/activity?collegeId="+encodeURIComponent(result.collegeId)+"&kind="+input.data.kind+"&page="+(input.data.page+1)}
       className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Next</Link>:null}
   </nav>
   <p className="text-xs text-muted-foreground">Read-only hiring history, not the recruiter Messages inbox.</p>
  </>}
 </div>;
}
