import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PersonOnboardDialog} from "@/components/admin/person-onboard-dialog";
import {CollegeAdminLifecycleAction} from "@/components/admin/college-admin-lifecycle-action";
import {listCollegeAdminSessionTargets} from "@/modules/colleges/admin-session-service";

export const dynamic="force-dynamic";
export default async function CollegeAdministratorsPage({params}:{
 params:Promise<{collegeId:string}>;
}){
 const collegeId=(await params).collegeId;
 const context=await getCurrentRequestContext();
 const data=await listCollegeAdminSessionTargets(context,collegeId);
 return <div className="min-w-0 space-y-5">
  <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">← College setup</Link>
  <PageHeader eyebrow="Super Admin · Tenant" title={data.college.name+" · Admins"}
   description="Manage college administrators and placement-cell officers in this college. New accounts use the canonical college membership workflow."/>
  <div className="flex flex-wrap gap-3">
   <PersonOnboardDialog collegeId={collegeId} forcedRole="COLLEGE_ADMIN"/>
   <PersonOnboardDialog collegeId={collegeId} forcedRole="TPO"/>
  </div>
  <section aria-label="College administrator directory" className="border-t border-border pt-4">
   <h2 className="mb-3 font-semibold">College Admin and TPO accounts</h2>
   <DataTable<(typeof data.items)[number]> caption="College Admin and TPO accounts" rows={data.items} getRowKey={item=>item.userId}
    empty={<p role="status" className="text-sm text-body">No active College Admin or TPO accounts in this college.</p>}
    columns={[
      {key:"name",header:"Name",mobilePriority:"primary",cell:item=><strong>{item.name}</strong>},
      {key:"email",header:"Email",mobilePriority:"secondary",cell:item=><span className="break-all">{item.email??"Not recorded"}</span>},
      {key:"roles",header:"Roles",mobilePriority:"secondary",cell:item=>item.roles.join(", ")},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>item.status==="ACTIVE"?"Enabled":"Suspended"},
      {key:"access",header:"Access",mobilePriority:"action",cell:item=><CollegeAdminLifecycleAction membershipId={item.membershipId} status={item.status} hasMentorRole={item.roles.includes("MENTOR")}/>},
      {key:"sessions",header:"Sessions",mobilePriority:"action",cell:item=><Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(item.userId)} className="inline-flex min-h-11 items-center text-primary-text underline">View active devices</Link>},
      {key:"history",header:"History",mobilePriority:"action",cell:item=><Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(item.userId)+"/history"} className="inline-flex min-h-11 items-center text-primary-text underline">View history</Link>},
    ]}/>  </section>
  {data.truncated?<p role="status" className="text-sm text-warning">Showing the first 500 role records. This directory needs a narrower scope to show every administrator.</p>:null}
 </div>;
}
