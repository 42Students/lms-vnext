import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");

describe("chat-16 public route responsive and accessible state coverage",()=>{
 it.each(["enterprises","universities","platform"])("UX-%s-02 keeps labelled shared hero, navigation and a usable demo action",area=>{
  const page=read("src/app/"+area+"/page.tsx");
  const kit=read("src/components/marketing/marketing-layout.tsx");
  expect(page).toContain("<MarketingLayout");
  expect(page).toContain("<MarketingHero");
  expect(page).toContain("<MarketingCta");
  const header=read("src/components/marketing/marketing-header-client.tsx");
  expect(header).toContain('aria-label="Primary"');
  expect(header).toContain('href="/request-demo"');
  expect(kit).toContain("min-h-11");
  expect(kit).toContain("min-w-0");
  expect(kit).toContain("focus-visible:outline-2");
 });
 it("UX-request-demo-02 is keyboard reachable and does not collect unprotected form data",()=>{
  const page=read("src/app/request-demo/page.tsx");
  expect(page).toContain("<MarketingLayout>");
  expect(page).toContain('const DEMO_MAILTO = "mailto:"');
  expect(page).toContain('href={DEMO_MAILTO}');
  expect(page).toContain("min-h-11");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).toContain("Email us to book a demo");
  expect(page).not.toContain("<form");
  expect(page).not.toContain('method="post"');
 });
 it("UX-forbidden-02 gives an accessible recovery route, not a redirect loop",()=>{
  const page=read("src/app/forbidden/page.tsx");
  expect(page).toContain("<GracefulScreen");
  expect(page).toContain('homeHref="/dashboard"');
  expect(page).toContain("contact your administrator");
  expect(page).not.toContain("redirect(");
 });
 it("UX-company-share-token-02 retains selected-column filtering and nonleaking failure state",()=>{
  const page=read("src/app/company-share/[token]/page.tsx");
  expect(page).toContain("safeCompanyShareColumns(result.selectedColumns)");
  expect(page).toContain("getPublicCompanyApplicantShare");
  expect(page).toContain('result.kind==="CODE_REQUIRED"');
  const code=read("src/app/company-share/[token]/share-code-form.tsx");
  expect(code).toContain('type="text"');
  expect(code).toContain('inputMode="text"');
  expect(code).toContain("required minLength={6} maxLength={6}");
  expect(code).toContain('pattern="[A-Za-z0-9]{6}"');
  expect(code).toContain("disabled={!valid}");
  expect(page).toContain("<DataTable");
  expect(page).toContain("empty={<div role=\"status\"");
  expect(page).toContain('href={publicApplicantExportHref(token,result.search)}');
  expect(page).toContain("Everything you open is logged");
 });
});
