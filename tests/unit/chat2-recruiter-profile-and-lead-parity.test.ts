import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {inferLegacyRecruiterCompanyName} from "@/modules/placements/tpo-recruiter-lead-policy";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Recruiter legacy profile and lead company parity",()=>{
 it("REC-calendar-messages-profile-28 uses exact profile titles and help text",()=>{
  const profile=src("src/app/(authenticated)/hr/profile/page.tsx");
  for(const s of ["Manage your recruiter details.","Your details","College access",
   "Work email","Only for the placement cell to call you. You never sign in with it.",
   "Your company comes from your work email. Ask 42 if its name or logo is wrong."])
   expect(profile).toContain(s);
  expect(profile).toContain("new work email and a new account.");
 });
 it("REC-calendar-messages-profile-42 keeps legacy invite-declined receipt copy",()=>{
  const invite=src("src/components/tpo/recruiter-invite-landing.tsx");
  expect(invite).toContain("Thank you, we have told the placement cell");
  expect(invite).toContain("You will not be contacted about this again.");
 });
 it("REC-calendar-messages-profile-37 honors legacy Reports URL with secure route redirect",()=>{
  const company=src("src/app/(authenticated)/hr/company/page.tsx");
  expect(company).toContain('requestedTab === "reports"');
  expect(company).toContain('"/hr/company/reports"');
  expect(company).toContain("requestedCollegeId");
 });
 it("TPO-recruiters-38 does not invent employers from private email providers",()=>{
  for(const email of ["test@gmail.com","test@icloud.com","test@protonmail.com",
   "test@mail.com","test@yahoo.co.in","test@outlook.com","test@aol.com"])
   expect(inferLegacyRecruiterCompanyName(email)).toBeNull();
  expect(inferLegacyRecruiterCompanyName("sam@acme.com")).toBe("Acme");
  expect(inferLegacyRecruiterCompanyName(null)).toBeNull();
 });
});
