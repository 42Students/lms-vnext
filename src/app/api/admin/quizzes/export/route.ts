import {exportSuperAdminLearningDirectory} from "@/modules/admin-ui/super-admin-learning-csv-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(request:Request){return exportSuperAdminLearningDirectory(request,"QUIZ");}
export const GET = secured(handleGET);
