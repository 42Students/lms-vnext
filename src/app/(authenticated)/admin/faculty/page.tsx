import {getCurrentRequestContext} from "@/auth/request-context";
import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
import {CollegePersonAuditModal} from "@/components/college/college-person-audit-modal";
import {CollegePersonProfileOverviewModal} from "@/components/college/college-person-profile-overview-modal";
import Link from "next/link";
import {Alert} from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
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
  <PageHeader title="Faculty"
   description="Manage faculty identity, access and account status here. Teaching allocation stays in Faculty Assignment so roster work and academic allocation do not get mixed together."
   actions={context.adminScope?.collegeId&&peopleFilters?<PersonOnboardDialog collegeId={context.adminScope.collegeId} forcedRole="FACULTY" departments={peopleFilters.departments}/>:undefined}/>
  {filtersResult.status==="rejected"?<Alert tone="warning" title="Faculty filter options are unavailable">
   The faculty roster remains available. Registration and department filters need verified choices.
   {" "}<Link href="/admin/faculty" className="font-semibold underline">Retry options</Link>.
  </Alert>:null}
  {pickerResult.status==="rejected"?<Alert tone="warning" title="Faculty reassignment options are unavailable">
   The faculty roster remains available. Schedule reassignments require refreshed faculty choices.
   {" "}<Link href="/admin/faculty" className="font-semibold underline">Retry options</Link>.
  </Alert>:null}
  <AdminScopedReadPage
    headingMode="section"
    intro={context.adminScope?.collegeId?<section aria-label="Faculty registration tools"
      className="min-w-0 space-y-3 pb-4">
      <details className="min-w-0 rounded-[8px] border border-border bg-surface px-4 py-3">
       <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-[var(--lms-primary)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        Register faculty (one at a time or bulk CSV)
       </summary>
       <div className="grid min-w-0 gap-6 pt-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-3">
         <h3 className="font-semibold text-[var(--lms-heading)]">Register New Faculty</h3>
         <p className="text-sm text-body">Create a faculty account for the selected college. Specify the teaching department, faculty type and contact details.</p>
         {peopleFilters?<PersonOnboardDialog collegeId={context.adminScope.collegeId} forcedRole="FACULTY" departments={peopleFilters.departments}/>:<Alert tone="warning">Department choices are unavailable; retry options before registering faculty.</Alert>}
        </div>
        <div className="min-w-0">
         <SuperAdminFacultyBulkImport collegeId={context.adminScope.collegeId}/>
        </div>
       </div>
      </details>
      <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-2">
       <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/admin/people">
        Manage memberships, profiles and account status →
       </Link>
       <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9" href="/admin/faculty-assignment">
        Faculty Assignment →
       </Link>
      </div>
    </section>:null}
    peopleFilters={peopleFilters?{...peopleFilters,kind:"FACULTY"}:undefined} title="Registered Faculty" path="/admin/faculty" statuses={statuses}
  exportPath="/api/admin/faculty/export" exportFilename="faculty.csv"
  description="Registered faculty in the selected college. Contact fields are shown only to authorized administrators."
  searchParams={searchParams} renderRowActions={row=><div className="flex min-w-0 flex-wrap items-start gap-3">
    {peopleFilters?<CollegePersonEditAction membershipId={row.id} kind="FACULTY" departments={peopleFilters.departments}/>:null}
    <CollegePersonAuditModal membershipId={row.id} name={row.title} kind="FACULTY"/>
    <CollegePersonProfileOverviewModal membershipId={row.id} name={row.title} kind="FACULTY"/>
    <Disclosure title={"More faculty actions for "+row.title} className="min-w-0"
      contentClassName="flex min-w-0 flex-col items-start gap-3 pb-2 pt-2 sm:flex-row sm:flex-wrap">
      <ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status} roleLabel="Faculty"/>
      {facultyPicker?<SuperAdminFacultyScheduleReassignAction sourceMembershipId={row.id} sourceName={row.title}
        candidates={facultyPicker.faculty} truncated={facultyPicker.truncated}/>:null}
      <p className="max-w-md text-xs text-muted-foreground">
        Legacy credential-swapping impersonation and forced OTP lockout clearing are
        retired security operations. Remove faculty ends only an unassigned college
        membership after a protected dependency check; it never deletes identity or history.
      </p>
    </Disclosure>
  </div>} loader={query=>listAdminScopedPeople(context,"FACULTY",query)}/></div>;
}
