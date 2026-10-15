import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
export const runtime="nodejs";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-faculty-ist.csv",statuses,
  loader:(context,query)=>listAdminScopedPeople(context,"FACULTY",query),
 });
}
