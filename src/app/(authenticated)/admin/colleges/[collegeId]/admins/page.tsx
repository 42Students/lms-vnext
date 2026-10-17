import Link from "next/link";
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
 return <main className="min-w-0 space-y-5">
  <Link href={"/admin/colleges/"+encodeURIComponent(collegeId)} className="text-sm font-semibold text-primary-text underline">← College setup</Link>
  <PageHeader eyebrow="Super Admin · Tenant" title={data.college.name+" · Admins"}
   description="Manage college administrators and placement-cell officers in this college. New accounts use the canonical college membership workflow."/>
  <div className="flex flex-wrap gap-3">
   <PersonOnboardDialog collegeId={collegeId} forcedRole="COLLEGE_ADMIN"/>
   <PersonOnboardDialog collegeId={collegeId} forcedRole="TPO"/>
  </div>
  <section aria-label="College administrator directory" className="rounded-xl border border-border bg-surface">
   <h2 className="border-b border-border p-4 font-semibold">College Admin and TPO accounts</h2>
   {data.items.length?<div className="overflow-x-auto"><table className="w-full min-w-[35rem] text-left text-sm">
    <thead className="bg-surface-subtle text-body"><tr>
     <th scope="col" className="p-3">Name</th><th scope="col" className="p-3">Email</th>
     <th scope="col" className="p-3">Roles</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Access</th><th scope="col" className="p-3">Sessions</th><th scope="col" className="p-3">History</th>
    </tr></thead>
    <tbody>{data.items.map(item=><tr key={item.userId} className="border-t border-border">
     <td className="p-3 font-semibold">{item.name}</td>
     <td className="break-all p-3">{item.email??"Not recorded"}</td>
     <td className="p-3">{item.roles.join(", ")}</td>
     <td className="p-3">{item.status==="ACTIVE"?"Enabled":"Suspended"}</td>
     <td className="p-3"><CollegeAdminLifecycleAction membershipId={item.membershipId}
      status={item.status} hasMentorRole={item.roles.includes("MENTOR")}/></td>
     <td className="p-3"><Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(item.userId)}
      className="text-primary-text underline">View active devices</Link></td>
     <td className="p-3"><Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(item.userId)+"/history"}
      className="text-primary-text underline">View history</Link></td>
    </tr>)}</tbody></table></div>:
    <p role="status" className="p-4 text-sm text-body">No active College Admin or TPO accounts in this college.</p>}
  </section>
  {data.truncated?<p role="status" className="text-sm text-warning-text">Showing the first 500 role records. This directory needs a narrower scope to show every administrator.</p>:null}
 </main>;
}
