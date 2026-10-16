import {describe,it,expect} from "vitest";
import {previewTpoCampaignText,tpoCampaignDraftSchema} from "@/modules/messaging/tpo-campaign-draft-model";
describe("TPO-campaigns-public-01 merge placeholder composer",()=>{
 const base={title:"Hiring",subject:"Opportunities",body:"Hello {name} from {company}",
  segment:"ALL_ELIGIBLE",templateKey:"tpo-campaign-general"};
 it("replaces only supported placeholders as plain text",()=>{
  expect(previewTpoCampaignText(base.body,{name:"Ravi",company:"ACME"})).toBe("Hello Ravi from ACME");
  expect(previewTpoCampaignText("{unknown}",{name:"Ravi",company:"ACME"})).toBe("{unknown}");
 });
 it("bounds the draft body at 10000 characters",()=>{
  expect(tpoCampaignDraftSchema.safeParse({...base,body:"x".repeat(10000)}).success).toBe(true);
  expect(tpoCampaignDraftSchema.safeParse({...base,body:"x".repeat(10001)}).success).toBe(false);
 });
});
