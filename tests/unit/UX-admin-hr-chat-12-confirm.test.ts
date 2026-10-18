import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync("src/components/admin/super-admin-hr-accounts.tsx","utf8");
describe("UX-admin-hr-chat-12-confirm",()=>{
 it("requires an accessible confirmation before recruiter suspension or reactivation",()=>{
  expect(source).not.toContain("window.confirm");
  expect(source).toContain('kind:"quick"');
  expect(source).toContain('setConfirmation({kind:"quick"');
  expect(source).toContain('if (target.kind === "quick")');
  expect(source).toContain("<ConfirmDialog");
  expect(source).toContain("pending={pending}");
 });
 it("keeps recruiter phone pagination actions at 44px",()=>{expect(source).not.toContain("min-h-10");expect(source).toContain("min-h-11");});
});
