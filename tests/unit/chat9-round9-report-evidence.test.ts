import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
import {REQUIRED_ACCREDITATION_FIELDS} from "@/modules/placements/tpo-accreditation-completeness";
import {AFTER_COLLEGE_OUTCOMES} from "@/modules/placements/tpo-after-college-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat9 report evidence, filters and privacy",()=>{
 it("TPO-calendar-reports-10 counts only open overdue follow-ups, round conflicts and three-or-more genuine events",()=>{
  const service=read("src/modules/placements/tpo-calendar-needs-model.ts");
  expect(service).toContain('item.kind==="FOLLOW_UP"&&item.status==="OPEN"&&item.startsAt<now');
  expect(service).toContain('item.kind==="ROUND"&&blockedDays.has(');
  expect(service).toContain('if(event.kind==="BLOCKED")continue');
  expect(service).toContain("count>=3");
 });
 it("TPO-calendar-reports-31 filters actual season-scoped drives without falsely claiming all-report aggregation",()=>{
  const service=read("src/modules/placements/tpo-report-drive-dimensions-service.ts");
  const page=read("src/app/(authenticated)/tpo/reports/placement-summary/page.tsx");
  expect(service).toContain("requirePlacementManageScope(context,input.collegeId)");
  expect(service).toContain("eq(placementJobs.seasonId,input.seasonId)");
  expect(page).toContain("This filters the drive table only.");
  expect(page).toContain("standard report CSV keep the selected season/drive scope.");
 });
 it("TPO-calendar-reports-32 shows bounded batch and branch-scoped After college outcomes without guessing missing choices",()=>{
  const page=read("src/app/(authenticated)/tpo/reports/after-college/page.tsx");
  expect(AFTER_COLLEGE_OUTCOMES.length).toBeGreaterThanOrEqual(5);
  expect(page).toContain("if(batchId&&!batches.batches.some");
  expect(page).toContain("if(branchId&&!branches.has(branchId))");
  expect(page).toContain("does not infer destinations");
  expect(page).toContain("NAAC 5.2 / NIRF");
 });
 it("TPO-calendar-reports-35 checks seven field groups instead of hiding missing accreditation data behind an export",()=>{
  expect(REQUIRED_ACCREDITATION_FIELDS.length).toBe(7);
  const completeness=read("src/modules/placements/tpo-accreditation-completeness.ts");
  expect(completeness).toContain("missingStudents:rows.filter");
  expect(completeness).toContain("missing:rows.filter");
 });
 it("TPO-calendar-reports-43 refuses to fabricate resume/mark verification on the unplaced report",()=>{
  const page=read("src/app/(authenticated)/tpo/reports/unplaced/page.tsx");
  expect(page).toContain("Academic marks and resume verification require authoritative evidence");
  expect(page).toContain("Lowest %");
  expect(page).toContain("Marks verified");
  expect(page).toContain("Still in a drive");
  expect(page).toContain("Last applied");
 });
});
