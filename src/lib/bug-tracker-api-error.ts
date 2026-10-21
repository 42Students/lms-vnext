import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { TrackerAdminError } from "@/modules/bug-tracker/admin-errors";
import { BugWorkflowError } from "@/modules/bug-tracker/workflow";

export function bugTrackerApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (error instanceof TrackerAdminError) {
    const status =
      error.code === "FORBIDDEN" ? 403 :
      error.code === "ISSUE_NOT_FOUND" ? 404 :
      error.code === "STALE_VERSION" ? 409 : 400;
    return NextResponse.json({ error: error.code,
      ...(error.code==="ISSUE_NOT_FOUND"?{message:"Issue not found"}:{}) }, { status });
  }
  if (error instanceof BugWorkflowError) {
    const status =
      error.code === "FORBIDDEN" ? 403 :
      error.code === "STALE_VERSION" ? 409 : 400;
    return NextResponse.json({ error: error.code }, { status });
  }
  return apiErrorResponse(error);
}
