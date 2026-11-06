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
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { groupId } = params;
    const updated = await changeCollegeStudyGroup(context, groupId, await request.json());
    return NextResponse.json({ group: updated });
  },
);
