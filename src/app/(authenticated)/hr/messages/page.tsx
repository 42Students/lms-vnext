import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrNotificationsQuerySchema} from "@/modules/placements/hr-notifications-model";
import {HrNotificationReadButton} from "@/components/hr/hr-notification-read-button";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
export default async function HrMessagesPage({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[];unreadOnly?:string|string[];page?:string|string[]}>
}) {
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
 const query=hrNotificationsQuerySchema.safeParse({
  collegeId:first(raw.collegeId),unreadOnly:first(raw.unreadOnly),page:first(raw.page),
 });
 if(!query.success)return <div className="space-y-4">
  <PageHeader eyebrow="Employer Recruiter" title="Messages & Notifications"/>
  <p role="alert">Invalid inbox filter.</p><Link href="/hr/messages" className="text-primary-text">Reset</Link>
 </div>;
 const result=await listHrNotifications(context,query.data);
 const time=(d:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(d);
 return <div className="space-y-6">
  <PageHeader eyebrow="Employer Recruiter" title="Messages & Notifications"
   description="Read-only in-app drive lifecycle notifications for your authorized employer and college."/>
  {result.status!=="READY"?<section className="space-y-3 rounded-lg border border-border bg-surface p-4">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}</p>
   {result.choices.map(grant=><Link key={grant.id}
    href={"/hr/messages?collegeId="+encodeURIComponent(grant.collegeId)}
    className="block rounded-md border border-border p-3 text-primary-text">{grant.collegeName}</Link>)}
  </section>:<>
   <nav aria-label="Inbox filters" className="flex flex-wrap gap-2">
    {result.choices.length>1?result.choices.map(grant=><Link key={grant.id}
     href={"/hr/messages?collegeId="+encodeURIComponent(grant.collegeId)}
     className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">{grant.collegeName}</Link>):null}
    <Link href={"/hr/messages?collegeId="+result.collegeId+"&unreadOnly="+
      (query.data.unreadOnly==="true"?"false":"true")}
     className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">
     {query.data.unreadOnly==="true"?"Show all":"Unread only"}
    </Link>
   </nav>
   <p className="text-sm text-body">{result.unread} unread · {result.total} authorized notifications</p>
   {result.rows.length?<ol className="grid gap-3">{result.rows.map(row=>
    <li key={row.id} className="rounded-lg border border-border bg-surface p-4">
     <div className="flex flex-wrap justify-between gap-3">
      <Link href={"/hr/placements/jobs/"+encodeURIComponent(row.jobId)}
       className="break-words font-semibold text-primary-text">{row.title}</Link>
      <span className="text-xs text-muted-foreground">{time(row.createdAt)} IST</span>
     </div>
     <p className="mt-2 text-sm text-body">{row.label}{row.unread?" · Unread":""}</p>
     {row.unread?<HrNotificationReadButton notificationId={row.id}
        expectedCreatedAt={row.createdAt.toISOString()}/>:null}
    </li>)}</ol>:<p role="status" className="rounded-lg border border-border p-5 text-sm text-body">
     No matching notifications for this employer and college.</p>}
   <nav aria-label="Notification pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
       {result.first?result.first+"–"+result.last:"No rows on this page"}
       {" of "+(query.data.unreadOnly==="true"?result.unread:result.total)}
      </p>
      <div className="flex flex-wrap gap-2">
       {result.page>1?<Link href={"/hr/messages?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&page="+(result.page-1)}
        className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Previous</Link>:null}
       {result.page<result.pages?<Link href={"/hr/messages?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&page="+(result.page+1)}
        className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Next</Link>:null}
      </div>
    </nav>
   <p className="text-xs text-muted-foreground">Conversation threads and replies remain unavailable. Read acknowledgement applies only to your own employer-scoped notification.</p>
  </>}
 </div>;
}
