import "server-only";
import { can } from "@/modules/permissions/policy";
import { hasActiveMembership,hasMembershipRole,type RequestContext } from "@/modules/identity/context";
import { getFacultyAttendanceWorkspace } from "@/modules/attendance/faculty-service";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import { getFacultyCourseAssessmentHealth } from "./faculty-course-health-service";
import { CoursesServiceError } from "./errors";
import {facultyReportsHubQuerySchema,publishedReportBreakdown,attendanceReportCounts} from "./faculty-reports-hub-model";
export async function getFacultyReportsHub(context:RequestContext,raw:unknown){
 const query=facultyReportsHubQuerySchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
 !can(context,"courses.read",{collegeId:membership.collegeId,organizationId:membership.organizationId}))
 throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const [attendance,health,overview]=await Promise.all([
  getFacultyAttendanceWorkspace(context,query.deliveryId),
  getFacultyCourseAssessmentHealth(context,query),
  getFacultyAssessmentOverview(context),
 ]);
 const rows=[
 ...overview.assignments.filter(row=>row.deliveryId===query.deliveryId).map(row=>({kind:"ASSIGNMENT" as const,status:row.status})),
 ...overview.quizzes.filter(row=>row.deliveryId===query.deliveryId).map(row=>({kind:"QUIZ" as const,status:row.status})),
 ];
 return {query,health,delivery:health.delivery,rosterSize:health.rosterSize,
 breakdown:publishedReportBreakdown(rows),attendance:attendanceReportCounts(attendance.sessions)};
}
