import { describe, expect, it } from "vitest";
import { pendingAttendanceWindowStart } from "@/modules/colleges/admin-today-attention-model";

describe("G2-2-012-034 pending attendance window", () => {
 it("covers a full seven rolling days rather than the seven IST calendar dates", () => {
  const now = new Date("2026-10-22T12:37:00.000Z");
  expect(pendingAttendanceWindowStart(now).toISOString()).toBe("2026-10-15T12:37:00.000Z");
  expect(now.getTime() - pendingAttendanceWindowStart(now).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
 });

 it("preserves the exact hour and minute across India midnight", () => {
  const now = new Date("2026-10-21T19:01:00.000Z");
  expect(pendingAttendanceWindowStart(now).toISOString()).toBe("2026-10-14T19:01:00.000Z");
 });
});
