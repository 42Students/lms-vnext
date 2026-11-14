import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoDriveOfferRegisterCsv } from "@/modules/placements/tpo-drive-offer-register-service";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(request:Request,{params}:{
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
        "Cache-Control":CACHE.PRIVATE_STRICT,
        "X-Content-Type-Options":"nosniff",
        Vary:"Cookie",
      },
    });
  const result=await getTpoDriveOfferRegisterCsv(await getCurrentRequestContext(),
   {...Object.fromEntries(url.searchParams.entries()),jobId});
  return new Response("\uFEFF"+result.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader(gridExportFilename("tpo-drive-offers", "csv")),
   "Cache-Control":CACHE.PRIVATE_STRICT,
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
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
