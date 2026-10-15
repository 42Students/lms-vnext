import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminClasses} from "@/modules/admin-ui/super-admin-classes-service";
export const runtime="nodejs";
const statuses=["ALL","ACTIVE","ARCHIVED"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-classes-ist.csv",statuses,
  loader:(context,query)=>listAdminClasses(context,query),
 });
}
