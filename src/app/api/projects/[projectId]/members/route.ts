import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  addProjectMember,
  listProjectMembers,
  reassignProjectPrimaryMentor,
} from "@/modules/projects/member-service";
import { addProjectMemberInputSchema } from "@/modules/projects/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { projectId } = await params;
    const members = await listProjectMembers(
      context,
      projectId,
    );

    return NextResponse.json({ members });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
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
    const { projectId } = await params;
    const body: unknown = await request.json();
    // Legacy direct mentor selection replaces an existing primary, rather
    // than failing the add-member uniqueness check. Service authorizes it.
    if (body && typeof body === "object" && !Array.isArray(body) &&
        "primaryMentorMembershipId" in body) {
      const choice = z.strictObject({
        primaryMentorMembershipId: z.uuid(),
        roleLabel: z.string().trim().min(1).max(120).optional(),
      }).parse(body);
      const primaryMentor = await reassignProjectPrimaryMentor(
        context, projectId, choice.primaryMentorMembershipId, choice.roleLabel,
      );
      return NextResponse.json({ primaryMentor }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    const member = await addProjectMember(
      context,
      projectId,
      addProjectMemberInputSchema.parse(body),
    );

    return NextResponse.json(
      { member },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
