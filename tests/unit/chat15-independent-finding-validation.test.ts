import {describe,expect,it} from "vitest";
import {independentFindingActionSchema} from "@/modules/bug-tracker/independent-finding-actions-model";
import {canAttachFixCommitToFinding,canTransitionIndependentFinding} from "@/modules/bug-tracker/independent-finding-transition-model";

describe("G2-2-001 legacy audit-finding validation",()=>{
 it("preserves Unknown status rather than surfacing a generic enum failure",()=>{
  const result=independentFindingActionSchema.safeParse({
   action:"STATUS",expectedVersion:1,status:"FUTURE_STATUS",
  });
  expect(result.success).toBe(false);
  if(!result.success)expect(result.error.issues.some(issue=>
   issue.message==="Unknown status")).toBe(true);
 });
 it("accepts a one-character assignee but rejects names over 100",()=>{
  expect(independentFindingActionSchema.safeParse({
   action:"ASSIGNEE",expectedVersion:2,assignee:"A",
  }).success).toBe(true);
  const long=independentFindingActionSchema.safeParse({
   action:"ASSIGNEE",expectedVersion:2,assignee:"A".repeat(101),
  });
  expect(long.success).toBe(false);
  if(!long.success)expect(long.error.issues.some(issue=>
   issue.message==="Keep the name under 100 characters")).toBe(true);
 });
 it("requires a reason for terminal/verification changes, and an explicit duplicate target",()=>{
  expect(independentFindingActionSchema.safeParse({
   action:"STATUS",expectedVersion:1,status:"VERIFIED",
  }).success).toBe(false);
  expect(independentFindingActionSchema.safeParse({
   action:"DUPLICATE",expectedVersion:1,duplicateOf:"/path",
  }).success).toBe(false);
  expect(canTransitionIndependentFinding("RELEASED_PROD","VERIFIED","Re-tested workflow")).toBe(true);
  expect(canTransitionIndependentFinding("CONFIRMED","VERIFIED","Re-tested workflow")).toBe(false);
 });
 it("restricts fix-commit evidence to fixed, released or verified findings",()=>{
  expect(canAttachFixCommitToFinding("NEW")).toBe(false);
  expect(canAttachFixCommitToFinding("IN_PROGRESS")).toBe(false);
  expect(canAttachFixCommitToFinding("DUPLICATE")).toBe(false);
  expect(canAttachFixCommitToFinding("FIXED_DEV")).toBe(true);
  expect(canAttachFixCommitToFinding("RELEASED_PROD")).toBe(true);
  expect(canAttachFixCommitToFinding("VERIFIED")).toBe(true);
 });
});
