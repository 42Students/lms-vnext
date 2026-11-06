import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminScopedPeople} from "@/modules/admin-ui/super-admin-scoped-people-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
const statuses=["ALL","ACTIVE","SUSPENDED","ENDED"] as const;
async function handleGET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-students-ist.csv",statuses,
  loader:(context,query)=>listAdminScopedPeople(context,"LEARNER",query),
 });
}
export const GET = secured(handleGET);
