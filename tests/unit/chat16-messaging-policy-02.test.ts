import {describe,expect,it} from "vitest";
import {canContactRecipientAtRuntime} from "@/modules/messaging/runtime-safety";
import {parseAuthTestAllowlist} from "@/modules/messaging/allowlist";
import {dedupeBatch,opaqueBatchAttemptKey} from "@/modules/messaging/batch-dedupe";
import {decideDelivery,normalizeRecipient,previewAudience,isValidRecipient,outboundSendSchema,
 type OutboundSendRequest,type DeliveryPolicy} from "@/modules/messaging/model";
import {summarizeAudience} from "@/modules/messaging/audience-summary";
import {isExotelAcceptedResponse} from "@/modules/messaging/provider-acceptance-model";
import {messagingHistoryPageWindow} from "@/modules/messaging/receipt-history-window-model";
import {projectMessagingHistory} from "@/modules/messaging/receipt-history-model";

const email:OutboundSendRequest={
 channel:"EMAIL",recipient:" A@EXAMPLE.org ",templateKey:"campaign.notice",
 variables:{name:"A"},purpose:"campaign"};
const basePolicy:DeliveryPolicy={
 appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set<string>(),
 sentToday:0,dailyCap:100,recentRecipientSends:0,recipientWindowCap:2};
