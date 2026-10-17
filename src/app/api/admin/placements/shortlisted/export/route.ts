import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listSuperAdminShortlisted} from "@/modules/admin-ui/super-admin-placement-shortlisted-service";
export const runtime="nodejs";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
export async function GET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"shortlisted.csv",statuses,loader:(context,query)=>listSuperAdminShortlisted(context,query),
 });
}
