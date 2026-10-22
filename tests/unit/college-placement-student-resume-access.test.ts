import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");

describe("G2-15-002-030: college placement learner resume privacy",()=>{
 it("reads the selected learner's receipt only in an active authorized college",()=>{
  const service=source("src/modules/placements/college-student-resume-service.ts");
  expect(service).toContain("await requireCollegePlacementAdmin(context)");
  expect(service).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(profilePrivateDocumentReceipts.owningMembershipId,membershipId)');
  expect(service).toContain('eq(profilePrivateDocumentReceipts.privateObjectKey,student.objectPath)');
  expect(service).toContain('eq(profilePrivateDocumentReceipts.purpose,"RESUME")');
  expect(service).toContain('eq(profilePrivateDocumentReceipts.scanStatus,"CLEAN")');
  expect(service).toContain("verifyPrivateDocumentReceipt(evidence)");
  expect(service).toContain("createPrivateReadGrant({");
  expect(service).toContain("grant.generation!==receipt.objectGeneration");
  expect(service).not.toContain("resumeUrl");
 });
 it("exposes only a verified, short-lived authorized redirect and no raw object path",()=>{
  const route=source("src/app/api/placements/college/students/[membershipId]/resume/route.ts");
  const page=source("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(route).toContain("grantCollegeStudentPlacementResume(context,membershipId)");
  expect(route).toContain("NextResponse.redirect(grant.url,{status:303");
  expect(route).toContain('"Referrer-Policy":"no-referrer"');
  expect(page).toContain('selectedProfile?.resumeAvailable?<a');
  expect(page).toContain("View verified resume");
  expect(page).toContain("Resume replacement is learner-owned");
  expect(page).toContain('href={"/api/placements/college/students/"+encodeURIComponent(selectedStudent.membershipId)+"/resume"}');
  expect(page).not.toContain('target="_blank"');
  expect(page).not.toContain("window.open(");
 });
});
