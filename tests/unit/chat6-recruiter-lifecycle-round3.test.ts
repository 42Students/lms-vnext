import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("Super Admin recruiter legacy lifecycle",()=>{
 it("SA-academics-people-109 offers suspend and reactivate with confirmation and session-safe archive",()=>{
  const ui=read("src/components/admin/super-admin-hr-accounts.tsx");
  expect(ui).toContain('const next=account.status==="ACTIVE"?"ARCHIVED":"ACTIVE"');
  expect(ui).toContain('confirmation.status==="ARCHIVED"?"Suspend ":"Reactivate "');
  expect(ui).toContain('setConfirmation({kind:"quick",userId:account.userId,name:hrDisplayName(account),status:next})');
  expect(ui).toContain("<ConfirmDialog");
  expect(ui).toContain("Recruiter suspended");
  expect(ui).toContain('account.status==="ACTIVE"?"Suspend":"Reactivate"');
  expect(read("docs/audit/owner-decisions-resolved.md")).toContain("OD-23");
 });
 it("SA-academics-people-114 restores recruiter accounts page search and college access copy",()=>{
  const ui=read("src/components/admin/super-admin-hr-accounts.tsx");
  const drawer=read("src/components/admin/super-admin-hr-detail-drawer.tsx");
  expect(ui).toContain('>Industry access</p>');
  expect(ui).toContain('<section aria-label="Recruiter account lifecycle"');
  expect(ui).toContain("<h2 className=\"text-base font-semibold\">Recruiter account lifecycle</h2>");
  expect(ui).toContain("Recruiter accounts");
  expect(ui).toContain('placeholder="Name, mobile or email"');
  expect(drawer).toContain("No colleges yet.");
  expect(drawer).toContain("Add a college");
 });
});
