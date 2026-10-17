import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import {getCurrentRequestContext} from "@/auth/request-context";
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
 if(!context.adminScope?.collegeId)return <div className="space-y-5">
  <PageHeader title="Semester–Course Mapping" />
  <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its semester-course mapping." />
 </div>;
 const curriculum=await listCollegeTermMappings(context);
 return <div className="space-y-6">
      <AcademicSetupSteps step={4} />
 {curriculum?<CollegeTermMappingManager data={curriculum}/>:null}
 <AdminScopedReadPage title="Semester–Course Mapping" path="/admin/semester-courses" statuses={statuses}
  exportPath="/api/admin/semester-courses/export" exportFilename="super-admin-semester-courses-ist.csv"
  description="Registered semester curriculum, course credits and order in your selected college."
  searchParams={searchParams} loader={query=>listAdminTermCourseMappings(context,query)}/>
 </div>;
}
