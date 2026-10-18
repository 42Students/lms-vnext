import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(file:string)=>readFileSync(file,"utf8");

describe("public legacy redirect accessibility and privacy",()=>{
 it("UX-e2e-superadmin-login-02 does not offer a privileged test-only sign-in",()=>{
  const page=read("src/app/e2e/superadmin-login/page.tsx");
  expect(page).toContain('redirect("/login")');
  expect(page).not.toContain("createSession");
  expect(page).not.toContain("SUPER_ADMIN");
 });
 it("UX-privacy-policy-02 redirects to the complete public policy rather than a stub",()=>{
  const page=read("src/app/privacy-policy/page.tsx");
  const policy=read("public/assets/static/privacy-policy-view.html");
  expect(page).toContain('redirect("/assets/static/privacy-policy-view.html")');
  expect(policy).toContain('<html lang="en">');
  expect(policy).toContain('name="viewport"');
  expect(policy).toContain("Privacy Policy");
  expect(policy.length).toBeGreaterThan(2000);
 });
});
