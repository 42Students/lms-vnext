import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminBatches} from "@/modules/admin-ui/super-admin-batches-service";
export const runtime="nodejs";
const statuses=["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-batches-ist.csv",statuses,
  loader:(context,query)=>listAdminBatches(context,query),
 });
}
