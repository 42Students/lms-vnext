import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  LearnerGalleryError, listLearnerGallery, appendLearnerGalleryImage,
} from "@/modules/profile-verification/learner-image-gallery-service";

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
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const membershipId = new URL(request.url).searchParams.get("membershipId") ?? undefined;
const result = await listLearnerGallery(__ctx, membershipId);
return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
} catch (error) { return failure(error); }
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const query = new URL(request.url).searchParams;
const input: unknown = await request.json();
const result = await appendLearnerGalleryImage(
      __ctx, input, query.get("membershipId") ?? undefined);
return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
} catch (error) { return failure(error); }
  },
);
