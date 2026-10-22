import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync("src/components/admin/learner-module-access-drawer.tsx","utf8");
describe("UX-admin-features-chat-12-drawer",()=>{
 it("uses shared drawer with native focus containment, Escape and topmost Back handling",()=>{
  expect(source).toContain("<Drawer open={traceOpen}");
  expect(source).toContain("onOpenChange={open=>{if(!open)close();}}");
  expect(source).not.toContain('role="dialog"');
  expect(source).not.toContain("onKeyDown=");
  expect(source).not.toContain("fixed inset-0 z-50");
  expect(source).toContain("Recheck access after a change");
 });
});
