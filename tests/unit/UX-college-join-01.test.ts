import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("UX-college-join-01 college recruiter invitation",()=>{
 it("retains college-only token scope and honest preview recovery",()=>{
  const page=read("src/app/college-join/[token]/page.tsx");
  expect(page).toContain('getPublicJoinPreview(token, "COLLEGE")');
  expect(page).toContain('scope="COLLEGE"');
  expect(page).toContain("PublicJoinPreviewRetry");
  expect(page).toContain("publicJoinUnavailable");
 });
 it("uses shared phone-first form, explicit labels, pending guards and focusable inline error",()=>{
  const form=read("src/components/placements/public-recruiter-join-form.tsx");
  for(const text of ['<Card as="section"','<Input ','<Button type="submit" loading={pending}','<InlineNotice tone="error" message={error}','ref={errorSummaryRef}','authStyles["page"]','submittingRef.current=true','submittingRef.current=false','Work email','Your name','Mobile (optional)','Send me a code']){
    expect(form).toContain(text);
  }
  // Full viewport height is supplied by the shared legacy-inspired public auth skin.
  expect(read("src/components/public/public-auth-skin.module.css")).toContain("min-height: 100dvh");
  expect(form).toContain('scope === "COMPANY" ? "/api/public/company-join/send-code" : "/api/public/college-join/send-code"');
 });
 it("keeps a recovery action without claiming the invitation was used",()=>{
  const retry=read("src/components/placements/public-join-preview-retry.tsx");
  expect(retry).toContain('<Card as="section" aria-label="Invitation preview unavailable"');
  expect(retry).toContain('<p role="alert"');
  expect(retry).toContain("Your invitation was not used.");
  expect(retry).toContain("Retry");
 });
});