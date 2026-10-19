import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoCompanyShareAudit} from "@/modules/placements/company-share/manage-service";
import {tpoCompanyShareAuditCsv} from "@/modules/placements/company-share/audit-csv-model";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  const result=await listTpoCompanyShareAudit(await getCurrentRequestContext(),jobId,new URL(request.url).searchParams.get("kind")??"ALL",1,{exportAll:true});
  if(!result.ready)return new Response("Audit migration pending",{
   status:503,headers:{"Cache-Control":"private, no-store"},
  });
  return new Response("\uFEFF"+tpoCompanyShareAuditCsv(result.entries,result.limited),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="' + gridExportFilename("company-share-access-audit", "csv") + '"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"},
  });
 }catch(error){return apiErrorResponse(error);}
}
