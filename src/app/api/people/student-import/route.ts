import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { runCollegeStudentCsv, listSuperAdminStudentCsvImportHistory } from "@/modules/people/college-student-csv-service";

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

/** Legacy bulk import history: only a persisted, authorized Super Admin
 * acting in a selected college can read this audit ledger. The same college
 * controls import and the historical actor/receipt metadata returned here. */
export async function GET() {
  try {
    const history = await listSuperAdminStudentCsvImportHistory(
      await getCurrentRequestContext(),
    );
    return NextResponse.json({history,action:"BULK_IMPORT_HISTORY",undoAvailable:false},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch(error) { return apiErrorResponse(error); }
}

/** A legacy one-step batch undo cannot erase an externally provisioned
 * identity, learner attendance or placement work. Return an explicit
 * dependency-review outcome; never pretend a partial rollback succeeded. */
export async function DELETE(request:Request) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  return NextResponse.json({
    error:"BULK_UNDO_REQUIRES_REVIEW",
    message:"Bulk import reversal requires a membership-by-membership dependency review. No learner, attendance or placement records were deleted.",
    recovery:"Review the import history and end eligible memberships individually.",
  },{status:409,headers:{"Cache-Control":"private, no-store"}});
}
