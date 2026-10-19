import {getCurrentRequestContext} from "@/auth/request-context";
import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
import Link from "next/link";
import {PersonOnboardDialog} from "@/components/admin/person-onboard-dialog";
import {SuperAdminFacultyBulkImport} from "@/components/admin/super-admin-faculty-bulk-import";
import {SuperAdminFacultyScheduleReassignAction} from "@/components/admin/super-admin-faculty-schedule-reassign-action";
import {listCollegeFacultyPicker} from "@/modules/courses/college-faculty-picker-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
import {getSuperAdminPeopleFilterOptions} from "@/modules/admin-ui/super-admin-people-filter-options";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminFacultyPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const peopleFilters=context.adminScope?.collegeId?await getSuperAdminPeopleFilterOptions(context):null;
 const facultyPicker=context.adminScope?.collegeId?await listCollegeFacultyPicker(context,context.adminScope.collegeId):null;
 return <div className="min-w-0 space-y-4">
  {context.adminScope?.collegeId?<div className="flex flex-wrap items-center gap-3"><p className="font-semibold">Register New Faculty</p>
    <PersonOnboardDialog collegeId={context.adminScope.collegeId} forcedRole="FACULTY"/>
    <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:underline sm:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/admin/people">
      Manage memberships, profiles and account status →
    </Link>
  </div>:null}
  {context.adminScope?.collegeId?<SuperAdminFacultyBulkImport collegeId={context.adminScope.collegeId}/>:null}
  <AdminScopedReadPage peopleFilters={peopleFilters?{...peopleFilters,kind:"FACULTY"}:undefined} title="Registered Faculty" path="/admin/faculty" statuses={statuses}
  exportPath="/api/admin/faculty/export" exportFilename="super-admin-faculty-ist.csv"
  description="Manage registered faculty, their teaching departments and account status. Used for OTP login. Contact fields are visible only to authorized administrators."
  searchParams={searchParams} renderRowActions={row=><div className="flex flex-wrap items-start gap-3"><ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status}/>{peopleFilters?<CollegePersonEditAction membershipId={row.id} kind="FACULTY" departments={peopleFilters.departments}/>:null}
    {facultyPicker?<SuperAdminFacultyScheduleReassignAction sourceMembershipId={row.id} sourceName={row.title}
      candidates={facultyPicker.faculty} truncated={facultyPicker.truncated}/>:null}</div>} loader={query=>listAdminScopedPeople(context,"FACULTY",query)}/></div>;
}
