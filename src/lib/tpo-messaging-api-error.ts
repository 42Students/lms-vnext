import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/modules/permissions/policy";
import { TpoMessagingError } from "@/modules/placements/tpo-messaging-service";

export function tpoMessagingApiErrorResponse(error: unknown) {
  if (error instanceof TpoMessagingError) {
    const notFound = [
      "TPO_MESSAGE_THREAD_NOT_FOUND",
      "TPO_MESSAGE_RECRUITER_NOT_FOUND",
      "TPO_MESSAGE_JOB_NOT_FOUND",
    ].includes(error.code);
    return NextResponse.json(
      { error: error.code },
      { status: notFound ? 404 : 403 },
    );
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 422 });
  }
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}
