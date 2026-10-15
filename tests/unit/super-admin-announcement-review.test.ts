import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync("src/components/announcements/announcement-admin-workspace.tsx","utf8");
describe("Super Admin publication review",()=>{
 it("requires review and confirmation before using publish consent",()=>{
  expect(source).toContain("setReviewPublish(true)");
  expect(source).toContain("publishConsent:true");
  expect(source).toContain("Confirm and publish");
  expect(source).toContain("No external outbound delivery");
 });
});