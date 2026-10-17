import {describe,it,expect} from "vitest";
import {parseTpoCalendarChips,toggleTpoCalendarChip,TPO_CALENDAR_CHIP_CHOICES} from "@/modules/placements/tpo-calendar-kind-chips";
import {initialTpoCalendarView,parseTpoCalendarUrl} from "@/modules/placements/tpo-calendar-url-model";
import {readFileSync} from "node:fs";import {join} from "node:path";
const s=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 TPO calendar source-verified contracts",()=>{
 it("TPO-calendar-reports-11 distinguishes talks from rounds and supports additive multi-kind selection",()=>{
  expect(TPO_CALENDAR_CHIP_CHOICES.map(x=>x.label)).toContain("Talks");
  expect(parseTpoCalendarChips("ROUND,TALK,ROUND,BOGUS")).toEqual(["ROUND","TALK"]);
  expect(toggleTpoCalendarChip(["ROUND"],"TALK")).toEqual(["ROUND","TALK"]);
  expect(toggleTpoCalendarChip(["ROUND","TALK"],"ROUND")).toEqual(["TALK"]);
 });
 it("TPO-calendar-reports-14 starts on agenda for mobile and week for desktop but respects valid explicit URL",()=>{
  expect(initialTpoCalendarView("iPhone Mobile")).toBe("agenda");
  expect(initialTpoCalendarView("Desktop Chrome")).toBe("week");
  expect(parseTpoCalendarUrl({date:"2099-06-10",view:"month"}).success).toBe(true);
  expect(parseTpoCalendarUrl({date:"2099-02-30"}).success).toBe(false);
 });
 it("TPO-calendar-reports-15 includes unpublished drive rounds for TPO but not unpublished deadlines",()=>{
  const c=s("src/modules/placements/placement-calendar-service.ts");
  expect(c).toContain('input.tpoLegacyScope?inArray(placementJobs.status,["DRAFT","PUBLISHED"])');
  expect(c).toContain('input.tpoLegacyScope?["PUBLISHED"]');
  expect(c).toContain('input.tpoLegacyScope?isNull(placementTpoFollowups.doneAt):undefined');
 });
 it("TPO-calendar-reports-24 appends transactional create and move events",()=>{
  const c=s("src/modules/placements/tpo-crm-service.ts");
  expect(c).toContain('eventType:"placements.tpo_followup.created"');
  expect(c).toContain('eventType:"placements.tpo_followup.moved"');
  expect(c).toContain("await tx.insert(activityEvents)");
 });
 it("TPO-calendar-reports-25 lets native keyboard button open Move and preserves Escape cancellation",()=>{
  const c=s("src/components/placements/tpo-week-hour-calendar.tsx");
  expect(c).toContain('aria-label={"Move follow-up: "+event.title}');
  expect(c).toContain("onClick={()=>setMove(");
  expect(c).toContain('aria-label="Move recruiter follow-up"');
  expect(c).toContain('event.key==="Escape"');
 });
});
