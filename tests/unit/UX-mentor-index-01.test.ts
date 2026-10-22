import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/mentor/page.tsx","utf8");
describe("Mentor UX cross-audit /mentor",()=>{
 it("UX-mentor-index-01 reads current context and calls its scoped service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch(/resolveOptionalModuleAccess\s*\(/);
 });
 it("UX-mentor-index-02 preserves route copy and live recovery/workflow",()=>{
  expect(src).toContain('role={failed?"alert":"status"}');
  expect(src).toContain("Retry access check");
  expect(src).toContain("View notifications");
  expect(src).toContain("hasActiveMembership");
 });
});
