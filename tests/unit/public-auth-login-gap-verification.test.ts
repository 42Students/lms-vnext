import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {signInCapabilities} from "@/modules/colleges/signin-methods-model";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const login=()=>source("src/components/auth/login-form.tsx");
const home=()=>source("src/app/page.tsx");
describe("public sign-in verified gap closure",()=>{
 it("PUB-auth-public-01 enforces per-college allowed login methods on client and server",()=>{
  expect(signInCapabilities("EMAIL_AND_PHONE")).toEqual({email:true,phone:true,primary:"EMAIL"});
  expect(signInCapabilities("EMAIL_ONLY")).toMatchObject({email:true,phone:false});
  expect(signInCapabilities("PHONE_ONLY")).toMatchObject({email:false,phone:true});
  const runtime=source("src/modules/auth/runtime.ts");
  expect(runtime).toContain("effectiveCollegeSignInCapabilities");
  expect(runtime).toContain('throw new LoginError("CHANNEL_DISABLED")');
  expect(home()).toContain("allowedChannels={signin.email");
 });
 it("PUB-auth-public-02 defaults email first and preserves the college method order",()=>{
  expect(signInCapabilities("EMAIL_AND_PHONE").primary).toBe("EMAIL");
  expect(signInCapabilities("PHONE_AND_EMAIL").primary).toBe("PHONE");
  expect(login()).toContain('defaultChannel = "EMAIL"');
 });
 it("PUB-auth-public-03 restores registered contact, code and resend labels",()=>{
  const s=login();
  for(const phrase of ["Use your registered mobile number.","Use your registered email address.",
   "Continue","Enter your code","One-time code","Verify and sign in","Get the code by email",
   "Enter the code","Resend code in ","Change"])expect(s).toContain(phrase);
 });
 it("PUB-auth-public-04 uses exact legacy guidance for wrong and expired OTP",()=>{
  const s=login();
  for(const phrase of ["That code isn't right. Check it and try again.",
   "This code can't be used any more. Ask for a new one to continue.",
   "Too many wrong codes. Ask for a new one.",
   "Too many codes were requested. Try again in about 10 minutes.",
   "Something went wrong. Try again in a moment.",
   "We couldn't find an account with that email."])expect(s).toContain(phrase);
 });
 it("PUB-auth-public-05 uses 42LMS branding tenant title and legal footer",()=>{
  const s=home();expect(s).toContain('title:"Sign in · "+');
  expect(s).toContain("Powered by 42LMS");
  expect(s).toContain("JRSPF Technologies Pvt. Ltd.");
  expect(s).toContain('branding?.collegeName ?? "42LMS"');
 });
 it("PUB-auth-public-06 consent and privacy terms are available on both steps",()=>{
  const s=login();expect(s.match(/<LoginConsent \/>/g)?.length).toBe(2);
  expect(s).toContain("By continuing, you agree to the");
  expect(s).toContain("Terms of Use");expect(s).toContain("Privacy Policy");
  expect(source("public/assets/static/terms-and-conditions-view.html").length).toBeGreaterThan(100);
  expect(source("public/assets/static/privacy-policy-view.html").length).toBeGreaterThan(100);
 });
 it("PUB-auth-public-07 validates mobile and email inline before sending",()=>{
  const s=login();expect(s).toContain("Enter your mobile number");
  expect(s).toContain("Enter a valid 10-digit mobile number");
  expect(s).toContain("Enter your email");
  expect(s).toContain("Enter a valid email address");
  expect(s).toContain('id="login-contact-error"');
 });
 it("PUB-auth-public-11 expired session shows the legacy re-login sentence",()=>{
  const s=home();expect(s).toContain("Your session expired. Please log in again.");
  expect(s).toContain("Your session has expired. Please log in again.");
 });
 it("PUB-auth-public-12 intercepts revoked or expired sessions on open tabs",()=>{
  const s=source("src/components/auth/session-response-guard.tsx");
  expect(s).toContain("window.fetch = guarded");
  expect(s).toContain("response.status === 401");
  expect(s).toContain('reason === "SESSION_EXPIRED"');
  expect(s).toContain("sessionExpiredHref(");
  expect(s).toContain('reason === "SESSION_REVOKED" ? "revoked" : "expired"');
  const helper=source("src/lib/return-to.ts");
  expect(helper).toContain("export function sessionExpiredHref(");
  expect(helper).toContain("safeReturnTo(currentPath)");
 });
 it("PUB-auth-public-13 restores an unexpired one-time-code attempt after refresh",()=>{
  const s=login();expect(s).toContain("window.sessionStorage.setItem(ATTEMPT_KEY");
  expect(s).toContain("loadLoginAttempt()");
  expect(s).toContain("setAttempt(stored.attempt)");
  expect(s).toContain("nextResendAt");
 });
 it("PUB-auth-public-16 displays the college logo or initials monogram fallback",()=>{
  const s=home();expect(s).toContain("branding?.logoUrl");
  expect(s).toContain("collegeMonogram");
  expect(s).toContain("branding?.collegeName");
 });
 it("PUB-auth-public-17 shows unknown-college recovery instructions and main sign-in link",()=>{
  const s=home();expect(s).toContain("This address isn&apos;t set up yet");
  expect(s).toContain("Ask your administrator to add this college");
  expect(s).toContain("Use the main sign-in page (42lms.com)");
 });
 it("PUB-auth-public-19 wrong-college contact offers a platform sign-in recovery link",()=>{
  const s=login();expect(s).toContain('errorCode === "NO_ACCOUNT_FOR_DOMAIN"');
  expect(s).toContain("https://42lms.com/");
  expect(s).toContain("Use the main sign-in page (42lms.com)");
 });
 it("PUB-auth-public-25 retains secure superadmin-login legacy bookmark redirect",()=>{
  expect(source("src/app/superadmin-login/page.tsx")).toContain('redirect("/")');
 });
 it("PUB-auth-public-33 recruiter=email legacy invitation opens email first",()=>{
  const s=source("src/app/login/page.tsx"),h=home();
  expect(s).toContain('export { default, generateMetadata } from "../page"');
  expect(h).toContain('recruiterValue==="email"&&signin.email?"EMAIL":signin.primary');
 });
 it("PUB-auth-public-39 routes visitors to marketing but preserves an explicit secure login",()=>{
  const s=home();
  expect(s).toContain('tenant.kind === "platform" && requestPath !== "/login"');
  expect(s).toContain('!authValue && !recruiterValue && !requested) redirect("/home")');
  expect(source("src/app/login/page.tsx")).toContain('export { default, generateMetadata } from "../page"');
  expect(source("src/components/marketing/marketing-layout.tsx")).toContain('href="/login"');
 });
 it("PUB-auth-public-34 method tabs announce selection and allow keyboard arrows",()=>{
  const s=login();expect(s).toContain('role="tablist"');
  expect(s).toContain('aria-controls="login-method-panel"');
  expect(s).toContain('"ArrowLeft"');expect(s).toContain('"ArrowRight"');
  expect(s).toContain('aria-describedby={contactError ? "login-contact-error"');
 });
 it("PUB-auth-public-37 safely retires legacy handoff tokens by redirecting to fresh login",()=>{
  const s=source("src/app/auth/handoff/page.tsx");
  expect(s).toContain('redirect("/?auth=handoff-retired")');
  expect(s).not.toContain("consumeHandoffToken");
 });
});
