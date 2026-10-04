import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementLearnerRequest,
  listOwnPlacementLearnerRequests,
} from "@/modules/placements/request-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context =
      await getCurrentRequestContext();
    const requests =
      await listOwnPlacementLearnerRequests(
        context,
      );
    return NextResponse.json({ requests });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const created =
      await createPlacementLearnerRequest(
        context,
        body as Record<string, unknown>,
      );

    return NextResponse.json(
      { request: created },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
