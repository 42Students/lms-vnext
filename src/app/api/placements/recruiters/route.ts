import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  grantPlacementRecruiter,
  listPlacementRecruiterGrants,
} from "@/modules/placements/recruiter-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      );
    const grants =
      await listPlacementRecruiterGrants(
        context,
        collegeId ?? "",
      );
    return NextResponse.json({ grants });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const result =
      await grantPlacementRecruiter(
        context,
        await request.json(),
      );
    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
