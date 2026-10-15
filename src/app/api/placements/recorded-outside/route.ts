import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {recordOutsideDrive} from "@/modules/placements/recorded-outside-service";
import {parseIstLocalSlot} from "@/modules/placements/hr-interview-slot-model";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_FORM"},{status:400});
 const payload={
  collegeId:form.get("collegeId"),
  companyRelationshipId:form.get("companyRelationshipId"),
  title:form.get("title"),occurredAt:parseIstLocalSlot(form.get("occurredAt")),
  externalReferenceUrl:form.get("externalReferenceUrl")||undefined,
  notes:form.get("notes")||undefined,
 };
 try{
  const saved=await recordOutsideDrive(await getCurrentRequestContext(),payload);
  return NextResponse.redirect(new URL((saved.role==="TPO"?"/tpo/placements/recorded-outside":"/hr/drives/recorded-outside")+"?saved="+saved.id,request.url),303);
 }catch(error){
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_RECORD"},{status:400});
  if(error instanceof PlacementsServiceError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="RECORDED_OUTSIDE_NOT_REGISTERED")
   return NextResponse.json({error:"EXTERNAL_RECORD_STORAGE_PENDING"},{status:503});
  throw error;
 }
}
