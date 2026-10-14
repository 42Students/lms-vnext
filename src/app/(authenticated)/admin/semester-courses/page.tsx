import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminTermCourseMappings} from "@/modules/admin-ui/super-admin-term-mapping-service";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
export default async function SuperAdminSemesterCourseMappingPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Semester–Course Mapping" path="/admin/semester-courses" statuses={statuses}
  description="Read-only registered program-term course mappings. Offering and timetable state are separate; no mapping edits here."
  searchParams={searchParams} loader={query=>listAdminTermCourseMappings(context,query)}/>;
}
