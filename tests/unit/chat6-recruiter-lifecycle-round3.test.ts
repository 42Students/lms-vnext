import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("Super Admin recruiter legacy lifecycle",()=>{
 it("SA-academics-people-109 offers suspend and reactivate with confirmation and session-safe archive",()=>{
  const ui=read("src/components/admin/super-admin-hr-accounts.tsx");
  expect(ui).toContain('const next=account.status==="ACTIVE"?"ARCHIVED":"ACTIVE"');
  expect(ui).toContain('"Suspend "+hrDisplayName(account)');
  expect(ui).toContain('"Reactivate "+hrDisplayName(account)');
  expect(ui).toContain("Recruiter suspended");
  expect(ui).toContain('account.status==="ACTIVE"?"Suspend":"Reactivate"');
  expect(read("docs/audit/owner-decisions-resolved.md")).toContain("OD-23");
 });
 it("SA-academics-people-114 restores recruiter accounts page search and college access copy",()=>{
  const ui=read("src/components/admin/super-admin-hr-accounts.tsx");
  const drawer=read("src/components/admin/super-admin-hr-detail-drawer.tsx");
  expect(ui).toContain('eyebrow="Industry access"');
  expect(ui).toContain('title="Recruiter account lifecycle"');
  expect(ui).toContain("Recruiter accounts");
  expect(ui).toContain('placeholder="Name, mobile or email"');
  expect(drawer).toContain("No colleges yet.");
  expect(drawer).toContain("Add a college");
 });
});
