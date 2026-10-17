import {exportSuperAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-csv-service";
export const runtime="nodejs";
export async function GET(request:Request){
 return exportSuperAdminFacultyAssignments(request);
}
