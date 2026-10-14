import { describe, expect, it } from "vitest";
import { eventsForLearnerIstScheduleDay, learnerIstScheduleToday, learnerScheduleDateFromDay } from "@/modules/academics/learner-ist-schedule-model";
import { resolveOwnLearnerCalendarFilters } from "@/modules/academics/learner-calendar-filter-model";
describe("learner day/week calendar in IST across device timezones", () => {
  it("groups UTC month-boundary events on their IST calendar day", () => {
    const previous = process.env.TZ;
    try {
      for (const timezone of ["UTC", "Asia/Tokyo", "America/Los_Angeles"]) {
        process.env.TZ = timezone;
        const events = [
          { id: "oct", startsAt: "2026-10-31T18:29:59Z" },
          { id: "nov", startsAt: "2026-10-31T18:30:00Z" },
        ];
        const day = learnerScheduleDateFromDay("2026-11-01");
        expect(eventsForLearnerIstScheduleDay(events, day).map(event => event.id)).toEqual(["nov"]);
        const today = learnerIstScheduleToday(new Date("2026-10-31T18:30:00Z"));
        expect(today.getMonth()).toBe(10); expect(today.getDate()).toBe(1);
      }
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  });
  it("serializes the default anchor as an IST day rather than a host-local instant", () => {
    const filters = resolveOwnLearnerCalendarFilters({}, [], new Date("2026-12-31T18:30:00Z"));
    expect(filters?.anchorDay).toBe("2027-01-01");
    expect(resolveOwnLearnerCalendarFilters({ month: "2026-10" }, [], new Date())?.anchorDay).toBe("2026-10-01");
    expect(() => learnerScheduleDateFromDay("2026-02-30")).toThrow();
  });
});
