import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const get=(path:string)=>readFileSync(path,"utf8");
describe("PROJ-BREAK-reviews-19 persisted reviewer authorizations",()=>{
 it("rechecks current project admin or mentor grants after locked submission and before review/notification insert",()=>{
  const code=get("src/modules/projects/submission-service.ts");
  const review=code.slice(code.indexOf("export async function reviewProjectSubmission("),
    code.indexOf("export async function listProjectSubmissions("));
  expect(review).toContain("requireProjectLifecycleAccess");
  expect(review).toContain('eq(projectSubmissions.id, submissionId)');
  expect(review).toContain('.for("update")');
  expect(review).toContain('if(reviewerAccess!=="ADMIN"&&reviewerAccess!=="MENTOR")');
  expect(review).toContain("await assertCurrentEvaluationActor(tx,context,{");
  expect(review).toContain("project:{id:scope.project.id}");
  expect(review).toContain("collegeId:scope.collegeId,organizationId:scope.organizationId");
  expect(review).toContain("access:reviewerAccess");
  expect(review.indexOf("await assertCurrentEvaluationActor(")).toBeGreaterThan(review.indexOf('if (submission.status !== "SUBMITTED"'));
  expect(review.indexOf("await assertCurrentEvaluationActor(")).toBeLessThan(review.indexOf(".insert(projectSubmissionReviews)"));
  expect(review.indexOf("await assertCurrentEvaluationActor(")).toBeLessThan(review.indexOf("recordActivityEventInTransaction(tx, context"));
  expect(review).toContain("learnerProjectDeliveryReviewNotice");
  expect(review).toContain("onConflictDoNothing");
 });
 it("persisted actor rechecks disabled user, rescinded system roles, active mentor project membership",()=>{
  const code=get("src/modules/projects/evaluation-service.ts");
  const actor=code.slice(code.indexOf("export async function assertCurrentEvaluationActor("),
    code.indexOf("function mapEvaluationConstraint("));
  expect(actor).toContain('assertPersistedPlatformPermission(tx,context,"projects.manage"');
  expect(actor).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(actor).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(actor).toContain('eq(projectMembers.role,"MENTOR")');
  expect(actor).toContain('isNull(projectMembers.endedAt)');
  expect(actor).toContain('.for("share")');
 });
});
