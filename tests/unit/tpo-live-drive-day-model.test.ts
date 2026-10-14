import { describe, expect, it } from "vitest";
import { isTpoRoundHappeningNow, summarizeTpoLiveAttendance } from "@/modules/placements/tpo-live-drive-day-model";
describe("TPO live Drive Day projection", () => {
  const round = { status: "SCHEDULED", scheduledAt: "2026-10-14T04:30:00.000Z", durationMinutes: 60 };
  it("requires actual scheduled start and known duration", () => {
    expect(isTpoRoundHappeningNow(round, "2026-10-14T04:40:00.000Z")).toBe(true);
    expect(isTpoRoundHappeningNow(round, "2026-10-14T05:30:00.000Z")).toBe(false);
    expect(isTpoRoundHappeningNow({ ...round, durationMinutes: null }, "2026-10-14T04:40:00Z")).toBe(false);
    expect(isTpoRoundHappeningNow({ ...round, status: "COMPLETED" }, "2026-10-14T04:40:00Z")).toBe(false);
  });
  it("counts checked-in, explicit no-show, waiting and unknown without false inference", () => {
    expect(summarizeTpoLiveAttendance({
      total: 8, waiting: 2, present: 2, inInterview: 1, done: 1,
      absent: 1, unknownAttendance: 1,
    })).toEqual({ total: 8, checkedIn: 4, noShow: 1, pending: 2, unknown: 1 });
  });
});
