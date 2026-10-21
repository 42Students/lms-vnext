import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { grantLessonResourceMaterialFile } from "@/modules/courses/lesson-resource-materials-service";
import { authorizeOrNotFound } from "@/modules/storage/file-access";
import { z } from "zod";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ contentId: string; materialId: string }>;
};

/** Authorize an individual FILE material before returning a short-lived
 * signed URL. Never expose storage keys or make URL grants cacheable.
 * Learners require a scoped delivery; faculty/admin use the existing
 * material service's persisted course and delivery authorization. */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const rawParams = await params;
    const parsedIds = z.object({
      contentId: z.string().uuid(),
      materialId: z.string().uuid(),
    }).safeParse(rawParams);
    if (!parsedIds.success) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "Invalid Resource material" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const ids = parsedIds.data;
    const url = new URL(request.url);
    const values = url.searchParams.getAll("deliveryId");
    if (values.length > 1 ||
        [...url.searchParams.keys()].some(key => key !== "deliveryId")) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "Invalid Resource material" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const parsedDelivery = values[0] === undefined
      ? null
      : z.string().uuid().safeParse(values[0]);
    if (parsedDelivery && !parsedDelivery.success) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "Invalid Resource material" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const deliveryId = parsedDelivery?.data ?? null;
    const context = await getCurrentRequestContext();
    const grant = await authorizeOrNotFound(() =>
      grantLessonResourceMaterialFile(
        context, ids.contentId, deliveryId, ids.materialId,
      ),
    );
    return Response.json(
      {
        status: "OK",
        message: "OK",
        data: { url: grant.url },
        grant,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
