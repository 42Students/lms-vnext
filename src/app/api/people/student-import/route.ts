import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { runCollegeStudentCsv } from "@/modules/people/college-student-csv-service";

export const runtime = "nodejs";
// PREVIEW and IMPORT deliberately share one scoped validation contract.
// Legacy bulk registration history/undo needs a durable cross-system ledger;
// a partially provisioned identity must not be rolled back by this route.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    // Legacy /bulk-validate and /bulk-register are represented as the PREVIEW
    // and IMPORT stages of this single, college-scoped endpoint. The service
    // revalidates on IMPORT; clients must not treat an old preview as a permit.
    const report = await runCollegeStudentCsv(
      await getCurrentRequestContext(), await request.json(),
    );
    const preflightPassed = report.structuralErrors.length === 0 && report.invalid === 0;
    return NextResponse.json({
      report,
      workflow: {
        phase: report.preview ? "PREFLIGHT" : "WRITE",
        preflightPassed,
        retryPolicy: report.preview ? "CORRECT_INVALID_ROWS" : "REVIEW_RECEIPTS_BEFORE_RETRY",
        requiresManualReconciliation:
          "recoveryRequired" in report && report.recoveryRequired === true,
      },
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
