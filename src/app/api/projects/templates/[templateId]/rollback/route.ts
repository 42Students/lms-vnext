import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rollbackProjectTemplate} from "@/modules/projects/template-rollback-service";
export const runtime="nodejs";
const rollbackCommand=z.strictObject({
 versionId:z.string().uuid(),expectedTemplateVersion:z.number().int().min(1),
 confirmed:z.literal(true),
 expectedAssignedCollegeCount:z.number().int().min(0).optional(),
 expectedPinnedWorkspaceCount:z.number().int().min(0).optional(),
});
export async function POST(request:Request,{params}:{params:Promise<{templateId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {templateId}=await params;
  const raw:unknown=await request.json().catch(()=>null);
  const command=rollbackCommand.safeParse(raw);
  if(!command.success)return NextResponse.json({
   error:"ROLLBACK_CONFIRMATION_REQUIRED",
   message:"Review this template version and confirm rollback with its current version.",
  },{status:400,headers:{"Cache-Control":"private, no-store"}});
  const result=await rollbackProjectTemplate(await getCurrentRequestContext(),templateId,command.data);
  return NextResponse.json({...result,message:"Template rolled back"},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
