import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const file=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO calendar graceful interactions",()=>{
 it("TPO-calendar-reports-21 guards in-progress follow-ups against cancel Escape reload and internal route navigation",()=>{
  const modal=file("src/components/tpo/tpo-new-followup-modal.tsx");
  const grid=file("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(modal).toContain("Discard this unfinished follow-up?");
  expect(modal).toContain("document.addEventListener");
  expect(modal).toContain("beforeunload");
  expect(modal).toContain("onClick={dismiss}");
  expect(grid).toContain("document.addEventListener");
  expect(grid).toContain("beforeunload");
 });
 it("TPO-calendar-reports-14 defaults desktop to Week and mobile to Agenda without displaying the wide grid on phones",()=>{
  const route=file("src/app/(authenticated)/tpo/calendar/page.tsx");
  const workspace=file("src/components/placements/placement-calendar-workspace.tsx");
  const url=file("src/modules/placements/tpo-calendar-url-model.ts");
  expect(route).toContain("initialTpoCalendarView(agent)");
  expect(url).toContain("agenda");
  expect(url).toContain("week");
  expect(workspace).toContain("hidden overflow-x-auto");
  expect(workspace).toContain("md:block");
  expect(workspace).toContain("Calendar agenda");
 });
});
