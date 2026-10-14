import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportCollegeAcademicDirectory} from "@/modules/academics/college-academic-export-service";
import {exportParams} from "@/modules/academics/college-academic-export-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const query=exportParams(new URL(request.url).searchParams);
  const result=await exportCollegeAcademicDirectory(await getCurrentRequestContext(),"BATCHES",query);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-batches.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Truncated":String(result.truncated),
   "X-Export-Row-Cap":String(result.cap),
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
