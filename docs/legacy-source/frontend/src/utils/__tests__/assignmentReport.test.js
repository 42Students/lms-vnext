import { buildAssignmentReport } from "../assignmentReport";

const ASSIGNMENT = {
  contentTitle: "Week 2 Homework",
  contentDataDTO: { due_date: "2026-09-20T18:00:00.000Z", points: 20 },
};

function submission(overrides = {}) {
  return {
    studentId: 1,
    studentFirstName: "Asha",
    studentLastName: "Rao",
    points: 20,
    pointsObtained: 18,
    graded: 1,
    createdAt: "2026-09-19T10:00:00.000Z",
    ...overrides,
  };
}

function rosterEntry(overrides = {}) {
  return { learnerId: 1, firstName: "Asha", lastName: "Rao", ...overrides };
}

test("computes average, distribution and graded count from graded submissions only", () => {
  const submissions = [
    submission({ studentId: 1, pointsObtained: 18, graded: 1 }),
    submission({ studentId: 2, studentFirstName: "Ravi", studentLastName: "Kumar", pointsObtained: null, graded: 0 }),
  ];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions });

  expect(report.submittedCount).toBe(2);
  expect(report.gradedCount).toBe(1);
  expect(report.avgPercent).toBe(90); // only the graded one counts
});

test("keeps only the most recent submission per student on resubmission", () => {
  const submissions = [
    submission({ studentId: 1, pointsObtained: 10, createdAt: "2026-09-18T10:00:00.000Z", updatedAt: "2026-09-18T10:00:00.000Z" }),
    submission({ studentId: 1, pointsObtained: 18, createdAt: "2026-09-19T10:00:00.000Z", updatedAt: "2026-09-19T10:00:00.000Z" }),
  ];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions });

  expect(report.students).toHaveLength(1);
  expect(report.students[0].score).toBe(18);
});

test("splits submissions into on-time vs. late against the assignment's due date", () => {
  const submissions = [
    submission({ studentId: 1, createdAt: "2026-09-19T10:00:00.000Z" }), // before due date
    submission({ studentId: 2, studentFirstName: "Ravi", studentLastName: "Kumar", createdAt: "2026-09-21T10:00:00.000Z" }), // after
  ];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions });

  expect(report.onTimeCount).toBe(1);
  expect(report.lateCount).toBe(1);
  expect(report.students.find((s) => s.id === 1).isLate).toBe(false);
  expect(report.students.find((s) => s.id === 2).isLate).toBe(true);
});

test("lists enrolled students who have not submitted at all, using the roster", () => {
  const submissions = [submission({ studentId: 1 })];
  const roster = [
    rosterEntry({ learnerId: 1 }),
    rosterEntry({ learnerId: 2, firstName: "Ravi", lastName: "Kumar" }),
    rosterEntry({ learnerId: 3, firstName: "Meena", lastName: "Iyer" }),
  ];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions, roster });

  expect(report.rosterSize).toBe(3);
  expect(report.completionPercent).toBe(33);
  expect(report.notSubmitted.map((s) => s.name).sort()).toEqual(["Meena Iyer", "Ravi Kumar"]);
});

test("with no roster, completion has no denominator rather than a misleading 100%", () => {
  const submissions = [submission({ studentId: 1 })];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions });

  expect(report.rosterSize).toBeNull();
  expect(report.completionPercent).toBeNull();
  expect(report.notSubmitted).toEqual([]);
});

test("a submitted student is never listed as missing just because studentId arrived as a string", () => {
  // Seen elsewhere in this codebase (e.g. computeAtRiskStudents) -- the submissions endpoint and
  // the roster endpoint don't reliably agree on numeric vs. string ids.
  const submissions = [submission({ studentId: "1" })];
  const roster = [rosterEntry({ learnerId: 1 }), rosterEntry({ learnerId: 2, firstName: "Ravi", lastName: "Kumar" })];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions, roster });

  expect(report.notSubmitted.map((s) => s.name)).toEqual(["Ravi Kumar"]);
});

test("graded===1 with a non-numeric pointsObtained does not corrupt the average with NaN", () => {
  const submissions = [
    submission({ studentId: 1, graded: 1, pointsObtained: undefined }),
    submission({ studentId: 2, studentFirstName: "Ravi", studentLastName: "Kumar", graded: 1, pointsObtained: 15 }),
  ];
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions });

  expect(Number.isNaN(report.avgPercent)).toBe(false);
  expect(report.avgPercent).toBe(75); // only the valid 15/20 counts
  expect(report.students.find((s) => s.id === 1).percent).toBeNull();
});

test("an assignment with no submissions produces sensible empty values, not crashes", () => {
  const report = buildAssignmentReport({ assignment: ASSIGNMENT, submissions: [] });
  expect(report.students).toEqual([]);
  expect(report.avgPercent).toBeNull();
  expect(report.onTimeCount).toBe(0);
  expect(report.lateCount).toBe(0);
});
