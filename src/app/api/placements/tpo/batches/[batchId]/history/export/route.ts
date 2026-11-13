import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoBatchHistory} from "@/modules/placements/tpo-batch-workspace-read-service";
import {batchHistoryViewSchema,filterTpoBatchHistoryKind,filterTpoBatchHistoryOutcome} from "@/modules/placements/tpo-batch-history-view-model";
import {serializeTpoCohortHistoryCsv} from "@/modules/placements/tpo-batch-history-csv-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(request:Request,{params}:{params:Promise<{batchId:string}>}){
 try{
  const {batchId}=await params;
  const input=Object.fromEntries(new URL(request.url).searchParams.entries());
  const filters=batchHistoryViewSchema.parse(input);
  const evidence=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
  if(!evidence.ready){
   return new Response("Decision-history storage unavailable",{status:503,headers:{"Cache-Control":CACHE.PRIVATE_STRICT}});
  }
  const rows=filterTpoBatchHistoryOutcome(filterTpoBatchHistoryKind(evidence.events,filters.kind),filters.after);
  return new Response("\uFEFF"+serializeTpoCohortHistoryCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-batch-decision-history", "csv") + '"',
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "X-Content-Type-Options":"nosniff",
   "X-Export-Scope":"latest-100-batch-class-learner-events",
   "Vary":"Cookie"
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
