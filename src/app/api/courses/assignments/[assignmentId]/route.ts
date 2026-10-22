import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  updateCourseAssignment,getCourseAssignmentForAdmin,
} from "@/modules/courses/assignment-service";
import { updateCourseAssignmentInputSchema } from "@/modules/courses/assignment-validation";

export const runtime = "nodejs";

// Admin/faculty edits are read-modify-write: the version the editor loaded
// must accompany every PATCH so a stale form cannot overwrite newer changes.
const versionedPatchSchema = z.looseObject({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function GET(_:Request,{params}:RouteContext){
 try{
  const context=await getCurrentRequestContext();
  const {assignmentId}=await params;
  const assignment=await getCourseAssignmentForAdmin(context,assignmentId);
  return NextResponse.json({assignment},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}

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
    const context =
      await getCurrentRequestContext();
    const { assignmentId } = await params;
    const body: unknown = await request.json();
    if (!versionedPatchSchema.safeParse(body).success) {
      return NextResponse.json(
        { error: "FACULTY_ASSIGNMENT_STALE_VERSION" },
        { status: 409 },
      );
    }
    const assignment =
      await updateCourseAssignment(
        context,
        assignmentId,
        updateCourseAssignmentInputSchema.parse(body),
      );

    return NextResponse.json({ assignment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
