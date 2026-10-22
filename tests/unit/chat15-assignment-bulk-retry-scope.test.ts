import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

/** Guard that targeted retries never count unrelated learner submissions. */
describe("G2-2-008 bulk grade publication retry isolation",()=>{
 const source=readFileSync("src/modules/courses/assignment-bulk-grade-publish-service.ts","utf8");
 it("rejects an explicitly empty retry list",()=>{
  expect(source).toContain("submissionIds:z.array(z.string().uuid()).min(1).max(MAX_BATCH).optional()");
 });
 it("uses the same scoped predicate before and after publishing",()=>{
  expect(source).toContain("const pendingScope=and(conditions,input.submissionIds?");
  expect(source).toContain("inArray(assignmentSubmissions.id,input.submissionIds):undefined);");
  expect(source.match(/where\(pendingScope\)/g)).toHaveLength(2);
  expect(source).toContain("complete:remaining===0");
 });
 it("keeps assignment/section authorization and atomic per-submission publication",()=>{
  expect(source).toContain("await requireWholeAssignmentBulkPermission(context,assignmentId)");
  expect(source).toContain("await publishAssignmentGrade(context,row.id,{expectedVersion:row.version})");
  expect(source).toContain("legacyAuditAction:\"ASSIGNMENT_GRADES_PUBLISH_ALL\"");
 });
});
