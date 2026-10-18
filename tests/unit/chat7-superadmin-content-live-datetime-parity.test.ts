import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseAdminContentLocalMoment} from "@/modules/courses/super-admin-content-datetime-model";

describe("SA-academics-people-58 live meeting IST/UTC calendar integrity",()=>{
 it("preserves exact India Standard Time on calendar boundaries, with no DST",()=>{
  expect(parseAdminContentLocalMoment("2099-01-01T00:00","Asia/Kolkata"))
   .toBe("2098-12-31T18:30:00.000Z");
  expect(parseAdminContentLocalMoment("2000-02-29T23:59","Asia/Kolkata"))
   .toBe("2000-02-29T18:29:00.000Z");
  expect(parseAdminContentLocalMoment("2099-06-01T05:30","Asia/Kolkata"))
   .toBe("2099-06-01T00:00:00.000Z");
 });
 it("keeps UTC independent of browser system timezone",()=>{
  expect(parseAdminContentLocalMoment("2099-01-01T00:00","UTC"))
   .toBe("2099-01-01T00:00:00.000Z");
  expect(parseAdminContentLocalMoment("2000-02-29T23:59","UTC"))
   .toBe("2000-02-29T23:59:00.000Z");
 });
 it("rejects normalized impossible dates and invalid times for both zones",()=>{
  for(const date of [
   "2099-02-29T12:00","2099-04-31T10:00","2099-01-32T12:00",
   "2099-12-00T12:00","2099-00-12T12:00","2099-01-01T24:00",
   "2099-01-01T23:60","2099-01-01","2099-01-01T09:30Z",
   "1999-12-31T23:59",
  ]){
   expect(parseAdminContentLocalMoment(date,"Asia/Kolkata")).toBeNull();
   expect(parseAdminContentLocalMoment(date,"UTC")).toBeNull();
  }
 });
 it("rejects unknown user-supplied zone values instead of guessing UTC",()=>{
  expect(parseAdminContentLocalMoment("2099-01-01T12:30","US/Pacific" as "UTC")).toBeNull();
 });
 it("rejects invalid date before calling the content PATCH endpoint and keeps the user's edit open",()=>{
  const source=readFileSync("src/components/courses/super-admin-content-actions.tsx","utf8");
  expect(source).toContain("parseAdminContentLocalMoment(startsAt,timeZone)");
  expect(source).toContain("parseAdminContentLocalMoment(endsAt,timeZone)");
  expect(source).toContain('if(!start||!end){setError("Enter a valid date and time.");return;}');
  expect(source.indexOf("if(!start||!end)")).toBeLessThan(source.indexOf('if(!window.confirm("Save changes?"))'));
  expect(source).toContain('className="min-h-11');
  expect(source).not.toContain("min-h-10");
  expect(source).toContain('Discard content changes?');
 });
});
