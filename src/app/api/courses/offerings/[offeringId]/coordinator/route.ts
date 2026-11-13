import { z } from "zod";
import { boundedRequestJson } from "@/lib/bounded-request-json";
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
export const DELETE = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { offeringId } = params;
    await revokeOfferingCoordinator(context, offeringId);
    return NextResponse.json({ coordinator: null });
  },
);
