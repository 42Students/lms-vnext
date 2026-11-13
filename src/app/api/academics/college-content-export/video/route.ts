import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportCollegeContentMetadata} from "@/modules/courses/college-content-export-service";
import {exportParams} from "@/modules/courses/college-content-export-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
async function handleGET(request:Request){
 try{
  const q=exportParams(new URL(request.url).searchParams);
  const result=await exportCollegeContentMetadata(await getCurrentRequestContext(),"VIDEO",q);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="college-videos.csv"',
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
