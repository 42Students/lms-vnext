import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { getFacultyAttendanceWorkspace } from "@/modules/attendance/faculty-service";
import { listAssignmentSubmissions } from "./assignment-submission-service";
import {
  getFacultyCourseWorkspace,
} from "./faculty-course-service";
import {
  buildFacultyCourseHomeSignals,
} from "./faculty-course-home-model";

type Workspace = Awaited<
  ReturnType<typeof getFacultyCourseWorkspace>
>;

export async function getFacultyCourseHomeSignals(
  context: RequestContext,
  workspace: Workspace,
) {
  const { course } = workspace;
  const [attendance, assignmentRows] =
    await Promise.all([
      getFacultyAttendanceWorkspace(
        context,
        course.deliveryId,
      ),
      Promise.all(
        workspace.lessons.flatMap((lesson) =>
          lesson.assignments.map(
            async (assignment) => ({
              id: assignment.id,
              lessonId: lesson.id,
              title: assignment.title,
              dueAt: assignment.dueAt,
              maxPoints: assignment.maxPoints,
              status: assignment.status,
              submissions:
                await listAssignmentSubmissions(
                  context,
                  assignment.id,
                  course.deliveryId,
                ),
            }),
          ),
        ),
      ),
    ]);

  return buildFacultyCourseHomeSignals({
    roster: attendance.roster,
    attendanceSessions:
      attendance.sessions.map(
        (session) => ({
          id: session.id,
          startsAt: session.startsAt,
          attendanceStatus:
            session.attendanceStatus,
        }),
      ),
    attendanceRecords:
      attendance.records.map((record) => ({
        scheduleEventId:
          record.scheduleEventId,
        membershipId:
          record.membershipId,
        status: record.status,
      })),
    assignments: assignmentRows,
  });
}
