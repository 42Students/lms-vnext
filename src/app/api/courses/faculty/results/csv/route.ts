import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseFacultyResultsSearchParams} from "@/modules/courses/faculty-results-model";
import {getFacultyAssessmentResults} from "@/modules/courses/faculty-results-service";
import {facultyResultsPageCsv} from "@/modules/courses/faculty-results-export";
export const runtime="nodejs";
export async function GET(request:Request){
 const url=new URL(request.url);
 const raw:Record<string,string|string[]>={};
 for(const [key,value] of url.searchParams){
  const prior=raw[key];
  raw[key]=prior===undefined?value:Array.isArray(prior)?[...prior,value]:[prior,value];
 }
 const parsed=parseFacultyResultsSearchParams(raw);
 if(!parsed.success)return Response.json({error:"INVALID_RESULTS_FILTERS"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const result=await getFacultyAssessmentResults(context,parsed.data);
  return new Response(facultyResultsPageCsv(result.items),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="faculty-assessment-results-page.csv"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
