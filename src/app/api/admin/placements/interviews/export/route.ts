import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {exportSuperAdminInterviewsCsv} from "@/modules/admin-ui/super-admin-placement-interviews-service";
import {superAdminReadQuerySchema} from "@/modules/admin-ui/super-admin-read-directory-model";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(request:Request){
 try{
  const params=Object.fromEntries(new URL(request.url).searchParams.entries());
  const query=superAdminReadQuerySchema.parse({
    q:params["q"],status:params["status"],jobId:params["jobId"],
  });
  const result=await exportSuperAdminInterviewsCsv(await getCurrentRequestContext(),query);
  return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":"attachment; filename=\"interviews.csv\"",
   "Cache-Control":CACHE.PRIVATE,
   "X-Content-Type-Options":"nosniff",
   "X-Export-Total":String(result.total),
   "X-Export-Truncated":String(result.truncated),
  }});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "placements.read", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
