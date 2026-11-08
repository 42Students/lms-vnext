import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
const read = (p:string) => readFileSync(p,"utf8");
describe("UX-G135 contact-profile safe draft UX",()=>{
 it("renders accessible contact form and clean initial state",()=>{
  const html=renderToStaticMarkup(<CollegeContactProfileForm initial={{
   collegeName:"Example College",supportEmail:"help@example.edu",supportPhone:null,
   termsUrl:"https://example.edu/terms",privacyUrl:null,version:7
  }}/>);
  for(const text of ["Example College","No unsaved changes.","Confirm and save changes","Support email","Support phone","type=\"email\"","type=\"url\"","pattern=\"https://.*\""]) expect(html).toContain(text);
 });
 it("confirms destructive reset and restores every field",()=>{
  const s=read("src/components/colleges/college-contact-profile-form.tsx");
  for(const text of ["setDiscardOpen(true)",'title="Discard unsaved contact changes?"','confirmVariant="danger"','confirmLabel="Discard changes"',"setName(saved.collegeName)","setEmail(saved.supportEmail","setPhone(saved.supportPhone","setTerms(saved.termsUrl","setPrivacy(saved.privacyUrl",'role="status" aria-live="polite"'])expect(s).toContain(text);
 });
 it("retains versioned API update, error and confirmation gates",()=>{
  const s=read("src/components/colleges/college-contact-profile-form.tsx");
  for(const text of ['fetch("/api/colleges/contact-profile"','method: "PATCH"','expectedVersion: saved.version','confirm: true','if (!response.ok) {','router.refresh()'])expect(s).toContain(text);
  expect(s).toContain("COLLEGE_PROFILE_STALE");
  expect(s).toContain("Your unsaved edits are still here.");
  expect(s).not.toContain("localStorage");
 });
 it("test fixture is inaccessible in production",()=>{
  const s=read("src/app/e2e/ux-g135-contact-profile/page.tsx");
  expect(s).toContain('process.env.NODE_ENV !== "development"');
  expect(s).toContain("notFound()");
 });
});
