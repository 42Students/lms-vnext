import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {editHrJobRound,hrRoundEditorUnavailableMessage} from "@/modules/placements/hr-round-editor-service";
import {hrRoundFormSchema} from "@/modules/placements/hr-round-editor-model";
import {PlacementsServiceError} from "@/modules/placements/errors";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {jobId}=await params;
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_FORM"},{status:400});
 const input=hrRoundFormSchema.safeParse({
  action:form.get("action"),
  kind:form.get("kind")||undefined,name:form.get("name")||undefined,
  mode:form.has("mode")?(form.get("mode")||null):undefined,
  durationMinutes:form.get("durationMinutes")||undefined,
  roundId:form.get("roundId")||undefined,
  expectedUpdatedAt:form.get("expectedUpdatedAt")||undefined,
 });
 if(!input.success)return NextResponse.json({error:"INVALID_ROUND",details:z.treeifyError(input.error)},{status:400});
 try{
  const result=await editHrJobRound(await getCurrentRequestContext(),jobId,input.data);
  if(request.headers.get("accept")?.includes("application/json"))
   return NextResponse.json({saved:true,id:result.id,action:result.action});
  const location=new URL("/recruiter/drives/"+jobId+"/rounds/editor?changed="+result.action,request.url);
  return NextResponse.redirect(location,303);
 }catch(error){
  if(error instanceof PlacementsServiceError){
   const stale=error.code==="PLACEMENT_ROUND_STALE";
   const notEditable=error.code==="PLACEMENT_ROUND_NOT_EDITABLE";
   if(stale||notEditable)return NextResponse.json({
    error:stale?"PLACEMENT_ROUND_STALE":"PLACEMENT_ROUND_NOT_EDITABLE",
    message:stale
     ?"This round changed or has already been used for results or interviews. Refresh the rounds before trying again."
     :"This round cannot be changed. Check the round name and the 12-round limit.",
   },{status:409});
   // The legacy controller distinguishes a drive that is over from an
   // editable current one. Do not disclose job/college details without a grant.
   return NextResponse.json({error:"NOT_FOUND",
    message:hrRoundEditorUnavailableMessage(error.code),
    nextAction:"Choose an active drive from Drives."},{status:404});
  }
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_ROUND"},{status:400});
  throw error;
 }
}
