import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoRegistrationChoiceSchema} from "@/modules/placements/tpo-batch-registration-summary-model";
import {tpoStudentRegisteredForPlacements} from "@/modules/placements/tpo-students-model";
import {learnerStaffApplicationOptOut} from "@/modules/placements/learner-staff-application-optout-model";
const file=(path:string)=>readFileSync(path,"utf8");
describe("Chat-5 remaining queue ambiguity decisions",()=>{
 it("TPO-drive-workspace-12 retains one scoped recruiter request decision service instead of duplicating writes on the drive",()=>{
  const queue=file("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(queue).toContain("TpoDriveRequestActions");
  expect(file("docs/audit/acceptance/tpo-drive-workspace-verification.md")).toContain("TPO-drive-workspace-12 | OPEN (additional delegated decision)");
 });
 it("TPO-drive-workspace-26 requires durable notification deferral before claiming a 30-second undo hold",()=>{
  const model=file("src/modules/placements/tpo-bulk-action-model.ts");
  expect(model).toContain("canExactUndo");
  expect(file("docs/audit/acceptance/tpo-drive-workspace-verification.md")).toContain("durable delayed outbox");
 });
 it("TPO-drive-workspace-38 keeps unavailable schedule data visible instead of pretending the drive has no conflicts",()=>{
  expect(file("src/modules/placements/tpo-drive-schedule-warnings-model.ts")).toContain("UNAVAILABLE");
  expect(file("docs/audit/acceptance/tpo-drive-workspace-verification.md")).toContain("TPO-drive-workspace-38 | OPEN (additional delegated decision)");
 });
 it("TPO-students-15 does not treat college-created applications as evidence of a learner opt-in",()=>{
  const service=file("src/modules/placements/bulk-drive-service.ts");
  expect(service).toContain("placementApplications");
  expect(service).toContain('eventType:"STUDENTS_ADDED_TO_DRIVE"');
  const start=new Date("2099-01-01T10:00:00.000Z");
  expect(learnerStaffApplicationOptOut({submittedAt:start,submittedByUserId:"staff",learnerUserId:"learner",now:new Date("2099-01-03T09:59:59.000Z")}).canOptOut).toBe(true);
  expect(learnerStaffApplicationOptOut({submittedAt:start,submittedByUserId:"staff",learnerUserId:"learner",now:new Date("2099-01-03T10:00:00.000Z")}).canOptOut).toBe(false);
  expect(file("docs/audit/acceptance/tpo-students-verification.md")).toContain("College-assisted applications must disclose");
 });
 it("TPO-students-49 requires full scope verification before admitting College Admin on private roster and exports",()=>{
  const page=file("src/app/(authenticated)/tpo/students/page.tsx");
  expect(page).toContain("getCurrentRequestContext");
  expect(file("docs/audit/acceptance/tpo-students-verification.md")).toContain("TPO-students-49 | OPEN (additional delegated decision)");
 });
 it("TPO-students-50 refuses to confuse recorded registration with implicit consent inferred from an application",()=>{
  expect(tpoRegistrationChoiceSchema.safeParse("PLACEMENTS").success).toBe(true);
  expect(tpoRegistrationChoiceSchema.safeParse("APPLIED").success).toBe(false);
  expect(tpoStudentRegisteredForPlacements(null,1)).toBe(true);
  expect(tpoStudentRegisteredForPlacements("HIGHER_STUDIES",1)).toBe(false);
  expect(file("src/modules/placements/tpo-batch-registration-summary-model.ts")).toContain("registered");
 });
 it("TPO-requests-verification-29 keeps private identity and review evidence behind authorized detail rather than raw document URLs",()=>{
  expect(file("docs/audit/acceptance/tpo-requests-verification-verification.md")).toContain("TPO-requests-verification-29 | OPEN (additional delegated decision)");
  expect(file("docs/audit/acceptance/tpo-requests-verification-verification.md")).toContain("identity values masked");
 });
});
