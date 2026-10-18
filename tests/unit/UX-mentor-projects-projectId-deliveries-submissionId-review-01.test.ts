import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor/projects/[projectId]/deliveries/[submissionId]/review",()=>{
 it("UX-mentor-projects-projectId-deliveries-submissionId-review-01 keeps the authorized scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/getMentorDeliveryVersion\s*\(/);
 });
 it("UX-mentor-projects-projectId-deliveries-submissionId-review-02 preserves exact route copy and recovery/workflow",()=>{
  expect(src).toContain("<PageHeader");
  expect(src).toContain("safeProjectExternalHref");
 });
});
