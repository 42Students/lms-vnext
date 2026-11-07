import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  changeCollegeStudyGroup,
  CollegeGroupManagementError,
} from "@/modules/groups/college-group-management-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { groupId } = params;
const updated = await changeCollegeStudyGroup(context, groupId, await request.json());
return NextResponse.json({ group: updated });
} catch (error) {
    if (error instanceof CollegeGroupManagementError) return NextResponse.json(
      { error: error.code },
      { status: error.code === "GROUP_NOT_FOUND" ? 404 : 409 },
    );
    return apiErrorResponse(error);
  }
  },
);
