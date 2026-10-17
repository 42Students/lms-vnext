import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminFacultyAssignments,getSuperAdminFacultyAssignmentClasses} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
const statuses=["ALL","ACTIVE","ENDED"] as const;
export default async function SuperAdminFacultyAssignmentPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const classes=context.adminScope?.collegeId?await getSuperAdminFacultyAssignmentClasses(context):[];
 return <AdminScopedReadPage classOptions={classes} title="Faculty Assignment" path="/admin/faculty-assignment" statuses={statuses}
  exportPath="/api/admin/faculty-assignment/export" exportFilename="faculty-assignments.csv"
  description="Read-only teaching history for the selected college. Export includes Faculty, Course, Class, Semester, Year, Role and Active columns."
  searchParams={searchParams} loader={query=>listAdminFacultyAssignments(context,query)}/>;
}
