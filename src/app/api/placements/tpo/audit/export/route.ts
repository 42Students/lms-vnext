import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoAuditCsv} from "@/modules/placements/tpo-audit-csv-model";
import {getTpoAuditLog,tpoAuditQuerySchema,type TpoAuditRow} from "@/modules/placements/tpo-audit-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Page through the actual college-scoped union, never export unfiltered raw history. */
export async function GET(request:Request){
 try{
  const raw=Object.fromEntries(new URL(request.url).searchParams.entries());
  delete raw.page;delete raw.pageSize;
  const filters=tpoAuditQuerySchema.parse({...raw,page:1,pageSize:100});
  const context=await getCurrentRequestContext();
  const items:TpoAuditRow[]=[];
  let total=0;
  // Legacy bounded export supports up to 5,000 events for a chosen range.
  // Keep the college-scoped union and explicit bounded paging.
  for(let page=1;page<=50;page++){
   const result=await getTpoAuditLog(context,{...filters,page,pageSize:100});
   total=result.summary.total;
   items.push(...result.items);
   if(items.length>=total||result.items.length===0)break;
  }
  return new Response("\uFEFF"+tpoAuditCsv(items),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("audit-log", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":items.length<total?"true":"false",
   "X-Export-Total":String(total),
   "X-Export-Row-Limit":"5000",
   Vary:"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
