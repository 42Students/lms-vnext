import {facultyStudentRosterMetrics} from "./faculty-student-roster-metrics";
import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {learnerContentProgress,quizAttempts} from "@/db/schema";
import {facultyCourseCompletion} from "./faculty-course-completion-model";

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
  // Only published and learner-visible items count toward course progress.
  // This matches the college admin denominator without importing its broader
  // admin scope into a Faculty workspace.
  const visibleLessons=workspace.learningPath?.status==="PUBLISHED"?
   workspace.lessons.filter(lesson=>lesson.status==="ACTIVE"&&lesson.visibleToStudents&&lesson.deletedAt===null):[];
  const videoIds=[...new Set(visibleLessons.flatMap(lesson=>lesson.contents.filter(item=>
   item.status==="PUBLISHED"&&item.visibleToStudents&&item.deletedAt===null&&
   (item.contentType==="VIDEO"||item.contentType==="YOUTUBE"))
   .map(item=>item.id)))];
  const assignmentIds=[...new Set(visibleLessons.flatMap(lesson=>
   lesson.assignments.filter(item=>item.status==="PUBLISHED").map(item=>item.id)))];
  const quizIds=[...new Set(visibleLessons.flatMap(lesson=>
   lesson.quizzes.filter(item=>item.status==="PUBLISHED"&&item.legacyDeletedAt===null)
    .map(item=>item.id)))];
  const learnerIds=[...new Set(attendance?.roster.map(row=>row.membershipId)??[])];
  const courseCompletionReads=attendanceComplete&&assignmentsComplete?
   await Promise.all([
    learnerIds.length&&videoIds.length?getDb().select({
     membershipId:learnerContentProgress.membershipId,itemId:learnerContentProgress.lessonContentId,
     attempt:learnerContentProgress.attempt,completedAt:learnerContentProgress.completedAt,
     legacyWasDeleted:learnerContentProgress.legacyWasDeleted,
    }).from(learnerContentProgress).where(and(
     inArray(learnerContentProgress.membershipId,learnerIds),
     inArray(learnerContentProgress.lessonContentId,videoIds))):[],
    learnerIds.length&&quizIds.length?getDb().select({
     membershipId:quizAttempts.membershipId,itemId:quizAttempts.quizId,
     attemptNumber:quizAttempts.attemptNumber,submittedAt:quizAttempts.submittedAt,
     score:quizAttempts.score,maxScore:quizAttempts.maxScore,
    }).from(quizAttempts).where(and(
     eq(quizAttempts.deliveryId,course.deliveryId),
     inArray(quizAttempts.membershipId,learnerIds),
     inArray(quizAttempts.quizId,quizIds),
     isNull(quizAttempts.deletedAt))):[],
   ]).then(([videos,quizzes])=>({videos,quizzes})).catch(()=>null):null;
  const courseCompletion=courseCompletionReads?facultyCourseCompletion({
   learnerIds,videoIds,assignmentIds,quizIds,
   videos:courseCompletionReads.videos,
   quizzes:courseCompletionReads.quizzes,
   assignments:assignmentRows.filter(row=>assignmentIds.includes(row.id))
    .flatMap(row=>row.submissions.map(sub=>({
     membershipId:sub.membershipId,itemId:row.id,
    }))),
  }):null;
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
    courseCompletion,
    studentRosterMetrics:facultyStudentRosterMetrics({
      roster:attendance?.roster??[],
      attendanceSessions:attendance?.sessions??[],
      attendanceRecords:attendance?.records??[],
      assignments:assignmentRows,
    }),
    completeness: {
      attendance: attendanceComplete,
      assignments: assignmentsComplete,
    },
  };
}
