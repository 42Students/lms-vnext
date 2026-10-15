import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const client=readFileSync("src/components/announcements/announcement-admin-workspace.tsx","utf8");
describe("Super Admin announcement edit confirmation",()=>{
 it("disables confirmation without affirmative consent",()=>{
  expect(client).toContain("requiresPublicationConsent&&!editConsent");
  expect(client).toContain("setEditConsent(false)");
  expect(client).toContain("publishConsent:requiresPublicationConsent?true:undefined");
 });
});