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
 if(!read.ok)return <div className="min-w-0 space-y-5">
  <PageHeader title="Membership audit trail"
    actions={<PageBackLink href={"/admin/people/directory/"+encodeURIComponent(membershipId)} label="Membership profile" />}/>
  <ErrorState title="Membership audit unavailable" description="Audit events could not be loaded. The selected membership has not changed."/>
 </div>;
 const data=read.data;
 if(!data)notFound();
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="Super Admin · People" title={"Audit trail · "+(data.membership.name??"Unnamed person")}
   description={"Recorded events for this exact membership in the selected college: "+data.membership.collegeName} actions={<PageBackLink href={"/admin/people/directory/"+encodeURIComponent(membershipId)} label="Membership profile" />}/>
  <p role="status" className="text-sm text-body">Showing latest {data.events.length} recorded events. This is not an authentication-session or cross-college activity audit.</p>
  <ol className="divide-y divide-border border-y border-border">{data.events.map(event=><li key={event.id} className="py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <h2 className="text-sm font-semibold">{event.summary}</h2>
     <time className="text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>{date.format(event.occurredAt)} IST</time>
    </div>
    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{event.module} · {event.eventType}</span><StatusBadge tone={event.importance==="HIGH"?"warning":"neutral"}>{event.importance}</StatusBadge></p>
   </li>)}</ol>
  {!data.events.length?<EmptyState title="No matching membership activity events have been recorded." />:null}
 </div>;
}
