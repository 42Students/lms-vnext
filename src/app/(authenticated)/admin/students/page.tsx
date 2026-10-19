import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {formatSuperAdminImportWhen} from "@/modules/admin-ui/super-admin-import-date-model";
import {ScopedMembershipLifecycleActions} from "@/components/admin/scoped-membership-lifecycle-actions";
import {CollegePersonEditAction} from "@/components/college/college-person-edit-action";
import {StudentClassMoveAction} from "@/components/college/student-class-move-action";
import {SuperAdminStudentBulkAccess} from "@/components/admin/super-admin-student-bulk-access";
import Link from "next/link";
import {CollegeStudentRegisterForm} from "@/components/college/college-student-register-form";
import {CollegeStudentCsvImport} from "@/components/college/college-student-csv-import";
import {SuperAdminStudentImportHistory} from "@/components/admin/super-admin-student-import-history";
import {listSuperAdminStudentCsvImportHistory} from "@/modules/people/college-student-csv-service";
import {getSuperAdminStudentRegisterOptions} from "@/modules/admin-ui/super-admin-student-register-options-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {ErrorState} from "@/components/ui/error-state";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
import {getSuperAdminPeopleFilterOptions} from "@/modules/admin-ui/super-admin-people-filter-options";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export default async function SuperAdminStudentsPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin" title="Students"/>
  <ErrorState title="Student access denied"
   description="Your account cannot access Super Admin student records."
   action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
 </div>;
 let peopleFilters:Awaited<ReturnType<typeof getSuperAdminPeopleFilterOptions>>|null=null;
 let choices:Awaited<ReturnType<typeof getSuperAdminStudentRegisterOptions>>|null=null;
 let importHistory:Awaited<ReturnType<typeof listSuperAdminStudentCsvImportHistory>>=[];
 if(context.adminScope?.collegeId){
  try{
   // Never display registration or bulk-import actions with partially loaded
   // college-scoped choices. A failed history or roster policy read is not an
   // empty authorized register.
   [peopleFilters,choices,importHistory]=await Promise.all([
    getSuperAdminPeopleFilterOptions(context),
    getSuperAdminStudentRegisterOptions(context),
    listSuperAdminStudentCsvImportHistory(context),
   ]);
  }catch{
   return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin" title="Students"/>
    <ErrorState title="Student register unavailable"
     description="The selected college's student registration and import details could not be verified. No registration actions are available until the read succeeds."
     action={<Link href="/admin/students" className="font-semibold text-primary-text">Retry student register</Link>}/>
   </div>;
  }
 }
 const importRuns=importHistory.map(run=>{
   const meta=run.metadata;
   const count=(value:unknown)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:0;
   return {
     when:formatSuperAdminImportWhen(run.occurredAt),
     students:count(meta.count),created:count(meta.created),failed:count(meta.failed),
   };
 });
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Super Admin" title="Students"
   description="Manage student identity, academic placement and account access from one roster."
   actions={context.adminScope?.collegeId?<div className="flex flex-wrap items-center justify-end gap-2">
    <a href="#register-student" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:min-h-9">Register New Student ↓</a>
    <Link href="/admin/people" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
      Manage memberships, profiles and account status →
    </Link>
   </div>:undefined}/>
  {choices?<section id="register-student" aria-labelledby="register-student-heading" className="min-w-0 scroll-mt-24 space-y-2"><h2 id="register-student-heading" className="text-lg font-semibold">Register New Student</h2><CollegeStudentRegisterForm choices={choices}/></section>:null}
  {choices?<section aria-labelledby="bulk-register-students-heading" className="min-w-0 space-y-3 border-b border-border pb-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="bulk-register-students-heading" className="text-lg font-semibold">Bulk Register Students</h2>
      <SuperAdminStudentImportHistory runs={importRuns}/>
    </div>
    <p className="text-sm text-body">Validate a selected Program, Batch and Class roster before creating students. Imports can&apos;t be undone in one step, to protect students&apos; work. Correct or suspend individual accounts instead.</p>
    <CollegeStudentCsvImport choices={choices}/>
  </section>:null}
  <AdminScopedReadPage headingMode="section" peopleFilters={peopleFilters?{...peopleFilters,kind:"LEARNER"}:undefined} title="Registered Students" path="/admin/students" statuses={statuses}
  exportPath="/api/admin/students/export" exportFilename="super-admin-students-ist.csv"
  description="Manage student identity, academic placement and account access from one roster. Bulk registration and high-impact access changes stay explicit and reviewable."
  searchParams={searchParams}
  renderBulkActions={rows=><SuperAdminStudentBulkAccess learners={rows.map(row=>({id:row.id,name:row.title}))}/>}
  renderRowActions={row=><div className="flex flex-wrap items-start gap-3"><ScopedMembershipLifecycleActions membershipId={row.id} displayName={row.title} status={row.status}/>{peopleFilters?<><CollegePersonEditAction membershipId={row.id} kind="LEARNER"/><StudentClassMoveAction membershipId={row.id} name={row.title}/></>:null}</div>} loader={query=>listAdminScopedPeople(context,"LEARNER",query)}/></div>;
}
