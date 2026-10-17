import {getCurrentRequestContext} from "@/auth/request-context";
import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
import {SuperAdminStudentBulkAccess} from "@/components/admin/super-admin-student-bulk-access";
import Link from "next/link";
import {CollegeStudentRegisterForm} from "@/components/college/college-student-register-form";
import {getSuperAdminStudentRegisterOptions} from "@/modules/admin-ui/super-admin-student-register-options-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
import {getSuperAdminPeopleFilterOptions} from "@/modules/admin-ui/super-admin-people-filter-options";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminStudentsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const peopleFilters=context.adminScope?.collegeId?await getSuperAdminPeopleFilterOptions(context):null;
 const choices=context.adminScope?.collegeId?await getSuperAdminStudentRegisterOptions(context):null;
 return <div className="space-y-4">
  {context.adminScope?.collegeId?<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
    <a href="#register-student" className="inline-flex min-h-10 items-center font-semibold text-primary-text">Register student ↓</a>
    <Link className="inline-flex min-h-10 items-center font-semibold text-primary-text" href="/admin/people">
      Manage memberships, profiles and account status →
    </Link>
  </div>:null}
  {choices?<section id="register-student" className="space-y-2"><h2 className="text-lg font-semibold">Register student</h2><CollegeStudentRegisterForm choices={choices}/></section>:null}
  <AdminScopedReadPage peopleFilters={peopleFilters?{...peopleFilters,kind:"LEARNER"}:undefined} title="Students" path="/admin/students" statuses={statuses}
  exportPath="/api/admin/students/export" exportFilename="super-admin-students-ist.csv"
  description="Read-only learner memberships in the selected college, without private contact details. Use the scoped membership detail for authorized contact."
  searchParams={searchParams}
  renderBulkActions={rows=><SuperAdminStudentBulkAccess learners={rows.map(row=>({id:row.id,name:row.title}))}/>}
  renderRowActions={row=><div className="flex flex-wrap items-start gap-3"><ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status}/>{peopleFilters?<CollegePersonEditAction membershipId={row.id} kind="LEARNER"/>:null}</div>} loader={query=>listAdminScopedPeople(context,"LEARNER",query)}/></div>;
}
