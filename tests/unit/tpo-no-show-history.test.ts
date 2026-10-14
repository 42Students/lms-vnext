import { describe, expect, it } from "vitest";
import {
  buildTpoNoShowReport,
} from "@/modules/placements/tpo-no-show-model";
import {
  projectTpoStudentPlacementHistory,
  tpoStudentHistoryQuerySchema,
} from "@/modules/placements/tpo-student-history-model";
import type { TpoRoundRosterRow } from "@/modules/placements/tpo-round-drive-day-model";

function row(id: string, attendance: TpoRoundRosterRow["attendance"]): TpoRoundRosterRow {
  return {
    applicationId: id,
    displayName: "Learner " + id,
    rollNumber: null,
    applicationStatus: "SUBMITTED",
    attendance,
    resultStatus: "APPLIED",
    resultOutcome: "FAIL",
  };
}

describe("TPO round no-show projection", () => {
  it("counts only explicit ABSENT marks, not WAITING or negative interview results", () => {
    const report = buildTpoNoShowReport([
      row("one", "ABSENT"),
      row("two", "WAITING"),
      row("three", "UNKNOWN"),
      row("four", "PRESENT"),
      row("five", "DONE"),
    ]);
    expect(report.totalRoster).toBe(5);
    expect(report.explicitlyAbsentCount).toBe(1);
    expect(report.explicitAbsences.map((item) => item.applicationId)).toEqual(["one"]);
    expect(report.awaitingMarkCount).toBe(1);
    expect(report.unknownCount).toBe(1);
  });

  it("does not infer an absence from an empty round", () => {
    expect(buildTpoNoShowReport([])).toMatchObject({
      totalRoster: 0,
      explicitlyAbsentCount: 0,
      awaitingMarkCount: 0,
      unknownCount: 0,
    });
  });
});

describe("TPO learner placement history projection", () => {
  const application = {
    id: "app-1",
    jobTitle: "Engineer",
    companyName: "Employer",
    seasonName: "2026",
    roleTitle: "Backend",
    applicationStatus: "WITHDRAWN",
    channel: "INTERNAL",
    submittedAt: new Date("2026-01-10T10:00:00Z"),
  };

  it("distinguishes offer versions, accepted statuses and confirmed joins", () => {
    const value = projectTpoStudentPlacementHistory(
      [application],
      [
        {
          id: "offer-old", applicationId: "app-1", status: "DECLINED",
          roleTitle: "Backend", annualCtcInr: null,
          issuedAt: new Date("2026-01-11T10:00:00Z"), joiningStatus: null,
        },
        {
          id: "offer-accepted", applicationId: "app-1", status: "ACCEPTED",
          roleTitle: "Backend", annualCtcInr: 900000,
          issuedAt: new Date("2026-01-12T10:00:00Z"), joiningStatus: "JOINED",
        },
      ],
      [{
        id: "round-1", applicationId: "app-1", name: "Interview",
        outcome: "PASS", appliedAt: new Date("2026-01-10T11:00:00Z"),
        status: "APPLIED", version: 1, submittedAt: new Date("2026-01-10T10:30:00Z"),
      }],
    );
    expect(value.pageFacts).toEqual({
      applications: 1, resultVersions: 1, stagedResults: 0,
      offerVersions: 2, acceptedOfferVersions: 1, confirmedJoins: 1,
    });
    expect(value.items[0]?.offers[0]?.status).toBe("ACCEPTED");
    expect(value.items[0]?.applicationStatus).toBe("WITHDRAWN");
    expect(value.items[0]?.appliedRounds[0]?.outcome).toBe("PASS");
  });

  it("does not treat an issued offer or missing joining outcome as a placement", () => {
    const value = projectTpoStudentPlacementHistory(
      [application],
      [{
        id: "offer-issued", applicationId: "app-1", status: "ISSUED",
        roleTitle: "Backend", annualCtcInr: null,
        issuedAt: new Date("2026-01-12T10:00:00Z"), joiningStatus: null,
      }],
      [],
    );
    expect(value.pageFacts.confirmedJoins).toBe(0);
    expect(value.pageFacts.acceptedOfferVersions).toBe(0);
    expect(value.items[0]?.appliedRounds).toEqual([]);
  });

  it("distinguishes staged/superseded versions from applied decisions", () => {
    const value = projectTpoStudentPlacementHistory(
      [application],
      [],
      [
        {
          id: "staged", applicationId: "app-1", name: "Interview",
          outcome: "PASS", status: "STAGED", version: 3,
          submittedAt: new Date("2026-01-11T09:00:00Z"), appliedAt: null,
        },
        {
          id: "superseded", applicationId: "app-1", name: "Interview",
          outcome: "FAIL", status: "SUPERSEDED", version: 2,
          submittedAt: new Date("2026-01-10T10:00:00Z"), appliedAt: null,
        },
        {
          id: "final", applicationId: "app-1", name: "Interview",
          outcome: "PASS", status: "APPLIED", version: 1,
          submittedAt: new Date("2026-01-10T09:00:00Z"),
          appliedAt: new Date("2026-01-10T12:00:00Z"),
        },
      ],
      [{
        id: "app-event", applicationId: "app-1",
        fromStatus: null, toStatus: "SUBMITTED",
        createdAt: new Date("2026-01-10T09:00:00Z"),
      }],
    );
    expect(value.pageFacts.resultVersions).toBe(3);
    expect(value.pageFacts.stagedResults).toBe(1);
    expect(value.items[0]?.resultVersions.map((result) => result.status))
      .toEqual(["STAGED", "SUPERSEDED", "APPLIED"]);
    expect(value.items[0]?.appliedRounds).toHaveLength(1);
    expect(value.items[0]?.appliedRounds[0]?.outcome).toBe("PASS");
    expect(value.items[0]?.applicationEvents[0]?.toStatus).toBe("SUBMITTED");
  });

    it("rejects forged college parameters and invalid pagination", () => {
    const membershipId = "00000000-0000-4000-8000-000000000011";
    expect(tpoStudentHistoryQuerySchema.parse({ membershipId, page: "2" }))
      .toEqual({ membershipId, page: 2 });
    expect(tpoStudentHistoryQuerySchema.safeParse({
      membershipId, collegeId: membershipId,
    }).success).toBe(false);
    expect(tpoStudentHistoryQuerySchema.safeParse({ membershipId, page: "0" }).success)
      .toBe(false);
    expect(tpoStudentHistoryQuerySchema.safeParse({ membershipId: "invalid" }).success)
      .toBe(false);
  });
});
