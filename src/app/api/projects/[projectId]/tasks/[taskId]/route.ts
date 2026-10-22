import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {deleteMentorProjectTask} from "@/modules/projects/mentor-task-delete-service";
import {readMentorProjectCommandBody,MentorProjectCommandBodyError,mentorProjectBodyFailureMessage}
 from "@/modules/projects/mentor-command-body";
import {
  updateProjectTaskStatus,
} from "@/modules/projects/lifecycle-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { projectId, taskId } = await params;
    const body = await readMentorProjectCommandBody(request);
    const task = await updateProjectTaskStatus(
      context,
      projectId,
      taskId,
      body,
    );

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof MentorProjectCommandBodyError) {
      return NextResponse.json(
        { error: error.code, message: mentorProjectBodyFailureMessage(error.status) },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    return apiErrorResponse(error);
  }
}

export async function DELETE(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {projectId,taskId}=await params;
  const body=await readMentorProjectCommandBody(request);
  return NextResponse.json(await deleteMentorProjectTask(context,projectId,taskId,body));
 }catch(error){
  if(error instanceof MentorProjectCommandBodyError)
   return NextResponse.json({error:error.code,message:mentorProjectBodyFailureMessage(error.status)},
    {status:error.status,headers:{"Cache-Control":"no-store"}});
  return apiErrorResponse(error);
 }
}
