import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-service";
export const runtime="nodejs";
const statuses=["ALL","ACTIVE","ENDED"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-faculty-assignment-ist.csv",statuses,
  loader:(context,query)=>listAdminFacultyAssignments(context,query),
 });
}
