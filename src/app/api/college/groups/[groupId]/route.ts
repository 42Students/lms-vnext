import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  changeCollegeStudyGroup,
  CollegeGroupManagementError,
} from "@/modules/groups/college-group-management-service";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { groupId } = await params;
    const updated = await changeCollegeStudyGroup(context, groupId, await request.json());
    return NextResponse.json({ group: updated });
  } catch (error) {
    if (error instanceof CollegeGroupManagementError) return NextResponse.json(
      { error: error.code },
      { status: error.code === "GROUP_NOT_FOUND" ? 404 : 409 },
    );
    return apiErrorResponse(error);
  }
}
