import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportParams} from "@/modules/academics/college-directory-export-model";
import {exportCollegeAssessments} from "@/modules/courses/college-assessment-export-service";

export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=exportParams(new URL(request.url).searchParams);
  if(params===null)return Response.json({error:"Invalid export filters"},{status:400});
  const result=await exportCollegeAssessments(await getCurrentRequestContext(),"QUIZ",params);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-quizs.csv"',
   "Cache-Control":"private, no-store",
   "X-Export-Truncated":String(result.truncated),
   "X-Export-Row-Cap":String(result.cap),
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
