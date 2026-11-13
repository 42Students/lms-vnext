import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {BoundedFormDataError,readBoundedFormData} from "@/lib/bounded-form-data";
import {ROUND_IMPORT_TEMPLATE} from "@/modules/placements/tpo-round-import-model";
import {previewTpoRoundImport,stageTpoRoundImport} from "@/modules/placements/tpo-round-import-service";
import { route } from "@/security/route";
import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string;roundId:string}>};
async function handleGET(_request:Request){
 return new Response("\uFEFF"+ROUND_IMPORT_TEMPLATE,{headers:{
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="round-results-template.csv"',
  "Cache-Control":CACHE.PRIVATE,
 }});
}
export const GET = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);
async function handlePOST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {jobId,roundId}=await params;
  // Authenticate before allocating or parsing untrusted form bytes.
  const context=await getCurrentRequestContext();
  let form:FormData;
  try { form=await readBoundedFormData(request,4_000_000); }
  catch(error){
    if(!(error instanceof BoundedFormDataError))throw error;
    return NextResponse.json({
      error:error.code==="BODY_TOO_LARGE"?"IMPORT_TOO_LARGE":"INVALID_FORM",
    },{status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.PRIVATE}});
  }
  const file=form.get("file");
  if(!(file instanceof File)||file.size<=0||file.size>3_000_000)
   return NextResponse.json({error:"Use a CSV/XLSX file up to 3 MB"},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());
  const action=form.get("action");
  if(action==="STAGE_IMPORT"&&form.get("confirmed")!=="true")
   return NextResponse.json({error:"Confirm the reviewed import before staging."},{status:400});
  if(action==="STAGE_IMPORT"&&form.get("missingPolicy")==="MARK_NOT_CLEARED"&&
    form.get("confirmMissingFailure")!=="true")
   return NextResponse.json({error:"Review and confirm the learners missing from the file."},{status:400});
  const value=action==="PREVIEW"
   ?await previewTpoRoundImport(context,jobId,roundId,bytes,file.name)
   :action==="STAGE_IMPORT"
   ?await stageTpoRoundImport(context,jobId,roundId,bytes,file.name,{
     action:"STAGE_IMPORT",confirmed:form.get("confirmed")==="true",previewToken:form.get("previewToken"),
     missingPolicy:form.get("missingPolicy"),
     overrides:JSON.parse(String(form.get("overrides")??"[]")),
     skippedLines:JSON.parse(String(form.get("skippedLines")??"[]")),
   }):null;
  if(!value)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return privateJson(value);
 }catch(e){return apiErrorResponse(e);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced", stepUp: true },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
