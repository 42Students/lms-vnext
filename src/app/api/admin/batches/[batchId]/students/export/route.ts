import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getSuperAdminBatchRosterOverview} from "@/modules/admin-ui/super-admin-batch-roster-service";
import {superAdminBatchRosterCsv} from "@/modules/admin-ui/super-admin-batch-roster-export-model";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{batchId:string}>}){
 try{
  const {batchId}=await params;
  const data=await getSuperAdminBatchRosterOverview(await getCurrentRequestContext(),batchId);
  if(!data)return Response.json({error:"BATCH_NOT_FOUND"},{status:404});
  // Export the exact currently authorized cohort; no global student lookup.
  if(data.roster.length>10000)return Response.json({error:"BATCH_EXPORT_TOO_LARGE"},{status:413});
  const labels=new Map(data.classes.map(c=>[c.id,c.name]));
  return new Response(superAdminBatchRosterCsv(data.roster,labels),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="batch-students.csv"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
