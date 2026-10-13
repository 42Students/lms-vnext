import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getSuperAdminHrAccount,
  updateSuperAdminHrAccount,
} from "@/modules/placements/super-admin-hr-service";
import {
  updateSuperAdminHrInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();

    const { userId } = await params;

    const account =
      await getSuperAdminHrAccount(
        context,
        userId,
      );

    return NextResponse.json({ account });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const context =
      await getCurrentRequestContext();

    const { userId } = await params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const input =
      updateSuperAdminHrInputSchema.parse(
        body,
      );

    const account =
      await updateSuperAdminHrAccount(
        context,
        userId,
        input,
      );

    return NextResponse.json({ account });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
