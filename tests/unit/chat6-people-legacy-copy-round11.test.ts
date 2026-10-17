import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin People legacy wording",()=>{
 it("SA-academics-people-91 preserves registered faculty headings, OTP help and create edit feedback",()=>{
  const page=source("src/app/(authenticated)/admin/faculty/page.tsx");
  const create=source("src/components/admin/person-onboard-dialog.tsx");
  const edit=source("src/components/college/college-person-edit-action.tsx");
  for(const text of ["Register New Faculty","Registered Faculty","Used for OTP login"])expect(page).toContain(text);
  expect(create).toContain("Faculty registered successfully! They can now login with their mobile number.");
  expect(edit).toContain("Faculty updated successfully!");
  const decisions=source("docs/audit/owner-decisions-resolved.md");
  expect(decisions).toContain("OD-23");
 });
});