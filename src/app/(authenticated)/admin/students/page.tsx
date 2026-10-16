import {getCurrentRequestContext} from "@/auth/request-context";
import Link from "next/link";
import {PersonOnboardDialog} from "@/components/admin/person-onboard-dialog";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminStudentsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <div className="space-y-4">
  {context.adminScope?.collegeId?<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
    <PersonOnboardDialog collegeId={context.adminScope.collegeId} forcedRole="LEARNER"/>
    <Link className="inline-flex min-h-10 items-center font-semibold text-primary-text" href="/admin/people">
      Manage memberships, profiles and account status →
    </Link>
  </div>:null}
  <AdminScopedReadPage title="Students" path="/admin/students" statuses={statuses}
  exportPath="/api/admin/students/export" exportFilename="super-admin-students-ist.csv"
  description="Read-only learner memberships in the selected college, without private contact details. Use the scoped membership detail for authorized contact."
  searchParams={searchParams} loader={query=>listAdminScopedPeople(context,"LEARNER",query)}/></div>;
}
