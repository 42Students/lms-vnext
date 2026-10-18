import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoAcademicImportNewlyIneligible} from "@/modules/placements/tpo-academic-import-recheck-model";
const code=readFileSync(new URL("../../src/modules/placements/tpo-academic-import-service.ts",import.meta.url),"utf8");

describe("TPO-students-34 verified academic import with concurrent applications",()=>{
 it("flags only a true transition from eligible to ineligible",()=>{
  expect(tpoAcademicImportNewlyIneligible("ELIGIBLE","INELIGIBLE")).toBe(true);
  expect(tpoAcademicImportNewlyIneligible("INELIGIBLE","INELIGIBLE")).toBe(false);
  expect(tpoAcademicImportNewlyIneligible("ELIGIBLE","ELIGIBLE")).toBe(false);
 });
 it("holds membership and open application locks until recheck, audit and delivery commit",()=>{
  const start=code.indexOf("const applications=await tx.select({");
  const evidence=code.indexOf("await tx.insert(placementCandidateAcademicEvidence)",start);
  expect(start).toBeGreaterThan(0);
  const select=code.slice(start,evidence);
  expect(select).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(select).toContain('eq(placementJobs.collegeId,college.id)');
  expect(select).toContain('.for("update",{of:placementApplications})');
  expect(code.indexOf('await assertPersistedPlatformPermission(tx, context, "placements.manage"'))
   .toBeLessThan(start);
 });
 it("rejects an application that changes status instead of flagging withdrawn evidence",()=>{
  const idx=code.indexOf("const [flagged]=await tx.update(placementApplications).set(");
  const event=code.indexOf('eventType:"NOW_INELIGIBLE"',idx);
  expect(idx).toBeGreaterThan(0);
  expect(event).toBeGreaterThan(idx);
  const write=code.slice(idx,event);
  expect(write).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(write).toContain("returning({id:placementApplications.id})");
  expect(write).toContain('if(!flagged)throw new Error("ACADEMIC_IMPORT_APPLICATION_CHANGED")');
 });
 it("keeps applications recorded and sends a single actual-event notification to the scoped learner and staff",()=>{
  expect(code).toContain("applicationPreserved:true");
  expect(code).toContain("await tx.insert(inAppNotifications).values(recipients).onConflictDoNothing()");
  expect(code).toContain("newlyIneligible++");
  expect(code).not.toContain("delete(placementApplications)");
 });
});
