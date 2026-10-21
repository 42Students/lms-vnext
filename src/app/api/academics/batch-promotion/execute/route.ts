import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { parsePromotionAcademicYear } from "@/modules/academics/college-batch-promotion-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegePromotionExecuteError, executeCollegeBatchPromotion } from "@/modules/academics/college-batch-promotion-execute";

import { markCollegeBatchGraduated, CollegeBatchGraduationError } from "@/modules/academics/college-batch-graduation-service";

export const runtime = "nodejs";
/** Legacy /api/v1/batch/{numericId}/promote cannot authorize mutations by
 * numeric ID. The vNext flow is GET preview (cohort UUID; acting-college
 * authorization), then POST execute with cohortId, expectedVersion,
 * targetTermNumber, yearStart, learner-impact preconditions and confirm:true.
 * A stale preview never commits and must be refreshed before resubmission.
 */

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body) &&
      "action" in body && body.action === "GRADUATE") {
      const command = z.object({
        action: z.literal("GRADUATE"), cohortId: z.string().uuid(),
        confirm: z.literal(true),
      }).strict().parse(body);
      // Graduation has its own guarded, transactional and idempotent service.
      const cohort = await markCollegeBatchGraduated(context, command.cohortId, { confirm: true });
      return NextResponse.json({ cohort, result: cohort, message: "Batch graduated" });
    }
    let promotionInput = body;
    if (body && typeof body === "object" && !Array.isArray(body) &&
        "yearStart" in body && typeof body.yearStart === "string") {
      const parsedYear = parsePromotionAcademicYear(body.yearStart);
      if (parsedYear === null)
        return NextResponse.json({
          error: "INVALID_ACADEMIC_YEAR",
          message: "Academic year must use YYYY-YY format with consecutive years, e.g. 2026-27",
          fieldErrors: { yearStart: "Use consecutive years, e.g. 2026-27" },
        }, { status: 400 });
      promotionInput = { ...body, yearStart: parsedYear };
    }
    const result = await executeCollegeBatchPromotion(context, promotionInput);
    return NextResponse.json({status:"OK",message:result.message,result,data:result},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    if(error instanceof ZodError||error instanceof SyntaxError)
      return NextResponse.json({error:"INVALID_PROMOTION_INPUT",
        message:"Refresh the preview and confirm the next semester and academic year."},
        {status:400});
    if (error instanceof CollegeBatchGraduationError) {
      return NextResponse.json({ error: error.code,
        message: error.code === "BATCH_NOT_READY_TO_GRADUATE" ? "The batch must complete its final semester before graduation." : "The batch changed; refresh and try again." },
        { status: error.code === "BATCH_NOT_FOUND" ? 404 : 409 });
    }
    if (error instanceof CollegePromotionExecuteError) {
      return NextResponse.json(
        { error: error.code, message: error.code === "PROMOTION_STALE" ?
          "Batch was modified by another request. Please refresh and try again." :
          error.code === "PROMOTION_BLOCKED" ? "Complete the curriculum and learner readiness checks before promoting this batch." :
          error.code === "PROMOTION_PREVIEW_CHANGED" ? "Preview changed. Refresh and confirm the updated batch before continuing." : "Batch not found." },
        { status: error.code === "BATCH_NOT_FOUND" ? 404 : 409 },
      );
    }
    return apiErrorResponse(error);
  }
}
