import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LearnerGalleryError, listLearnerGallery, appendLearnerGalleryImage,
} from "@/modules/profile-verification/learner-image-gallery-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
function failure(error: unknown) {
  if (error instanceof LearnerGalleryError)
    return NextResponse.json({ error: error.code }, {
      status: error.code === "GALLERY_NOT_READY" ? 503 :
        error.code === "GALLERY_FORBIDDEN" ? 403 :
        error.code === "GALLERY_NOT_FOUND" ? 404 : 409,
    });
  return apiErrorResponse(error);
}
async function handleGET(request: Request) {
  try {
    const membershipId = new URL(request.url).searchParams.get("membershipId") ?? undefined;
    const result = await listLearnerGallery(await getCurrentRequestContext(), membershipId);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
export const GET = secured(handleGET);
async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const query = new URL(request.url).searchParams;
    const input: unknown = await request.json();
    const result = await appendLearnerGalleryImage(
      await getCurrentRequestContext(), input, query.get("membershipId") ?? undefined);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
