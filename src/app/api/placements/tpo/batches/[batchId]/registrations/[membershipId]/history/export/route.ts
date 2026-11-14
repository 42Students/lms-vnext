import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoLearnerRegistrationHistory} from "@/modules/placements/tpo-learner-registration-history-service";
import {tpoRegistrationHistoryQuery,filterTpoRegistrationEvents} from "@/modules/placements/tpo-registration-history-filter-model";
import {serializeTpoRegistrationEventHistoryCsv} from "@/modules/placements/tpo-registration-event-history-csv-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(request:Request,{params}:{params:Promise<{batchId:string;membershipId:string}>}){
 try{
  const {batchId,membershipId}=await params;
  const query=new URL(request.url).searchParams;
  const filters=tpoRegistrationHistoryQuery.parse({source:query.get("source")??undefined,event:query.get("event")??undefined});
  const evidence=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
  if(!evidence.ready)return new Response("Registration event history unavailable",{status:503,headers:{"Cache-Control":CACHE.PRIVATE_STRICT}});
  const rows=filterTpoRegistrationEvents(evidence.events,filters);
  return new Response("\uFEFF"+serializeTpoRegistrationEventHistoryCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader(gridExportFilename("tpo-registration-event-history", "csv")),
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "X-Content-Type-Options":"nosniff",
   "X-Export-Scope":"current-learner-latest-100-events",
   "X-Export-Truncated":evidence.truncated?"true":"false",
   "Vary":"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
export const GET = route(
  { auth: "user", permission: "placements.manage", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
