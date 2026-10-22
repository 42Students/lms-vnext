import { describe, expect, it } from "vitest";
import {
  careerCalendarEvents, careerCalendarPeriod, careerDayKey,
  shiftCareerCalendarDay, learnerCareerIcal,
} from "@/modules/placements/learner-career-calendar-model";

const round = (id: string, start: string, kind = "TEST") => ({
  applicationId: "application-a",
  roundId: id, roundName: id,
  roundKind: kind, companyName: "Employer",
  roleTitle: "Engineer", scheduledAt: start,
  exception: null as {scheduledAt:string} | null,
});

describe("Learner Career Calendar", () => {
  it("groups UTC timestamps by India calendar day", () => {
    expect(careerDayKey(new Date("2026-10-10T19:00:00Z")))
      .toBe("2026-10-11");
  });
  it("uses approved reschedules and retains the real date", () => {
    const events = careerCalendarEvents([
      { ...round("old", "2026-10-10T10:00:00Z"),
        exception: { scheduledAt: "2026-10-13T10:00:00Z" } },
      round("bad", "bad-date"),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]?.dayKey).toBe("2026-10-13");
    expect(events[0]?.rescheduled).toBe(true);
  });
  it("keeps un-applied deadlines and scoped exam days while excluding hidden events", () => {
    const events=careerCalendarEvents([],[
      {key:"deadline",kind:"APPLICATION_DEADLINE",day:"2026-10-17",
        title:"Apply by 17 Oct",visible:true,applied:false,jobId:"own-job"},
      {key:"exam",kind:"EXAM_BLOCK",day:"2026-10-17",
        title:"Midterm exam",visible:true},
      {key:"foreign",kind:"EXAM_BLOCK",day:"2026-10-17",
        title:"Hidden college exam",visible:false},
      {key:"applied",kind:"APPLICATION_DEADLINE",day:"2026-10-17",
        title:"Already applied",visible:true,applied:true},
    ]);
    expect(events).toHaveLength(2);
    expect(events.map(event=>event.eventType)).toEqual(["APPLICATION_DEADLINE","EXAM_BLOCK"]);
    expect(events[1]?.title).toContain("No drives run on it");
    expect(events.every(event=>event.dayKey==="2026-10-17")).toBe(true);
  });
  it("navigates month/week/day and clamps month ends", () => {
    expect(shiftCareerCalendarDay("2026-01-31", "month", 1)).toBe("2026-02-28");
    expect(shiftCareerCalendarDay("2026-10-13", "week", 1)).toBe("2026-10-20");
    expect(shiftCareerCalendarDay("2026-10-13", "day", -1)).toBe("2026-10-12");
  });
  it("filters an ISO Monday week and the current month separately", () => {
    const events = careerCalendarEvents([
      round("tuesday", "2026-10-13T05:00:00Z"),
      round("next", "2026-10-20T05:00:00Z"),
      round("november", "2026-11-01T05:00:00Z"),
    ]);
    expect(careerCalendarPeriod(events, "2026-10-13", "week").events.map(x=>x.title))
      .toEqual(["tuesday"]);
    expect(careerCalendarPeriod(events, "2026-10-13", "month").events.map(x=>x.title))
      .toEqual(["tuesday", "next"]);
  });
  it("exports UTC event times without injecting untrusted provider links", () => {
    const events = careerCalendarEvents([
      {...round("test", "2026-10-13T05:00:00Z"), roundName: "Test, phase; 1\nFinal"},
    ]);
    const file = learnerCareerIcal(events, new Date("2026-10-13T00:00:00Z"));
    expect(file).toContain("DTSTART:20261013T050000Z");
    expect(file).toContain("SUMMARY:Test\\, phase\\; 1\\nFinal");
    expect(file).toContain("END:VCALENDAR");
    expect(file).not.toContain("https://");
  });
});
