import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminTermCourseMappings} from "@/modules/admin-ui/super-admin-term-mapping-service";
export const runtime="nodejs";
const statuses=["ALL","ACTIVE","INACTIVE"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-semester-courses-ist.csv",statuses,
  loader:(context,query)=>listAdminTermCourseMappings(context,query),
 });
}
