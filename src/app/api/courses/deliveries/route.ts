import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseSectionDelivery,
  listCourseSectionDeliveries,
} from "@/modules/courses/delivery-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const deliveries =
      await listCourseSectionDeliveries(
        context,
        url.searchParams.get("offeringId") ?? "",
        url.searchParams.get("includeEnded") ===
          "true",
      );

    return NextResponse.json({ deliveries });
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
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const delivery =
      await createCourseSectionDelivery(
        context,
        body,
      );

    return NextResponse.json(
      { delivery },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
