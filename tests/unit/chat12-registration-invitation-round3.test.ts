import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoStudentRegisteredForPlacements} from "@/modules/placements/tpo-students-model";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Chat-12 implicit placement registration and cohort invitations",()=>{
 it("TPO-students-50 recognizes existing applications without overriding explicit choices",()=>{
  expect(tpoStudentRegisteredForPlacements(null,1)).toBe(true);
  expect(tpoStudentRegisteredForPlacements(null,0)).toBe(false);
  expect(tpoStudentRegisteredForPlacements("PLACEMENTS",0)).toBe(true);
  expect(tpoStudentRegisteredForPlacements("HIGHER_STUDIES",1)).toBe(false);
 });
 it("TPO-students-32 derives the invitation state from the batch lifecycle, not from readiness",()=>{
  const service=src("src/modules/placements/tpo-students-service.ts");
  const page=src("src/app/(authenticated)/tpo/students/page.tsx");
  expect(service).toContain("batchInvitedAt:placementBatchLifecycles.invitedAt");
  expect(service).toContain("uninvitedCount:scopedRows.filter");
  expect(page).toContain("Registration is not open for {data.uninvitedCount} students:");
  expect(page).toContain("Open Placement eligibility");
 });
});
