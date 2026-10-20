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
 return <div className="min-w-0 space-y-4 md:space-y-6">
  <AdminScopedReadPage
    headerActions={context.adminScope?.collegeId?<PersonOnboardDialog collegeId={context.adminScope.collegeId} forcedRole="FACULTY"/>:null}
    intro={context.adminScope?.collegeId?<section aria-label="Faculty registration tools" className="min-w-0 space-y-3 border-b border-border pb-4">
      <SuperAdminFacultyBulkImport collegeId={context.adminScope.collegeId}/>
      <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9" href="/admin/people">
       Manage memberships, profiles and account status →
      </Link>
    </section>:null}
    peopleFilters={peopleFilters?{...peopleFilters,kind:"FACULTY"}:undefined} title="Registered Faculty" path="/admin/faculty" statuses={statuses}
  exportPath="/api/admin/faculty/export" exportFilename="super-admin-faculty-ist.csv"
  description="Manage registered faculty, their teaching departments and account status. Used for OTP login. Contact fields are visible only to authorized administrators."
  searchParams={searchParams} renderRowActions={row=><div className="flex flex-wrap items-start gap-3"><ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status}/>{peopleFilters?<CollegePersonEditAction membershipId={row.id} kind="FACULTY" departments={peopleFilters.departments}/>:null}
    {facultyPicker?<SuperAdminFacultyScheduleReassignAction sourceMembershipId={row.id} sourceName={row.title}
      candidates={facultyPicker.faculty} truncated={facultyPicker.truncated}/>:null}</div>} loader={query=>listAdminScopedPeople(context,"FACULTY",query)}/></div>;
}
