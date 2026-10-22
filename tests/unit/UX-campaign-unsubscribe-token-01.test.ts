import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

describe("UX-campaign-unsubscribe-token-01 preference confirmation",()=>{
 it("validates the link on GET without any suppression mutation or false success",()=>{
  const page=read("src/app/campaign-unsubscribe/[token]/page.tsx");
  const preview=read("src/modules/placements/public-unsubscribe-preview-service.ts");
  // GET must never reveal whether a campaign recipient token is valid.
  // Only the confirmed POST validates the signed token and mutates opt-outs.
  expect(page).not.toContain("campaignUnsubscribeTokenKind(token)");
  expect(page).toContain("CampaignUnsubscribeConfirm token={token}");
  expect(page).toContain("Opening this link does not unsubscribe you.");
  expect(page).toContain("Stop these emails?");
  expect(preview).toContain("verifyUnsubscribeToken");
  expect(preview).toContain("verifyTpoCampaignRecipientToken");
  expect(preview).not.toContain('method:"POST"');
 });
 it("uses mobile-safe shared Card and a guarded confirmed POST with accessible error",()=>{
  const page=read("src/app/campaign-unsubscribe/[token]/page.tsx");
  const form=read("src/components/placements/campaign-unsubscribe-confirm.tsx");
  expect(page).toContain('<h1 className="m-0 text-[20px]');
  expect(page).toContain('<Card as="section"');
  expect(page).toContain('min-h-dvh');
  expect(form).toContain("if(pendingRef.current)return");
  expect(form).toContain('method:"POST"');
  expect(form).toContain('response.redirected');
  expect(form).toContain('url.pathname!=="/campaign-unsubscribe/confirmed"');
  expect(form).toContain('<Button type="submit" loading={pending}');
  expect(form).toContain('<InlineNotice tone="error" message={error}');
  expect(form).toContain('ref={errorRef}');
 });
 it("retains bounded route loading and public error recovery",()=>{
  expect(read("src/app/campaign-unsubscribe/[token]/loading.tsx")).toContain("<GracefulPageLoading");
  expect(read("src/app/campaign-unsubscribe/[token]/error.tsx")).toContain('homeHref="/"');
 });
});