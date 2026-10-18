import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({outbound:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/outbound",()=>({outboundFetch:mocks.outbound}));
import {sendRecruiterMessageDigest} from "@/modules/placements/recruiter-message-email-provider";

const config={
 APP_ENV:"production",
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"recruiter-digest-v1",
 RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.com",
 ZEPTOMAIL_TOKEN:"private-mail-token",
 ZEPTOMAIL_API_URL:"https://api.zeptomail.in/v1.1/email/template",
 ZEPTOMAIL_FROM_ADDRESS:"noreply@example.com",
};
const digest={
 recipient:"hr@example.edu",recipientName:"Recruiter",companyName:"Employer",
 collegeName:"College",replyTo:"r-"+ "a".repeat(32)+"@reply.example.com",
 messages:[{body:"Candidate update <script>"}],
};
describe("HR-BREAK-MAIL-REDIRECT-13: recruiter digest must reject provider redirects",()=>{
 beforeEach(()=>{vi.clearAllMocks();mocks.outbound.mockResolvedValue({ok:true});});
 it("sends one bounded nonredirecting POST, with sanitized digest text and scoped Reply-To",async()=>{
  expect(await sendRecruiterMessageDigest(digest,config)).toBe(true);
  expect(mocks.outbound).toHaveBeenCalledOnce();
  const [url,options]=mocks.outbound.mock.calls[0]!;
  expect(url).toBe(config.ZEPTOMAIL_API_URL);
  expect(options).toMatchObject({
   method:"POST",redirect:"error",timeoutMs:10_000,maxAttempts:1,
   headers:{Authorization:config.ZEPTOMAIL_TOKEN},
  });
  const body=JSON.parse(options.body);
  expect(body.template_key).toBe(config.RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY);
  expect(body.reply_to).toEqual([{address:digest.replyTo}]);
  expect(body.merge_info.message1).toContain("&lt;script&gt;");
  expect(body.merge_info.message1).not.toContain("<script>");
 });
 it("does not send any digest unless explicitly enabled and provider/recipient are configured",async()=>{
  expect(await sendRecruiterMessageDigest(digest,{
   ...config,RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false",
  })).toBe(false);
  expect(await sendRecruiterMessageDigest(digest,{
   ...config,ZEPTOMAIL_TOKEN:" ",
  })).toBe(false);
  expect(await sendRecruiterMessageDigest(digest,{
   ...config,RECRUITER_MESSAGE_REPLY_DOMAIN:"other.example.com",
  })).toBe(false);
  expect(mocks.outbound).not.toHaveBeenCalled();
 });
 it("does not mark a message accepted when redirects are refused or provider returns error",async()=>{
  mocks.outbound.mockRejectedValue(new Error("redirect was blocked"));
  expect(await sendRecruiterMessageDigest(digest,config)).toBe(false);
  mocks.outbound.mockResolvedValue({ok:false,status:302});
  expect(await sendRecruiterMessageDigest(digest,config)).toBe(false);
 });
});
