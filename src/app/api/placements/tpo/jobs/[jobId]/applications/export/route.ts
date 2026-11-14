import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoDriveApplicationsExport} from "@/modules/placements/tpo-drive-applications-export-service";
import {tpoDriveApplicationsExportQuerySchema} from "@/modules/placements/tpo-drive-applications-export-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  const filters=tpoDriveApplicationsExportQuerySchema.omit({jobId:true})
   .parse(Object.fromEntries(new URL(request.url).searchParams));
  const result=await getTpoDriveApplicationsExport(await getCurrentRequestContext(),{jobId,...filters},{exportAll:true});
  return new Response("\uFEFF"+result.csv,{status:200,headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader(gridExportFilename("tpo-drive-applications", "csv")),
   "Cache-Control":CACHE.PRIVATE_STRICT,
   "X-Content-Type-Options":"nosniff",Vary:"Cookie",
   "X-Export-Truncated":String(result.truncated),
  }});
 }catch(error){const response=apiErrorResponse(error);response.headers.set("Cache-Control","private, no-store, max-age=0");return response;}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
