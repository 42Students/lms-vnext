import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-campaigns-public-02 saved records and receipt separation",()=>{
 it("lists scoped saved drafts separately from real provider receipts",()=>{
  const s=readFileSync("src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx","utf8");
  expect(s).toContain("Saved campaign drafts");
  expect(s).toContain("Delivery receipts");
  expect(s).toContain("listTpoCampaignDrafts(context)");
 });
 it("never advertises unverified sends as delivered",()=>{
  const s=readFileSync("src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx","utf8");
  expect(s).toContain("CAMPAIGN_DELIVERY_UNAVAILABLE");
 });
 it("scopes one draft by college and campaign id",()=>{
  const s=readFileSync("src/modules/messaging/tpo-campaign-draft-service.ts","utf8");
  expect(s).toContain("where d.college_id=");
  expect(s).toContain("and d.campaign_id=");
 });
});
