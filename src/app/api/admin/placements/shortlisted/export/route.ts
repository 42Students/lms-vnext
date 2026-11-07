import {exportSuperAdminScopedDirectory} from "@/modules/admin-ui/super-admin-scoped-csv-service";
import {listSuperAdminShortlisted} from "@/modules/admin-ui/super-admin-placement-shortlisted-service";
import { route } from "@/security/route";
export const runtime="nodejs";
const statuses=["ALL","SUBMITTED","WITHDRAWN"] as const;
async function handleGET(request:Request){
 return exportSuperAdminScopedDirectory(request,{
  filename:"shortlisted.csv",statuses,loader:(context,query)=>listSuperAdminShortlisted(context,query),
 });
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
