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
  exportPath="/api/admin/faculty-assignment/export" exportFilename="super-admin-faculty-assignment-ist.csv"
  description="Read-only teaching history joined to the exact selected college for course, class and faculty membership."
  searchParams={searchParams} loader={query=>listAdminFacultyAssignments(context,query)}/>;
}
