import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const invite=()=>src("src/components/tpo/recruiter-invite-landing.tsx");
const share=()=>src("src/app/company-share/[token]/page.tsx");
describe("Public invite, share, marketing, privacy legacy gaps",()=>{
 it("PUB-auth-public-40 recruiter acceptance UI is not permanently disabled",()=>{
  expect(invite()).toContain("acceptCode()");
  expect(invite()).toContain("Join ");
  expect(invite()).toContain("/accept");
 });
 it("PUB-auth-public-41 recruiter can request a code through same-origin protected endpoint",()=>{
  expect(invite()).toContain("Send me a code");
  const endpoint=src("src/app/api/public/recruiter-invite/[token]/send-code/route.ts");
  expect(endpoint).toContain("isSameOriginRequest");
  expect(endpoint).toContain("requestRecruiterInviteOtp");
 });
 it("PUB-auth-public-42 recruiter accepted by public API, not requiring signed-in role",()=>{
  const endpoint=src("src/app/api/public/recruiter-invite/[token]/accept/route.ts");
  expect(endpoint).toContain("acceptPublicTpoRecruiterInviteOtp");
  expect(endpoint).toContain("isSameOriginRequest");
  expect(endpoint).not.toContain("getCurrentRequestContext");
 });
 it("PUB-auth-public-44 recruiter invite validates name, optional 10-digit phone and six-digit OTP",()=>{
  expect(invite()).toContain("Enter your name");
  expect(invite()).toContain("The code has 6 digits");
  expect(invite()).toContain("Enter a valid 10-digit mobile number, or leave it blank.");
 });
 it("PUB-auth-public-45 a successful recruiter join provides a sign-in link",()=>{
  expect(invite()).toContain("You now have access to");
  expect(invite()).toContain("Sign in with your work email");
  expect(invite()).toContain('href="/login"');
 });
 it("PUB-auth-public-46 errors loading a valid invitation show Retry, not invalid token",()=>{
  expect(invite()).toContain('"load_error"');
  expect(invite()).toContain("Retry");
  expect(invite()).toContain("apiFetch<{invite?:Invite}>");
  expect(invite()).toContain("FriendlyFetchError");
  expect(invite()).toContain("This link is no longer valid");
 });
 it("PUB-auth-public-47 invite context identifies the company and college",()=>{
  expect(invite()).toContain("You are joining as ");
  expect(invite()).toContain("invite.companyName");
  expect(invite()).toContain("invite.collegeName");
  expect(invite()).toContain("Contact details are shared only as the placement cell allows.");
 });
 it("PUB-auth-public-48 declined recruiter subtitle exact legacy wording",()=>{
  expect(invite()).toContain("You will not be contacted about this again.");
 });
 it("PUB-auth-public-56 company share carries who, when, expiry and disclosure warning",()=>{
  expect(share()).toContain("Shared with {result.companyName}");
  expect(share()).toContain("Shared by {result.collegeName}");
  expect(share()).toContain("Please do not forward this page.");
  expect(share()).toContain("The link works until");
 });
 it("PUB-auth-public-58 applicant list has per-company confidential watermark",()=>{
  expect(share()).toContain("{result.companyName} · confidential");
  expect(share()).toContain('aria-hidden="true"');
 });
 it("PUB-auth-public-59 temporary share failure offers a retry action",()=>{
  const err=src("src/app/company-share/[token]/error.tsx");
  expect(err).toContain("We couldn&apos;t load this share");
  expect(err).toContain("onClick={reset}");
  expect(err).toContain("Retry");
  expect(share()).toContain("This link is not valid any more.");
  expect(share()).toContain("It may have expired or been withdrawn. Please ask the placement cell for a new one.");
 });
 it("PUB-auth-public-62 marketing home contains role audience and JSON-LD",()=>{
  const page=src("src/app/home/page.tsx");
  expect(page).toContain("application/ld+json");
  expect(page).toContain("Who the platform serves");
  expect(page).toContain("One continuous journey");
 });
 it("PUB-auth-public-63 platform overview describes talent and workforce development",()=>{
  expect(src("src/app/platform/page.tsx")).toContain("One autonomous AI platform for talent and workforce development");
 });
 it("PUB-auth-public-64 Universities landing has matching headline",()=>{
  expect(src("src/app/universities/page.tsx")).toContain("Develop Employable Graduates with AI");
 });
 it("PUB-auth-public-65 Enterprises landing has matching headline",()=>{
  expect(src("src/app/enterprises/page.tsx")).toContain("Build High-Performing Workforces with AI");
 });
 it("PUB-auth-public-66 demo request has mailto action without collecting form data",()=>{
  const page=src("src/app/request-demo/page.tsx");
  expect(page).toContain("See 42 LMS in action");
  expect(page).toContain("Email us to book a demo");
  expect(page).toContain("mailto:hello@42lms.com");
 });
 it("PUB-auth-public-67 mobile privacy URL serves the historical policy with contact and effective date",()=>{
  expect(src("src/app/privacy-policy/page.tsx")).toContain("/assets/static/privacy-policy-view.html");
  const policy=src("public/assets/static/privacy-policy-view.html");
  expect(policy).toContain("April 20, 2026");
  expect(policy).toContain("com.lms42.app");
  expect(policy).toContain("privacy@42lms.com");
 });
 it("PUB-auth-public-68 historical terms and privacy static URLs exist",()=>{
  expect(src("public/assets/static/terms-and-conditions-view.html")).toContain("privacy-policy-view.html");
  expect(src("public/assets/static/privacy-policy-view.html")).toContain("Privacy");
 });
 it("PUB-auth-public-54 shared applicant export is labelled Download list with approved bounded CSV",()=>{
  const page=src("src/app/company-share/[token]/page.tsx");
  const href=src("src/modules/placements/company-share/export-href-model.ts");
  expect(page).toContain("Download list (CSV, up to 500 applicants)");
  expect(page).toContain("publicApplicantExportHref(token,result.search)");
  expect(href).toContain("company-share");
 });

});
