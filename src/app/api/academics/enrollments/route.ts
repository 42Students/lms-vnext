import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  createLearnerProgramEnrollment,
  listLearnerProgramEnrollments,
} from "@/modules/academics/enrollment-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";

async function handleGET(request: Request) {
  try {
    const url = new URL(request.url);
    if (["programId", "cohortId"].some(key => url.searchParams.getAll(key).length > 1))
      return NextResponse.json({ error: "INVALID_FILTERS" }, {
        status: 400, headers: { "Cache-Control": "private, no-store" },
      });
    const context = await getCurrentRequestContext();
    const enrollments =
      await listLearnerProgramEnrollments(
        context,
        url.searchParams.get("programId") ?? "",
        url.searchParams.get("cohortId"),
      );

    return NextResponse.json({ enrollments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePOST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const parsed = await readBoundedJsonBody(request, 16_384);
    if (parsed.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsed.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body = parsed.value;
    const enrollment =
      await createLearnerProgramEnrollment(
        context,
        body,
      );

    return NextResponse.json(
      { enrollment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST);
