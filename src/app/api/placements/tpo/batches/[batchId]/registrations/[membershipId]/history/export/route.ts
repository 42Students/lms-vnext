import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoLearnerRegistrationHistory} from "@/modules/placements/tpo-learner-registration-history-service";
import {tpoRegistrationHistoryQuery,filterTpoRegistrationEvents} from "@/modules/placements/tpo-registration-history-filter-model";
import {serializeTpoRegistrationEventHistoryCsv} from "@/modules/placements/tpo-registration-event-history-csv-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{batchId:string;membershipId:string}>}){
 try{
  const {batchId,membershipId}=await params;
  const query=new URL(request.url).searchParams;
  const filters=tpoRegistrationHistoryQuery.parse({source:query.get("source")??undefined,event:query.get("event")??undefined});
  const evidence=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
  if(!evidence.ready)return new Response("Registration event history unavailable",{status:503,headers:{"Cache-Control":"private, no-store, max-age=0"}});
  const rows=filterTpoRegistrationEvents(evidence.events,filters);
  return new Response("\uFEFF"+serializeTpoRegistrationEventHistoryCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-registration-event-history", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
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
