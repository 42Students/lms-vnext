import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { updateMentorSprintDetails } from "@/modules/projects/mentor-sprint-details-service";
import {deleteMentorProjectSprint} from "@/modules/projects/mentor-sprint-delete-service";

export const runtime = "nodejs";
type RouteContext={params:Promise<{projectId:string;sprintId:string}>};

export async function PATCH(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  try {
    const context=await getCurrentRequestContext();
    const path=await params;
    const body=await request.json();
    const sprint=await updateMentorSprintDetails(context,path,body);
    return NextResponse.json({sprint});
  } catch(error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request:Request,{params}:RouteContext) {
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const result=await deleteMentorProjectSprint(await getCurrentRequestContext(),
      await params,await request.json());
    return NextResponse.json(result);
  }catch(error){return apiErrorResponse(error);}
}
