import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const ui=readFileSync("src/components/hr/recruiter-conversation-reply-form.tsx","utf8");
describe("Recruiter Messages draft protection",()=>{
 it("REC-calendar-messages-profile-12 warns before closing a nonempty reply",()=>{
  expect(ui).toContain("Discard this unsent message?");
  expect(ui).toContain("Your draft reply will be lost.");
  expect(ui).toContain(">Keep writing</button>");
  expect(ui).toContain("setConfirmDiscard(true)");
  expect(ui).toContain('role="alertdialog"');
  expect(ui).toContain("router.push(\"/hr/messages\")");
 });
 it("REC-calendar-messages-profile-12 protects native unload while unsent text remains",()=>{
  expect(ui).toContain('window.addEventListener("beforeunload",warn)');
  expect(ui).toContain('window.removeEventListener("beforeunload",warn)');
 });
});
