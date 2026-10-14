import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { manageCollegeStudyMember } from "@/modules/groups/college-member-management-service";
import { GroupServiceError } from "@/modules/groups/service";
import { GroupActorAccessError } from "@/modules/groups/actor-access";

export const runtime = "nodejs";

export async function POST(
  request: Request, { params }: { params: Promise<{ groupId: string }> },
) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { groupId } = await params;
    const member = await manageCollegeStudyMember(context, groupId, await request.json());
    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof GroupServiceError)
      return NextResponse.json({ error: error.code }, {
        status: ["GROUP_NOT_FOUND", "GROUP_MEMBER_NOT_FOUND", "GROUP_NOT_MANAGEABLE"].includes(error.code)
          ? 404 : 409,
      });
    if (error instanceof GroupActorAccessError)
      return NextResponse.json({ error: "GROUP_ACTOR_NOT_AUTHORIZED" }, { status: 403 });
    return apiErrorResponse(error);
  }
}
