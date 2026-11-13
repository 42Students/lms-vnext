import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportParams} from "@/modules/academics/college-directory-export-model";
import {exportCollegeAssessments} from "@/modules/courses/college-assessment-export-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
async function handleGET(request:Request){
 try{
  const params=exportParams(new URL(request.url).searchParams);
  if(params===null)return Response.json({error:"Invalid export filters"},{status:400});
  const result=await exportCollegeAssessments(await getCurrentRequestContext(),"ASSIGNMENT",params);
  const filename=result.exportMode==="PAGE"?
   "assignments-college-"+result.collegeId+"-page-"+result.page+".csv":
   "college-assignments.csv";
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="'+filename+'"',
   "Cache-Control":CACHE.PRIVATE,
   "X-Export-Truncated":String(result.truncated),
   "X-Export-Row-Cap":String(result.cap),
   "X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
