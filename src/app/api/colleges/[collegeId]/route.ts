import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { updateCollege } from "@/modules/colleges/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    collegeId: string;
  }>;
};

export async function PATCH(
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
    const { collegeId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const college = await updateCollege(
      context,
      collegeId,
      body as Record<string, unknown>,
    );

    return NextResponse.json({ college });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
