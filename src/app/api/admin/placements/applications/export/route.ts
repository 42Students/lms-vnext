import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listAdminPlacementApplications} from "@/modules/admin-ui/super-admin-placement-applications-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
// Legacy POST /refresh rebuilt a cached global search index. The vNext export
// and application directory query tenant-scoped PostgreSQL directly: there is
// no search index to refresh and no global cache invalidation capability to
// expose to a Super Admin. Every GET reads the current committed rows.
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
async function handleGET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"super-admin-placement-applications-ist.csv",statuses,
  loader:(context,query)=>listAdminPlacementApplications(context,query),
 });
}
export const GET = secured(handleGET);
