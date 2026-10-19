import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoBatchRegistrationRoster} from "@/modules/placements/tpo-batch-registration-roster-service";
import {exportTpoBatchRegistrationsCsv} from "@/modules/placements/tpo-batch-registration-export-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Same filters and 25-row pagination as UI. No export of consent metadata. */
export async function GET(request:Request,{params}:{params:Promise<{batchId:string}>}){
 try{
  const {batchId}=await params;
  const q=new URL(request.url).searchParams;
  const data=await listTpoBatchRegistrationRoster(await getCurrentRequestContext(),batchId,{
   q:q.get("q")??undefined,choice:q.get("choice")??undefined,source:q.get("source")??undefined,recency:q.get("recency")??undefined,order:q.get("order")??undefined,pageSize:q.get("pageSize")??undefined,page:q.get("page")??undefined,
  });
  if(!data.ready)return NextResponse.json({error:"REGISTRATION_DATA_UNAVAILABLE"},{status:503});
  const csv=exportTpoBatchRegistrationsCsv(data.items);
  return new Response("\uFEFF"+csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-batch-registration-page", "csv") + '"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "X-TPO-Export-Scope":"CURRENT_PAGE_ONLY",Vary:"Cookie",
  }});
 }catch(error){return apiErrorResponse(error);}
}
