import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { actOnPlacementRequest } from "@/modules/placements/request-service";
import { placementRequestActionSchema } from "@/modules/placements/validation";
import { z } from "zod";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

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
    const context =
      await getCurrentRequestContext();
    const { requestId } = await params;
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
