import {PageBackLink} from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listSuperAdminPersonAudit} from "@/modules/people/super-admin-person-audit-service";
import {PageHeader} from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
export default async function MembershipAuditPage({params}:{params:Promise<{membershipId:string}>}){
 const {membershipId}=await params;
 const read=await listSuperAdminPersonAudit(await getCurrentRequestContext(),membershipId)
   .then(data=>({ok:true as const,data}))
   .catch(()=>({ok:false as const}));
 if(!read.ok)return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Membership audit trail"
    actions={<PageBackLink href={"/admin/people/directory/"+encodeURIComponent(membershipId)} label="Membership profile" />}/>
  <ErrorState title="Membership audit unavailable" description="Audit events could not be loaded. The selected membership has not changed."/>
 </div>;
 const data=read.data;
 if(!data)notFound();
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader eyebrow="Super Admin · People" title={"Audit trail · "+(data.membership.name??"Unnamed person")}
   description={"Recorded events for this exact membership in the selected college: "+data.membership.collegeName} actions={<PageBackLink href={"/admin/people/directory/"+encodeURIComponent(membershipId)} label="Membership profile" />}/>
  <p role="status" className="max-w-3xl text-sm leading-6 text-body">Showing latest {data.events.length} recorded events. This is not an authentication-session or cross-college activity audit.</p>
  {data.events.length ? <ol className="min-w-0 divide-y divide-border border-y border-border">{data.events.map(event=><li key={event.id} className="min-w-0 py-[var(--lms-space-4)] first:pt-0">
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-1)] sm:flex-row sm:items-start sm:justify-between sm:gap-[var(--lms-space-4)]">
     <h2 className="min-w-0 break-words text-sm font-semibold leading-6 text-[var(--lms-heading)]">{event.summary}</h2>
     <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>{date.format(event.occurredAt)} IST</time>
    </div>
    <p className="mt-[var(--lms-space-2)] flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-xs text-muted-foreground"><span>{event.module} · {event.eventType}</span><StatusBadge tone={event.importance==="HIGH"?"warning":"neutral"}>{event.importance}</StatusBadge></p>
   </li>)}</ol> : <EmptyState title="No membership activity" description="No matching membership activity events have been recorded."/>}
 </div>;
}
