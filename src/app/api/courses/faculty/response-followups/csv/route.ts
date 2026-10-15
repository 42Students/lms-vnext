import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseFacultyFollowUpSearchParams} from "@/modules/courses/faculty-response-followup-model";
import {getFacultyResponseFollowUps} from "@/modules/courses/faculty-response-followup-service";
import {facultyFollowUpPageCsv} from "@/modules/courses/faculty-followup-export";
export const runtime="nodejs";
export async function GET(request:Request){
 const raw:Record<string,string|string[]>={};
 for(const [key,value] of new URL(request.url).searchParams){
  const existing=raw[key];
  raw[key]=existing===undefined?value:Array.isArray(existing)?[...existing,value]:[existing,value];
 }
 const parsed=parseFacultyFollowUpSearchParams(raw);
 if(!parsed.success)return Response.json({error:"INVALID_FOLLOWUP_FILTERS"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const data=await getFacultyResponseFollowUps(context,parsed.data);
  return new Response(facultyFollowUpPageCsv(data.items),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="faculty-response-followups-page.csv"',
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
