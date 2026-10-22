import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("UX-company-join-01 company recruiter invitation",()=>{
 it("retains separate company-token context and server-side readiness",()=>{
  const page=read("src/app/company-join/[token]/page.tsx");
  expect(page).toContain('getPublicJoinPreview(token, "COMPANY")');
  expect(page).toContain('scope="COMPANY"');
  expect(page).toContain("publicJoinUnavailableCopy");
  expect(page).toContain("PublicJoinPreviewRetry");
 });
 it("preserves company email proof, six-digit code and guarded shared actions",()=>{
  const form=read("src/components/placements/public-recruiter-join-form.tsx");
  expect(form).toContain('scope === "COMPANY" ? "/api/public/company-join/join" : "/api/public/college-join/join"');
  expect(form).toContain('scope === "COMPANY" ? "/api/public/company-join/send-code" : "/api/public/college-join/send-code"');
  expect(form).toContain('pattern="[0-9]{6}"');
  expect(form).toContain('type="email" required');
  expect(form).toContain("One more step");
  expect(form).toContain("<InlineNotice");
  expect(form).toContain("submittingRef.current");
  expect(form).toContain('type="button" disabled={pending}');
  expect(form).toContain('loading={pending}');
  expect(form).toContain('Join {college} placements');
 });
 it("reuses accessible preview retry rather than conflating network errors and expired links",()=>{
  const retry=read("src/components/placements/public-join-preview-retry.tsx");
  expect(retry).toContain('scope==="COMPANY"?"/company-join/":"/college-join/"');
  expect(retry).toContain("encodeURIComponent(token)");
  expect(retry).toContain('role="alert"');
  expect(retry).toContain('aria-label="Invitation preview unavailable"');
 });
});