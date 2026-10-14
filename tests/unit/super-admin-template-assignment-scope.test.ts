import {describe,expect,it} from "vitest";
import {templateAssignmentMatchesScope,templateAssignmentScopeLabel} from "@/modules/projects/template-assignment-read-scope";
describe("Template assignment safety scope",()=>{
 it("allows global but rejects other org and college",()=>{
  const row={collegeId:"a",organizationId:"o"};
  expect(templateAssignmentMatchesScope(row,null)).toBe(true);
  expect(templateAssignmentMatchesScope(row,{collegeId:"b",organizationId:"o"})).toBe(false);
  expect(templateAssignmentMatchesScope(row,{organizationId:"elsewhere"})).toBe(false);
  expect(templateAssignmentMatchesScope(row,{collegeId:"a",organizationId:"o"})).toBe(true);
 });
 it("labels the visible assignment count",()=>{
  expect(templateAssignmentScopeLabel(null)).toBe("global");
  expect(templateAssignmentScopeLabel({organizationId:"o"})).toBe("selected organization");
 });
});
