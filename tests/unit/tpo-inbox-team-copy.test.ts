import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/messages/page.tsx"),"utf8");
describe("TPO Messages copy parity",()=>{
 it("TPO-inbox-team-10 uses the exact legacy Messages subtitle without developer status jargon",()=>{
  expect(page).toContain("Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace.");
  expect(page).not.toContain("Current source:");
  expect(page).not.toContain("Conversation tables available");
  expect(page).not.toContain("Notification fallback");
  expect(page).not.toContain("outbound email/SMS messaging schema");
  expect(page).not.toContain("unregistered migration");
 });
});
