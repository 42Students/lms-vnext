import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoBatchStudents } from "@/modules/placements/tpo-batch-workspace-read-service";
import { exportTpoBatchStudentsCsv } from "@/modules/placements/tpo-batch-students-export-model";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const pageSchema = z.coerce.number().int().min(1).max(100000).default(1);
/** Exports exactly one 25-person page; URL cannot override tenant or batch. */
export async function GET(request:Request,{params}:{params:Promise<{batchId:string}>}){
 try {
  const {batchId}=await params;
  const url=new URL(request.url);
  const page=pageSchema.parse(url.searchParams.get("page")??1);
  const data=await getTpoBatchStudents(await getCurrentRequestContext(),batchId,page);
  const csv=exportTpoBatchStudentsCsv(data.students);
  return new Response("\uFEFF"+csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-batch-students-page", "csv") + '"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "X-TPO-Export-Scope":"CURRENT_PAGE_ONLY",Vary:"Cookie",
  }});
 }catch(error){return apiErrorResponse(error);}
}
