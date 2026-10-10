import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { TpoRecruiterInviteServiceError } from "@/modules/placements/tpo-recruiter-invite-service";

export function tpoRecruiterInviteApiErrorResponse(error: unknown) {
  if (error instanceof TpoRecruiterInviteServiceError) {
    return NextResponse.json(
      { error: error.code === "TPO_RECRUITER_INVITE_NOT_FOUND"
          ? "INVITE_INVALID"
          : error.code },
      { status: error.code === "TPO_RECRUITER_INVITE_NOT_FOUND" ? 404 : 409 },
    );
  }
  return apiErrorResponse(error);
}
