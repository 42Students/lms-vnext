import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  endCourseSectionDelivery,
} from "@/modules/courses/delivery-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

export async function DELETE(
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
    const { deliveryId } = await params;
    const delivery =
      await endCourseSectionDelivery(
        context,
        deliveryId,
      );

    return NextResponse.json({ delivery });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
