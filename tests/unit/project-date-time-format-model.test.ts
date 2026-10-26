import {describe,expect,it} from "vitest";
import {formatProjectIstDateTime} from "@/modules/projects/project-date-time-format-model";

describe("Project IST timestamps on Mentor workspace, meeting and resource views",()=>{
  it("formats a persisted meeting instant in IST without throwing during server rendering",()=>{
    expect(formatProjectIstDateTime(new Date("2026-10-26T06:45:00.000Z")))
      .toBe("26 Oct 2026, 12:15 pm IST");
  });
  it("uses the next IST day when UTC is still the previous day",()=>{
    expect(formatProjectIstDateTime(new Date("2026-10-26T21:00:00.000Z")))
      .toBe("27 Oct 2026, 2:30 am IST");
  });
  it("handles unset and invalid legacy timestamps without crashing the page",()=>{
    expect(formatProjectIstDateTime(null)).toBe("Not set");
    expect(formatProjectIstDateTime(new Date("invalid"))).toBe("Date unavailable");
  });
});
