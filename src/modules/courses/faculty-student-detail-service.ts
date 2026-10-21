import "server-only";
import { can } from "@/modules/permissions/policy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import {
  getFacultyDeliveryRoster, getFacultyAttendanceWorkspace,
} from "@/modules/attendance/faculty-service";
import { facultyLearnerAttendanceDetail } from "@/modules/attendance/faculty-learner-attendance-detail";
import {
  facultyStudentDetailParamsSchema,
  findAuthorizedFacultyStudent,
  summarizeFacultyStudentAttendance,
} from "./faculty-student-detail-model";

/** Old student ID + class ID are numeric legacy identifiers, never UUIDs.
 * Authenticate the courseSectionDelivery UUID and membership UUID from the
 * current roster before revealing profile/contact details. Legacy first/last
 * name -> displayName; roll_number -> rollNumber; contact_mobile/mail ->
 * phoneE164/email through the authorized directory projection. Do not use a
 * numeric cast or a stale course roster to bypass membership authorization.
 */
/** Exact current delivery roster is authoritative; do not accept caller college scope. */
export async function getFacultyStudentDetail(context: RequestContext, rawParams: unknown) {
  const params = facultyStudentDetailParamsSchema.parse(rawParams);
  const membership = context.membership;
  if (!membership || context.user.platformStatus !== "ACTIVE" ||
      !hasMembershipRole(context, "FACULTY") ||
      !can(context, "courses.read", {
        collegeId: membership.collegeId,
        organizationId: membership.organizationId,
      })) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  const { delivery, roster } = await getFacultyDeliveryRoster(context, params.deliveryId);
  const student = findAuthorizedFacultyStudent(roster, params.membershipId);
  if (!student) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");

  const workspace = await getFacultyAttendanceWorkspace(context, params.deliveryId);
  if (!findAuthorizedFacultyStudent(workspace.roster, params.membershipId)) {
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  }
  const detail = facultyLearnerAttendanceDetail(
    params.membershipId,
    workspace.sessions.map(row => ({
      id: row.id,
      title: row.title,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      attendanceStatus: row.attendanceStatus,
    })),
    workspace.records.filter(row => row.membershipId === params.membershipId)
      .map(row => ({
        scheduleEventId: row.scheduleEventId,
        membershipId: row.membershipId,
        status: row.status,
        markedAt: row.markedAt.toISOString(),
        note: row.note,
      })),
    new Date(),
  );
  return {
    student,
    course: {
      deliveryId: delivery.deliveryId, courseName: delivery.courseName,
      sectionName: delivery.sectionName,
      academicPeriodName: delivery.academicPeriodName,
    },
    summary: summarizeFacultyStudentAttendance(detail),
    sessions: detail.rows,
  };
}
