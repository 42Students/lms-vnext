import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoRecruiterInviteServiceError } from "@/modules/placements/tpo-recruiter-invite-service";

import { CACHE } from "@/security/responses";
export function tpoRecruiterInviteApiErrorResponse(error: unknown) {
  if (error instanceof TpoRecruiterInviteServiceError) {
    return NextResponse.json(
      { error: error.code === "TPO_RECRUITER_INVITE_NOT_FOUND"
          ? "INVITE_INVALID"
          : error.code,
        message: error.code === "TPO_RECRUITER_INVITE_NOT_FOUND"
          ? "This invitation is no longer available."
          : "The invitation cannot be completed. Check the recruiter details or ask the placement cell." },
      { status: error.code === "TPO_RECRUITER_INVITE_NOT_FOUND" ? 404 : 400,
        headers: { "Cache-Control": CACHE.PRIVATE, "Referrer-Policy": "no-referrer" } },
    );
  }
  // The generic handler also handles unexpected errors. A bearer-token
  // invitation must never become cacheable on that fallback path.
  const response = apiErrorResponse(error);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
