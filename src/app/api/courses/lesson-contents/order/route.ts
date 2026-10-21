import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { lessonContentOrderRuntimeEnabled } from "@/modules/courses/lesson-content-order-readiness";
import { updateDeliveryLessonContentOrder } from "@/modules/courses/lesson-content-order-service";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  if (!lessonContentOrderRuntimeEnabled()) {
    return NextResponse.json(
      {
        error:
          "DB05_CONTENT_ORDER_MIGRATIONS_PENDING",
      },
      { status: 503 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const order =
      await updateDeliveryLessonContentOrder(
        context,
        await request.json(),
      );
    return NextResponse.json({
      order,
      status: "OK",
      message: "OK",
      data: "Order updated",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
