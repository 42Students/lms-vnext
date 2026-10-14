import { describe, expect, it } from "vitest";
import {
  bulkOfferWithdrawalSchema,
  classifyBulkOfferWithdrawal,
  summarizeBulkOfferWithdrawal,
} from "@/modules/placements/bulk-offer-withdrawal-model";
import { buildTpoNoShowReport } from "@/modules/placements/tpo-no-show-model";
import { tpoRoundAttendanceCsv } from "@/modules/placements/tpo-operations-export-model";
import type { TpoRoundRosterRow } from "@/modules/placements/tpo-round-drive-day-model";

const uuid = (index: number) =>
  "00000000-0000-4000-8000-" + String(index).padStart(12, "0");

describe("confirmed TPO bulk offer withdrawal", () => {
  const valid = {
    confirmed: true,
    reason: "Employer cancelled the role",
    offers: [{ id: uuid(1), expectedStatus: "ISSUED" as const }],
  };

  it("accepts a bounded explicit confirmation only", () => {
    expect(bulkOfferWithdrawalSchema.safeParse(valid).success).toBe(true);
    expect(bulkOfferWithdrawalSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
    expect(bulkOfferWithdrawalSchema.safeParse({ ...valid, reason: "short" }).success).toBe(false);
    expect(bulkOfferWithdrawalSchema.safeParse({ ...valid, offers: [] }).success).toBe(false);
    expect(bulkOfferWithdrawalSchema.safeParse({
      ...valid,
      offers: Array.from({ length: 51 }, (_, index) => ({
        id: uuid(index + 1), expectedStatus: "ISSUED",
      })),
    }).success).toBe(false);
    expect(bulkOfferWithdrawalSchema.safeParse({
      ...valid,
      offers: [{ ...valid.offers[0] }, { ...valid.offers[0] }],
    }).success).toBe(false);
    expect(bulkOfferWithdrawalSchema.safeParse({
      ...valid, collegeId: uuid(2),
    }).success).toBe(false);
    expect(bulkOfferWithdrawalSchema.safeParse({
      ...valid, action: "ACCEPT",
    }).success).toBe(false);
  });

  it("distinguishes unavailable, already withdrawn, stale and joined offers", () => {
    const result = [
      classifyBulkOfferWithdrawal(uuid(1), { status: "ISSUED", joiningStatus: null }, "ISSUED"),
      classifyBulkOfferWithdrawal(uuid(2), { status: "WITHDRAWN", joiningStatus: null }, "ISSUED"),
      classifyBulkOfferWithdrawal(uuid(3), { status: "ACCEPTED", joiningStatus: "JOINED" }, "ACCEPTED"),
      classifyBulkOfferWithdrawal(uuid(4), { status: "DECLINED", joiningStatus: null }, "ISSUED"),
      classifyBulkOfferWithdrawal(uuid(5), null, "ISSUED"),
      classifyBulkOfferWithdrawal(uuid(6), { status: "ACCEPTED", joiningStatus: "PENDING" }, "ACCEPTED"),
    ];
    expect(result.map((item) => item.status)).toEqual([
      "withdrawn", "already-withdrawn", "ineligible",
      "ineligible", "ineligible", "withdrawn",
    ]);
    expect(summarizeBulkOfferWithdrawal(result)).toEqual({
      withdrawn: 2,
      alreadyWithdrawn: 1,
      ineligible: 3,
    });
  });

  it("rejects stale client status rather than overriding it", () => {
    expect(classifyBulkOfferWithdrawal(
      uuid(1), { status: "ACCEPTED", joiningStatus: "PENDING" }, "ISSUED",
    )).toMatchObject({ status: "ineligible" });
  });
});

describe("no-show-only export projection", () => {
  function row(id: string, status: TpoRoundRosterRow["attendance"]): TpoRoundRosterRow {
    return {
      applicationId: id,
      displayName: id === "absent" ? "=FORMULA()" : id,
      rollNumber: null,
      applicationStatus: "SUBMITTED",
      attendance: status,
      resultStatus: null,
      resultOutcome: null,
    };
  }
  it("exports explicit ABSENT marks only and escapes spreadsheet formulae", () => {
    const data = {
      companyName: "Company",
      job: { title: "Role" },
      round: { name: "Round", status: "COMPLETED", scheduledAt: null },
      rows: [row("absent", "ABSENT"), row("waiting", "WAITING"), row("present", "PRESENT")],
    };
    const report = buildTpoNoShowReport(data.rows);
    expect(report.explicitlyAbsentCount).toBe(1);
    const csv = tpoRoundAttendanceCsv({ ...data, rows: report.explicitAbsences });
    expect(csv).toContain("\"'=FORMULA()\"");
    expect(csv).toContain('"ABSENT"');
    expect(csv).not.toContain('"waiting"');
    expect(csv).not.toContain('"present"');
    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("produces an honest headings-only CSV for no persisted absences", () => {
    const data = {
      companyName: "Company",
      job: { title: "Role" },
      round: { name: "Round", status: "PENDING", scheduledAt: null },
      rows: [row("unmarked", "WAITING")],
    };
    const csv = tpoRoundAttendanceCsv({
      ...data,
      rows: buildTpoNoShowReport(data.rows).explicitAbsences,
    });
    expect(csv.split("\r\n")).toHaveLength(1);
    expect(csv).toContain('"Attendance"');
  });
});
