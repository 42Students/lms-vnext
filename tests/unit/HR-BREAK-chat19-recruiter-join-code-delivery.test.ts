import {beforeEach,describe,expect,it,vi} from "vitest";

const dep=vi.hoisted(()=>({config:vi.fn(),endpoint:vi.fn(),recipient:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/notifications/zeptomail-email",()=>({
 readZeptoMailConfig:dep.config,
 isSecureMailProviderEndpoint:dep.endpoint,
}));
vi.mock("@/modules/messaging/runtime-safety",()=>({
 canContactRecipientAtRuntime:dep.recipient,
}));
import {deliverPublicRecruiterJoinCode} from "@/modules/messaging/public-join-code-delivery";

const address="hr@example.edu";
const config={
 token:"secure-test-token",apiUrl:"https://email.zeptomail.in/v1.1/email/template",
 otpTemplateKey:"recruiter-signin",fromAddress:"no-reply@example.edu",fromName:"LMS",
};
describe("HR-BREAK-JOIN-CODE-01: recruiter OTP delivery safety and fail-soft handling",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  dep.recipient.mockReturnValue(true);
  dep.endpoint.mockReturnValue(true);
  dep.config.mockReturnValue(config);
 });
 it("rejects invalid OTP values before touching an email provider",async()=>{
  for(const value of ["", "abc123","12345","1234567","123456\n","000000\u200b"]){
   const fetcher=vi.fn();
   expect(await deliverPublicRecruiterJoinCode(address,value,fetcher as unknown as typeof fetch)).toBe(false);
   expect(fetcher).not.toHaveBeenCalled();
  }
 });
 it("does not send a code if recipient contacts are disabled or invalid",async()=>{
  dep.recipient.mockReturnValue(false);
  const fetcher=vi.fn();
  expect(await deliverPublicRecruiterJoinCode("unauthorized@example.edu","123456",
    fetcher as unknown as typeof fetch)).toBe(false);
  expect(dep.recipient).toHaveBeenCalledWith("EMAIL","unauthorized@example.edu");
  expect(dep.config).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
 });
 it.each([""," "," \t "])("rejects empty/whitespace API token %j",async token=>{
  dep.config.mockReturnValue({...config,token});
  const fetcher=vi.fn();
  expect(await deliverPublicRecruiterJoinCode(address,"123456",fetcher as unknown as typeof fetch)).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("rejects unsafe endpoint and missing OTP template before fetch",async()=>{
  const fetcher=vi.fn();
  dep.endpoint.mockReturnValue(false);
  expect(await deliverPublicRecruiterJoinCode(address,"123456",fetcher as unknown as typeof fetch)).toBe(false);
  dep.endpoint.mockReturnValue(true);
  dep.config.mockReturnValue({...config,otpTemplateKey:""});
  expect(await deliverPublicRecruiterJoinCode(address,"123456",fetcher as unknown as typeof fetch)).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("sends only the intended code and destination using a bounded POST without logging the code",async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true});
  expect(await deliverPublicRecruiterJoinCode(address,"123456",fetcher as unknown as typeof fetch)).toBe(true);
  expect(fetcher).toHaveBeenCalledOnce();
  const [url,options]=fetcher.mock.calls[0]!;
  expect(url).toBe(config.apiUrl);
  expect(options).toMatchObject({method:"POST",headers:{
   Authorization:config.token,"Content-Type":"application/json",Accept:"application/json",
  }});
  const body=JSON.parse(options.body);
  expect(body.template_key).toBe(config.otpTemplateKey);
  expect(body.to).toEqual([{email_address:{address,name:address}}]);
  expect(body.merge_info.otp).toBe("123456");
  expect(body.merge_info.expiryMinutes).toBe("10");
  expect(options.redirect).toBe("error");
  expect(options.signal).toBeDefined();
 });
 it("does not claim delivery on provider denial, timeout or connection failure",async()=>{
  const rejected=vi.fn().mockResolvedValue({ok:false,status:429});
  expect(await deliverPublicRecruiterJoinCode(address,"123456",rejected as unknown as typeof fetch)).toBe(false);
  const thrown=vi.fn().mockRejectedValue(new Error("provider secret / detail"));
  expect(await deliverPublicRecruiterJoinCode(address,"123456",thrown as unknown as typeof fetch)).toBe(false);
 });
});
