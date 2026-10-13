import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTpoRoundDriveDayRoster,
  type TpoRoundApplicationDetail,
  type TpoRoundRosterSourceStudent,
} from "@/modules/placements/tpo-round-drive-day-model";

const students: TpoRoundRosterSourceStudent[] = [
  {
    applicationId: "app-2",
    displayName: "Zara",
    rollNumber: "22CSE002",
    attendance: "IN_INTERVIEW",
  },
  {
    applicationId: "app-1",
    displayName: "Asha",
    rollNumber: "22CSE001",
    attendance: "PRESENT",
  },
  {
    applicationId: "app-3",
    displayName: "Bina",
    rollNumber: null,
    attendance: "WAITING",
  },
  {
    applicationId: "app-4",
    displayName: "Devi",
    rollNumber: "22CSE004",
    attendance: "DONE",
  },
  {
    applicationId: "app-5",
    displayName: "Esha",
    rollNumber: "22CSE005",
    attendance: "ABSENT",
  },
];

const details: TpoRoundApplicationDetail[] = [
  {
    applicationId: "app-1",
    applicationStatus: "SUBMITTED",
    resultStatus: "APPLIED",
    resultOutcome: "PASS",
  },
  {
    applicationId: "app-2",
    applicationStatus: "SUBMITTED",
    resultStatus: "STAGED",
    resultOutcome: "HOLD",
  },
  {
    applicationId: "app-3",
    applicationStatus: "SUBMITTED",
    resultStatus: null,
    resultOutcome: null,
  },
  {
    applicationId: "app-4",
    applicationStatus: "SUBMITTED",
    resultStatus: "APPLIED",
    resultOutcome: "PASS",
  },
  {
    applicationId: "app-5",
    applicationStatus: "SUBMITTED",
    resultStatus: "APPLIED",
    resultOutcome: "ABSENT",
  },
];

describe("TPO round Drive Day projection", () => {
  it("preserves applicant identity, application status and current result outcome", () => {
    const result = buildTpoRoundDriveDayRoster(
      students,
      details,
    );

    expect(
      result.rows.map((row) => row.displayName),
    ).toEqual([
      "Asha",
      "Bina",
      "Devi",
      "Esha",
      "Zara",
    ]);

    expect(result.rows[0]).toEqual({
      applicationId: "app-1",
      displayName: "Asha",
      rollNumber: "22CSE001",
      applicationStatus: "SUBMITTED",
      attendance: "PRESENT",
      resultStatus: "APPLIED",
      resultOutcome: "PASS",
    });
  });

  it("counts each persisted attendance state separately", () => {
    const result = buildTpoRoundDriveDayRoster(
      students,
      details,
    );

    expect(result.counts).toMatchObject({
      total: 5,
      waiting: 1,
      present: 1,
      inInterview: 1,
      done: 1,
      absent: 1,
      unknownAttendance: 0,
    });
  });

  it("distinguishes staged, applied and missing results", () => {
    const result = buildTpoRoundDriveDayRoster(
      students,
      details,
    );

    expect(result.counts).toMatchObject({
      stagedResults: 1,
      appliedResults: 3,
      noResult: 1,
    });

    expect(
      result.rows.find(
        (row) => row.applicationId === "app-2",
      ),
    ).toMatchObject({
      resultStatus: "STAGED",
      resultOutcome: "HOLD",
    });

    expect(
      result.rows.find(
        (row) => row.applicationId === "app-3",
      ),
    ).toMatchObject({
      resultStatus: null,
      resultOutcome: null,
    });
  });

  it("does not introduce applicants from detail rows outside the authorized roster", () => {
    const result = buildTpoRoundDriveDayRoster(
      [students[0]!],
      [
        details[1]!,
        {
          applicationId: "foreign-app",
          applicationStatus: "SUBMITTED",
          resultStatus: "APPLIED",
          resultOutcome: "PASS",
        },
      ],
    );

    expect(
      result.rows.map((row) => row.applicationId),
    ).toEqual(["app-2"]);

    expect(result.counts.total).toBe(1);
  });

  it("omits roster records without matching scoped application details", () => {
    const result = buildTpoRoundDriveDayRoster(
      students,
      [details[0]!],
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.applicationId).toBe(
      "app-1",
    );
    expect(result.counts.total).toBe(1);
  });

  it("does not misclassify an unexpected attendance state as present", () => {
    const result = buildTpoRoundDriveDayRoster(
      [
        {
          ...students[0]!,
          attendance: "UNEXPECTED",
        },
      ],
      [details[1]!],
    );

    expect(result.rows[0]?.attendance).toBe(
      "UNKNOWN",
    );

    expect(result.counts).toMatchObject({
      total: 1,
      present: 0,
      unknownAttendance: 1,
    });
  });

  it("ignores an outcome when there is no current result record", () => {
    const result = buildTpoRoundDriveDayRoster(
      [students[0]!],
      [
        {
          applicationId: "app-2",
          applicationStatus: "SUBMITTED",
          resultStatus: null,
          resultOutcome: "PASS",
        },
      ],
    );

    expect(result.rows[0]?.resultOutcome).toBeNull();
    expect(result.counts.noResult).toBe(1);
  });

  it("does not mutate source arrays", () => {
    const originalStudents = students.map(
      (student) => ({ ...student }),
    );

    const originalDetails = details.map(
      (detail) => ({ ...detail }),
    );

    buildTpoRoundDriveDayRoster(
      students,
      details,
    );

    expect(students).toEqual(originalStudents);
    expect(details).toEqual(originalDetails);
  });

  it("returns zero counts for an empty round roster", () => {
    const result = buildTpoRoundDriveDayRoster(
      [],
      [],
    );

    expect(result.rows).toEqual([]);

    expect(
      Object.values(result.counts).every(
        (count) => count === 0,
      ),
    ).toBe(true);
  });
});
