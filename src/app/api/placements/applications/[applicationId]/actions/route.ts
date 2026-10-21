import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnPlacementApplications, withdrawPlacementApplication } from "@/modules/placements/application-service";
import { z } from "zod";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { learnerApplicationWithdrawalSchema } from "@/modules/placements/learner-withdrawal-model";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { applicationId } = await params;
    const json: unknown = await request.json();
    // The retired learner route accepted a job ID, while vNext uses an
    // application UUID. Resolve old links only inside the learner's own
    // persisted applications; never substitute an unscoped job lookup.
    const query = new URL(request.url).searchParams;
    const legacyByJob = query.get("by") === "job";
    const suppliedJobId = json && typeof json === "object" && !Array.isArray(json) &&
      "jobId" in json ? (json as { jobId?: unknown }).jobId : undefined;
    const inputBody = json && typeof json === "object" && !Array.isArray(json) ?
      Object.fromEntries(Object.entries(json).filter(([key]) => key !== "jobId")) : json;
    const input = learnerApplicationWithdrawalSchema.parse(inputBody);
    let resolvedId = applicationId;
    if (legacyByJob || suppliedJobId !== undefined) {
      const jobId = z.uuid().parse(suppliedJobId ?? applicationId);
      const own = await listOwnPlacementApplications(context);
      const byApplication = own.find(row => row.application.id === applicationId);
      if (byApplication) {
        if (byApplication.job.id !== jobId) {
          return NextResponse.json({ error: "APPLICATION_JOB_MISMATCH" }, { status: 409 });
        }
      } else {
        if (applicationId !== jobId) {
          return NextResponse.json({ error: "APPLICATION_JOB_MISMATCH" }, { status: 409 });
        }
        const matching = own.filter(row => row.job.id === jobId &&
          row.application.status === "SUBMITTED");
        if (matching.length > 1) {
          return NextResponse.json({ error: "AMBIGUOUS_APPLICATION",
            message: "Choose the application to withdraw from this drive." }, { status: 409 });
        }
        if (matching.length === 0) {
          throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
        }
        resolvedId = matching[0]!.application.id;
      }
    }
    const application = await withdrawPlacementApplication(context, resolvedId, input.reason);
    return NextResponse.json({ application, status: "OK", message: "Application withdrawn" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_WITHDRAWAL",
        message: "Failed to withdraw. Please try again or contact support.",
        fieldErrors: z.flattenError(error).fieldErrors }, { status: 400 });
    }
    if (error instanceof PlacementsServiceError &&
        (error.code === "PLACEMENT_APPLICATION_INELIGIBLE" ||
         error.code === "PLACEMENT_APPLICATION_ALREADY_WITHDRAWN")) {
      return NextResponse.json({ error: error.code,
        message: "Failed to withdraw. Please try again or contact support." }, { status: 409 });
    }
    return apiErrorResponse(error);
  }
}
