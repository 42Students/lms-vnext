import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {calendarLocalIstToOffset} from "@/modules/placements/tpo-calendar-followup-model";
describe("TPO-home-31 quick-create follow-up modal",()=>{
 it("converts typed IST date-time to a timezone-safe API date",()=>{
  expect(calendarLocalIstToOffset("2026-10-17T09:30")).toBe("2026-10-17T09:30:00+05:30");
  expect(()=>calendarLocalIstToOffset("invalid")).toThrow();
 });
 it("uses the pre-existing scoped leads and calendar follow-up routes",()=>{
  const ui=readFileSync("src/components/tpo/tpo-new-followup-modal.tsx","utf8");
  const layout=readFileSync("src/app/(authenticated)/tpo/layout.tsx","utf8");
  const menu=readFileSync("src/components/tpo/tpo-topbar-new-menu.tsx","utf8");
  expect(ui).toContain("new URLSearchParams({collegeId,q:search.trim(),page:String(page)})");
  expect(ui).toContain('"/api/placements/tpo/leads/search?"+params.toString()');
  expect(ui).toContain('"/api/placements/tpo/calendar/follow-ups"');
  expect(ui).toContain("Choose a recruiter");
  expect(ui).toContain("Pick a date and time");
  expect(ui).toContain("Follow-up added. It shows on the calendar.");
  expect(ui).toContain("Could not save the follow-up");
  expect(layout).toContain("<TpoTopbarNewMenu collegeId={context.membership!.collegeId}/>");
  expect(menu).toContain("<TpoNewFollowupModal collegeId={collegeId}/>");
 });
});
