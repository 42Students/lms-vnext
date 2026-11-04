import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
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

    const parsed = await readBoundedJsonRequest(request, 8192);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const input =
      grantSuperAdminHrCollegeInputSchema.parse(
        parsed.value,
      );

    // Company-college recruiter grants are privileged candidate-data access.
    // A stale or differently authenticated actor cannot change them.
    await requireRecentDeviceAuthentication(context.user.id);
    const grant =
      await grantSuperAdminHrCollegeAccess(
        context,
        userId,
        input,
      );

    return NextResponse.json(
      { grant },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
