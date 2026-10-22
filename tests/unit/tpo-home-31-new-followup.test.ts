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
  const create=readFileSync("src/components/shell/topbar/tpo-quick-create.tsx","utf8");
  expect(ui).toContain("new URLSearchParams({collegeId,q:search.trim(),page:String(page)})");
  expect(ui).toContain('"/api/placements/tpo/leads/search?"+params.toString()');
  expect(ui).toContain('"/api/placements/tpo/calendar/follow-ups"');
  expect(ui).toContain("Choose a recruiter");
  expect(ui).toContain("Pick a date and time");
  expect(ui).toContain('showToast({tone:"success",title:"Follow-up added"})');
  expect(ui).toContain("Could not save the follow-up");
  // The global legacy topbar mounts the scoped follow-up modal. The TPO
  // layout must not render an extra command strip above the one canvas.
  expect(layout).not.toContain("<TpoTopbarNewMenu");
  expect(layout).toContain("The global 68px topbar now owns Find, +New, Messages and Notifications.");
  expect(create).toContain("<TpoNewFollowupModal collegeId={collegeId}/>");
  expect(create).toContain("TPO_TOPBAR_QUICK_LINKS");
  expect(create).toContain("encodeURIComponent(company)");
 });
});
