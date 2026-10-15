import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {AuthorizationError} from "@/modules/permissions/policy";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoGlobalRequestsInbox} from "@/modules/placements/tpo-global-requests-service";
import {globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-model";
import {toTpoRequestsPageCsv} from "@/modules/placements/tpo-requests-page-csv-model";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try {
  const context=await getCurrentRequestContext();
  if(!context.membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
  const query=globalTpoRequestsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  const data=await getTpoGlobalRequestsInbox(context,query);
  const csv=toTpoRequestsPageCsv(data.requests);
  return new Response("\uFEFF"+csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="tpo-requests-page.csv"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Range":"current-page-only",
   "Vary":"Cookie"
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
