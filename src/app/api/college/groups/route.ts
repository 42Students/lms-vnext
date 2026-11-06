import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCollegeStudyGroup,
  CollegeGroupManagementError,
} from "@/modules/groups/college-group-management-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const created = await createCollegeStudyGroup(context, await request.json());
    return NextResponse.json({ group: created }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeGroupManagementError) return NextResponse.json(
      { error: error.code },
      { status: error.code === "GROUP_NOT_FOUND" ? 404 : 409 },
    );
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
