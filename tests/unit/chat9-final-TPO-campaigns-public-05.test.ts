import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-05 verifies the implemented contract",()=>{
  const service=read("src/modules/messaging/tpo-campaign-dispatch-service.ts");
  expect(service).toContain('eq(placementTpoEmailCampaigns.status,"DRAFT")');
  expect(service).toContain("campaignRecipientDisposition({");
  expect(service).toContain("canContactRecipientAtRuntime");
  expect(service).toContain("issueTpoCampaignRecipientToken({");
  expect(service).toContain('note:"Campaign: "+draft.subject.slice(0,180)');
  expect(service).toContain('status:"EMAILED"');
  expect(service).toContain('process.env["TPO_CAMPAIGNS_READY"]!=="VERIFIED"');
  expect(service).toContain("messagingDeliveryReceipts");
 });
});
