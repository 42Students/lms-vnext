import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoBatchStudents} from "@/modules/placements/tpo-batch-workspace-read-service";
import {buildTpoEligibilityImportScaffold} from "@/modules/placements/tpo-eligibility-import-scaffold-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const pageSchema=z.coerce.number().int().min(1).max(100000).default(1);
export async function GET(request:Request,{params}:{params:Promise<{batchId:string}>}){
 try{
  const {batchId}=await params;
  const query=new URL(request.url).searchParams;
  const page=pageSchema.parse(query.get("page")??undefined);
  const result=await getTpoBatchStudents(await getCurrentRequestContext(),batchId,page);
  const csv=buildTpoEligibilityImportScaffold(result.students);
  return new Response("\uFEFF"+csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-batch-eligibility-scaffold.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Scope":"current-page-only",
   "Vary":"Cookie",
  }});
 }catch(error){const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store, max-age=0");return response;}
}
