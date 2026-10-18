import {describe,expect,it} from "vitest";
import {
 outboundChannelSchema,outboundStatusSchema,outboundSendSchema,
 isValidRecipient,normalizeRecipient,decideDelivery,previewAudience,
 type DeliveryPolicy,type OutboundSendRequest,
} from "@/modules/messaging/model";

const email=(recipient:string,overrides:Partial<OutboundSendRequest>={}):OutboundSendRequest=>({
 channel:"EMAIL",recipient,templateKey:"campaign.notice",variables:{name:"Recruiter"},
 purpose:"placements-outreach",...overrides,
});
const policy=(overrides:Partial<DeliveryPolicy>={}):DeliveryPolicy=>({
 appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set<string>(),
 sentToday:0,dailyCap:10,recentRecipientSends:0,recipientWindowCap:2,...overrides,
});

describe("chat-16 outbound template, channel and recipient boundary matrix",()=>{
 it("MSG-RECIPIENT-BIDI-50 rejects invisible/BiDi mailbox controls while retaining ordinary addresses",()=>{
  expect(isValidRecipient("EMAIL","user@example.org")).toBe(true);
  expect(isValidRecipient("EMAIL","søren@example.org")).toBe(true);
  for(const invalid of [
   "user\u200b@example.org","user\u202e@example.org","user\u2066@example.org",
   "user\u200f@example.org","user\u0000@example.org","user\n@example.org",
  ])expect(isValidRecipient("EMAIL",invalid)).toBe(false);
  expect(isValidRecipient("SMS","+919876543210")).toBe(true);
  expect(isValidRecipient("SMS","+91\u202e9876543210")).toBe(false);
 });
 it("MSG-RECIPIENT-SCHEMA-51 validates enum and outbound template request shape",()=>{
  expect(outboundChannelSchema.options).toEqual(["EMAIL","SMS"]);
  expect(outboundStatusSchema.options).toEqual(["QUEUED","SENT","FAILED","SUPPRESSED"]);
  expect(outboundSendSchema.safeParse(email(" user@example.org ")).success).toBe(true);
  for(const raw of [
   {...email("user@example.org"),collegeId:"forged"},
   {...email("user@example.org"),templateKey:"../../password"},
   {...email("user@example.org"),variables:{invalidKey:"x".repeat(10001)}},
   {...email("user@example.org"),purpose:"invalid\nreason"},
   {...email("user@example.org"),channel:"PUSH"},
  ])expect(outboundSendSchema.safeParse(raw).success).toBe(false);
 });
 it("MSG-RECIPIENT-QUOTAS-52 refuses exhausted or malformed quotas before provider dispatch",()=>{
  const row=email("user@example.org");
  expect(normalizeRecipient("EMAIL"," USER@Example.org ")).toBe("user@example.org");
  expect(decideDelivery(row,policy())).toEqual({status:"QUEUED"});
  for(const invalid of [
   policy({dailyCap:0}),policy({sentToday:10}),
   policy({sentToday:Number.POSITIVE_INFINITY}),policy({dailyCap:Number.NaN}),
  ])expect(decideDelivery(row,invalid)).toMatchObject({status:"SUPPRESSED",reason:"daily-cap"});
  for(const invalid of [
   policy({recipientWindowCap:0}),policy({recentRecipientSends:2}),
   policy({recentRecipientSends:-1}),policy({recentRecipientSends:Number.NaN}),
  ])expect(decideDelivery(row,invalid)).toMatchObject({status:"SUPPRESSED",reason:"rate-limited"});
 });
 it("MSG-RECIPIENT-PREVIEW-53 suppresses identical recipient+purpose+template without leaking cross-purpose state",()=>{
  const rows=[
   email("PERSON@example.org"),
   email("person@example.org"),
   email("person@example.org",{purpose:"different-outreach"}),
  ];
  const result=previewAudience(rows,()=>policy());
  expect(result.map(x=>x.status)).toEqual(["QUEUED","SUPPRESSED","QUEUED"]);
  expect(result[1]).toMatchObject({reason:"duplicate-in-batch"});
  expect(result[0]?.recipient).toBe("person@example.org");
  const staging=previewAudience([email("unauthorized@example.org")],()=>policy({
   appEnv:"development",testEmails:["staff@example.org"],
  }));
  expect(staging[0]).toMatchObject({status:"SUPPRESSED",reason:"nonprod-not-allowlisted"});
 });
});