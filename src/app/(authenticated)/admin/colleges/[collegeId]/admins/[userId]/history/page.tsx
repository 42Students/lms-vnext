import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {EmptyState} from "@/components/ui/empty-state";
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
  <PageHeader title="Administrator activity history" actions={<PageBackLink href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"} label="College admins"/>}/>
  <ErrorState title="Invalid history page" description="Choose a valid page without repeated or unrelated filters."
   action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history"} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear history filters</Link>}/>
 </div>;
 const data=await listCollegeAdminHistory(context,collegeId,userId,page);
 const base="/admin/colleges/"+encodeURIComponent(collegeId)+"/admins";
 const format=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(date);
 return <div className="min-w-0 space-y-5">
  <PageHeader title={data.target.name+" · History"}
   description="Recorded identity, college-admin lifecycle and platform actions concerning this administrator in this college. Cross-college and raw event metadata are excluded."
   actions={<div className="flex flex-wrap items-center gap-2">
    <PageBackLink href={base} label="College admins"/>
    <a href={"/api/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(userId)+"/history?page="+data.page}
     className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Export shown history (CSV)</a>
   </div>}/>
  <p role="status" className="text-sm text-body">
   Page {data.page} · {data.events.length} recorded event(s) shown{data.truncated?" · more available":""}.
  </p>
  <DataTable<(typeof data.events)[number]> caption="Administrator activity history" rows={data.events} getRowKey={row=>row.id}
    empty={<EmptyState title="No administrator history" description="No matching identity or platform history was recorded for this administrator in the current college."/>}
    columns={[
      {key:"when",header:"When (IST)",mobilePriority:"secondary",cell:row=>format(row.occurredAt)},
      {key:"event",header:"Event",mobilePriority:"primary",cell:row=><span className="break-all font-mono text-xs">{row.eventType}</span>},
      {key:"summary",header:"Summary",mobilePriority:"secondary",cell:row=><span className="break-words">{row.summary}</span>},
    ]}/>
  <nav aria-label="Administrator activity pages" className="flex flex-wrap gap-3 text-sm">
    {data.page>1?<Link href={"?page="+(data.page-1)}
     className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Previous 100</Link>:null}
    {data.truncated?<Link href={"?page="+(data.page+1)}
     className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Next 100</Link>:null}
  </nav>
 </div>;
}
