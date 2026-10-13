import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  grantSuperAdminHrCollegeAccess,
} from "@/modules/placements/super-admin-hr-service";
import {
  grantSuperAdminHrCollegeInputSchema,
} from "@/modules/placements/super-admin-hr-validation";

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
      grantSuperAdminHrCollegeInputSchema.parse(
        body,
      );

    const grant =
      await grantSuperAdminHrCollegeAccess(
        context,
        userId,
        input,
      );

    return NextResponse.json(
      { grant },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
