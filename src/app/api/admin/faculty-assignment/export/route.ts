import {exportSuperAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-csv-service";
import { route } from "@/security/route";
export const runtime="nodejs";
async function handleGET(request:Request){
 return exportSuperAdminFacultyAssignments(request);
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
