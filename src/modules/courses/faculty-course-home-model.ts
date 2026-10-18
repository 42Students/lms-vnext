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
  // Do not let duplicate or invalid timetable data inflate a student's
  // denominator. Only current enrolled learners contribute to this snapshot.
  const roster = [...new Map(input.roster.map(learner => [learner.membershipId,learner] as const)).values()];
  const rosterIds = new Set(roster.map(learner => learner.membershipId));
  const heldMarkedSessions = [...new Map(
    input.attendanceSessions.filter(session =>
      Number.isFinite(session.startsAt.getTime()) &&
      session.startsAt.getTime() <= now.getTime() &&
      session.attendanceStatus === "MARKED"
    ).map(session=>[session.id,session] as const),
  ).values()];
  const markedIds = new Set(heldMarkedSessions.map(session=>session.id));
  const countedAbsences = new Set<string>();
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
      !rosterIds.has(record.membershipId) ||
      !isAbsentStatus(record.status)
    ) {
      continue;
    }
    const absenceKey = record.scheduleEventId+":"+record.membershipId;
    if(countedAbsences.has(absenceKey))continue;
    countedAbsences.add(absenceKey);
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

  const rosterSize = roster.length;
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

  const lowAttendance = roster
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
                  rosterIds.has(submission.membershipId) &&
                  submission.gradingStatus !== "GRADED",
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
      assignment.status !== "PUBLISHED"
    ) {
      continue;
    }
    for (const submission of
      assignment.submissions) {
      if (
        !rosterIds.has(submission.membershipId) ||
        submission.gradingStatus !== "GRADED" ||
        submission.pointsAwarded === null ||
        !Number.isFinite(submission.pointsAwarded) ||
        !Number.isFinite(assignment.maxPoints) ||
        submission.pointsAwarded < 0 ||
        submission.pointsAwarded > assignment.maxPoints
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
  const studentAverages = roster
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

  const contentPerformance=input.assignments.flatMap(assignment=>{
    if(assignment.status!=="PUBLISHED"||assignment.maxPoints<=0)return [];
    const scores=assignment.submissions.filter(sub=>
      rosterIds.has(sub.membershipId)&&sub.gradingStatus==="GRADED"&&
      sub.pointsAwarded!==null&&Number.isFinite(sub.pointsAwarded)&&
      sub.pointsAwarded>=0&&sub.pointsAwarded<=assignment.maxPoints
    ).map(sub=>Math.round(100*(sub.pointsAwarded!)/assignment.maxPoints));
    if(scores.length<3)return [];
    return [{id:assignment.id,title:assignment.title,graded:scores.length,
      averagePercent:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}];
  }).sort((a,b)=>a.averagePercent-b.averagePercent||a.title.localeCompare(b.title));
  const weakestContent=contentPerformance[0]??null;
  const strongestContent=contentPerformance.length>1?contentPerformance[contentPerformance.length-1]:null;

  const missingCounts = new Map<
    string,
    number
  >();
  for (const assignment of input.assignments) {
    if (
      assignment.status !== "PUBLISHED" ||
      !assignment.dueAt ||
      !Number.isFinite(assignment.dueAt.getTime()) ||
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
    for (const learner of roster) {
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
  const allAtRisk = roster
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
        attendancePercent:attendance?.attendancePercent??null,
        missingSubmissionCount:missing,
        averageGradePercent:studentAverages.find(row=>row.membershipId===learner.membershipId)?.averagePercent??null,
      }];
    })
    .sort(
      (a, b) =>
        b.severity - a.severity ||
        a.name.localeCompare(b.name),
    );
  const atRiskTotal=allAtRisk.length;
  const atRiskCounts={
    critical:allAtRisk.filter(row=>row.severity>=3).length,
    moderate:allAtRisk.filter(row=>row.severity<3).length,
  };
  const atRisk=allAtRisk.slice(0,8);

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
      weakestContent,
      strongestContent,
    },
    atRisk,
    atRiskCounts,
    atRiskTotal,
  };
}
