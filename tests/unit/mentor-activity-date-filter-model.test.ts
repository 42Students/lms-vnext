import {describe,expect,it} from "vitest";
import {mentorActivityIstDayKey,mentorActivityMatchesDateFilters}
 from "@/modules/projects/mentor-activity-date-filter-model";

const now="2026-10-25T06:00:00.000Z"; // 11:30 Sunday IST
const matches=(stamp:string,range="ALL",from="",to="")=>
 mentorActivityMatchesDateFilters(stamp,now,range,from,to);

describe("Mentor Project Activity IST date filters",()=>{
 it("places UTC-evening events in the next local date",()=>{
  expect(mentorActivityIstDayKey("2026-10-24T18:29:59Z")).toBe("2026-10-24");
  expect(mentorActivityIstDayKey("2026-10-24T18:30:00Z")).toBe("2026-10-25");
  expect(matches("2026-10-24T18:30:00Z","ALL","2026-10-25","2026-10-25")).toBe(true);
  expect(matches("2026-10-24T18:29:59Z","ALL","2026-10-25","2026-10-25")).toBe(false);
  expect(matches("2026-10-24T18:30:00Z","ALL","2026-10-24","2026-10-24")).toBe(false);
 });
 it("treats Today as IST midnight-to-now, not a rolling 24-hour interval",()=>{
  expect(matches("2026-10-24T18:30:00Z","1")).toBe(true);
  expect(matches("2026-10-24T18:29:59Z","1")).toBe(false);
  expect(matches("2026-10-25T06:00:01Z","1")).toBe(false);
  expect(matches("2026-10-24T20:00:00Z","7")).toBe(true);
  expect(matches("2026-10-10T20:00:00Z","7")).toBe(false);
 });
 it("honors inclusive IST from/to boundaries across year rollover",()=>{
  expect(mentorActivityIstDayKey("2026-12-31T18:30:00Z")).toBe("2027-01-01");
  expect(mentorActivityMatchesDateFilters("2026-12-31T18:30:00Z",
   "2027-01-01T03:00:00Z","ALL","2027-01-01","2027-01-01")).toBe(true);
 });
 it("does not crash or admit imported invalid/future timestamps",()=>{
  expect(mentorActivityIstDayKey("not-a-date")).toBeNull();
  expect(matches("not-a-date")).toBe(false);
  expect(matches("2026-10-26T06:00:00Z","1")).toBe(false);
  expect(matches("2026-10-24T18:30:00Z","UNKNOWN")).toBe(false);
 });
});
