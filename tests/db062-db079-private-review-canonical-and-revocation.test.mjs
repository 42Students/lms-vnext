import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const service=readFileSync("src/modules/placements/recruiter-private-rating-service.ts","utf8");
const route=readFileSync("src/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/private-rating/route.ts","utf8");
const readStart=service.indexOf("export async function readRecruiterPrivateReview(");
const writeStart=service.indexOf("export async function writeRecruiterPrivateReview(");
assert.ok(readStart>=0&&writeStart>readStart);
const reader=service.slice(readStart,writeStart),writer=service.slice(writeStart);

test("DB062 canonical scoped reads precede strictly owner-bound legacy fallback",()=>{
 for(const text of [
  "const scope=await verifyOwnSharedApplication(ctx,jobId,applicationId)",
  ".from(placementRecruiterApplicantNotes)",
  "eq(placementRecruiterApplicantNotes.collegeId,scope.college.id)",
  "eq(placementRecruiterApplicantNotes.jobId,jobId)",
  "eq(placementRecruiterApplicantNotes.recruiterUserId,ctx.user.id)",
  "eq(placementRecruiterPrivateReviews.recruiterUserId,ctx.user.id)",
 ])assert.ok(reader.includes(text),"Missing scoped read: "+text);
 assert.ok(reader.indexOf(".from(placementRecruiterApplicantNotes)") <
  reader.indexOf(".from(placementRecruiterPrivateReviews)"));
});

test("DB079 mutation locks fresh persisted grant, tenant and recruiter principal before changes",()=>{
 for(const frag of [
  'eq(users.platformStatus,"ACTIVE")',
  'eq(placementRecruiterProfiles.status,"ACTIVE")',
  'eq(placementCompanyRelationships.status,"ACTIVE")',
  'eq(placementCompanies.status,"ACTIVE")',
  'eq(colleges.status,"ACTIVE")',
  'eq(organizations.status,"ACTIVE")',
  'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
  'eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")',
  "gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)",
  "eq(placementCompanyRelationships.companyId,placementRecruiterProfiles.companyId)",
  "eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)",
  'eq(placementApplications.status,"SUBMITTED")',
  'eq(placementApplicationScreenings.status,"SHORTLISTED")',
  '.for("update").limit(1)',
 ])assert.ok(writer.includes(frag),"Missing live private note guard: "+frag);
 const lock=writer.indexOf('.for("update").limit(1)');
 const mutation=writer.indexOf("await tx.update(placementRecruiterApplicantNotes)");
 assert.ok(lock>0&&mutation>lock);
});

test("DB062 single canonical note writer uses CAS, scoped identity and no dual writes",()=>{
 for(const text of [
  '.from(placementRecruiterApplicantNotes).where(target).for("update")',
  'eq(placementRecruiterApplicantNotes.collegeId,scope.college.id)',
  'eq(placementRecruiterApplicantNotes.applicationId,applicationId)',
  'eq(placementRecruiterApplicantNotes.recruiterUserId,ctx.user.id)',
  '(current?.updatedAt.toISOString()??null)!==input.expectedUpdatedAt',
  'greatest(clock_timestamp()',
  'tx.insert(placementRecruiterApplicantNotes).values({',
  'if(legacy)throw new RecruiterPrivateReviewMigrationPending()',
  'if(input.rating===null && input.note==="")',
  'tx.delete(placementRecruiterApplicantNotes)',
 ])assert.ok(writer.includes(text),"Missing canonical contract: "+text);
 assert.doesNotMatch(writer,/tx\.(?:insert|update)\(placementRecruiterPrivateReviews\)/);
});

test("private rating API requires canonical table and reports pending historical migration",()=>{
 assert.match(route,/placementTableExists\("placement_recruiter_applicant_notes"\)/);
 assert.doesNotMatch(route,/placementTableExists\("placement_recruiter_private_reviews"\)/);
 assert.match(route,/error instanceof RecruiterPrivateReviewMigrationPending/);
 assert.match(route,/error:"REVIEW_MIGRATION_PENDING"/);
 assert.match(route,/isSameOriginRequest\(request\)/);
});
