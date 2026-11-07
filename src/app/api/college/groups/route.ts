import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCollegeStudyGroup,
  CollegeGroupManagementError,
} from "@/modules/groups/college-group-management-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const created = await createCollegeStudyGroup(context, await boundedRequestJson(request));
return NextResponse.json({ group: created }, { status: 201 });
} catch (error) {
    if (error instanceof CollegeGroupManagementError) return NextResponse.json(
      { error: error.code },
      { status: error.code === "GROUP_NOT_FOUND" ? 404 : 409 },
    );
    return apiErrorResponse(error);
  }
  },
);
