import {getCurrentRequestContext} from "@/auth/request-context";
import {AdminScopedReadPage} from "@/components/admin/admin-scoped-read-page";
import {listAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
const statuses=["ALL","ACTIVE","ENDED"] as const;
export default async function SuperAdminFacultyAssignmentPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 return <AdminScopedReadPage title="Faculty Assignment" path="/admin/faculty-assignment" statuses={statuses}
  description="Read-only teaching history joined to the exact selected college for course, class and faculty membership."
  searchParams={searchParams} loader={query=>listAdminFacultyAssignments(context,query)}/>;
}
