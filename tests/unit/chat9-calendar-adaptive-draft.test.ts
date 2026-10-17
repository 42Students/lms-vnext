import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {initialTpoCalendarView,parseTpoCalendarUrl} from "../../src/modules/placements/tpo-calendar-url-model";
const source=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
describe("TPO calendar adaptive and draft safety",()=>{
 it("TPO-calendar-reports-14 defaults to Agenda on mobile and Week on desktop while respecting explicit URL",()=>{
  expect(initialTpoCalendarView("Mozilla/5.0 (iPhone) Mobile")).toBe("agenda");
  expect(initialTpoCalendarView("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("week");
  expect(parseTpoCalendarUrl({view:"month"}).success).toBe(true);
  const page=source("src/app/(authenticated)/tpo/calendar/page.tsx");
  expect(page).toContain("initialTpoCalendarView(agent)");
 });
 it("TPO-calendar-reports-13 provides immediate authorized company links while preserving filters",()=>{
  const page=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(page).toContain('aria-label="Quick company filters"');
  expect(page).toContain("calendarHref(basePath,audience,state,{company:name})");
  expect(page).toContain("calendarHref(basePath,audience,state,{company:\"\"})");
 });
 it("TPO-calendar-reports-21 keeps unfinished lead notes across accidental navigation prompts",()=>{
  const page=source("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(page).toContain('window.addEventListener("beforeunload",prevent)');
  expect(page).toContain("Discard this unfinished follow-up?");
  expect(page).toContain("onClick={cancelDraft}");
 });
 it("TPO-calendar-reports-25 supports keyboard day-hour creation and escape to dismiss the modal",()=>{
  const page=source("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(page).toContain('aria-label={"Add follow-up on "');
  expect(page).toContain('role="dialog"');
  expect(page).toContain('event.key==="Escape"');
 });
});