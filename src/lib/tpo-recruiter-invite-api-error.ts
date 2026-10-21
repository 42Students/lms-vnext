import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoRecruiterInviteServiceError } from "@/modules/placements/tpo-recruiter-invite-service";

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
        headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return apiErrorResponse(error);
}
