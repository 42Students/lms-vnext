import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 HR UX rollout batch 03",()=>{
 it("UX-hr-hr-profile-01 protects responsive route semantics",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/profile/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).toContain("<DataTable");
  expect(src).toContain('caption="Current college access"');
  expect(src).toContain('mobilePriority:"primary"');
  expect(src).toContain("hasActiveRecruiter(context)");
 });
 it("UX-hr-hr-round-results-01 protects responsive route semantics",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/round-results/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
});
