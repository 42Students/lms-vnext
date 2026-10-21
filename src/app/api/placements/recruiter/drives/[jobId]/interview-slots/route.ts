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
 const {jobId}=await params;
 const json=request.headers.get("content-type")?.toLowerCase().includes("application/json")??false;
 const data:unknown=json?await request.json().catch(()=>null):await request.formData().catch(()=>null);
 if(!data)return NextResponse.json({error:"INVALID_FORM"},{status:400});
 try{
  // Both the old recruiter JSON DTO and the in-page form resolve to the same
  // validated write service. Datetime-local fields have an explicit IST
  // conversion; offset-bearing JSON instants already identify their zone.
  const field=(name:string):unknown=>data instanceof FormData?data.get(name):
   typeof data==="object"&&data!==null&&name in data?
    (data as Record<string,unknown>)[name]:undefined;
  const action=z.enum(["CREATE","OFFER","BOOK","CANCEL"]).parse(field("action"));
  const input=action==="CREATE"?{
   action,roundId:field("roundId"),
   startAt:json?field("startAt"):parseIstLocalSlot(field("startAt")),
   endAt:json?field("endAt"):parseIstLocalSlot(field("endAt")),
   timezone:"Asia/Kolkata" as const,mode:field("mode"),
   panelLabel:field("panelLabel")||undefined,
   meetingLocation:field("meetingLocation")||undefined,
   capacity:field("capacity"),
  }:{
   action,slotId:field("slotId"),expectedVersion:field("expectedVersion"),
  };
  const result=await writeHrInterviewSlot(await getCurrentRequestContext(),jobId,input);
  // One slot is proposed per form submission (not a batch), so there are no per-row failures.
  const added=action==="CREATE"?1:0;
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({...result,added});
  const next=new URL("/recruiter/drives/"+jobId+"/interview-slots",request.url);
  if(added)next.searchParams.set("added",String(added));
  return NextResponse.redirect(next,303);
 }catch(error){
  if(error instanceof PlacementsServiceError)return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_SLOT"},{status:400});
  if(error instanceof Error && ["SLOT_STALE","SLOT_FULL","SLOT_OVERLAP"].includes(error.message))
   return NextResponse.json({error:error.message},{status:409});
  if(error instanceof Error && ["INVALID_IST_DATE","INVALID_SLOT_DATE"].includes(error.message))
   return NextResponse.json({error:"INVALID_SLOT_DATE"},{status:400});
  throw error;
 }
}
