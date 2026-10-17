import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listCollegeAdminHistory} from "@/modules/colleges/admin-session-service";
import {collegeAdminHistoryCsv} from "@/modules/colleges/admin-history-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{collegeId:string;userId:string}>}){
 try{
  const {collegeId,userId}=await params;
  const data=await listCollegeAdminHistory(await getCurrentRequestContext(),collegeId,userId);
  return new Response(collegeAdminHistoryCsv(data.events),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-admin-history.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":data.truncated?"possibly":"false",
   Vary:"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
