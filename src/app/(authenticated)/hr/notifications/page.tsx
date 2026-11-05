import { Tabs } from "@/components/ui/tabs";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateTimeFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";
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
   actions={<TextLink href="/hr/conversations"
     className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto">Recruiter conversations</TextLink>}/>
  <ErrorState title="Invalid inbox filter" description="Review the college, search and unread options." role="alert"
   action={<TextLink href="/hr/notifications" className="inline-flex min-h-11 items-center md:min-h-9">Reset</TextLink>}/>
 </div>;
 const result=await listHrNotifications(context,query.data);
 const time=(d:Date)=>istDateTimeFormatter.format(d);
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Notifications"
   description="In-app drive notifications for your authorized employer and college. Conversations and replies are available under Messages."
   actions={<>
     <TextLink href="/hr/conversations" className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto">
       Open recruiter conversations
     </TextLink>
     {result.status==="READY"?<TextLink
       href={"/api/placements/recruiter/notifications/export?collegeId="+encodeURIComponent(result.collegeId)+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)}
       className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto">
       Export scoped notifications CSV
     </TextLink>:null}
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
   <form action="/hr/notifications" method="get" role="search" aria-label="Search recruiter notifications" className="flex min-w-0 flex-wrap items-end gap-2 max-md:flex-col max-md:items-stretch">
     <Input type="hidden" name="collegeId" value={result.collegeId} />
     <Input type="hidden" name="unreadOnly" value={query.data.unreadOnly} />
     <Label htmlFor="hr-notification-search" className="sr-only">Search drive titles</Label>
     <Input id="hr-notification-search" type="search" name="q" defaultValue={query.data.q} maxLength={120}
       placeholder="Search drive titles" className="min-h-11 min-w-0 w-full md:min-h-9 md:max-w-sm md:flex-1" />
     <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
   </form>
   <p className="text-sm text-body leading-[22px]">{formatNumberIN(result.unread)} unread · {formatNumberIN(result.total)} matching authorized notifications</p>

   {result.rows.length?<div className="space-y-6">
     <p className="text-xs text-muted-foreground leading-5">Grouped by drive within this page only. This is not a conversation thread.</p>
     {groupHrNotificationPage(result.rows).map(group=><section key={group.jobId}
       aria-label={"Notifications for "+group.title}
       className="border-b border-border pb-4">
       <div className="flex flex-wrap items-center justify-between gap-2">
         <Heading level={2} size="lg" className="text-[var(--lms-heading)] leading-[1.4]">
           <TextLink href={"/hr/placements/jobs/"+encodeURIComponent(group.jobId)}
             className="min-h-11 md:min-h-9 inline-flex items-center">{group.title}</TextLink>
         </Heading>
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
     action={query.data.q||query.data.unreadOnly==="true" ? <TextLink href={"/hr/notifications?collegeId="+encodeURIComponent(result.collegeId)} className="inline-flex min-h-11 items-center md:min-h-9">Reset</TextLink> : undefined}/>}
   <nav aria-label="Notification pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground leading-5">
       {result.first?result.first+"–"+result.last:"No rows on this page"}
       {" of "+formatNumberIN((query.data.unreadOnly==="true"?result.unread:result.total))}
      </p>
      <div className="flex flex-wrap gap-2">
       {result.page>1?<ButtonLink variant="secondary" href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)+"&page="+(result.page-1)}>Previous</ButtonLink>:null}
       {result.page<result.pages?<ButtonLink variant="secondary" href={"/hr/notifications?collegeId="+result.collegeId+"&unreadOnly="+query.data.unreadOnly+"&q="+encodeURIComponent(query.data.q)+"&page="+(result.page+1)}>Next</ButtonLink>:null}
      </div>
    </nav>
   <p className="text-xs text-muted-foreground leading-5"><TextLink href="/hr/messages" className="min-h-11 md:min-h-9 inline-flex items-center">Messages</TextLink> opens conversations with the placement cell. Notification read acknowledgement applies only to your own employer-scoped notification.</p>
  </>}
 </div>;
}
