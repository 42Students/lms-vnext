import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LearnerGalleryError, initiateOwnLearnerGalleryUpload,
  confirmOwnLearnerGalleryUpload,
} from "@/modules/profile-verification/learner-image-gallery-service";

export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
const schema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("INITIATE"), originalName: z.string(),
    contentType: z.string(), sizeBytes: z.number() }),
  z.strictObject({ action: z.literal("CONFIRM"), objectKey: z.string() }),
]);
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: noStore });
  try {
    const input = schema.parse(await request.json());
    const context = await getCurrentRequestContext();
    // The HTTP action discriminator is transport-only. The private-storage
    // service enforces strict payloads and must never receive an extra "action".
    const result = input.action === "INITIATE"
      ? await initiateOwnLearnerGalleryUpload(context, {
          originalName: input.originalName,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
        })
      : await confirmOwnLearnerGalleryUpload(context, {
          objectKey: input.objectKey,
        });
    return NextResponse.json(result, {
      status: input.action === "INITIATE" ? 201 : 200, headers: noStore,
    });
  } catch (error) {
    if (error instanceof LearnerGalleryError) return NextResponse.json(
      { error: error.code }, { status: error.code === "GALLERY_NOT_READY" ? 503 :
        error.code === "GALLERY_FORBIDDEN" ? 403 : 409, headers: noStore });
    if (error instanceof ZodError)
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
    return apiErrorResponse(error);
  }
}
