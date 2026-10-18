import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/risk-readiness",()=>{
 it("UX-mentor-projects-projectId-risk-readiness-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorRiskReadiness\s*\(/);
 });
 it("UX-mentor-projects-projectId-risk-readiness-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("title=\"At-risk & readiness drill-in\"");
  expect(src).toContain("mentorRiskReadinessQuerySchema.safeParse");
 });
});
