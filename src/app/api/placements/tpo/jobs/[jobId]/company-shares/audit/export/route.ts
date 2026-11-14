import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoCompanyShareAudit} from "@/modules/placements/company-share/manage-service";
import {tpoCompanyShareAuditCsv} from "@/modules/placements/company-share/audit-csv-model";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  const result=await listTpoCompanyShareAudit(await getCurrentRequestContext(),jobId,new URL(request.url).searchParams.get("kind")??"ALL",1,{exportAll:true});
  if(!result.ready)return new Response("Audit migration pending",{
   status:503,headers:{"Cache-Control":CACHE.PRIVATE},
  });
  return new Response("\uFEFF"+tpoCompanyShareAuditCsv(result.entries,result.limited),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":attachmentHeader(gridExportFilename("company-share-access-audit", "csv")),
    "Cache-Control":CACHE.PRIVATE,"X-Content-Type-Options":"nosniff"},
  });
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
