import {describe,expect,it,vi} from "vitest";
import {createOutboundProvider,type OutboundProviderConfig} from "@/modules/messaging/providers";
import type {OutboundSendRequest} from "@/modules/messaging/model";

const config:OutboundProviderConfig={
 email:{
  apiUrl:"https://api.zeptomail.in/v1.1/email/template",
  token:"test-email-token",otpTemplateKey:"auth.otp",
  fromAddress:"hello@example.org",fromName:"42 LMS",
 },
 sms:{
  apiKey:"test-key",apiToken:"test-token",accountSid:"safe-account",
  dltEntityId:"123456",otpSenderId:"OTPTEST",otpDltTemplateId:"otp-template",
  smsType:"transactional_opt_in",
 },
 templates:{
  "campaign.email":{zeptoTemplateKey:"recruiter.notice"},
  "campaign.sms":{
   exotelSenderId:"RECRUT",exotelDltTemplateId:"campaign-dlt",
   renderSms:(values)=>"Drive details: "+(values.body??""),
  },
 },
};
const email:OutboundSendRequest={
 channel:"EMAIL",recipient:"lead@example.org",templateKey:"campaign.email",
 purpose:"placement-campaign",variables:{body:"Invitation"},
};
const sms:OutboundSendRequest={
 channel:"SMS",recipient:"+919876543210",templateKey:"campaign.sms",
 purpose:"placement-campaign",variables:{body:"Invitation"},
};
const production={APP_ENV:"production"};
const emailFetch=()=>vi.fn(async()=>new Response("",{status:202}));

describe("chat-16 isolated outbound provider adapters",()=>{
 it("messaging-provider-16 denies unsafe production config or unknown/transactional template without attempting a send",async()=>{
  const fetchMock=emailFetch();
  const provider=createOutboundProvider(config,fetchMock as unknown as typeof fetch,production);
  expect(await provider.send({...email,templateKey:"auth.otp"})).toBe(false);
  expect(await provider.send({...email,templateKey:"campaign.unknown"})).toBe(false);
  expect(await provider.send({...email,recipient:"bad@@example.org"})).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
  const badConfig={
   ...config,email:{...config.email,otpTemplateKey:"recruiter.notice"},
  };
  expect(await createOutboundProvider(badConfig,fetchMock as unknown as typeof fetch,production).send(email))
   .toBe(false);
  const insecure={...config,email:{...config.email,apiUrl:"http://api.zeptomail.in/v1.1/email/template"}};
  expect(await createOutboundProvider(insecure,fetchMock as unknown as typeof fetch,production).send(email))
   .toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("messaging-provider-17 sends only a configured campaign email and reports provider acceptance, not delivery",async()=>{
  const fetchMock=emailFetch();
  const result=await createOutboundProvider(config,fetchMock as unknown as typeof fetch,production).send(email);
  expect(result).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url,options]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toBe(config.email.apiUrl);
  expect(options.method).toBe("POST");
  const body=JSON.parse(String(options.body)) as {
   template_key:string;merge_info:Record<string,string>;
   to:Array<{email_address:{address:string}}>;
  };
  expect(body.template_key).toBe("recruiter.notice");
  expect(body.merge_info).toEqual({body:"Invitation"});
  expect(body.to[0]?.email_address.address).toBe(email.recipient);
 });
 it("messaging-provider-22 sends normalized recipient addresses rather than caller-supplied whitespace or case",async()=>{
  const fetchMock=emailFetch();
  const provider=createOutboundProvider(config,fetchMock as unknown as typeof fetch,production);
  await expect(provider.send({...email,recipient:"  LEAD@Example.ORG  "})).resolves.toBe(true);
  const [,options]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
  const payload=JSON.parse(String(options.body)) as {
   to:Array<{email_address:{address:string}}>;
  };
  expect(payload.to[0]?.email_address.address).toBe("lead@example.org");
 });
 it("messaging-provider-18 never sends unapproved nonproduction recipients, even with valid provider config",async()=>{
  const fetchMock=emailFetch();
  const provider=createOutboundProvider(config,fetchMock as unknown as typeof fetch,{
   APP_ENV:"development",AUTH_TEST_EMAILS:"allowed@example.org",
  });
  await expect(provider.send(email)).resolves.toBe(false);
  await expect(provider.send({...email,recipient:"allowed@example.org"})).resolves.toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it("messaging-provider-19 fails closed for upstream 429 and rejected requests without ambiguous POST retry",async()=>{
  const fetchMock=vi.fn().mockResolvedValueOnce(new Response("",{status:429}))
   .mockRejectedValueOnce(new Error("provider credentials unavailable"));
  const provider=createOutboundProvider(config,fetchMock as unknown as typeof fetch,production);
  await expect(provider.send(email)).resolves.toBe(false);
  await expect(provider.send(email)).resolves.toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(2);
 });
 it("messaging-provider-20 requires a registered SMS DLT configuration and bounded rendered body",async()=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({
   SMSMessage:{Sid:"SM-123",Status:"queued"},
  }),{status:200}));
  const broken={...config,sms:{...config.sms,dltEntityId:""}};
  expect(await createOutboundProvider(broken,fetchMock as unknown as typeof fetch,production).send(sms))
   .toBe(false);
  const duplicateOtp={...config,templates:{
   ...config.templates,"campaign.sms":{
    ...config.templates["campaign.sms"],exotelDltTemplateId:config.sms.otpDltTemplateId,
   },
  }};
  expect(await createOutboundProvider(duplicateOtp,fetchMock as unknown as typeof fetch,production).send(sms))
   .toBe(false);
  const oversized={...config,templates:{
   ...config.templates,"campaign.sms":{
    ...config.templates["campaign.sms"],renderSms:()=>"x".repeat(1601),
   },
  }};
  expect(await createOutboundProvider(oversized,fetchMock as unknown as typeof fetch,production).send(sms))
   .toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("messaging-provider-21 requires both an affirmative Exotel status and provider SID",async()=>{
  const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
   SMSMessage:{Sid:"SM-123",Status:"Queued"},
  }),{status:200})).mockResolvedValueOnce(new Response(JSON.stringify({
   SMSMessage:{Sid:"SM-123",Status:"Rejected"},
  }),{status:200})).mockResolvedValueOnce(new Response(JSON.stringify({
   SMSMessage:{Status:"sent"},
  }),{status:200}));
  const provider=createOutboundProvider(config,fetchMock as unknown as typeof fetch,production);
  await expect(provider.send(sms)).resolves.toBe(true);
  await expect(provider.send(sms)).resolves.toBe(false);
  await expect(provider.send(sms)).resolves.toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  const [url,init]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toContain("/Accounts/safe-account/Sms/send.json");
  const form=init.body as URLSearchParams;
  expect(form.get("DltTemplateId")).toBe("campaign-dlt");
  expect(form.get("From")).toBe("RECRUT");
  expect(form.get("To")).toBe("+919876543210");
 });
});
