import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";
import {CollegeTermMappingManager} from "@/components/academics/college-term-mapping-manager";
import {listCollegeTermMappings} from "@/modules/academics/college-term-mapping-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {Banner} from "@/components/ui/banner";
import {listAdminTermCourseMappings} from "@/modules/admin-ui/super-admin-term-mapping-service";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
export default async function SuperAdminSemesterCourseMappingPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))return <div className="min-w-0 space-y-5">
  <PageHeader title="Semester–Course Mapping"/>
  <ErrorState title="Semester mapping access denied"
   description="Your account cannot access Super Admin semester mappings."
   action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Back to dashboard</Link>}/>
 </div>;
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-5">
  <PageHeader title="Semester–Course Mapping" />
  <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its semester-course mapping." />
 </div>;
 // Editing options are optional to the separately authorized directory:
 // an editor outage must not suppress valid course-mapping results.
 const curriculumResult=await listCollegeTermMappings(context)
  .then(value=>({ok:true as const,value}))
  .catch(()=>({ok:false as const}));
 const curriculum=curriculumResult.ok?curriculumResult.value:null;
 return <div className="min-w-0 space-y-4 md:space-y-5">
 <AdminScopedReadPage
  intro={<section aria-label="Semester curriculum tools" className="min-w-0 space-y-3">
   <AcademicSetupSteps step={4} showRefresh={false}/>
   {!curriculumResult.ok?<Banner tone="warning">
    Semester mapping editor is temporarily unavailable. The directory remains accessible.
   </Banner>:null}
   {curriculum?<div aria-label="Manage semester course mappings" className="grid min-w-0 gap-4 border-b border-[var(--lms-canvas-border)] pb-5 lg:grid-cols-[minmax(0,10fr)_minmax(240px,4fr)]">
    <section className="min-w-0 space-y-3">
      <h2 className="text-base font-semibold text-[var(--lms-heading)]">Manage semester course mappings</h2>
      <CollegeTermMappingManager data={curriculum}/>
    </section>
    <aside className="min-w-0 space-y-3 border-t border-border pt-4 text-sm text-body lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
      <h3 className="font-semibold text-[var(--lms-heading)]">Mapping guide</h3>
      <p>Choose a program and semester, then review its mapped courses, credits and order before saving.</p>
      <p>The directory below is a separate read-only view of the current selected-college mappings.</p>
      <Link href="/admin/semesters" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">View semesters</Link>
    </aside>
   </div>:null}
  </section>}
  title="Semester–Course Mapping" path="/admin/semester-courses" statuses={statuses}
  exportPath="/api/admin/semester-courses/export" exportFilename="super-admin-semester-courses-ist.csv"
  description="Registered semester curriculum, course credits and order in your selected college."
  searchParams={searchParams} loader={query=>listAdminTermCourseMappings(context,query)}/>
 </div>;
}
