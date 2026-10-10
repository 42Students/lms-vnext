import { buildScoreDistribution } from "./faculty-assessment-report-service";

type RosterLearner = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
};

type AttendanceSession = {
  id: string;
  startsAt: Date;
  attendanceStatus: string | null;
};

type AttendanceRecord = {
  scheduleEventId: string;
  membershipId: string;
  status: string;
};

type AssignmentInput = {
  id: string;
  title: string;
  dueAt: Date | null;
  maxPoints: number;
  status: string;
  lessonId: string;
  submissions: readonly {
    membershipId: string;
    gradingStatus: string;
    pointsAwarded: number | null;
  }[];
};

function learnerName(learner: RosterLearner) {
  return (
    learner.displayName?.trim() ||
    learner.email ||
    "Learner"
  );
}

function isAbsentStatus(status: string) {
  return (
    status === "ABSENT" ||
    status === "EXCUSED" ||
    status === "MEDICAL" ||
    status === "LATE"
  );
}

export function buildFacultyCourseHomeSignals(
  input: {
    roster: readonly RosterLearner[];
    attendanceSessions: readonly AttendanceSession[];
    attendanceRecords: readonly AttendanceRecord[];
    assignments: readonly AssignmentInput[];
  },
  now = new Date(),
) {
  const heldMarkedSessions =
    input.attendanceSessions.filter(
      (session) =>
        session.startsAt.getTime() <=
          now.getTime() &&
        session.attendanceStatus === "MARKED",
    );
  const markedIds = new Set(
    heldMarkedSessions.map(
      (session) => session.id,
    ),
  );
  const absencesByLearner = new Map<
    string,
    number
  >();
  const absencesBySession = new Map<
    string,
    number
  >();
  for (const record of input.attendanceRecords) {
    if (
      !markedIds.has(record.scheduleEventId) ||
      !isAbsentStatus(record.status)
    ) {
      continue;
    }
    absencesByLearner.set(
      record.membershipId,
      (absencesByLearner.get(
        record.membershipId,
      ) ?? 0) + 1,
    );
    absencesBySession.set(
      record.scheduleEventId,
      (absencesBySession.get(
        record.scheduleEventId,
      ) ?? 0) + 1,
    );
  }

  const rosterSize = input.roster.length;
  const sessionPercentages =
    rosterSize > 0
      ? heldMarkedSessions.map(
          (session) =>
            Math.round(
              ((rosterSize -
                (absencesBySession.get(
                  session.id,
                ) ?? 0)) /
                rosterSize) *
                100,
            ),
        )
      : [];
  const averageAttendance =
    sessionPercentages.length > 0
      ? Math.round(
          sessionPercentages.reduce(
            (sum, value) => sum + value,
            0,
          ) / sessionPercentages.length,
        )
      : null;

  const lowAttendance = input.roster
    .flatMap((learner) => {
      const absentCount =
        absencesByLearner.get(
          learner.membershipId,
        ) ?? 0;
      if (
        heldMarkedSessions.length === 0 ||
        absentCount <=
          heldMarkedSessions.length * 0.25
      ) {
        return [];
      }
      return [{
        membershipId: learner.membershipId,
        name: learnerName(learner),
        absentCount,
        attendancePercent: Math.round(
          ((heldMarkedSessions.length -
            absentCount) /
            heldMarkedSessions.length) *
            100,
        ),
      }];
    })
    .sort(
      (a, b) =>
        a.attendancePercent -
          b.attendancePercent ||
        a.name.localeCompare(b.name),
    );

  const pendingSubmissions =
    input.assignments.flatMap(
      (assignment) =>
        assignment.status === "PUBLISHED"
          ? assignment.submissions
              .filter(
                (submission) =>
                  submission.gradingStatus !==
                  "GRADED",
              )
              .map((submission) => ({
                assignmentId: assignment.id,
                assignmentTitle:
                  assignment.title,
                lessonId: assignment.lessonId,
                membershipId:
                  submission.membershipId,
              }))
          : [],
    );

  const studentScores = new Map<
    string,
    number[]
  >();
  for (const assignment of input.assignments) {
    if (
      assignment.maxPoints <= 0 ||
      assignment.status === "ARCHIVED"
    ) {
      continue;
    }
    for (const submission of
      assignment.submissions) {
      if (
        submission.gradingStatus !==
          "GRADED" ||
        submission.pointsAwarded === null ||
        submission.pointsAwarded < 0 ||
        submission.pointsAwarded >
          assignment.maxPoints
      ) {
        continue;
      }
      const scores =
        studentScores.get(
          submission.membershipId,
        ) ?? [];
      scores.push(
        Math.min(
          100,
          Math.round(
            (submission.pointsAwarded /
              assignment.maxPoints) *
              100,
          ),
        ),
      );
      studentScores.set(
        submission.membershipId,
        scores,
      );
    }
  }
  const studentAverages = input.roster
    .flatMap((learner) => {
      const scores = studentScores.get(
        learner.membershipId,
      );
      if (!scores?.length) return [];
      return [{
        membershipId: learner.membershipId,
        name: learnerName(learner),
        averagePercent: Math.round(
          scores.reduce(
            (sum, score) => sum + score,
            0,
          ) / scores.length,
        ),
      }];
    })
    .sort(
      (a, b) =>
        a.averagePercent -
          b.averagePercent ||
        a.name.localeCompare(b.name),
    );
  const averagePerformance =
    studentAverages.length > 0
      ? Math.round(
          studentAverages.reduce(
            (sum, learner) =>
              sum +
              learner.averagePercent,
            0,
          ) / studentAverages.length,
        )
      : null;

  const missingCounts = new Map<
    string,
    number
  >();
  for (const assignment of input.assignments) {
    if (
      assignment.status !== "PUBLISHED" ||
      !assignment.dueAt ||
      assignment.dueAt.getTime() >
        now.getTime()
    ) {
      continue;
    }
    const submitted = new Set(
      assignment.submissions.map(
        (submission) =>
          submission.membershipId,
      ),
    );
    for (const learner of input.roster) {
      if (
        !submitted.has(
          learner.membershipId,
        )
      ) {
        missingCounts.set(
          learner.membershipId,
          (missingCounts.get(
            learner.membershipId,
          ) ?? 0) + 1,
        );
      }
    }
  }

  const attendanceByLearner = new Map(
    lowAttendance.map((learner) => [
      learner.membershipId,
      learner,
    ]),
  );
  const atRisk = input.roster
    .flatMap((learner) => {
      const attendance =
        attendanceByLearner.get(
          learner.membershipId,
        );
      const missing =
        missingCounts.get(
          learner.membershipId,
        ) ?? 0;
      if (!attendance && missing < 2) {
        return [];
      }
      const reasons: string[] = [];
      let severity = 0;
      if (attendance) {
        reasons.push(
          `${attendance.attendancePercent}% attendance`,
        );
        severity +=
          attendance.attendancePercent < 50
            ? 3
            : 2;
      }
      if (missing >= 2) {
        reasons.push(
          `${missing} submissions missing`,
        );
        severity += missing >= 3 ? 3 : 2;
      }
      return [{
        membershipId:
          learner.membershipId,
        name: learnerName(learner),
        reasons,
        severity,
      }];
    })
    .sort(
      (a, b) =>
        b.severity - a.severity ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 8);

  return {
    pendingSubmissions,
    attendance: {
      markedSessions:
        heldMarkedSessions.length,
      averagePercent:
        averageAttendance,
      lowAttendance,
    },
    performance: {
      averagePercent:
        averagePerformance,
      distribution:
        buildScoreDistribution(
          studentAverages.map(
            (learner) =>
              learner.averagePercent,
          ),
        ),
      studentAverages,
    },
    atRisk,
  };
}
