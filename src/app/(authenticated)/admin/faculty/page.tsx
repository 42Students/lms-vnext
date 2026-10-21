import {getCurrentRequestContext} from "@/auth/request-context";
import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
import {CollegePersonAuditModal} from "@/components/college/college-person-audit-modal";
import {CollegePersonProfileOverviewModal} from "@/components/college/college-person-profile-overview-modal";
import Link from "next/link";
import {Alert} from "@/components/ui/alert";
import { Disclosure } from "@/components/ui/disclosure";
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
 const [filtersResult,pickerResult]=await Promise.allSettled([
  context.adminScope?.collegeId?getSuperAdminPeopleFilterOptions(context):Promise.resolve(null),
  context.adminScope?.collegeId?listCollegeFacultyPicker(context,context.adminScope.collegeId):Promise.resolve(null),
 ]);
 const peopleFilters=filtersResult.status==="fulfilled"?filtersResult.value:null;
 const facultyPicker=pickerResult.status==="fulfilled"?pickerResult.value:null;
 return <div className="min-w-0 space-y-4 md:space-y-6">
  {filtersResult.status==="rejected"?<Alert tone="warning" title="Faculty filter options are unavailable">
   The faculty roster remains available. Registration and department filters need verified choices.
   {" "}<Link href="/admin/faculty" className="font-semibold underline">Retry options</Link>.
  </Alert>:null}
  {pickerResult.status==="rejected"?<Alert tone="warning" title="Faculty reassignment options are unavailable">
   The faculty roster remains available. Schedule reassignments require refreshed faculty choices.
   {" "}<Link href="/admin/faculty" className="font-semibold underline">Retry options</Link>.
  </Alert>:null}
  <AdminScopedReadPage
    headerActions={context.adminScope?.collegeId&&peopleFilters?<PersonOnboardDialog collegeId={context.adminScope.collegeId} forcedRole="FACULTY" departments={peopleFilters?.departments ?? []}/>:null}
    intro={context.adminScope?.collegeId?<section aria-label="Faculty registration tools"
      className="min-w-0 space-y-3 border-b border-border pb-4">
      <Disclosure title="Bulk Register Faculty" className="min-w-0"
        contentClassName="min-w-0 pb-3 pt-3">
        <SuperAdminFacultyBulkImport collegeId={context.adminScope.collegeId}/>
      </Disclosure>
      <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/admin/people">
       Manage memberships, profiles and account status →
      </Link>
    </section>:null}
    peopleFilters={peopleFilters?{...peopleFilters,kind:"FACULTY"}:undefined} title="Registered Faculty" path="/admin/faculty" statuses={statuses}
  exportPath="/api/admin/faculty/export" exportFilename="faculty.csv"
  description="Manage registered faculty, their teaching departments and account status. Used for OTP login. Contact fields are visible only to authorized administrators."
  searchParams={searchParams} renderRowActions={row=><div className="flex min-w-0 flex-wrap items-start gap-3">
    {peopleFilters?<CollegePersonEditAction membershipId={row.id} kind="FACULTY" departments={peopleFilters.departments}/>:null}
    <Disclosure title="More faculty actions" className="min-w-0"
      contentClassName="flex min-w-0 flex-col items-start gap-3 pb-2 pt-2 sm:flex-row sm:flex-wrap">
      <ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status} roleLabel="Faculty"/>
      <CollegePersonAuditModal membershipId={row.id} name={row.title} kind="FACULTY"/>
      <CollegePersonProfileOverviewModal membershipId={row.id} name={row.title} kind="FACULTY"/>
      {facultyPicker?<SuperAdminFacultyScheduleReassignAction sourceMembershipId={row.id} sourceName={row.title}
        candidates={facultyPicker.faculty} truncated={facultyPicker.truncated}/>:null}
    </Disclosure>
  </div>} loader={query=>listAdminScopedPeople(context,"FACULTY",query)}/></div>;
}
