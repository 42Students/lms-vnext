import {describe,expect,it} from "vitest";
import {discussionModerationAuditScope} from "@/modules/courses/discussion-audit-scope-model";
describe("G2-2-033 discussion moderation audit scope",()=>{
 const scope={collegeId:"college-1",organizationId:"org-1"};
 it("attributes platform Super Admin moderation to the authorized class",()=>{
  expect(discussionModerationAuditScope(scope,null,"ADMIN")).toEqual(scope);
 });
 it("rejects mismatched teacher or learner membership colleges",()=>{
  expect(discussionModerationAuditScope(scope,"college-1","FACULTY"))
   .toEqual(scope);
  expect(()=>discussionModerationAuditScope(scope,"college-2","FACULTY"))
   .toThrow("differ");
  expect(()=>discussionModerationAuditScope(scope,null,"LEARNER"))
   .toThrow("differ");
 });
});
