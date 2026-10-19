import { gridExportFilename } from "@/modules/placements/grid-export-filename";
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
  // Export the authorized filtered view, not an arbitrary visible pagination page.
  // The explicit ceiling protects an interactive worker from unbounded queries.
  const cap=5000;
  const exportQuery={...query,page:1,pageSize:100};
  const first=await getTpoGlobalRequestsInbox(context,exportQuery);
  const rows=[...first.requests];
  for(let page=2;page<=first.totalPages&&rows.length<cap;page++){
    const next=await getTpoGlobalRequestsInbox(context,{...exportQuery,page});
    if(next.requests.length===0)break;
    rows.push(...next.requests);
  }
  const truncated=first.total>rows.length;
  const csv=toTpoRequestsPageCsv(rows);
  return new Response("\uFEFF"+csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-requests", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Range":"filtered-authorized-view",
   "X-Export-Truncated":String(truncated),
   "X-Export-Row-Cap":String(cap),
   "Vary":"Cookie"
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
