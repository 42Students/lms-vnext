import {describe,expect,it} from "vitest";
import {nextDayTpoFollowupAt} from "@/modules/placements/tpo-crm-followup-policy";

describe("G2-11-019 TPO recruiter No answer follow-up",()=>{
  it("schedules tomorrow at 10:00 IST, not 48 hours from the contact",()=>{
    const loggedAt=new Date("2026-10-22T08:24:00Z"); // 13:54 IST
    expect(nextDayTpoFollowupAt(loggedAt).toISOString())
      .toBe("2026-10-23T04:30:00.000Z");
  });

  it("uses the local IST calendar date near UTC and month boundaries",()=>{
    // 23:59 IST on 31 October; a new UTC date is still not a new IST date.
    expect(nextDayTpoFollowupAt(new Date("2026-10-31T18:29:00Z")).toISOString())
      .toBe("2026-11-01T04:30:00.000Z");
    // 00:01 IST on 1 November: tomorrow means 2 November.
    expect(nextDayTpoFollowupAt(new Date("2026-10-31T18:31:00Z")).toISOString())
      .toBe("2026-11-02T04:30:00.000Z");
  });

  it("handles new-year rollover and rejects an unusable clock",()=>{
    expect(nextDayTpoFollowupAt(new Date("2026-12-31T18:29:00Z")).toISOString())
      .toBe("2027-01-01T04:30:00.000Z");
    expect(()=>nextDayTpoFollowupAt(new Date(Number.NaN)))
      .toThrow("Invalid CRM follow-up clock");
  });
});
