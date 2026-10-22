import { describe, expect, it } from "vitest";
import { decideTpoAttendanceTransition, tpoDriveDayCheckInSchema } from "@/modules/placements/tpo-drive-day-checkin-model";
const applicationId = "10000000-0000-4000-8000-000000000001";
describe("TPO confirmed Drive Day attendance", () => {
  const base = { confirmed: true, applicationId, expectedAttendance: "WAITING", status: "PRESENT" };
  it("accepts only a confirmed check-in or no-show without forged college", () => {
    expect(tpoDriveDayCheckInSchema.safeParse(base).success).toBe(true);
    expect(tpoDriveDayCheckInSchema.safeParse({ ...base, status: "ABSENT" }).success).toBe(true);
    expect(tpoDriveDayCheckInSchema.safeParse({ ...base, status: "WAITING" }).success).toBe(false);
    expect(tpoDriveDayCheckInSchema.safeParse({ ...base, expectedAttendance: "DONE" }).success).toBe(true);
    expect(decideTpoAttendanceTransition("DONE", "WAITING", "PRESENT")).toBe("STALE");
    expect(tpoDriveDayCheckInSchema.safeParse({ ...base, confirmed: false }).success).toBe(false);
    expect(tpoDriveDayCheckInSchema.safeParse({ ...base, collegeId: applicationId }).success).toBe(false);
  });
  it("distinguishes first mark, idempotency and stale races", () => {
    expect(decideTpoAttendanceTransition(null, "WAITING", "PRESENT")).toBe("UPDATE");
    expect(decideTpoAttendanceTransition("PRESENT", "PRESENT", "PRESENT")).toBe("UNCHANGED");
    expect(decideTpoAttendanceTransition("ABSENT", "WAITING", "PRESENT")).toBe("STALE");
    expect(decideTpoAttendanceTransition("IN_INTERVIEW", "PRESENT", "ABSENT")).toBe("STALE");
  });
});
