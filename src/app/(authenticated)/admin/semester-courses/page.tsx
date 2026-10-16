import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeTermMappingManager} from "@/components/academics/college-term-mapping-manager";
import {listCollegeTermMappings} from "@/modules/academics/college-term-mapping-service";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminTermCourseMappings} from "@/modules/admin-ui/super-admin-term-mapping-service";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
export default async function SuperAdminSemesterCourseMappingPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const curriculum=context.adminScope?.collegeId?await listCollegeTermMappings(context):null;
 return <div className="space-y-6">
 {curriculum?<CollegeTermMappingManager data={curriculum}/>:null}
 <AdminScopedReadPage title="Semester–Course Mapping" path="/admin/semester-courses" statuses={statuses}
  exportPath="/api/admin/semester-courses/export" exportFilename="super-admin-semester-courses-ist.csv"
  description="Registered semester curriculum, course credits and order in your selected college."
  searchParams={searchParams} loader={query=>listAdminTermCourseMappings(context,query)}/>
 </div>;
}
