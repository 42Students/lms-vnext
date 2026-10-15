import {describe,it,expect} from "vitest";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";
describe("campaign cannot masquerade as another login template",()=>{
 it.each(["mfa","user.2fa","sign-in","email.signin","sms.passcode","magic-link","user.one-time"])("rejects reserved auth family %s",key=>{
  expect(isCampaignTemplateKey(key)).toBe(false);
 });
 it.each(["placement.drive-invite","college:newsletter","hiring_update"])("preserves genuine campaign family %s",key=>{
  expect(isCampaignTemplateKey(key)).toBe(true);
 });
});
