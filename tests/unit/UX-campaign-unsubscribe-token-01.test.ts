import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

describe("UX-campaign-unsubscribe-token-01 preference confirmation",()=>{
 it("validates the link on GET without any suppression mutation or false success",()=>{
  const page=read("src/app/campaign-unsubscribe/[token]/page.tsx");
  const preview=read("src/modules/placements/public-unsubscribe-preview-service.ts");
  expect(page).toContain("campaignUnsubscribeTokenKind(token)");
  expect(page).toContain("This confirmation link is invalid or expired. No preference was changed.");
  expect(page).toContain("Opening this link does not unsubscribe you.");
  expect(page).toContain('cell ? "Stop these emails?" : "Campaign email preferences"');
  expect(preview).toContain("verifyUnsubscribeToken");
  expect(preview).toContain("verifyTpoCampaignRecipientToken");
  expect(preview).not.toContain('method:"POST"');
 });
 it("uses mobile-safe shared Card and a guarded confirmed POST with accessible error",()=>{
  const page=read("src/app/campaign-unsubscribe/[token]/page.tsx");
  const form=read("src/components/placements/campaign-unsubscribe-confirm.tsx");
  expect(page).toContain("<PageHeader");
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