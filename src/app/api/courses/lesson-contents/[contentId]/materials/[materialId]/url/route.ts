import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  grantLessonResourceMaterialFile,
  resolveLegacyResourceMaterialId,
} from "@/modules/courses/lesson-resource-materials-service";
import { StorageFileError } from "@/modules/storage/file-errors";
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
      materialId: z.string().min(1),
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
    const isUuid = z.string().uuid().safeParse(ids.materialId).success;
    const isLegacyIndex = /^[0-9]{1,9}$/.test(ids.materialId);
    if (!isUuid && !isLegacyIndex) {
      return Response.json(
        { error: "INVALID_REQUEST", message: "Invalid Resource material" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const context = await getCurrentRequestContext();
    // Preserve the historic material array index without exposing object keys.
    // Both resolution and signing independently enforce the course scope.
    const materialId = isUuid
      ? ids.materialId
      : await authorizeOrNotFound(() =>
          resolveLegacyResourceMaterialId(
            context, ids.contentId, deliveryId, Number(ids.materialId),
          ),
        );
    if (!materialId) throw new StorageFileError("STORAGE_NOT_FOUND");
    const grant = await authorizeOrNotFound(() =>
      grantLessonResourceMaterialFile(
        context, ids.contentId, deliveryId, materialId,
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
