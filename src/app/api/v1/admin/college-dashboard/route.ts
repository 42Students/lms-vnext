import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import { apiErrorResponse } from "@/lib/api-error";
import { getCollegeDashboardAttendance } from "@/modules/admin-ui/college-dashboard-attendance-service";
import { getCollegeDashboardLowAttendance } from "@/modules/admin-ui/college-dashboard-risk-service";
import { getCollegeDashboardPendingGrades, getCollegeDashboardPendingGradesCount } from "@/modules/admin-ui/college-dashboard-grading-service";
import { getCollegeDashboardUnstaffedCourses, getCollegeDashboardUnstaffedDeliveriesCount } from "@/modules/admin-ui/college-dashboard-staffing-service";
import { getCollegeDashboardSetupGaps } from "@/modules/admin-ui/college-dashboard-setup-gaps-service";
import { getCollegeClosingQuizzes } from "@/modules/admin-ui/college-dashboard-quizzes-service";

export const runtime = "nodejs";
function value<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

/** Authenticated, tenant-scoped compatibility read for legacy dashboard clients.
 * Unlike the retired endpoint, partial-feed failures are explicit null, not zero. */
export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    const membership = context.membership;
    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json({error:"COLLEGE_MEMBERSHIP_REQUIRED"},{status:403});
    }
    requirePermission(context, "academics.read", {
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    });
    const now=new Date();
    const [attendance,risk,grading,gradingCount,staffing,staffingCount,setup,quizzes] = await Promise.allSettled([
      getCollegeDashboardAttendance(context,now),
      getCollegeDashboardLowAttendance(context,now),
      getCollegeDashboardPendingGrades(context),
      getCollegeDashboardPendingGradesCount(context),
      getCollegeDashboardUnstaffedCourses(context),
      getCollegeDashboardUnstaffedDeliveriesCount(context),
      getCollegeDashboardSetupGaps(context),
      getCollegeClosingQuizzes(context,now),
    ]);
    const today=value(attendance)?.today ?? null;
    const threshold=value(risk)?.threshold ?? null;
    return NextResponse.json({
      generatedAt:now.toISOString(),
      attendanceThreshold:threshold,
      today,
      attendancePending: value(attendance) ? {
        count:value(attendance)!.unattendedCount,
        items:value(attendance)!.unattended,
      } : null,
      lowAttendance:value(risk),
      gradingBacklog:value(grading) ? {count:value(gradingCount),items:value(grading)} : null,
      unstaffed:value(staffing) ? {count:value(staffingCount),items:value(staffing)} : null,
      setupGaps:value(setup),
      dueQuizzes:value(quizzes),
    }, {headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch (error) {return apiErrorResponse(error);}
}
