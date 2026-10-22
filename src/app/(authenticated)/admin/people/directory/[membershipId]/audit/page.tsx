import {PageBackLink} from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listSuperAdminPersonAudit} from "@/modules/people/super-admin-person-audit-service";
import {PageHeader} from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
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
  <p role="status" className="max-w-3xl text-sm leading-6 text-body">Showing latest {data.events.length.toLocaleString("en-IN")} recorded events. This is not an authentication-session or cross-college activity audit.</p>
  <DataTable caption="Membership activity events" mobileMode="scroll"
   columns={[
    {key:"event",header:"Event",mobilePriority:"primary",cell:(event)=><span className="font-semibold text-[var(--lms-heading)]">{event.summary}</span>},
    {key:"module",header:"Module",mobilePriority:"secondary",cell:(event)=>event.module},
    {key:"type",header:"Type",mobilePriority:"secondary",cell:(event)=>event.eventType},
    {key:"importance",header:"Importance",mobilePriority:"secondary",cell:(event)=><StatusBadge tone={event.importance==="HIGH"?"warning":"neutral"}>{event.importance}</StatusBadge>},
    {key:"date",header:"Date",mobilePriority:"secondary",cell:(event)=><time dateTime={event.occurredAt.toISOString()}>{date.format(event.occurredAt)} IST</time>},
   ] satisfies DataTableColumn<(typeof data.events)[number]>[]}
   rows={data.events} getRowKey={event=>String(event.id)}
   empty={<EmptyState title="No membership activity" description="No matching membership activity events have been recorded."/>}/>

 </div>;
}
