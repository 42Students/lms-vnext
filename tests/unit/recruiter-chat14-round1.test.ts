import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {recruiterMobileNumberValid} from "@/modules/placements/recruiter-profile-details-service-client";
import {hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
import {HR_DRIVE_ROUND_PRESETS} from "@/modules/placements/hr-drive-round-presets";
const read=(path:string)=>readFileSync(path,"utf8");
const component=read("src/components/hr/recruiter-profile-details-editor.tsx");
const profile=read("src/app/(authenticated)/hr/profile/page.tsx");
const loginRoutes=["src/app/(authenticated)/recruiter/page.tsx",
 "src/app/(authenticated)/recruiter/colleges/page.tsx"];

describe("chat-14 recruiter reassigned exact-parity round 1",()=>{
 it("REC-calendar-messages-profile-12 preserves the message draft on in-app navigation until explicit Discard",()=>{
  const code=read("src/components/hr/recruiter-conversation-reply-form.tsx");
  expect(code).toContain('title="Discard this unsent message?"');
  expect(code).toContain('consequence="Your draft reply will be lost."');
  expect(code).toContain('document.addEventListener("click",intercept,true)');
  expect(code).toContain('event.preventDefault();event.stopPropagation()');
  expect(code).toContain('confirmLabel="Discard"');
  expect(code).toContain('router.push(destination)');
  expect(code).toContain('window.addEventListener("beforeunload",warn)');
 });
 it("REC-calendar-messages-profile-16 surfaces the exact ended-access response to a failed recruiter reply",()=>{
  expect(hrReplyErrorMessage(403)).toBe("Your access to this college has ended or was removed. Ask the placement cell to give it again.");
 });
 it("REC-calendar-messages-profile-25 supports optional mobile contact without changing work-email login",()=>{
  expect(recruiterMobileNumberValid("")).toBe(true);
  expect(recruiterMobileNumberValid("9876543210")).toBe(true);
  expect(recruiterMobileNumberValid("+919876543210")).toBe(true);
  expect(recruiterMobileNumberValid("12345")).toBe(false);
  const service=read("src/modules/placements/recruiter-profile-details-service.ts");
  expect(service).toContain("placementRecruiterPublicContacts.phoneDigits");
  expect(service).not.toContain("users.phoneE164");
  expect(service).toContain('eq(users.id,context.user.id)');
  expect(service).not.toContain("users.email,");
  expect(profile).toContain("Only for the placement cell to call you. You never sign in with it.");
 });
 it("REC-calendar-messages-profile-27 saves name designation and mobile atomically and warns before leaving dirty form",()=>{
  const service=read("src/modules/placements/recruiter-profile-details-service.ts");
  expect(service).toContain("return getDb().transaction(async tx=>{");
  expect(service).toContain("sameHrNameVersion(");
  expect(service).toContain("sameRecruiterProfileVersion(");
  expect(component).toContain("Unsaved changes");
  expect(component).toContain("Save changes");
  expect(component).toContain("Profile saved");
  expect(component).toContain("Could not save your profile. Your changes are still here; try again.");
  expect(component).toContain("Discard your unsaved profile changes?");
  expect(component).toContain("disabled={busy||!dirty}");
 });
 it("REC-calendar-messages-profile-28 preserves recruiter profile card titles and legacy help",()=>{
  for(const sentence of ["Your details","College access","Account",
    "These details identify you to the placement cell.","Manage your recruiter details."]){
   expect(profile).toContain(sentence);
  }
  expect(profile).toContain("Work email");
  expect(component).toContain("Mobile");
  expect(component).toContain("Designation");
 });
 it("REC-calendar-messages-profile-37 preserves company reports deep links with authorized redirect",()=>{
  const company=read("src/app/(authenticated)/hr/company/page.tsx");
  expect(company).toContain('requestedTab === "reports"');
  expect(company).toContain('"/hr/company/reports"');
  expect(company).toContain("encodeURIComponent(requestedCollegeId)");
 });
 it("REC-calendar-messages-profile-42 shows the legacy decline and unsubscribe confirmation",()=>{
  const code=read("src/components/tpo/recruiter-invite-landing.tsx");
  expect(code).toContain("Thank you, we have told the placement cell");
  expect(code).toContain("You will not be contacted about this again.");
 });
 it("REC-calendar-messages-profile-47 redirects legacy recruiter and colleges entrypoints to Today",()=>{
  for(const path of loginRoutes)expect(read(path)).toContain('redirect("/hr/home")');
 });
 it("REC-calendar-messages-profile-R03 links the notification footer to working recruiter conversations",()=>{
  const page=read("src/app/(authenticated)/hr/notifications/page.tsx");
  expect(page).toContain('href="/hr/messages"');
  expect(page).not.toContain("Conversation threads and replies remain unavailable");
 });
 it("REC-home-drives-11 offers the legacy account load recovery and Retry action",()=>{
  const failure=read("src/app/(authenticated)/hr/home/error.tsx");
  expect(failure).toContain("We couldn&apos;t load your account");
  expect(failure).toContain(">Retry</button>");
 });
 it("REC-home-drives-31 keeps exact legacy round preset labels",()=>{
  expect(HR_DRIVE_ROUND_PRESETS.map(v=>v.label)).toEqual([
   "Test, Technical, HR","Talk, Test, Interview","Test, Group discussion, Interview",
  ]);
 });
 it("REC-home-drives-54 displays the legacy missing-drive message without disclosing other colleges",()=>{
  const missing=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx");
  expect(missing).toContain("We could not find this drive");
  expect(missing).toContain("It isn&apos;t one of your drives at this college, or it was removed.");
 });
 it("REC-home-drives-R07 intentionally uses IST for all LMS recruiter's dates by owner decision",()=>{
  const home=read("src/app/(authenticated)/hr/home/page.tsx");
  const portfolio=read("src/components/placements/recruiter-placement-portfolio.tsx");
  expect(home).toContain('timeZone:"Asia/Kolkata"');
  expect(portfolio).toContain('timeZone:"Asia/Kolkata"');
 });
});
