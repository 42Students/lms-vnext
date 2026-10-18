import {beforeEach,describe,expect,it,vi} from "vitest";
import {outboundFetch} from "@/lib/outbound";
import {writeStructuredLog} from "@/observability/logger";
import {createZeptoMailEmailProvider,type ZeptoMailConfig}
 from "@/modules/notifications/zeptomail-email";
import {createExotelSmsProvider,type ExotelConfig}
 from "@/modules/notifications/exotel-sms";

vi.mock("@/lib/outbound",()=>({outboundFetch:vi.fn()}));
vi.mock("@/observability/logger",()=>({writeStructuredLog:vi.fn()}));
const emailConfig:ZeptoMailConfig={
 apiUrl:"https://api.zeptomail.in/v1.1/email/template",
 token:"fake-provider-token",otpTemplateKey:"auth.code",
 fromAddress:"hello@42lms.com",fromName:"42 LMS",
};
const smsConfig:ExotelConfig={
 apiKey:"fake-id",apiToken:"fake-key",accountSid:"42students",
 dltEntityId:"1234567890",otpSenderId:"FLERNR",otpDltTemplateId:"otp-template",
 smsType:"transactional_opt_in",
};
beforeEach(()=>vi.clearAllMocks());
describe("chat-16 transactional OTP provider ports (mock network only)",()=>{
 it("messaging-otp-email-16 fails closed on unsafe endpoints, missing credentials or invalid destination",async()=>{
  for(const cfg of [
   {...emailConfig,token:""},
   {...emailConfig,apiUrl:"http://api.zeptomail.in/v1.1/email/template"},
   {...emailConfig,otpTemplateKey:""},
  ]){
   await expect(createZeptoMailEmailProvider(cfg).sendOtpEmail({
    toEmail:"learner@example.edu",displayName:"Learner",code:"123456",
   })).resolves.toBe(false);
  }
  await expect(createZeptoMailEmailProvider(emailConfig).sendOtpEmail({
   toEmail:"not-an-email",displayName:"Learner",code:"123456",
  })).resolves.toBe(false);
  await expect(createZeptoMailEmailProvider(emailConfig).sendOtpEmail({
   toEmail:"learner@example.edu",displayName:"Learner",code:"12a456",
  })).resolves.toBe(false);
  expect(outboundFetch).not.toHaveBeenCalled();
 });
 it("messaging-otp-email-17 posts one bounded transactional template request, never a campaign",async()=>{
  vi.mocked(outboundFetch).mockResolvedValue(new Response("",{status:202}));
  await expect(createZeptoMailEmailProvider(emailConfig).sendOtpEmail({
   toEmail:"learner@example.edu",displayName:"Learner",code:"123456",
  })).resolves.toBe(true);
  expect(outboundFetch).toHaveBeenCalledOnce();
  const [url,options]=vi.mocked(outboundFetch).mock.calls[0]!;
  expect(url).toBe(emailConfig.apiUrl);
  expect(options).toMatchObject({method:"POST",maxAttempts:1,timeoutMs:10000});
  expect(options).toBeDefined();
  if(!options)throw new Error("Expected mail provider request options");
  const body=JSON.parse(String(options.body)) as {
   template_key:string;to:Array<{email_address:{address:string}}>;
   merge_info:{otp:string;expiryMinutes:string};
  };
  expect(body.template_key).toBe(emailConfig.otpTemplateKey);
  expect(body.to[0]?.email_address.address).toBe("learner@example.edu");
  expect(body.merge_info).toMatchObject({otp:"123456",expiryMinutes:"5"});
  expect(JSON.stringify(vi.mocked(writeStructuredLog).mock.calls))
   .not.toContain("123456");
 });
 it("messaging-otp-email-18 does not interpret provider refusal as acceptance",async()=>{
  vi.mocked(outboundFetch).mockResolvedValue(new Response("",{status:429}));
  await expect(createZeptoMailEmailProvider(emailConfig).sendOtpEmail({
   toEmail:"learner@example.edu",displayName:"Learner",code:"123456",
  })).resolves.toBe(false);
 });
 it("messaging-otp-sms-19 enforces DLT, E.164 and OTP shape before network",async()=>{
  const examples=[
   {config:{...smsConfig,dltEntityId:""},phone:"+919876543210",code:"123456"},
   {config:smsConfig,phone:"09876543210",code:"123456"},
   {config:smsConfig,phone:"+919876543210",code:"12AB56"},
  ];
  for(const item of examples){
   await expect(createExotelSmsProvider(item.config).sendOtp(item.phone,item.code))
    .resolves.toBe(false);
  }
  expect(outboundFetch).not.toHaveBeenCalled();
 });
 it("messaging-otp-sms-20 requires affirmative Exotel SID/status even on HTTP 200",async()=>{
  vi.mocked(outboundFetch).mockResolvedValueOnce(
   new Response(JSON.stringify({SMSMessage:{Sid:"SM-1",Status:"queued"}}),{status:200}),
  ).mockResolvedValueOnce(
   new Response(JSON.stringify({SMSMessage:{Sid:"SM-1",Status:"rejected"}}),{status:200}),
  ).mockResolvedValueOnce(
   new Response(JSON.stringify({SMSMessage:{Status:"queued"}}),{status:200}),
  );
  const provider=createExotelSmsProvider(smsConfig);
  await expect(provider.sendOtp("+919876543210","123456")).resolves.toBe(true);
  await expect(provider.sendOtp("+919876543210","123456")).resolves.toBe(false);
  await expect(provider.sendOtp("+919876543210","123456")).resolves.toBe(false);
  expect(outboundFetch).toHaveBeenCalledTimes(3);
  const [,options]=vi.mocked(outboundFetch).mock.calls[0]!;
  expect(options).toMatchObject({method:"POST",maxAttempts:1,timeoutMs:10000});
  expect(options).toBeDefined();
  if(!options)throw new Error("Expected SMS provider request options");
  const form=options.body as URLSearchParams;
  expect(form.get("DltEntityId")).toBe(smsConfig.dltEntityId);
  expect(form.get("DltTemplateId")).toBe(smsConfig.otpDltTemplateId);
  expect(form.get("To")).toBe("+919876543210");
  expect(JSON.stringify(vi.mocked(writeStructuredLog).mock.calls))
   .not.toContain("123456");
 });
});