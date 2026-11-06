import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {moveMentorBacklogTask,createMentorBacklogTask} from "@/modules/projects/mentor-backlog-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handlePATCH(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const result=await moveMentorBacklogTask(await getCurrentRequestContext(),projectId,await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });

async function handlePOST(request:Request,{params}:{params:Promise<{projectId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {projectId}=await params;
  const task=await createMentorBacklogTask(await getCurrentRequestContext(),projectId,await request.json());
  return NextResponse.json({task},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
