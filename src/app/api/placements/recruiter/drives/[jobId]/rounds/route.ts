import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {editHrJobRound} from "@/modules/placements/hr-round-editor-service";
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
   const conflict=error.code==="PLACEMENT_ROUND_STALE"||error.code==="PLACEMENT_ROUND_NOT_EDITABLE";
   return NextResponse.json({error:conflict?"STALE_OR_USED_ROUND":"NOT_FOUND"},{status:conflict?409:404});
  }
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_ROUND"},{status:400});
  throw error;
 }
}
