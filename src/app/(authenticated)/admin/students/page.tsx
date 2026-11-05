import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {formatSuperAdminImportWhen} from "@/modules/admin-ui/super-admin-import-date-model";
import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
import {CollegePersonAuditModal} from "@/components/college/college-person-audit-modal";
import {CollegePersonProfileOverviewModal} from "@/components/college/college-person-profile-overview-modal";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {StudentClassMoveAction} from "@/components/college/student-class-move-action";
import {SuperAdminStudentBulkAccess} from "@/components/admin/super-admin-student-bulk-access";
import {CollegeStudentRegisterForm} from "@/components/college/college-student-register-form";
import {CollegeStudentCsvImport} from "@/components/college/college-student-csv-import";
import {SuperAdminStudentImportHistory} from "@/components/admin/super-admin-student-import-history";
import {listSuperAdminStudentCsvImportHistory} from "@/modules/people/college-student-csv-service";
import {getSuperAdminStudentRegisterOptions} from "@/modules/admin-ui/super-admin-student-register-options-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {ErrorState} from "@/components/ui/error-state";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
import {getSuperAdminPeopleFilterOptions} from "@/modules/admin-ui/super-admin-people-filter-options";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminStudentsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Students"/>
  <ErrorState title="Student access denied"
   description="Your account cannot access Super Admin student records."
   action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
 </div>;
 let peopleFilters:Awaited<ReturnType<typeof getSuperAdminPeopleFilterOptions>>|null=null;
 let choices:Awaited<ReturnType<typeof getSuperAdminStudentRegisterOptions>>|null=null;
 let importHistory:Awaited<ReturnType<typeof listSuperAdminStudentCsvImportHistory>>=[];
 let filtersUnavailable=false,choicesUnavailable=false,historyUnavailable=false;
 if(context.adminScope?.collegeId){
  // Academic choices and import history are independent reads. Their failure must
  // disable the affected operation, not hide an otherwise authorized roster.
  const [filtersResult,choicesResult,historyResult]=await Promise.allSettled([
   getSuperAdminPeopleFilterOptions(context),
   getSuperAdminStudentRegisterOptions(context),
   listSuperAdminStudentCsvImportHistory(context),
  ]);
  if(filtersResult.status==="fulfilled")peopleFilters=filtersResult.value;
  else filtersUnavailable=true;
  if(choicesResult.status==="fulfilled")choices=choicesResult.value;
  else choicesUnavailable=true;
  if(historyResult.status==="fulfilled")importHistory=historyResult.value;
  else historyUnavailable=true;
 }
 const importRuns=importHistory.map(run=>{
   const meta=run.metadata;
   const count=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:0;
   return {
     when:formatSuperAdminImportWhen(run.occurredAt),
     students:count(meta["count"]),created:count(meta["created"]),failed:count(meta["failed"]),
   };
 });
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Students"
   description="Manage student identity, academic placement and account access from one roster."
   actions={context.adminScope?.collegeId?<div className="flex w-full min-w-0 flex-col items-stretch gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:justify-end">
    {choices?<ButtonLink variant="primary" href="#register-student-heading"><span aria-hidden="true">＋</span>Register students</ButtonLink>:null}
    <ButtonLink variant="secondary" href="/admin/people">
      Manage memberships, profiles and account status →
    </ButtonLink>
   </div>:undefined}/>
  <section aria-label="Student support and retention policy" className="min-w-0 border-b border-border pb-3 text-sm text-body">
   <Heading level={2} className="text-foreground">Account access and support</Heading>
   <p className="mt-1">The legacy Impersonate action is retired. This membership-based workspace does not exchange Super Admin tokens for a learner session or replace active session credentials. Use the student row's audited profile, history and membership controls for support.</p>
   <p className="mt-1">The legacy permanent Delete action is retired for learners with attendance, submissions, placement or audit records. Suspend or end college access instead; historical records remain available under their original identity.</p>
   <TextLink href="/admin/people" className="inline-flex min-h-11 items-center md:min-h-9">Open audited membership controls</TextLink>
  </section>
  {filtersUnavailable?<Alert tone="warning">Academic filter choices could not be loaded. Student directory rows remain available; edit and class-move actions are temporarily disabled. <TextLink href="/admin/students">Retry academic filters</TextLink></Alert>:null}
  {choicesUnavailable?<Alert tone="warning">Registration and bulk-import academic choices could not be loaded. Those actions are disabled until the selected college's options can be verified. <TextLink href="/admin/students">Retry registration options</TextLink></Alert>:null}
  {historyUnavailable?<Alert tone="warning">Recent bulk import history is unavailable; no empty import history is implied. <TextLink href="/admin/students">Retry import history</TextLink></Alert>:null}
  <AdminScopedReadPage headingMode="section" intro={choices?
   <Disclosure title={<>
     <span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-lg leading-none">＋</span>
     Register students (one at a time or bulk CSV)
     <span aria-hidden="true" className="ml-auto text-muted-foreground group-open:rotate-180">⌄</span>
    </>} id="register-student" className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center gap-2">
    <div className="grid min-w-0 gap-[var(--lms-space-4)] border-t border-[var(--lms-canvas-border)] p-[var(--lms-space-4)] lg:grid-cols-2">
     <section aria-labelledby="register-student-heading" className="min-w-0 space-y-3 border-b border-border pb-4 lg:border-b-0 lg:border-r lg:pr-4">
      <Heading level={2} size="base" id="register-student-heading" className="leading-6 text-[var(--lms-heading)]">Register New Student</Heading>
      <CollegeStudentRegisterForm choices={choices}/>
     </section>
     <section aria-labelledby="bulk-register-students-heading" className="min-w-0 space-y-3 pb-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
       <Heading level={2} size="base" id="bulk-register-students-heading" className="leading-6 text-[var(--lms-heading)]">Bulk Register Students</Heading>
       {historyUnavailable?<StatusBadge tone="warning">History unavailable</StatusBadge>:<SuperAdminStudentImportHistory runs={importRuns}/>}
      </div>
      <p className="text-sm leading-[22px] text-body">Validate a selected Program, Batch and Class roster before creating students. Imports can&apos;t be undone in one step, to protect students&apos; work. Correct or suspend individual accounts instead.</p>
      <Disclosure title="Show CSV import form" className="min-w-0">
       <div className="min-w-0 pt-3"><CollegeStudentCsvImport choices={choices}/></div>
      </Disclosure>
     </section>
    </div>
   </Disclosure>:null} {...(peopleFilters ? {peopleFilters:{...peopleFilters,kind:"LEARNER" as const}} : {})} title="Registered Students" path="/admin/students" statuses={statuses}
  exportPath="/api/admin/students/export" exportFilename="students.csv"
  description="Manage student identity, academic placement and account access from one roster. Bulk registration and high-impact access changes stay explicit and reviewable."
  searchParams={searchParams}
  renderBulkActions={rows=><Disclosure title="Bulk module access controls" className="min-w-0">
    <div className="min-w-0 pt-3"><SuperAdminStudentBulkAccess collegeId={context.adminScope?.collegeId??""} learners={rows.map(row=>({id:row.id,name:row.title}))}/></div>
   </Disclosure>}
  renderRowActions={row=><div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-start [&>div]:w-full sm:[&>div]:w-auto">
    <ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status}/>
    {peopleFilters?<><CollegePersonEditAction membershipId={row.id} kind="LEARNER"/><StudentClassMoveAction membershipId={row.id} name={row.title}/></>:null}
    <CollegePersonAuditModal membershipId={row.id} name={row.title} kind="LEARNER"/>
    <CollegePersonProfileOverviewModal membershipId={row.id} name={row.title} kind="LEARNER"/>
    {row.details.some(detail=>detail.startsWith("Mobile: ")&&
       detail.slice("Mobile: ".length).trim()!=="—"&&
       detail.slice("Mobile: ".length).trim().length>0)?
      <ButtonLink variant="secondary" href="/admin/otp-lockout"
       aria-label={"Clear OTP lockout for "+row.title+" using verified mobile number"}>
       <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>
       </svg>
       Clear OTP lockout
      </ButtonLink>:null}
   </div>} loader={query=>listAdminScopedPeople(context,"LEARNER",query)}/></div>;
}
