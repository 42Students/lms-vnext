import {exportSuperAdminLearningDirectory} from "@/modules/admin-ui/super-admin-learning-csv-service";
export const runtime="nodejs";
export async function GET(request:Request){return exportSuperAdminLearningDirectory(request,"PROGRESS");}
