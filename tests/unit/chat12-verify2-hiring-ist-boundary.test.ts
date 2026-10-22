import { describe, expect, it } from "vitest";
import { superAdminHiringReportQuery } from "@/modules/admin-ui/super-admin-hiring-report-model";
import { istStartOfDay, istStartOfNextDay } from "@/modules/admin-ui/super-admin-hiring-ist-boundary";

describe("chat-12 verify2: legacy hiring report inclusive IST dates", () => {
  it("covers the complete requested day, excluding the next local midnight", () => {
    const from = istStartOfDay("2026-10-22");
    const toExclusive = istStartOfNextDay("2026-10-22");
    expect(from.toISOString()).toBe("2026-10-21T18:30:00.000Z");
    expect(toExclusive.toISOString()).toBe("2026-10-22T18:30:00.000Z");
    expect(new Date("2026-10-22T18:29:59.999Z").getTime()).toBeLessThan(toExclusive.getTime());
    expect(new Date("2026-10-22T18:30:00.000Z").getTime()).toBe(toExclusive.getTime());
  });

  it("handles month/year and leap-day boundaries without local machine timezone", () => {
    expect(istStartOfNextDay("2026-12-31").toISOString()).toBe("2027-01-01T18:30:00.000Z");
    expect(istStartOfNextDay("2028-02-29").toISOString()).toBe("2028-02-29T18:30:00.000Z");
    expect(istStartOfDay("2028-03-01").getTime()).toBe(istStartOfNextDay("2028-02-29").getTime());
  });

  it("rejects reversed or invalid calendar dates at the report query boundary", () => {
    expect(superAdminHiringReportQuery.safeParse({ appliedFrom: "2026-10-23", appliedTo: "2026-10-22" }).success).toBe(false);
    expect(superAdminHiringReportQuery.safeParse({ appliedFrom: "2026-02-30" }).success).toBe(false);
    expect(superAdminHiringReportQuery.safeParse({ appliedTo: "2026-10-22" }).success).toBe(true);
  });
});
