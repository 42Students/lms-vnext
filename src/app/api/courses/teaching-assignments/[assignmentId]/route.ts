import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {changeCourseTeachingAssignmentRoleInputSchema} from "@/modules/courses/validation";
import {
  endCourseTeachingAssignment,
  changeCourseTeachingAssignmentRole,
} from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

export async function DELETE(
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
    const { assignmentId } = await params;
    const assignment =
      await endCourseTeachingAssignment(
        context,
        assignmentId,
      );

    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request:Request,{params}:RouteContext){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {assignmentId}=await params;
    const body:unknown=await request.json();
    const parsed=changeCourseTeachingAssignmentRoleInputSchema.safeParse(body);
    if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const assignment=await changeCourseTeachingAssignmentRole(context,assignmentId,parsed.data);
    return NextResponse.json({assignment});
  }catch(error){return apiErrorResponse(error);}
}
