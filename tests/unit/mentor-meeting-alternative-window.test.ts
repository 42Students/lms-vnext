import {describe,expect,it} from "vitest";
import {mentorMeetingHasDifferentRequestedWindow}
  from "@/modules/projects/mentor-meeting-form-model";

describe("Mentor requested meeting alternate time",()=>{
  const start="2026-12-01T09:00:00.000+05:30";
  const end="2026-12-01T10:00:00.000+05:30";
  it("rejects unchanged requested time despite differently formatted offsets",()=>{
    expect(mentorMeetingHasDifferentRequestedWindow(start,end,
      "2026-12-01T03:30:00Z","2026-12-01T04:30:00Z")).toBe(false);
  });
  it("allows a genuinely different start or end time",()=>{
    expect(mentorMeetingHasDifferentRequestedWindow(start,end,
      "2026-12-01T09:30:00+05:30","2026-12-01T10:30:00+05:30")).toBe(true);
    expect(mentorMeetingHasDifferentRequestedWindow(start,end,
      start,"2026-12-01T10:30:00+05:30")).toBe(true);
  });
  it("fails closed on missing and invalid timestamps",()=>{
    expect(mentorMeetingHasDifferentRequestedWindow(start,end,"","bad")).toBe(false);
    expect(mentorMeetingHasDifferentRequestedWindow("invalid",end,
      "2026-12-01T09:30:00+05:30",end)).toBe(false);
  });
});
