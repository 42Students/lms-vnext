import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-campaigns-public-01 campaign composer and POST",()=>{
 it("requires same-origin and authenticated persisted scope",()=>{
  const route=readFileSync("src/app/api/placements/tpo/campaigns/drafts/route.ts","utf8");
  const service=readFileSync("src/modules/messaging/tpo-campaign-draft-service.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("planTpoCampaignRecipients");
 });
 it("never claims delivery from draft save",()=>{
  const ui=readFileSync("src/components/tpo/tpo-campaign-compose.tsx","utf8");
  expect(ui).toContain("Nothing is sent from this form.");
  expect(ui).toContain("No email was sent.");
  expect(ui).toContain("CAMPAIGN_DELIVERY_UNAVAILABLE");
 });
});
