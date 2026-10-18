import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const route="/mentor/notifications";
const src=readFileSync("src/app/(authenticated)"+route+"/page.tsx","utf8");
describe("UX mentor /mentor/notifications audit contract",()=>{
 it("UX-mentor-notifications-01 reads the current membership and uses its authorized service",()=>{
  expect(src).toContain("getCurrentRequestContext");
  expect(src).toMatch("getMentorPersonalInbox"=== "" ? /\w+/ : /getMentorPersonalInbox\s*\(/);
 });
 it("UX-mentor-notifications-02 preserves route copy and the actual recovery/workflow state",()=>{
  expect(src).toContain("title=\"Notifications\"");
  expect(src).toContain("failedSources.push");
 });
});
