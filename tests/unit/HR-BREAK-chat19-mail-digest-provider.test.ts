import {beforeEach,describe,expect,it,vi} from "vitest";

const deps=vi.hoisted(()=>({
 fetch:vi.fn(),allowed:vi.fn(),config:vi.fn(),template:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/outbound",()=>({outboundFetch:deps.fetch}));
vi.mock("@/modules/messaging/runtime-safety",()=>({
 canContactRecipientAtRuntime:deps.allowed,
}));
vi.mock("@/modules/notifications/zeptomail-email",()=>({
 readZeptoMailConfig:deps.config,
}));
vi.mock("@/modules/messaging/template-boundary-model",()=>({
 isCampaignTemplateKey:deps.template,
}));
import {sendRecruiterMessageDigest} from "@/modules/placements/recruiter-message-email-provider";

const replyDomain="reply.42lms.com";
const replyTo="r-"+"a".repeat(32)+"@"+replyDomain;
const options={
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_REPLY_DOMAIN:replyDomain,
 RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"digest-template",
};
const input={
 recipient:"recruiter@example.edu",
 recipientName:"Recruiter <Alice>",
 companyName:"Employer & Co",
 collegeName:"College <A>",
 replyTo,
 messages:[{body:"Old secret"},
  {body:"Message one <img>"},
  {body:"Message two & more"},
  {body:"Newest — 'important'"}],
};
const settings={
 apiUrl:"https://api.zeptomail.in/v1.1/email/template",
 token:"test-api-token",otpTemplateKey:"otp-template",
 fromAddress:"no-reply@example.edu",fromName:"42",
};

describe("HR-BREAK-MAIL-DIGEST-15: provider boundary, recipient privacy and non-OTP template",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  deps.allowed.mockReturnValue(true);
  deps.template.mockReturnValue(true);
  deps.config.mockReturnValue(settings);
  deps.fetch.mockResolvedValue({ok:true,status:202});
 });
 it("never sends when bridge is unconfigured, disabled or the recipient is disallowed",async()=>{
  const direct=vi.fn();
  expect(await sendRecruiterMessageDigest(input,{},direct as unknown as typeof fetch)).toBe(false);
  deps.allowed.mockReturnValue(false);
  expect(await sendRecruiterMessageDigest(input,options,direct as unknown as typeof fetch)).toBe(false);
  expect(deps.fetch).not.toHaveBeenCalled();
 });
 it.each([
  {RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"otp-template"},
  {RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:""},
  {RECRUITER_MESSAGE_REPLY_DOMAIN:"foreign.example"},
 ])("rejects mismatched/OTP template or Reply-To domain %j",async patch=>{
  expect(await sendRecruiterMessageDigest(input,{...options,...patch})).toBe(false);
  expect(deps.fetch).not.toHaveBeenCalled();
 });
 it.each(["http://api.zeptomail.in/v1.1/email/template",
  "https://user:pass@api.zeptomail.in/v1.1/email/template","not-a-url"])(
  "rejects insecure provider address %j before credentials leave",async apiUrl=>{
   deps.config.mockReturnValue({...settings,apiUrl});
   expect(await sendRecruiterMessageDigest(input,options)).toBe(false);
   expect(deps.fetch).not.toHaveBeenCalled();
  },
 );
 it("never sends empty digest or without a configured provider token",async()=>{
  deps.config.mockReturnValue({...settings,token:" "});
  expect(await sendRecruiterMessageDigest(input,options)).toBe(false);
  deps.config.mockReturnValue(settings);
  expect(await sendRecruiterMessageDigest({...input,messages:[]},options)).toBe(false);
  expect(deps.fetch).not.toHaveBeenCalled();
 });
 it("sends only last three bounded, HTML-escaped messages with one nonredirecting POST",async()=>{
  expect(await sendRecruiterMessageDigest(input,options)).toBe(true);
  expect(deps.fetch).toHaveBeenCalledTimes(1);
  const [url,request]=deps.fetch.mock.calls[0]!;
  expect(url).toBe(settings.apiUrl);
  expect(request).toMatchObject({
   method:"POST",redirect:"error",timeoutMs:10_000,maxAttempts:1,
   headers:{Authorization:settings.token},
  });
  const parsed=JSON.parse(request.body);
  expect(parsed.template_key).toBe("digest-template");
  expect(parsed.template_key).not.toBe(settings.otpTemplateKey);
  expect(parsed.reply_to).toEqual([{address:replyTo}]);
  expect(parsed.to[0].email_address.address).toBe(input.recipient);
  expect(parsed.merge_info.message1).toContain("&lt;img&gt;");
  expect(parsed.merge_info.message2).toContain("&amp; more");
  expect(parsed.merge_info.message3).toContain("&#39;important&#39;");
  expect(request.body).not.toContain("Old secret");
  expect(parsed.merge_info.company).toContain("Employer &amp; Co");
  expect(parsed.merge_info.college).toContain("College &lt;A&gt;");
 });
 it("does not acknowledge undelivered messages on provider rejection or exception",async()=>{
  deps.fetch.mockResolvedValue({ok:false,status:429});
  expect(await sendRecruiterMessageDigest(input,options)).toBe(false);
  deps.fetch.mockRejectedValue(new Error("token 123, recipient details"));
  expect(await sendRecruiterMessageDigest(input,options)).toBe(false);
 });
});
