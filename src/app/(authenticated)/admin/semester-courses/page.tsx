import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";
import {CollegeTermMappingManager} from "@/components/academics/college-term-mapping-manager";
import {listCollegeTermMappings} from "@/modules/academics/college-term-mapping-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {Banner} from "@/components/ui/banner";
import {listAdminTermCourseMappings} from "@/modules/admin-ui/super-admin-term-mapping-service";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
const legacySubtitle="Define the curriculum for each semester and spot courses that still need faculty coverage.";
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
  <PageHeader title="Semester–Course Mapping" description={legacySubtitle}/>
  <AcademicSetupSteps step={4} showRefresh={false}/>
  <Alert tone="warning">
   <div className="flex items-start gap-3">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v6m0 4h.01"/></svg>
    <p><strong>Select a college to manage Semester–Course Mapping.</strong> Choose an Organization + College in the header above.</p>
   </div>
  </Alert>
  <p className="text-sm text-body">The mapping editor is disabled until a college is selected.</p>
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
    <div className="flex flex-wrap items-center gap-3">
     <span>Semester mapping editor is temporarily unavailable. The directory remains accessible.</span>
     <Link href="/admin/semester-courses" className="font-semibold text-primary-text underline">Retry semester mappings</Link>
    </div>
   </Banner>:null}
   {curriculum?.lookupFailures.map(name=><Banner key={name} tone="warning">
    <div className="flex flex-wrap items-center gap-3">
     <span>Could not load {name}. Other semester mapping information remains available.</span>
     <Link href="/admin/semester-courses" className="font-semibold text-primary-text underline">Retry {name}</Link>
    </div>
   </Banner>)}
   {curriculum&&!curriculum.staffingAvailable?<Banner tone="warning">
    Faculty staffing coverage could not be loaded. Course mappings remain available.
    <Link href="/admin/semester-courses" className="ml-2 font-semibold text-primary-text underline">Retry staffing</Link>
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
  description={legacySubtitle}
  searchParams={searchParams} loader={query=>listAdminTermCourseMappings(context,query)}/>
 </div>;
}
