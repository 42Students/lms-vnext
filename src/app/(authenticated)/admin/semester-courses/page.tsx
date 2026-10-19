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
   action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
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
 return <div className="min-w-0 space-y-6">
      <AcademicSetupSteps step={4} />
 {!curriculumResult.ok?<p role="status" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2 text-sm text-body">
  Semester mapping editor is temporarily unavailable. The directory remains accessible.
 </p>:null}
 {curriculum?<CollegeTermMappingManager data={curriculum}/>:null}
 <AdminScopedReadPage title="Semester–Course Mapping" path="/admin/semester-courses" statuses={statuses}
  exportPath="/api/admin/semester-courses/export" exportFilename="super-admin-semester-courses-ist.csv"
  description="Registered semester curriculum, course credits and order in your selected college."
  searchParams={searchParams} loader={query=>listAdminTermCourseMappings(context,query)}/>
 </div>;
}
