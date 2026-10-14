import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {createMentorProjectTask} from "@/modules/projects/mentor-task-create-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{projectId:string}>};
export async function POST(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const path=await params;
    const body=await request.json();
    const task=await createMentorProjectTask(context,path,body);
    return NextResponse.json({task},{status:201});
  }catch(error){return apiErrorResponse(error);}
}
