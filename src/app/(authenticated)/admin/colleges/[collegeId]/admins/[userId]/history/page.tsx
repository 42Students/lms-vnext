import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {parseAdminSessionHistoryPage} from "@/modules/colleges/admin-session-query-model";
import {listCollegeAdminHistory} from "@/modules/colleges/admin-session-service";
export const dynamic="force-dynamic";
export default async function AdministratorHistoryPage({params,searchParams}:{
 params:Promise<{collegeId:string;userId:string}>;
 searchParams:Promise<{page?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const {collegeId,userId}=await params;
 const raw=await searchParams;
 const page=parseAdminSessionHistoryPage(raw);
 if(page===null)return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Tenant" title="Administrator activity history"/>
  <ErrorState title="Invalid history page" description="Choose a valid page without repeated or unrelated filters."
   action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history"} className="inline-flex min-h-11 items-center font-semibold underline">Clear history filters</Link>}/>
 </div>;
 const data=await listCollegeAdminHistory(context,collegeId,userId,page);
 const base="/admin/colleges/"+encodeURIComponent(collegeId)+"/admins";
 const format=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
 return <div className="min-w-0 space-y-5">
  <Link href={base} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">← College admins</Link>
  <PageHeader eyebrow="Super Admin · Tenant" title={data.target.name+" · History"}
   description="Recorded identity, college-admin lifecycle and platform actions concerning this administrator in this college. Cross-college and raw event metadata are excluded."/>
  <a href={"/api/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history?page="+data.page}
   className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Export shown history (CSV)</a>
  <p role="status" className="text-sm text-body">
   Page {data.page} · {data.events.length} recorded event(s) shown{data.truncated?" · more available":""}.
  </p>
  <DataTable<(typeof data.events)[number]> caption="Administrator activity history" rows={data.events} getRowKey={row=>row.id}
    empty={<p role="status" className="text-sm">No matching identity or platform history was recorded for this administrator in the current college.</p>}
    columns={[
      {key:"when",header:"When (IST)",mobilePriority:"secondary",cell:row=>format(row.occurredAt)},
      {key:"event",header:"Event",mobilePriority:"primary",cell:row=><span className="break-all font-mono text-xs">{row.eventType}</span>},
      {key:"summary",header:"Summary",mobilePriority:"secondary",cell:row=><span className="break-words">{row.summary}</span>},
    ]}/>  <nav aria-label="Administrator activity pages" className="flex flex-wrap gap-3 text-sm">
    {data.page>1?<Link href={"?page="+(data.page-1)}
     className="inline-flex min-h-11 items-center text-primary-text underline">Previous 100</Link>:null}
    {data.truncated?<Link href={"?page="+(data.page+1)}
     className="inline-flex min-h-11 items-center text-primary-text underline">Next 100</Link>:null}
  </nav>
 </div>;
}
