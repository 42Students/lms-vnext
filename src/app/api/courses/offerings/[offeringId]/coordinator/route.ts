import { z } from "zod";
import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getOfferingCoordinator,
  grantOfferingCoordinator,
  listEligibleOfferingCoordinators,
  listOfferingCoordinatorHistory,
  revokeOfferingCoordinator,
} from "@/modules/courses/coordinator-service";

export const runtime = "nodejs";

const grantBodySchema = z.object({ membershipId: z.string().uuid() }).strict();

/** College admin: who coordinates this course now, who could, and what changed before. */
// @security-reviewed GET auth=session tenant=college permission=courses.manage csrf=route-wrapper test=tests/unit/course-coordinator-policy.test.ts
export const GET = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { offeringId } = params;
    const [coordinator, eligible, history] = await Promise.all([
      getOfferingCoordinator(context, offeringId),
      listEligibleOfferingCoordinators(context, offeringId),
      listOfferingCoordinatorHistory(context, offeringId),
    ]);
    return NextResponse.json({ coordinator, eligible, history });
  },
);

/** College admin: nominate one of the course's teachers. */
// @security-reviewed PUT auth=session tenant=college permission=courses.manage csrf=route-wrapper test=tests/unit/course-coordinator-policy.test.ts
export const PUT = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { offeringId } = params;
    const body = grantBodySchema.parse(await boundedRequestJson(request));
    const coordinator = await grantOfferingCoordinator(context, offeringId, body.membershipId);
    return NextResponse.json({ coordinator });
  },
);

/** College admin: remove the current coordinator. */
// @security-reviewed DELETE auth=session tenant=college permission=courses.manage csrf=route-wrapper test=tests/unit/course-coordinator-policy.test.ts
export const DELETE = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { offeringId } = params;
    await revokeOfferingCoordinator(context, offeringId);
    return NextResponse.json({ coordinator: null });
  },
);
