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
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const created = await createCollegeStudyGroup(context, await request.json());
    return NextResponse.json({ group: created }, { status: 201 });
  },
);
