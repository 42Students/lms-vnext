import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { lessonContentOrderRuntimeEnabled } from "@/modules/courses/lesson-content-order-readiness";
import { updateDeliveryLessonContentOrder } from "@/modules/courses/lesson-content-order-service";
import { route } from "@/security/route";

export const runtime = "nodejs";

async function handlePUT(request: Request) {
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
        await boundedRequestJson(request),
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
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePUT(request as Parameters<typeof handlePUT>[0]),
);
