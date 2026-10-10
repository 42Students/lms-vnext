import { describe, expect, it } from "vitest";
import { coordinatorRoundOnDutyDate } from "@/modules/placements/drive-day-coordinator-policy";

describe("W04 Drive Day limited learner coordinator scope", () => {
  const dutyDate = "2026-10-20";
  const eligible = (scheduledAt: Date | null, roundStatus = "SCHEDULED") =>
    coordinatorRoundOnDutyDate({ scheduledAt, roundStatus, dutyDate });

  it("allows only scheduled or just-completed rounds on the coordinator's assigned India date", () => {
    expect(eligible(new Date("2026-10-20T18:29:59.000Z"))).toBe(true);
    expect(eligible(new Date("2026-10-20T18:29:59.000Z"), "COMPLETED")).toBe(true);
    expect(eligible(new Date("2026-10-20T18:30:00.000Z"))).toBe(false);
    expect(eligible(new Date("2026-10-19T18:29:59.000Z"))).toBe(false);
  });

  it("does not authorize pending, cancelled, or unscheduled rounds even on the same job", () => {
    const sameDay = new Date("2026-10-20T10:00:00.000Z");
    expect(eligible(sameDay, "PENDING")).toBe(false);
    expect(eligible(sameDay, "CANCELLED")).toBe(false);
    expect(eligible(null)).toBe(false);
  });

  it("rejects malformed duty dates without defaulting to the local machine timezone", () => {
    expect(coordinatorRoundOnDutyDate({
      dutyDate: "2026/10/20",
      scheduledAt: new Date("2026-10-20T07:00:00.000Z"),
      roundStatus: "SCHEDULED",
    })).toBe(false);
  });
});
