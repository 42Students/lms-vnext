import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {writeHrInterviewSlot} from "@/modules/placements/hr-interview-slot-service";
import {parseIstLocalSlot} from "@/modules/placements/hr-interview-slot-model";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_FORM"},{status:400});
 const {jobId}=await params;
 const action=form.get("action");
 try{
  const input=action==="CREATE"?{
   action,roundId:form.get("roundId"),
   startAt:parseIstLocalSlot(form.get("startAt")),
   endAt:parseIstLocalSlot(form.get("endAt")),
   timezone:"Asia/Kolkata",mode:form.get("mode"),
   panelLabel:form.get("panelLabel")||undefined,
   meetingLocation:form.get("meetingLocation")||undefined,
   capacity:form.get("capacity"),
  }:{
   action,slotId:form.get("slotId"),expectedVersion:form.get("expectedVersion"),
  };
  await writeHrInterviewSlot(await getCurrentRequestContext(),jobId,input);
  return NextResponse.redirect(new URL("/recruiter/drives/"+jobId+"/interview-slots",request.url),303);
 }catch(error){
  if(error instanceof PlacementsServiceError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_SLOT"},{status:400});
  if(error instanceof Error && error.message==="INTERVIEW_SLOTS_NOT_REGISTERED")
   return NextResponse.json({error:"SLOT_STORAGE_NOT_REGISTERED"},{status:503});
  if(error instanceof Error && ["SLOT_STALE","SLOT_FULL","SLOT_OVERLAP"].includes(error.message))
   return NextResponse.json({error:error.message},{status:409});
  if(error instanceof Error && error.message==="INVALID_IST_DATE")
   return NextResponse.json({error:"INVALID_SLOT_DATE"},{status:400});
  throw error;
 }
}
