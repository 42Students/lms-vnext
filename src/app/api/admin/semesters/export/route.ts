import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminSemesters} from "@/modules/admin-ui/super-admin-semesters-service";
export const runtime="nodejs";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-semesters-ist.csv",statuses,
  loader:(context,query)=>listAdminSemesters(context,query),
 });
}
