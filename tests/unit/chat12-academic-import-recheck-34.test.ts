import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoAcademicImportNewlyIneligible} from "@/modules/placements/tpo-academic-import-recheck-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Academic import eligibility follow-through",()=>{
 it("TPO-students-34 detects only newly ineligible applications, never repeats a settled restriction",()=>{
  expect(tpoAcademicImportNewlyIneligible("ELIGIBLE","INELIGIBLE")).toBe(true);
  expect(tpoAcademicImportNewlyIneligible("ELIGIBLE_WITH_MISSING_EVIDENCE","INELIGIBLE")).toBe(true);
  expect(tpoAcademicImportNewlyIneligible("INELIGIBLE","INELIGIBLE")).toBe(false);
  expect(tpoAcademicImportNewlyIneligible("NEEDS_DATA","ELIGIBLE")).toBe(false);
 });
 it("TPO-students-34 updates a review flag without deleting existing applications, inside the academic import transaction",()=>{
  const text=src("src/modules/placements/tpo-academic-import-service.ts");
  expect(text).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(text).toContain("evaluatePlacementEligibility(context,app.jobId,row.studentCode,tx)");
  expect(text).toContain("newlyIneligible:true");
  expect(text).toContain('eventType:"NOW_INELIGIBLE"');
  expect(text).toContain("await tx.insert(inAppNotifications).values(recipients)");
  expect(text).not.toContain("tx.delete(placementApplications)");
 });
});
