import { gridExportFilename } from "@/modules/placements/grid-export-filename";

import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoRecruiterAccessQuerySchema} from "@/modules/placements/tpo-recruiter-access-model";
import {listTpoRecruiterAccess} from "@/modules/placements/tpo-recruiter-access-service";
import {tpoRecruiterGrantCsv,tpoRecruiterGrantXlsx} from "@/modules/placements/tpo-recruiter-grant-export-model";
import { route } from "@/security/route";
import { CACHE, privateJson } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
export const runtime="nodejs";
export const dynamic="force-dynamic";

async function handleGET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  // Do not silently choose the first value of conflicting filters or
  // accept an arbitrary scope, identity or page-size override on exports.
  const allowed=new Set(["status","q","format"]);
  if([...params.keys()].some(key=>!allowed.has(key)||params.getAll(key).length!==1))
   return privateJson({error:"INVALID_REQUEST"}, { status: 400 });
  const format=params.get("format")??"csv";
  if(format!=="csv"&&format!=="xlsx")
   return privateJson({error:"INVALID_REQUEST"}, { status: 400 });
  const query=tpoRecruiterAccessQuerySchema.parse({
   status:params.get("status")??"ALL",q:params.get("q")??"",page:1,
  });
  const result=await listTpoRecruiterAccess(await getCurrentRequestContext(),query,{exportAll:true});
  const headers={"Cache-Control":CACHE.PRIVATE,"X-Content-Type-Options":"nosniff"};
  if(format==="xlsx")
   return new Response(tpoRecruiterGrantXlsx(result.items,result.truncated),{
    headers:{...headers,"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
     "Content-Disposition":attachmentHeader(gridExportFilename("recruiters", "xlsx"))},
   });
  return new Response("\uFEFF"+tpoRecruiterGrantCsv(result.items,result.truncated),{
   headers:{...headers,"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":attachmentHeader(gridExportFilename("recruiters", "csv"))},
  });
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
