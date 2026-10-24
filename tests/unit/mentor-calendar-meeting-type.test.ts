import {describe,expect,it} from "vitest";
import {safeMentorCalendarMeetingType}
  from "@/modules/projects/mentor-calendar-view";

describe("Mentor Calendar imported meeting type",()=>{
  it.each(["GENERAL","PLANNING","STANDUP","REVIEW","RETRO"] as const)(
    "recognizes %s without changing persisted ceremony",kind=>{
      expect(safeMentorCalendarMeetingType(kind)).toBe(kind);
    },
  );
  it.each([null,undefined,"UNKNOWN","Meeting","", "GENERAL;DROP"] as const)(
    "leaves unrecognized imported ceremony %s unspecified",kind=>{
      expect(safeMentorCalendarMeetingType(kind)).toBeUndefined();
    },
  );
});
