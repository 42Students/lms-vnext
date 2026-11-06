import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listSuperAdminShortlisted} from "@/modules/admin-ui/super-admin-placement-shortlisted-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
async function handleGET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"shortlisted.csv",statuses,loader:(context,query)=>listSuperAdminShortlisted(context,query),
 });
}
export const GET = secured(handleGET, { stepUp: true });
