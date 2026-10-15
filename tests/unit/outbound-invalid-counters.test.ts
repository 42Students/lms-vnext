import {describe,it,expect} from "vitest";
import {decideDelivery,type DeliveryPolicy,type OutboundSendRequest} from "@/modules/messaging/model";
const request:OutboundSendRequest={channel:"EMAIL",recipient:"member@example.com",templateKey:"campaign",purpose:"UPDATE",variables:{}};
const policy:DeliveryPolicy={appEnv:"production",testEmails:[],testPhones:[],suppressed:new Set(),
 sentToday:0,dailyCap:100,recentRecipientSends:0,recipientWindowCap:5};
describe("malformed outbound counters fail closed",()=>{
 it.each([NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1])("rejects invalid daily accepted count %s",count=>{
  expect(decideDelivery(request,{...policy,sentToday:count})).toEqual({status:"SUPPRESSED",reason:"daily-cap"});
 });
 it.each([NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1])("rejects invalid recipient accepted count %s",count=>{
  expect(decideDelivery(request,{...policy,recentRecipientSends:count})).toEqual({status:"SUPPRESSED",reason:"rate-limited"});
 });
 it("still accepts well-formed in-cap requests",()=>{
  expect(decideDelivery(request,policy)).toEqual({status:"QUEUED"});
 });
});
