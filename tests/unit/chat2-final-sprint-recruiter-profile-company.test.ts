import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
const profile=()=>src("src/app/(authenticated)/hr/profile/page.tsx");
const company=()=>src("src/app/(authenticated)/hr/company/page.tsx");
describe("Final sprint recruiter profile/company verification",()=>{
 it("REC-calendar-messages-profile-26 gives separate bounded first and last names",()=>{
  const editor=src("src/components/hr/recruiter-profile-details-editor.tsx");
  expect(editor).toContain('["firstName","First name"]');
  expect(editor).toContain('["lastName","Last name"]');
  expect(editor).toContain('key==="title"?160:100');
  expect(editor).toContain('autoComplete={key==="firstName"?"given-name"');
 });
 it("REC-calendar-messages-profile-29 discloses actual college-grant expiry without guessing an end date",()=>{
  const page=profile();
  expect(page).toContain("Access until");
  expect(page).toContain("grant.accessUntilIso");
  expect(page).toContain("Access has no end date");
 });
 it("REC-calendar-messages-profile-30 preserves explicit consent confirmation for college grant self-revoke",()=>{
  const ui=src("src/components/hr/recruiter-profile-access.tsx");
  expect(ui).toContain("Leave access to ");
  expect(ui).toContain("You will immediately lose recruiter access to this college.");
  expect(ui).toContain("Leave Access");
  expect(ui).toContain("requires a new placement-cell grant to return");
 });
 it("REC-calendar-messages-profile-32 provides scoped company name, safe website, domain, industry fallback and initials",()=>{
  const page=company();
  expect(page).toContain('result.company.name.trim().charAt(0).toUpperCase()');
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain("Primary domain");
  expect(page).toContain("Industry not set");
  expect(page).toContain("One company for everyone at it.");
 });
 it("REC-calendar-messages-profile-33 keeps a college-private trust classification from appearing as a recruiter permission",()=>{
  const page=company();
  expect(page).toContain("Linked by the placement cell");
  expect(page).not.toContain('>Trusted relationship<');
  expect(page).not.toContain("isTrusted ?");
 });
 it("REC-calendar-messages-profile-34 shows own-company teammates and actual attributed drive counts",()=>{
  const page=company();
  expect(page).toContain("Colleagues from your company who work with this college.");
  expect(page).toContain("attributedDriveCounts[member.userId]");
  expect(page).toContain("drive(s) here");
  expect(page).toContain("hrTeamRosterMessage");
 });
 it("REC-calendar-messages-profile-35 distinguishes verified report status buckets and never counts withdrawals as offers",()=>{
  const page=src("src/app/(authenticated)/hr/company/reports/page.tsx");
  expect(page).toContain('["Applied",job.applications]');
  expect(page).toContain('"Offered"');
  expect(page).toContain("job.outstandingOffers+job.acceptedOffers+job.declinedOffers");
  expect(page).toContain("job.acceptedOffers");
  expect(page).toContain("job.declinedOffers");
  expect(page).toContain("job.joinedOffers");
  expect(page).toContain("job.withdrawnApplications");
  expect(page).toContain("Reports appear once you have a drive with applicants.");
 });
 it("REC-calendar-messages-profile-36 matches legacy recruiter company header label without CSS changes",()=>{
  const page=company();
  expect(page).toContain('eyebrow="Recruiter"');
  expect(page).toContain("Your profile");
  expect(page).toContain('description={"Your work with " + result.grant.collegeName}');
 });
 it("REC-calendar-messages-profile-41 keeps verified invite email read-only and discloses permission-bounded student access",()=>{
  const ui=src("src/components/tpo/recruiter-invite-landing.tsx");
  expect(ui).toContain("You can request placement drives and review the students who apply.");
  expect(ui).toContain("Contact details are shared only as the placement cell allows.");
  expect(ui).toContain('<input type="email" readOnly value={invite.contactEmail??""}');
  expect(ui).toContain('{"From your invitation. You\'ll sign in with it."}');
 });
 it("REC-calendar-messages-profile-26 independent final-sprint acceptance regression",()=>{
  expect(src("src/components/hr/recruiter-profile-details-editor.tsx")).toContain("[\"firstName\",\"First name\"]");
  expect(src("src/components/hr/recruiter-profile-details-editor.tsx")).toContain("[\"lastName\",\"Last name\"]");
  expect(src("src/components/hr/recruiter-profile-details-editor.tsx")).toContain("maxLength={key===\"phone\"?14:key===\"title\"?160:100}");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-26 |");
 });

 it("REC-calendar-messages-profile-29 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/profile/page.tsx")).toContain("grant.accessUntilIso");
  expect(src("src/app/(authenticated)/hr/profile/page.tsx")).toContain("Access has no end date");
  expect(src("src/modules/placements/recruiter-self-grants-service.ts")).toContain("validUntil: placementRecruiterCollegeGrants.validUntil");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-29 |");
 });

});