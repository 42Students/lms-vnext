import { describe, expect, it } from "vitest";
import { combineHrCalendarDays, hrResultsDueHref, selectHrMobileCalendarDays } from "@/modules/placements/hr-calendar-day-model";

const due = {
  id: "round-1", jobId: "job-1", jobTitle: "Engineer", roundName: "Technical",
  dueAt: new Date("2026-10-21T19:00:00Z"), status: "SCHEDULED",
};

describe("HR calendar results due day integration", () => {
  it("places a results deadline on the correct IST day, even without a round scheduled that day", () => {
    const groups = combineHrCalendarDays([], [due]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.day).toBe("2026-10-22");
    expect(groups[0]!.events).toEqual([]);
    expect(groups[0]!.resultsDue).toEqual([due]);
  });

  it("groups existing days and due-only days in order without dropping events", () => {
    const initial = [{ day: "2026-10-20", events: [] }];
    expect(combineHrCalendarDays(initial, [due]).map((item) => item.day))
      .toEqual(["2026-10-20", "2026-10-22"]);
    expect(hrResultsDueHref("a/b")).toBe("/hr/placements/jobs/a%2Fb?tab=rounds");
    expect(selectHrMobileCalendarDays(combineHrCalendarDays(initial,[due]),["2026-10-22"]))
      .toMatchObject([{day:"2026-10-22"}]);
    expect(selectHrMobileCalendarDays(combineHrCalendarDays([],[]),["2026-10-22"]))
      .toEqual([]);
  });
});
