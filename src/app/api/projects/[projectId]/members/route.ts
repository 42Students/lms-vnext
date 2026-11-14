import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addProjectMember,
  listProjectMembers,
  reassignProjectPrimaryMentor,
} from "@/modules/projects/member-service";
import { addProjectMemberInputSchema } from "@/modules/projects/validation";

import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const members = await listProjectMembers(
      context,
      projectId,
    );
    return NextResponse.json({ members });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { projectId } = params;
    const body: unknown = await boundedRequestJson(request);
    if (body && typeof body === "object" && !Array.isArray(body) &&
        "primaryMentorMembershipId" in body) {
      const choice = z.strictObject({
        primaryMentorMembershipId: zUuid,
        roleLabel: z.string().trim().min(1).max(120).optional(),
      }).parse(body);
      const primaryMentor = await reassignProjectPrimaryMentor(
        context, projectId, choice.primaryMentorMembershipId, choice.roleLabel,
      );
      return NextResponse.json({ primaryMentor }, {
        headers: { "Cache-Control": CACHE.PRIVATE },
      });
    }
    const member = await addProjectMember(
      context,
      projectId,
      addProjectMemberInputSchema.parse(body) as Parameters<typeof addProjectMember>[2],
    );
    return NextResponse.json(
      { member },
      { status: 201 },
    );
  },
);
