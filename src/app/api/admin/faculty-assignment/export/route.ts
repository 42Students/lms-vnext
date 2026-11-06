import {exportSuperAdminFacultyAssignments} from "@/modules/admin-ui/super-admin-faculty-assignments-csv-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(request:Request){
 return exportSuperAdminFacultyAssignments(request);
}
export const GET = secured(handleGET);
