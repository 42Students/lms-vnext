import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoBatchStudentRegistrations} from "@/modules/placements/tpo-batch-student-registration-service";
import {parseBatchStudentSearchParams} from "@/modules/placements/tpo-batch-student-view-model";
import {selectTpoBatchStudentView} from "@/modules/placements/tpo-batch-student-selection-model";
import {serializeTpoBatchStudentViewCsv} from "@/modules/placements/tpo-batch-student-filtered-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export async function GET(request:Request,{params}:{params:Promise<{batchId:string}>}){
 try{
  const {batchId}=await params;
  const raw=Object.fromEntries(new URL(request.url).searchParams.entries());
  const page=pageSchema.parse(raw.page??undefined);
  const view=parseBatchStudentSearchParams(raw);
  if(!view.success)throw new Error("Invalid batch student filters");
  const records=await getTpoBatchStudentRegistrations(await getCurrentRequestContext(),batchId,page);
  const chosen=selectTpoBatchStudentView(records.students,view.data,records.registrationAvailable);
  return new Response("\uFEFF"+serializeTpoBatchStudentViewCsv(chosen),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-batch-students-filtered-page.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Scope":"authorized-current-page-only",
   "Vary":"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
