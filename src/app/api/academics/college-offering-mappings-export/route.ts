import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportCollegeOfferingMappings} from "@/modules/academics/college-mapping-export-service";
import {exportParams} from "@/modules/academics/college-mapping-export-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const q=exportParams(new URL(request.url).searchParams);
  const result=await exportCollegeOfferingMappings(await getCurrentRequestContext(),q);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-offering-mappings.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Truncated":String(result.truncated),
   "X-Export-Row-Cap":String(result.cap),
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
