import { describe, expect, it } from "vitest";
import { filterLearnerAttendanceMonth, learnerAttendanceIstMonth, resolveLearnerAttendanceFilters } from "@/modules/attendance/learner-attendance-filter-model";
const deliveryId = "00000000-0000-4000-8000-000000000001";
const foreignId = "00000000-0000-4000-8000-000000000002";
describe("IST learner attendance filters", () => {
  it("moves UTC month-boundary classes into the IST month", () => {
    const rows = [
      { id: "oct", deliveryId, startsAt: "2026-10-31T18:29:59Z" },
      { id: "nov", deliveryId, startsAt: "2026-10-31T18:30:00Z" },
      { id: "foreign", deliveryId: foreignId, startsAt: "2026-10-31T18:30:00Z" },
    ];
    expect(filterLearnerAttendanceMonth(rows, deliveryId, "2026-11").map(row => row.id)).toEqual(["nov"]);
    expect(filterLearnerAttendanceMonth(rows, deliveryId, "2026-10").map(row => row.id)).toEqual(["oct"]);
    expect(learnerAttendanceIstMonth("2026-12-31T18:30:00Z")).toBe("2027-01");
  });
  it("bounds query months and selects only an authorized Course", () => {
    expect(resolveLearnerAttendanceFilters({ deliveryId: foreignId, month: "2026-13" }, [{ deliveryId }], "2026-10"))
      .toEqual({ deliveryId, month: "2026-10" });
    expect(resolveLearnerAttendanceFilters({ month: ["2026-11"] }, [], "2026-10"))
      .toEqual({ deliveryId: "", month: "2026-10" });
    expect(filterLearnerAttendanceMonth([], "invalid", "2026-11")).toEqual([]);
  });
  it("resolves a restored URL directly instead of retaining a prior filter", () => {
    expect(resolveLearnerAttendanceFilters({ month: "2026-11" }, [{ deliveryId }], "2026-10").month).toBe("2026-11");
    expect(resolveLearnerAttendanceFilters({ month: "2026-10" }, [{ deliveryId }], "2026-10").month).toBe("2026-10");
  });
});
