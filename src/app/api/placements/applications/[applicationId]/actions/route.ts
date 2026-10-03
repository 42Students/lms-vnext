import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { withdrawPlacementApplication } from "@/modules/placements/application-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
};

const inputSchema = z
  .object({
    action: z.literal("WITHDRAW"),
  })
  .strict();

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
    const { applicationId } = await params;
    inputSchema.parse(await request.json());
    const application =
      await withdrawPlacementApplication(
        context,
        applicationId,
      );
    return NextResponse.json({ application });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
