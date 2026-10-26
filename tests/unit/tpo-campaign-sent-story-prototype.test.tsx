import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it} from "vitest";
import {TpoCampaignSentStory} from "@/components/tpo/tpo-campaign-sent-story";

const campaign={
 status:"SENT",subject:"Campus recruiting dates",body:"Hello {name},\nPlease choose a campus date.",
 senderName:"Placement Team",createdAt:"2026-10-20T10:00:00Z",
 totalRecipients:5,providerAccepted:3,failed:1,skipped:1,
};
const recipients=[
 {leadId:"11111111-1111-4111-8111-111111111111",name:"Recipient One",status:"SENT"},
 {leadId:"22222222-2222-4222-8222-222222222222",name:"Recipient Two",status:"FAILED"},
 {leadId:"33333333-3333-4333-8333-333333333333",name:"Recipient Three",status:"SKIPPED_UNSUBSCRIBED"},
];

describe("TPO original sent email screenshots — persisted campaign timeline",()=>{
 it("projects only provider receipts; does not invent open/click/reply metrics",()=>{
  const html=renderToStaticMarkup(createElement(TpoCampaignSentStory,{
   campaign,recipients,recipientsReady:true,hasMoreRecipients:false,
  }));
  expect(html).toContain("Campus recruiting dates");
  for(const title of ["What you sent","What happened","What to do now","Everyone it went to"]){
   expect(html).toContain(title);
  }
  expect(html).toContain("3 of 5 intended recipients");
  expect(html).toContain("Provider accepted");
  expect(html).toContain("1 recorded failed attempt needs");
  expect(html).toContain("Recipient Two");
  expect(html).toContain('href="/tpo/recruiters/22222222-2222-4222-8222-222222222222"');
  expect(html).toContain("Provider acceptance does not confirm inbox delivery");
  expect(html).not.toContain("3 opened");
  expect(html).not.toContain("2 clicked");
  expect(html).not.toContain("3 replied");
  expect(html).not.toContain("Email delivered");
 });
 it("drafts and canceled campaigns never masquerade as sent",()=>{
  for(const status of ["DRAFT","CANCELLED"]){
   expect(renderToStaticMarkup(createElement(TpoCampaignSentStory,{
    campaign:{...campaign,status},recipients,recipientsReady:true,hasMoreRecipients:false,
   }))).toBe("");
  }
 });
 it("signals pending receipts and unavailable recipient records explicitly",()=>{
  const html=renderToStaticMarkup(createElement(TpoCampaignSentStory,{
   campaign:{...campaign,status:"SENDING",providerAccepted:1,failed:0,skipped:0},
   recipients:[],recipientsReady:false,hasMoreRecipients:false,
  }));
  expect(html).toContain("Sending in progress");
  expect(html).toContain("4 intended recipient receipts are not settled");
  expect(html).toContain("Individual recipient statuses are unavailable");
 });
 it("does not render campaign recipient email addresses, hashes or tokens",()=>{
  const html=renderToStaticMarkup(createElement(TpoCampaignSentStory,{
   campaign,recipients:[{...recipients[0]!,name:"Encoded <Name>"}],
   recipientsReady:true,hasMoreRecipients:false,
  }));
  expect(html).toContain("Encoded &lt;Name&gt;");
  expect(html).not.toContain("recipient_key");
  expect(html).not.toContain("unsubscribe_token");
  expect(html).not.toContain("mailto:");
 });
});
