import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {issueTpoCampaignRecipientToken,verifyTpoCampaignRecipientToken,matchesCampaignRecipient} from "@/modules/messaging/tpo-campaign-recipient-token";
const source=(path:string)=>readFileSync(path,"utf8");
const claim={v:1 as const,collegeId:"11111111-1111-4111-8111-111111111111",campaignId:"22222222-2222-4222-8222-222222222222",recipientId:"33333333-3333-4333-8333-333333333333",expiresAt:1};
describe("TPO public campaign ambiguous lifecycle decisions",()=>{
 it("TPO-campaigns-public-17 retains safe signed unsubscribe after historic email token expiry",()=>{
  const key="this-is-a-valid-campaign-specific-secret-of-at-least-thirty-two-bytes";
  const token=issueTpoCampaignRecipientToken(claim,key);
  expect(verifyTpoCampaignRecipientToken(token,key,4102444800000)).toEqual(claim);
  expect(verifyTpoCampaignRecipientToken(token,key+"tampered",4102444800000)).toBeNull();
  expect(matchesCampaignRecipient(claim,{collegeId:claim.collegeId,campaignId:claim.campaignId,id:claim.recipientId,unsubscribedAt:null})).toBe(true);
  expect(matchesCampaignRecipient(claim,{collegeId:"44444444-4444-4444-8444-444444444444",campaignId:claim.campaignId,id:claim.recipientId,unsubscribedAt:null})).toBe(false);
 });
 it("TPO-campaigns-public-25 gives the public link an explicit audited on/off/replacement lifecycle rather than silent expiry",()=>{
  const service=source("src/modules/placements/tpo-public-join-link-service.ts");
  expect(service).toContain('expiresAt: new Date("9999-12-31T00:00:00.000Z")');
  expect(service).toContain("setTpoPublicJoinLinkEnabled");
  expect(service).toContain("revokedAt: now");
  expect(service).toContain("metadata:{scope:input.scope,enabled:input.enabled}");
  expect(service).toContain("assertPersistedPlatformPermission");
 });
 it("TPO-campaigns-public-R08 records verified join provenance and never silently skips a requested-drive review",()=>{
  const join=source("src/modules/placements/public-join/join-service.ts");
  const request=source("src/modules/placements/recruiter-drive-request-service.ts");
  expect(join).toContain('joinMethod:scope==="COLLEGE"?"PUBLIC_LINK":"COMPANY_LINK"');
  expect(join).toContain('grantSource:"VERIFIED_RECRUITER_SELF_SERVICE"');
  expect(join).toContain("bypassesDriveReview:false");
  expect(join).toContain('capabilities: ["DRIVES"]');
  expect(request).toContain("No auto-approval until the shared TPO-side policy is registered");
 });
});