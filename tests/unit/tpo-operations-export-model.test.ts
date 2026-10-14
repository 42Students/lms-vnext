import { describe, expect, it } from "vitest";
import {
  projectTpoCompanyContactRows,
  tpoRoundAttendanceCsv,
} from "@/modules/placements/tpo-operations-export-model";
import { tpoCompanyContactLogQuerySchema } from "@/modules/placements/tpo-company-contact-log-service";

describe("TPO Drive Day attendance export", () => {
  it("neutralizes spreadsheet formula cells and escapes quotes", () => {
    const csv = tpoRoundAttendanceCsv({
      companyName: "=BAD()",
      job: { title: "Engineer" },
      round: {
        name: 'Interview "A"',
        status: "COMPLETED",
        scheduledAt: new Date("2026-10-14T03:30:00Z"),
      },
      rows: [{
        applicationId: "application-1",
        displayName: "+DANGEROUS",
        rollNumber: "@42",
        applicationStatus: "SUBMITTED",
        attendance: "PRESENT",
        resultStatus: "APPLIED",
        resultOutcome: "PASS",
      }],
    });
    expect(csv).toContain("\"'=BAD()\"");
    expect(csv).toContain("\"'+DANGEROUS\"");
    expect(csv).toContain("\"'@42\"");
    expect(csv).toContain('"Interview ""A"""');
    expect(csv).toContain('"2026-10-14T03:30:00.000Z"');
  });

  it("does not misrepresent staged outcomes as applied", () => {
    const csv = tpoRoundAttendanceCsv({
      companyName: "Company",
      job: { title: "Role" },
      round: { name: "Round", status: "SCHEDULED", scheduledAt: null },
      rows: [{
        applicationId: "application-2",
        displayName: "Candidate",
        rollNumber: null,
        applicationStatus: "SUBMITTED",
        attendance: "WAITING",
        resultStatus: "STAGED",
        resultOutcome: "FAIL",
      }],
    });
    expect(csv).toContain('"STAGED",""');
    expect(csv).not.toContain('"FAIL"');
  });

  it("emits headings only when no round roster is persisted", () => {
    const csv = tpoRoundAttendanceCsv({
      companyName: "Company",
      job: { title: "Role" },
      round: { name: "Round", status: "PENDING", scheduledAt: null },
      rows: [],
    });
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});

describe("TPO company contact log model", () => {
  it("projects persisted fields without contact addresses or private notes", () => {
    const rows = projectTpoCompanyContactRows([{
      id: "activity-1",
      leadName: "  Recruiter A  ",
      type: "CALL",
      outcome: null,
      createdAt: new Date("2026-10-14T02:00:00Z"),
    }]);
    expect(rows).toEqual([{
      id: "activity-1",
      contactName: "Recruiter A",
      type: "CALL",
      outcome: "Not recorded",
      occurredAtIso: "2026-10-14T02:00:00.000Z",
    }]);
    expect(Object.keys(rows[0]!)).not.toContain("email");
    expect(Object.keys(rows[0]!)).not.toContain("note");
  });

  it("rejects extra scope fields and unsupported filters", () => {
    const companyId = "00000000-0000-4000-8000-000000000001";
    expect(tpoCompanyContactLogQuerySchema.parse({
      companyId,
      page: "2",
      type: "CALL",
    })).toEqual({ companyId, page: 2, type: "CALL" });
    expect(tpoCompanyContactLogQuerySchema.safeParse({
      companyId, collegeId: companyId,
    }).success).toBe(false);
    expect(tpoCompanyContactLogQuerySchema.safeParse({
      companyId, page: "0",
    }).success).toBe(false);
    expect(tpoCompanyContactLogQuerySchema.safeParse({
      companyId, type: "NOT_REAL",
    }).success).toBe(false);
  });
});
