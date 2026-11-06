import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {BoundedFormDataError,readBoundedFormData} from "@/lib/bounded-form-data";
import {recordOutsideDrive} from "@/modules/placements/recorded-outside-service";
import {parseIstLocalSlot} from "@/modules/placements/hr-interview-slot-model";
import {PlacementsServiceError} from "@/modules/placements/errors";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  // Authenticate first, then enforce the actual stream budget. Preserve
  // urlencoded HTML form support as well as multipart submissions.
  const context=await getCurrentRequestContext();
  let form:FormData;
  try {form=await readBoundedFormData(request,64*1024);}
  catch(error){
   if(!(error instanceof BoundedFormDataError))throw error;
   return NextResponse.json({
    error:error.code==="BODY_TOO_LARGE"?"FORM_TOO_LARGE":"INVALID_FORM",
   },{status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"}});
  }
  const payload={
   collegeId:form.get("collegeId"),
   companyRelationshipId:form.get("companyRelationshipId"),
   title:form.get("title"),occurredAt:parseIstLocalSlot(form.get("occurredAt")),
   externalReferenceUrl:form.get("externalReferenceUrl")||undefined,
   notes:form.get("notes")||undefined,
  };
  const saved=await recordOutsideDrive(context,payload);
  return NextResponse.redirect(new URL(saved.role==="TPO"
   ? "/tpo/placements/recorded-outside?saved="+saved.id
   : "/hr/drives/recorded-outside?collegeId="+saved.collegeId+"&saved="+saved.id,request.url),303);
 }catch(error){
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_RECORD"},{status:400});
  if(error instanceof PlacementsServiceError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  throw error;
 }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