describe("chat-16 messaging provider and PII boundary controls",()=>{
 it("messaging-allowlist-01 never sends to unallowlisted addresses when APP_ENV is missing",()=>{
  expect(canContactRecipientAtRuntime("EMAIL","real@example.org",{})).toBe(false);
  expect(canContactRecipientAtRuntime("EMAIL"," Allowed@EXAMPLE.org ",{
   APP_ENV:"development",AUTH_TEST_EMAILS:"allowed@example.org, allowed@example.org"})).toBe(true);
  expect(canContactRecipientAtRuntime("EMAIL","bad@@example.org",{APP_ENV:"production"})).toBe(false);
  expect(canContactRecipientAtRuntime("SMS","+919876543210",{APP_ENV:"testing",
   AUTH_TEST_PHONES:"+919876543210"})).toBe(true);
  expect(canContactRecipientAtRuntime("SMS","+919876543211",{APP_ENV:"testing",
   AUTH_TEST_PHONES:"+919876543210"})).toBe(false);
 });
 it("messaging-allowlist-02 canonicalizes and validates test recipients, without broad wildcard",()=>{
  const list=parseAuthTestAllowlist({emailAddresses:" A@Example.org, a@example.org, invalid",
   phoneNumbers:"+919876543210,+919876543210,wrong"});
  expect(list.testEmails).toEqual(["a@example.org"]);
  expect(list.testPhones).toEqual(["+919876543210"]);
  expect(normalizeRecipient("EMAIL"," A@Example.org ")).toBe("a@example.org");
  expect(isValidRecipient("EMAIL","a@-unsafe.org")).toBe(false);
  expect(isValidRecipient("SMS","+00000000000")).toBe(false);
 });
 it("messaging-batch-01 deduplicates case-insensitive recipient in same channel+purpose+template",()=>{
  const second={...email,recipient:"a@example.ORG"};
  const different={...email,purpose:"other"};
  expect(dedupeBatch([email,second,different])).toEqual([email,different]);
  expect(opaqueBatchAttemptKey("EMAIL","abc","a","b")).not.toBe(
   opaqueBatchAttemptKey("EMAIL","abc","a:b",""));
 });
 it("messaging-send-01 denies invalid recipient, opt-out and unallowlisted nonproduction",()=>{
  expect(decideDelivery({...email,recipient:"not-an-email"},basePolicy)).toEqual({
   status:"SUPPRESSED",reason:"invalid-recipient"});
  expect(decideDelivery(email,{...basePolicy,appEnv:undefined})).toEqual({
   status:"SUPPRESSED",reason:"nonprod-not-allowlisted"});
  expect(decideDelivery(email,{...basePolicy,suppressed:new Set(["EMAIL:a@example.org"])})).toEqual({
   status:"SUPPRESSED",reason:"unsubscribed"});
  expect(decideDelivery(email,basePolicy)).toEqual({status:"QUEUED"});
 });
 it("messaging-limits-01 fails closed for corrupt counters, daily cap and per-recipient cap",()=>{
  expect(decideDelivery(email,{...basePolicy,dailyCap:0})).toMatchObject({reason:"daily-cap"});
  expect(decideDelivery(email,{...basePolicy,sentToday:100})).toMatchObject({reason:"daily-cap"});
  expect(decideDelivery(email,{...basePolicy,recentRecipientSends:2})).toMatchObject({reason:"rate-limited"});
  expect(decideDelivery(email,{...basePolicy,sentToday:-1})).toMatchObject({reason:"daily-cap"});
  expect(decideDelivery(email,{...basePolicy,recipientWindowCap:Number.NaN})).toMatchObject({reason:"rate-limited"});
 });
 it("messaging-template-01 rejects extra payload fields, giant variables and bad purpose controls",()=>{
  expect(outboundSendSchema.safeParse(email).success).toBe(true);
  expect(outboundSendSchema.safeParse({...email,internal:true}).success).toBe(false);
  expect(outboundSendSchema.safeParse({...email,purpose:"a\nb"}).success).toBe(false);
  expect(outboundSendSchema.safeParse({...email,variables:{body:"x".repeat(4001)}}).success).toBe(false);
  expect(outboundSendSchema.safeParse({...email,purpose:"tpo-recruiter-campaign:1",
   variables:{body:"x".repeat(4001)}}).success).toBe(true);
  expect(outboundSendSchema.safeParse({...email,variables:{badName$:"x"}}).success).toBe(false);
 });
 it("messaging-preview-01 validates whole request batch and suppresses duplicate sends",()=>{
  const planned=previewAudience([email,{...email,recipient:"a@example.org"}],()=>basePolicy);
  expect(planned.map(r=>r.status)).toEqual(["QUEUED","SUPPRESSED"]);
  expect(planned[1]).toMatchObject({reason:"duplicate-in-batch"});
  expect(()=>previewAudience([{...email,templateKey:"not allowed space"}],()=>basePolicy)).toThrow();
  expect(summarizeAudience([{status:"QUEUED"},{status:"SUPPRESSED",reason:"unsubscribed"}]))
   .toEqual({total:2,eligible:1,suppressed:1,reasons:{unsubscribed:1}});
 });
 it("messaging-exotel-01 requires an affirmative status and SID, not just HTTP success",()=>{
  expect(isExotelAcceptedResponse(null)).toBe(false);
  expect(isExotelAcceptedResponse({SMSMessage:{Status:"sent"}})).toBe(false);
  expect(isExotelAcceptedResponse({SMSMessage:{Sid:"SM-42",Status:"Rejected"}})).toBe(false);
  expect(isExotelAcceptedResponse({SMSMessage:{Sid:"SM-42",Status:" queued "}})).toBe(true);
  expect(isExotelAcceptedResponse({SMSMessage:{Sid:"SM\n-42",Status:"sent"}})).toBe(false);
 });
 it("messaging-history-01 bounds page windows and does not confuse provider acceptance with delivery",()=>{
  expect(messagingHistoryPageWindow(3,12,5)).toEqual({page:3,pages:3,offset:10});
  expect(messagingHistoryPageWindow(4,12,5)).toEqual({page:3,pages:3,offset:10});
  expect(()=>messagingHistoryPageWindow(0,12,5)).toThrow();
  const date=new Date("2099-01-01T00:00:00Z");
  expect(projectMessagingHistory([{
   id:"id",purpose:"campaign",total:2,queued:0,sent:1,failed:1,suppressed:0,
   createdAt:date,finalizedAt:null,
  }])[0]).toMatchObject({acceptedByProvider:1,status:"IN_PROGRESS"});
 });
});
