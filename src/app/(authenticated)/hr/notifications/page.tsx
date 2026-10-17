import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrNotificationsQuerySchema} from "@/modules/placements/hr-notifications-model";
import {HrNotificationReadButton} from "@/components/hr/hr-notification-read-button";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
import {groupHrNotificationPage} from "@/modules/placements/hr-notification-groups-model";
export default async function HrMessagesPage({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[];unreadOnly?:string|string[];page?:string|string[];q?:string|string[]}>
}) {
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
 const query=hrNotificationsQuerySchema.safeParse({
  collegeId:first(raw.collegeId),unreadOnly:first(raw.unreadOnly),page:first(raw.page),q:first(raw.q),
 });
 if(!query.success)return <div className="space-y-4">
  <PageHeader eyebrow="Recruiter" title="Notifications"/>
  <Link href="/hr/conversations" className="text-primary-text">Recruiter conversations</Link>
  <p role="alert">Invalid inbox filter.</p><Link href="/hr/notifications" className="text-primary-text">Reset</Link>
 </div>;
 const result=await listHrNotifications(context,query.data);
 const time=(d:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(d);
 return <div className="space-y-6">
  <PageHeader eyebrow="Recruiter" title="Notifications"
   description="In-app drive notifications for your authorized employer and college. Conversations with the placement cell are separate."/>
  <Link href="/hr/conversations" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
   Open recruiter conversations
  </Link>
  {result.status!=="READY"?<section className="space-y-3 rounded-lg border border-border bg-surface p-4">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}</p>
   {result.choices.map(grant=><Link key={grant.id}
    href={"/hr/notifications?collegeId="+encodeURIComponent(grant.collegeId)}
    className="block rounded-md border border-border p-3 text-primary-text">{grant.collegeName}</Link>)}
  </section>:<>
   <nav aria-label="Inbox filters" className="flex flex-wrap gap-2">
    {result.choices.length>1?result.choices.map(grant=><Link key={grant.id}
     href={"/hr/notifications?collegeId="+encodeURIComponent(grant.collegeId)}
     className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">{grant.collegeName}</Link>):null}
    <Link href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+
      (query.data.unreadOnly==="true"?"false":"true")+"&q="+encodeURIComponent(query.data.q)}
     className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">
     {query.data.unreadOnly==="true"?"Show all":"Unread only"}
    </Link>
   </nav>
   <form action="/hr/notifications" method="get" className="flex flex-wrap gap-2">
     <input type="hidden" name="collegeId" value={result.collegeId} />
     <input type="hidden" name="unreadOnly" value={query.data.unreadOnly} />
     <label htmlFor="hr-notification-search" className="sr-only">Search drive titles</label>
     <input id="hr-notification-search" name="q" defaultValue={query.data.q} maxLength={120}
       placeholder="Search drive titles" className="min-h-11 min-w-48 flex-1 rounded-md border border-border bg-surface px-3 text-sm" />
     <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">Search</button>
   </form>
   <p className="text-sm text-body">{result.unread} unread · {result.total} matching authorized notifications</p>
   <div className="flex justify-end">
     <Link href={"/api/placements/recruiter/notifications/export?collegeId="+encodeURIComponent(result.collegeId)+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)}
       className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">
       Export scoped notifications CSV
     </Link>
   </div>
   {result.rows.length?<div className="space-y-5">
     <p className="text-xs text-muted-foreground">Grouped by drive within this page only. This is not a conversation thread.</p>
     {groupHrNotificationPage(result.rows).map(group=><section key={group.jobId}
       aria-label={"Notifications for "+group.title}
       className="rounded-xl border border-border bg-surface p-4">
       <div className="flex flex-wrap items-center justify-between gap-2">
         <h2 className="font-semibold text-foreground">
           <Link href={"/hr/placements/jobs/"+encodeURIComponent(group.jobId)}
             className="text-primary-text">{group.title}</Link>
         </h2>
         <span className="text-xs text-muted-foreground">{group.items.length} on this page · {group.unread} unread</span>
       </div>
       <ol className="mt-3 divide-y divide-border">{group.items.map(row=>
         <li key={row.id} className="py-3">
           <div className="flex flex-wrap justify-between gap-2">
             <span className="text-sm text-body">{row.label}{row.unread?" · Unread":""}</span>
             <span className="text-xs text-muted-foreground">{time(row.createdAt)} IST</span>
           </div>
           {row.unread?<HrNotificationReadButton notificationId={row.id}
             expectedCreatedAt={row.createdAt.toISOString()}/>:null}
         </li>)}
       </ol>
     </section>)}
   </div>:<p role="status" className="rounded-lg border border-border p-5 text-sm text-body">
     No matching notifications for this employer and college.</p>}
   <nav aria-label="Notification pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
       {result.first?result.first+"–"+result.last:"No rows on this page"}
       {" of "+(query.data.unreadOnly==="true"?result.unread:result.total)}
      </p>
      <div className="flex flex-wrap gap-2">
       {result.page>1?<Link href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)+"&page="+(result.page-1)}
        className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Previous</Link>:null}
       {result.page<result.pages?<Link href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)+"&page="+(result.page+1)}
        className="rounded-md border border-border px-3 py-2 text-sm text-primary-text">Next</Link>:null}
      </div>
    </nav>
   <p className="text-xs text-muted-foreground"><Link href="/hr/messages" className="font-semibold text-primary-text underline">Messages</Link> opens conversations with the placement cell. Notification read acknowledgement applies only to your own employer-scoped notification.</p>
  </>}
 </div>;
}
