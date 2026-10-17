import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("Learner photo upload gated by secure private storage",()=>{
 it("LEARNER-profile-misc-02 BLOCKED never claims a public URL is a verified uploaded photo",()=>{
  const ui=readFileSync("src/components/profile/learner-profile-workspace.tsx","utf8");
  expect(ui).toContain("Upload/replace remains blocked until the shared Cloud Storage profile-asset workflow is live.");
  expect(ui).not.toContain('accept="image/*"');
  expect(ui).not.toContain('action="/api/public/upload-photo"');
 });
});