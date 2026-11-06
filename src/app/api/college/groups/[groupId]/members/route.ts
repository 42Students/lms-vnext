import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { manageCollegeStudyMember } from "@/modules/groups/college-member-management-service";
import { GroupServiceError } from "@/modules/groups/service";
import { GroupActorAccessError } from "@/modules/groups/actor-access";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { groupId } = params;
    const member = await manageCollegeStudyMember(context, groupId, await request.json());
    return NextResponse.json({ member });
  },
);
