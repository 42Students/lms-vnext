import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {canScheduleOnCollegeBlockedDay} from "@/modules/placements/tpo-blocked-day-decision";
import {recruiterAccessMonthsOrDefault} from "@/modules/placements/recruiter-access-defaults";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 round9 registered settings contracts",()=>{
 it("TPO-settings-audit-53 creates college settings before a scoped recruiter grant without modifying a different tenant",()=>{
  const v=read("src/modules/placements/tpo-recruiter-grant-write-service.ts");
  expect(v).toMatch(/tx\.insert\(placementTpoCollegeSettings\)[\s\S]*?onConflictDoNothing\(\)/);
  expect(v).toContain("eq(placementCompanyRelationships.collegeId, collegeId)");
  expect(v).toContain('requirePermission(context, "placements.manage", { collegeId })');
 });
 it("TPO-settings-audit-40 saves the bounded 0–100 preparation percentage alongside course-count policy",()=>{
  const page=read("src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx");
  const editor=read("src/components/tpo/tpo-prep-percentage-editor.tsx");
  expect(page).toContain("TpoPrepPercentageEditor");
  expect(editor).toContain("percent<0||percent>100");
  expect(editor).toContain('section:"PREP_THRESHOLD",prepThresholdPct:percent');
  expect(page).toContain("TpoPrepReadinessEditor");
 });
 it("TPO-settings-audit-43 supports bounded exam ranges and preserves valid existing choices after a failed save",()=>{
  const editor=read("src/components/tpo/tpo-blocked-dates-editor.tsx");
  expect(editor).toContain("rangeLength<=90");
  expect(editor).toContain('reason:reason.trim()||"Blocked"');
  expect(editor).toContain("Show past blocked dates");
  expect(editor).toContain("Remove whole range");
  expect(editor).toContain("Blocked dates could not be updated.");
 });
 it("TPO-settings-audit-44 requires explicit acknowledgement for blocked-date round scheduling and fails closed on storage outage",()=>{
  expect(canScheduleOnCollegeBlockedDay({storageReady:false,blocked:false,acknowledged:false})).toEqual({allowed:false,reason:"STORAGE_UNAVAILABLE"});
  expect(canScheduleOnCollegeBlockedDay({storageReady:true,blocked:true,acknowledged:false})).toEqual({allowed:false,reason:"ACK_REQUIRED"});
  expect(canScheduleOnCollegeBlockedDay({storageReady:true,blocked:true,acknowledged:true})).toEqual({allowed:true});
  const route=read("src/modules/placements/tpo-round-calendar-service.ts");
  expect(route).toContain("canScheduleOnCollegeBlockedDay(");
  expect(route).toContain("acknowledgedBlockedDate===true");
 });
 it("TPO-settings-audit-52 uses expiring grants rather than a permanent no-end-date capability",()=>{
  expect(recruiterAccessMonthsOrDefault(null)).toBe(6);
  expect(()=>recruiterAccessMonthsOrDefault(0)).toThrow();
  expect(()=>recruiterAccessMonthsOrDefault(61)).toThrow();
  const ui=read("src/components/tpo/tpo-communication-settings-editors.tsx");
  expect(ui).toContain("No end date is unavailable");
  expect(ui).toContain("[3,6,12,24]");
 });
});
