import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminPlacementApplications} from "@/modules/admin-ui/super-admin-placement-applications-service";
export const runtime="nodejs";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-placement-applications-ist.csv",statuses,
  loader:(context,query)=>listAdminPlacementApplications(context,query),
 });
}
