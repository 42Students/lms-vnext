import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LearnerGalleryError, deactivateLearnerGalleryImage, openLearnerGalleryImage,
} from "@/modules/profile-verification/learner-image-gallery-service";

export const runtime = "nodejs";
type Params = { params: Promise<{ imageId: string }> };
function failure(error: unknown) {
  if (error instanceof LearnerGalleryError)
    return NextResponse.json({ error: error.code }, {
      status: error.code === "GALLERY_NOT_READY" ? 503 :
        error.code === "GALLERY_FORBIDDEN" ? 403 :
        error.code === "GALLERY_NOT_FOUND" ? 404 : 409,
    });
  return apiErrorResponse(error);
}
export async function GET(request: Request, { params }: Params) {
  try {
    const { imageId } = await params;
    const member = new URL(request.url).searchParams.get("membershipId") ?? undefined;
    const result = await openLearnerGalleryImage(
      await getCurrentRequestContext(), imageId, member);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const { imageId } = await params;
    const member = new URL(request.url).searchParams.get("membershipId") ?? undefined;
    const result = await deactivateLearnerGalleryImage(
      await getCurrentRequestContext(), imageId, member);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
