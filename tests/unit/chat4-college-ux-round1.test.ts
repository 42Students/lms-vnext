import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const page=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/"+route+"/page.tsx"),"utf8");
describe("Chat-4 College UX round one",()=>{
 it("UX-college-01 preserves narrow-screen content and 44px navigation targets",()=>{
  const source=page("college");
  expect(source).toContain("min-w-0 max-w-full space-y");
  expect(source).toContain("min-h-11");
  // The legacy attention board replaced the vNext low-attendance DataTable.
  expect(source).toContain("<CollegeNeedsAttentionBoard");
  expect(source).toContain("risk:lowAttendance");
 });
 it("UX-college-academics-01 preserves narrow-screen content and 44px navigation targets",()=>{
  const source=page("college/academics");
  expect(source).toContain("min-w-0 overflow-x-clip space-y");
  expect(source).toContain("<AcademicsOverview");
 });
 it("UX-college-activity-01 preserves narrow-screen content and 44px navigation targets",()=>{
  const source=page("college/activity");
  expect(source).toContain("min-w-0 max-w-full space-y");
  expect(source).toContain("min-h-11");
 });
 it("UX-college-activity-eventId-01 preserves narrow-screen content and 44px navigation targets",()=>{
  const source=page("college/activity/[eventId]");
  expect(source).toContain("min-w-0 overflow-x-clip space-y");
  expect(source).toContain("<PageBackLink");
 });
 it("UX-college-announcements-01 preserves narrow-screen content and 44px navigation targets",()=>{
  const source=page("college/announcements");
  expect(source).toContain("min-w-0 overflow-x-clip space-y");
  expect(source).toContain("min-h-11");
 });
});
