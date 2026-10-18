import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {recruiterSharedRoundParticipantEmail}
 from "@/modules/placements/recruiter-round-participant-sharing";

describe("HR-WORKSPACE-CONTACT-18 round workspace candidate contact disclosure",()=>{
 it("denies email by default when sharing row or column is missing",()=>{
  for(const columns of [null,undefined,[],["phone"],["resume","projects"],["Email"]]){
   expect(recruiterSharedRoundParticipantEmail("private@example.test",columns)).toBeNull();
  }
  expect(recruiterSharedRoundParticipantEmail(null,["email"])).toBeNull();
 });
 it("releases email only for an expressly enabled relationship column",()=>{
  expect(recruiterSharedRoundParticipantEmail("shared@example.test",["email"]))
   .toBe("shared@example.test");
  expect(recruiterSharedRoundParticipantEmail("shared@example.test",["resume","email"]))
   .toBe("shared@example.test");
 });
 it("workspace projects each participant after authoritative job, company, grant and relationship checks",()=>{
  const file=readFileSync(join(process.cwd(),
   "src/modules/placements/recruiter-workspace-service.ts"),"utf8");
  expect(file).toContain("isRecruiterJobVisible(context, scope.job.collegeId, scope.relationshipId)");
  expect(file).toContain("context.recruiter?.companyId !== scope.companyId");
  expect(file).toContain("shareColumnDefaults: placementCompanyRelationships.shareColumnDefaults");
  expect(file).toContain("email: recruiterSharedRoundParticipantEmail(candidate.email, scope.shareColumnDefaults)");
  expect(file).toContain("isRecruiterSharedCandidateAllowed");
  expect(file).toContain('eq(users.id,context.user.id)');
  expect(file).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(file).not.toContain("email: candidate.email,");
  // HR-WORKSPACE-RELATION-21: a stale but still cached recruiter grant cannot
  // authorize records when the employer, relationship or college was disabled.
  for(const relationState of [
    'eq(placementCompanyRelationships.status, "ACTIVE")',
    'eq(placementCompanies.status, "ACTIVE")',
    'eq(colleges.status, "ACTIVE")',
  ])expect(file).toContain(relationState);
 });
});
