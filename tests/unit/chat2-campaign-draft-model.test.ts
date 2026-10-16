import {describe,it,expect} from "vitest";
import {tpoCampaignDraftSchema} from "@/modules/messaging/tpo-campaign-draft-model";
const sample={title:"October hiring",subject:"Campus placements",body:"Interested in student hiring?",
 segment:"ALL_ELIGIBLE",templateKey:"tpo-campaign-general"};
describe("TPO-campaigns-public-01 draft safety",()=>{
 it("accepts only an approved non-OTP template shape",()=>{
  expect(tpoCampaignDraftSchema.safeParse(sample).success).toBe(true);
  expect(tpoCampaignDraftSchema.safeParse({...sample,templateKey:"login-otp"}).success).toBe(false);
 });
 it("rejects forged tenant and recipients",()=>{
  expect(tpoCampaignDraftSchema.safeParse({...sample,collegeId:"foreign"}).success).toBe(false);
  expect(tpoCampaignDraftSchema.safeParse({...sample,recipientEmail:"victim@example.com"}).success).toBe(false);
 });
});
