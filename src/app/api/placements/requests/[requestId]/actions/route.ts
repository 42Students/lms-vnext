import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { actOnPlacementRequest } from "@/modules/placements/request-service";
import { placementRequestActionSchema } from "@/modules/placements/validation";
import { z } from "zod";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { requestId } = params;
    const payload = await request.json();
    const validated = z.union([
      placementRequestActionSchema,
      z.object({
        action: z.literal("CANCEL"),
        expectedUpdatedAt: z.string().datetime({ offset: true }),
      }).strict(),
    ]).parse(payload);
    const token = "expectedUpdatedAt" in validated ? validated.expectedUpdatedAt : undefined;
    const placementRequest = await actOnPlacementRequest(
      context, requestId, "expectedUpdatedAt" in validated ? { action: "CANCEL" } : validated, token,
    );
    return NextResponse.json({
      request: placementRequest,
    });
  },
);
