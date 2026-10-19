import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoDriveOfferRegisterCsv } from "@/modules/placements/tpo-drive-offer-register-service";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{
 params:Promise<{jobId:string}>;
}){
 try{
  const {jobId}=await params;
  const url=new URL(request.url);
  // The path jobId is authoritative. A query parameter must never select a
  // different drive for an export than the page the TPO is reviewing.
  if(url.searchParams.has("jobId")||tpoReportHasRepeatedSearchParams(url.searchParams))
    return Response.json({
      error:"Invalid report filters. Clear the filters and try again.",
    },{
      status:400,headers:{
        "Cache-Control":"private, no-store, max-age=0",
        "X-Content-Type-Options":"nosniff",
        Vary:"Cookie",
      },
    });
  const result=await getTpoDriveOfferRegisterCsv(await getCurrentRequestContext(),
   {...Object.fromEntries(url.searchParams.entries()),jobId});
  return new Response("\uFEFF"+result.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-drive-offers", "csv") + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "Vary":"Cookie",
   "X-Export-Truncated":String(result.truncated),
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
