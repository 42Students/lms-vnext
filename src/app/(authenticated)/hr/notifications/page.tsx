import { Tabs } from "@/components/ui/tabs";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
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
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const raw=await searchParams;
 const query=hrNotificationsQuerySchema.safeParse({
  collegeId:raw.collegeId,unreadOnly:raw.unreadOnly,page:raw.page,q:raw.q,
 });
 if(!query.success)return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Notifications"
   actions={<Link href="/hr/conversations"
     className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 md:w-auto">Recruiter conversations</Link>}/>
  <ErrorState title="Invalid inbox filter" description="Review the college, search and unread options." role="alert"
   action={<Link href="/hr/notifications" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] md:min-h-9">Reset</Link>}/>
 </div>;
 const result=await listHrNotifications(context,query.data);
 const time=(d:Date)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(d);
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Notifications"
   description="In-app drive notifications for your authorized employer and college. Conversations and replies are available under Messages."
   actions={<>
     <Link href="/hr/conversations" className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 md:w-auto">
       Open recruiter conversations
     </Link>
     {result.status==="READY"?<Link
       href={"/api/placements/recruiter/notifications/export?collegeId="+encodeURIComponent(result.collegeId)+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)}
       className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text underline underline-offset-4 md:min-h-9 md:w-auto hover:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
       Export scoped notifications CSV
     </Link>:null}
   </>}/>
  {result.status!=="READY"?<section className="space-y-3 border-b border-border pb-4">
   <p className="text-sm text-body leading-[22px]">{result.status==="NO_ACCESS"?"No active college access.":"Choose a college."}</p>
   <NeedsDoingChips label="Authorized colleges:"
     items={result.choices.map(grant=>({
       key:grant.collegeId,label:grant.collegeName,
       href:"/hr/notifications?collegeId="+encodeURIComponent(grant.collegeId),
     }))}/>
  </section>:<>
   {result.choices.length>1?<NeedsDoingChips label="College notifications:"
     selectedKey={result.collegeId}
     items={result.choices.map(grant=>({
       key:grant.collegeId,label:grant.collegeName,
       href:"/hr/notifications?collegeId="+encodeURIComponent(grant.collegeId),
     }))}/>:null}
   <Tabs renderPanel={false} ariaLabel="Inbox filters" value={query.data.unreadOnly}
     items={[
       {value:"false",label:"Show all",href:"/hr/notifications?collegeId="+
         encodeURIComponent(result.collegeId)+"&unreadOnly=false&q="+encodeURIComponent(query.data.q)},
       {value:"true",label:"Unread only",href:"/hr/notifications?collegeId="+
         encodeURIComponent(result.collegeId)+"&unreadOnly=true&q="+encodeURIComponent(query.data.q)},
     ]}/>
   <form action="/hr/notifications" method="get" role="search" aria-label="Search recruiter notifications" className="flex min-w-0 flex-wrap items-end gap-2 max-[767px]:flex-col max-[767px]:items-stretch">
     <Input type="hidden" name="collegeId" value={result.collegeId} />
     <Input type="hidden" name="unreadOnly" value={query.data.unreadOnly} />
     <label htmlFor="hr-notification-search" className="sr-only">Search drive titles</label>
     <Input id="hr-notification-search" type="search" name="q" defaultValue={query.data.q} maxLength={120}
       placeholder="Search drive titles" className="min-h-11 min-w-0 w-full md:min-h-9 md:max-w-sm md:flex-1" />
     <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
   </form>
   <p className="text-sm text-body leading-[22px]">{result.unread.toLocaleString("en-IN")} unread · {result.total.toLocaleString("en-IN")} matching authorized notifications</p>

   {result.rows.length?<div className="space-y-6">
     <p className="text-xs text-muted-foreground leading-5">Grouped by drive within this page only. This is not a conversation thread.</p>
     {groupHrNotificationPage(result.rows).map(group=><section key={group.jobId}
       aria-label={"Notifications for "+group.title}
       className="border-b border-border pb-4">
       <div className="flex flex-wrap items-center justify-between gap-2">
         <h2 className="font-semibold text-[var(--lms-heading)] text-[18px] leading-[1.4]">
           <Link href={"/hr/placements/jobs/"+encodeURIComponent(group.jobId)}
             className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{group.title}</Link>
         </h2>
         <span className="text-xs text-muted-foreground">{group.items.length} on this page · {group.unread} unread</span>
       </div>
       <ol className="mt-3 divide-y divide-border">{group.items.map(row=>
         <li key={row.id} className="min-w-0 py-3 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-table-hover)] motion-reduce:transition-none">
           <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
             <span className="min-w-0 break-words text-sm text-body">{row.label}{row.unread?<StatusBadge tone="info" className="ml-2">Unread</StatusBadge>:null}</span>
             <span className="text-xs text-muted-foreground">{time(row.createdAt)} IST</span>
           </div>
           {row.unread?<HrNotificationReadButton notificationId={row.id}
             expectedCreatedAt={row.createdAt.toISOString()}/>:null}
         </li>)}
       </ol>
     </section>)}
   </div>:<EmptyState title="No matching notifications"
     description="No matching notifications for this employer and college."
     action={query.data.q||query.data.unreadOnly==="true" ? <Link href={"/hr/notifications?collegeId="+encodeURIComponent(result.collegeId)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Reset</Link> : undefined}/>}
   <nav aria-label="Notification pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground leading-5">
       {result.first?result.first+"–"+result.last:"No rows on this page"}
       {" of "+(query.data.unreadOnly==="true"?result.unread:result.total).toLocaleString("en-IN")}
      </p>
      <div className="flex flex-wrap gap-2">
       {result.page>1?<Link href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)+"&page="+(result.page-1)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] md:rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Previous</Link>:null}
       {result.page<result.pages?<Link href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)+"&page="+(result.page+1)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] md:rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-primary-text md:min-h-9 hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Next</Link>:null}
      </div>
    </nav>
   <p className="text-xs text-muted-foreground leading-5"><Link href="/hr/messages" className="min-h-11 md:min-h-9 inline-flex items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Messages</Link> opens conversations with the placement cell. Notification read acknowledgement applies only to your own employer-scoped notification.</p>
  </>}
 </div>;
}
