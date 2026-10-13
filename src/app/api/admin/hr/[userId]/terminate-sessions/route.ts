import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  terminateSuperAdminHrSessions,
} from "@/modules/placements/super-admin-hr-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
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

    const { userId } = await params;

    const result =
      await terminateSuperAdminHrSessions(
        context,
        userId,
      );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
