import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoLiveDriveDaySummary} from "@/modules/placements/tpo-live-drive-day-service";
import {tpoDriveDayIssueSchema,filterTpoDriveDayIssues} from "@/modules/placements/tpo-drive-day-issue-filter-model";
import {tpoDriveDaySortSchema,sortTpoDriveDayRows} from "@/modules/placements/tpo-drive-day-sort-model";
import {tpoLiveRoundSearchSchema,filterTpoLiveRoundSearch} from "@/modules/placements/tpo-live-round-search-model";
import {serializeTpoLiveDriveDayCsv} from "@/modules/placements/tpo-live-drive-day-csv-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const query=new URL(request.url).searchParams;
  const q=tpoLiveRoundSearchSchema.parse(query.get("q")??undefined);
  const issue=tpoDriveDayIssueSchema.parse(query.get("issue")??undefined);
  const sort=tpoDriveDaySortSchema.parse(query.get("sort")??undefined);
  const snapshot=await getTpoLiveDriveDaySummary(await getCurrentRequestContext());
  const rows=sortTpoDriveDayRows(filterTpoDriveDayIssues(filterTpoLiveRoundSearch(snapshot.rows,q),issue),sort);
  return new Response("\uFEFF"+serializeTpoLiveDriveDayCsv(rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-drive-day-live-snapshot", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Scope":"authorized-capped-live-round-snapshot",
   "X-Export-Truncated":snapshot.truncated?"true":"false",
   "Vary":"Cookie"
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
