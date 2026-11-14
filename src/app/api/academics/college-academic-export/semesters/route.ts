import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportCollegeAcademicDirectory} from "@/modules/academics/college-academic-export-service";
import {exportParams} from "@/modules/academics/college-academic-export-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
async function handleGET(request:Request){
 try{
  const query=exportParams(new URL(request.url).searchParams);
  const result=await exportCollegeAcademicDirectory(await getCurrentRequestContext(),"SEMESTERS",query);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader("college-semesters.csv"),
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
