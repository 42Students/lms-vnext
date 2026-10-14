import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { withdrawPlacementApplication } from "@/modules/placements/application-service";
import { learnerApplicationWithdrawalSchema } from "@/modules/placements/learner-withdrawal-model";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
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
    const context = await getCurrentRequestContext();
    const { applicationId } = await params;
    const input = learnerApplicationWithdrawalSchema.parse(await request.json());
    const application =
      await withdrawPlacementApplication(
        context,
        applicationId,
        input.reason,
      );
    return NextResponse.json({ application });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
