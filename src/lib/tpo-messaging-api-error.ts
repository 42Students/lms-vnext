import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { statusForCode } from "@/lib/error-registry";
import { AuthorizationError } from "@/modules/permissions/policy";
import { TpoMessagingError } from "@/modules/placements/tpo-messaging-service";

export function tpoMessagingApiErrorResponse(error: unknown) {
  if (error instanceof TpoMessagingError) {
    return NextResponse.json(
      { error: error.code },
      { status: statusForCode("tpoMessaging", error.code) },
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
