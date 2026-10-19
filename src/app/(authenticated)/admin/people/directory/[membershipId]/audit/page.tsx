import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listSuperAdminPersonAudit} from "@/modules/people/super-admin-person-audit-service";
import {PageHeader} from "@/components/ui/page-header";
export default async function MembershipAuditPage({params}:{params:Promise<{membershipId:string}>}){
 const {membershipId}=await params;
 const data=await listSuperAdminPersonAudit(await getCurrentRequestContext(),membershipId);
 if(!data)notFound();
 const date=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · People" title={"Audit trail · "+(data.membership.name??"Unnamed person")}
   description={"Recorded events for this exact membership in the selected college: "+data.membership.collegeName}/>
  <Link href={"/admin/people/directory/"+encodeURIComponent(membershipId)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">← Membership profile</Link>
  <p role="status" className="text-sm text-body">Showing latest {data.events.length} recorded events. This is not an authentication-session or cross-college activity audit.</p>
  <ol className="divide-y divide-border border-y border-border">{data.events.map(event=><li key={event.id} className="py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <h2 className="text-sm font-semibold">{event.summary}</h2>
     <time className="text-xs text-muted-foreground" dateTime={event.occurredAt.toISOString()}>{date.format(event.occurredAt)} IST</time>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{event.module} · {event.eventType} · {event.importance}</p>
   </li>)}</ol>
  {!data.events.length?<p role="status" className="border-b border-border py-4 text-sm text-muted-foreground">No matching membership activity events have been recorded.</p>:null}
 </div>;
}
