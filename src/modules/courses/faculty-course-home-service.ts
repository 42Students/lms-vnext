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
  // FAC-courses-27: preserve successful partial results. An outage for
  // attendance or one assignment must not incorrectly report zero learners
  // needing attention or discard every other valid signal.
  const [attendanceResult, assignmentResults] = await Promise.all([
    getFacultyAttendanceWorkspace(context, course.deliveryId)
      .then((value) => ({ value }))
      .catch(() => ({ value: null })),
    Promise.allSettled(
      workspace.lessons.flatMap((lesson) =>
        lesson.assignments.map(async (assignment) => ({
          id: assignment.id,
          lessonId: lesson.id,
          title: assignment.title,
          dueAt: assignment.dueAt,
          maxPoints: assignment.maxPoints,
          status: assignment.status,
          submissions: await listAssignmentSubmissions(
            context, assignment.id, course.deliveryId,
          ),
        })),
      ),
    ),
  ]);
  const attendance = attendanceResult.value;
  const assignmentRows = assignmentResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const attendanceComplete = attendance !== null;
  const assignmentsComplete = assignmentResults.every(
    (result) => result.status === "fulfilled",
  );
  const signals = buildFacultyCourseHomeSignals({
    roster: attendance?.roster ?? [],
    attendanceSessions: attendance?.sessions.map((session) => ({
      id: session.id,
      startsAt: session.startsAt,
      attendanceStatus: session.attendanceStatus,
    })) ?? [],
    attendanceRecords: attendance?.records.map((record) => ({
      scheduleEventId: record.scheduleEventId,
      membershipId: record.membershipId,
      status: record.status,
    })) ?? [],
    assignments: assignmentRows,
  });
  return {
    ...signals,
    completeness: {
      attendance: attendanceComplete,
      assignments: assignmentsComplete,
    },
  };
}
