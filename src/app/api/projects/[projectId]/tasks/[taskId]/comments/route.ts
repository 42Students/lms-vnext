import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listProjectTaskComments,postProjectTaskComment} from "@/modules/projects/task-comment-service";
export const runtime="nodejs";
type Route={params:Promise<{projectId:string;taskId:string}>};
export async function GET(_request:Request,{params}:Route){
 try{const context=await getCurrentRequestContext();const {projectId,taskId}=await params;
 return NextResponse.json({comments:await listProjectTaskComments(context,projectId,taskId)});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Route){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const context=await getCurrentRequestContext();const {projectId,taskId}=await params;
 return NextResponse.json({comment:await postProjectTaskComment(context,projectId,taskId,await request.json())},{status:201});
 }catch(error){return apiErrorResponse(error);}
}
