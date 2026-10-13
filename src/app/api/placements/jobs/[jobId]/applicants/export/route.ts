import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { exportPlacementJobApplicantsCsv } from "@/modules/placements/applicant-export-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

/**
 * Read-only, permission-scoped download.
 *
 * The application service resolves the persisted job and enforces
 * placements.manage for the job's college. No college ID is accepted
 * from the URL or request query.
 *
 * A GET download intentionally does not require an Origin header:
 * ordinary browser navigation/download links do not reliably send one.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();

    const { jobId } = await params;

    const csv =
      await exportPlacementJobApplicantsCsv(
        context,
        jobId,
      );

    return new Response(`﻿${csv}`, {
      status: 200,
      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="placement-drive-${jobId}-applicants.csv"`,
        "Cache-Control":
          "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);

    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0",
    );
    response.headers.set(
      "X-Content-Type-Options",
      "nosniff",
    );
    response.headers.set(
      "Vary",
      "Cookie",
    );

    return response;
  }
}
