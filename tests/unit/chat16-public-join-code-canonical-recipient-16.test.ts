import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({config:vi.fn(),endpoint:vi.fn(),recipient:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/notifications/zeptomail-email",()=>({
 readZeptoMailConfig:mocks.config,isSecureMailProviderEndpoint:mocks.endpoint,
}));
vi.mock("@/modules/messaging/runtime-safety",()=>({
 canContactRecipientAtRuntime:mocks.recipient,
}));
import {deliverPublicRecruiterJoinCode} from "@/modules/messaging/public-join-code-delivery";

const config={
 token:"test-token",apiUrl:"https://api.zeptomail.in/v1.1/email/template",
 otpTemplateKey:"public-recruiter-join-code",
 fromAddress:"hello@42lms.com",fromName:"42Learn",
};
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.config.mockReturnValue(config);
 mocks.endpoint.mockReturnValue(true);
 mocks.recipient.mockReturnValue(true);
});

describe("chat-16 public recruiter join-code destination normalization",()=>{
 it("public-join-code-16 sends only the canonical address validated by runtime safety",async()=>{
  const transport=vi.fn().mockResolvedValue({ok:true});
  const result=await deliverPublicRecruiterJoinCode(
   "  Recruiter@Example.ORG  ","123456",transport as unknown as typeof fetch,
  );
  expect(result).toBe(true);
  expect(mocks.recipient).toHaveBeenCalledExactlyOnceWith("EMAIL","recruiter@example.org");
  expect(transport).toHaveBeenCalledOnce();
  const [,init]=transport.mock.calls[0] as [string,RequestInit];
  const body=JSON.parse(String(init.body)) as {
   to:{email_address:{address:string;name:string}}[];
   merge_info:{email:string;otp:string};
  };
  expect(body.to).toEqual([{email_address:{
   address:"recruiter@example.org",name:"recruiter@example.org",
  }}]);
  expect(body.merge_info.email).toBe("recruiter@example.org");
  expect(body.merge_info.otp).toBe("123456");
 });
 it("public-join-code-17 rejects runtime-denied recipients before loading secrets",async()=>{
  mocks.recipient.mockReturnValue(false);
  const transport=vi.fn();
  await expect(deliverPublicRecruiterJoinCode(
   "  Denied@Example.org ","123456",transport as unknown as typeof fetch,
  )).resolves.toBe(false);
  expect(mocks.recipient).toHaveBeenCalledWith("EMAIL","denied@example.org");
  expect(mocks.config).not.toHaveBeenCalled();
  expect(transport).not.toHaveBeenCalled();
 });
});