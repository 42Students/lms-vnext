import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { transitionMentorProjectTask } from "@/modules/projects/mentor-task-transition-service";
export const runtime = "nodejs";
type RouteContext = { params:Promise<{projectId:string;taskId:string}> };
export async function PATCH(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const [context,path]=await Promise.all([getCurrentRequestContext(),params]);
    const task=await transitionMentorProjectTask(context,path,await request.json());
    return NextResponse.json({task});
  }catch(error){return apiErrorResponse(error);}
}
