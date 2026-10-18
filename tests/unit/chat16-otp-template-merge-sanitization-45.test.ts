import {beforeEach,describe,expect,it,vi} from "vitest";
import {outboundFetch} from "@/lib/outbound";
import {writeStructuredLog} from "@/observability/logger";
import {
 createZeptoMailEmailProvider,safeOtpEmailDisplayName,type ZeptoMailConfig,
} from "@/modules/notifications/zeptomail-email";

vi.mock("@/lib/outbound",()=>({outboundFetch:vi.fn()}));
vi.mock("@/observability/logger",()=>({writeStructuredLog:vi.fn()}));
const config:ZeptoMailConfig={
 apiUrl:"https://api.zeptomail.in/v1.1/email/template",token:"test-token",
 otpTemplateKey:"otp-template",fromAddress:"hello@example.org",fromName:"42LMS",
};
const send=(
 displayName:string,phoneE164:string|null,
)=>createZeptoMailEmailProvider(config).sendOtpEmail({
 toEmail:"user@example.org",displayName,phoneE164,code:"123456",
});
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(outboundFetch).mockResolvedValue(new Response("{}",{status:200}));
});

describe("chat-16 ZeptoMail OTP profile merge-variable hardening",()=>{
 it("AUTH-OTP-MERGE-45 HTML-escapes untrusted profile names and strips controls",()=>{
  expect(safeOtpEmailDisplayName(" Alice <script>alert(1)</script> & Bob "))
   .toBe("Alice &lt;script&gt;alert(1)&lt;/script&gt; &amp; Bob");
  expect(safeOtpEmailDisplayName("Alice\r\nBcc: bad")).toBe("Alice Bcc: bad");
  expect(safeOtpEmailDisplayName("x".repeat(300))).toHaveLength(160);
  expect(safeOtpEmailDisplayName("😀".repeat(200))).toBe("😀".repeat(160));
 });
 it("AUTH-OTP-MERGE-46 sends canonical OTP recipient and sanitized template variables only",async()=>{
  expect(await send("<img src=x onerror=alert(1)>","not-an-e164")).toBe(true);
  const [,options]=vi.mocked(outboundFetch).mock.calls[0]!;
  const payload=JSON.parse(String(options?.body)) as {
   to:Array<{email_address:{address:string}}>;
   merge_info:{learnerName:string;mobile:string;otp:string};
  };
  expect(payload.to[0]?.email_address.address).toBe("user@example.org");
  expect(payload.merge_info.learnerName).toContain("&lt;img");
  expect(payload.merge_info.learnerName).not.toContain("<img");
  expect(payload.merge_info.mobile).toBe("");
  expect(payload.merge_info.otp).toBe("123456");
  expect(outboundFetch).toHaveBeenCalledTimes(1);
  vi.mocked(outboundFetch).mockClear();
  expect(await send("Normal name","+919876543210")).toBe(true);
  const [,next]=vi.mocked(outboundFetch).mock.calls[0]!;
  const second=JSON.parse(String(next?.body)) as {merge_info:{learnerName:string;mobile:string}};
  expect(second.merge_info).toMatchObject({
   learnerName:"Normal name",mobile:"+919876543210",
  });
  expect(JSON.stringify(vi.mocked(writeStructuredLog).mock.calls)).not.toContain("123456");
 });
});