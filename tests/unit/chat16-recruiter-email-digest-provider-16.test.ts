import {describe,expect,it,vi} from "vitest";
import {
  sendRecruiterMessageDigest,type RecruiterMailDigest,
} from "@/modules/placements/recruiter-message-email-provider";

const env={
 APP_ENV:"development",AUTH_TEST_EMAILS:"lead@example.org",
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"campaign.recruiter_digest",
 RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.org",
 ZEPTOMAIL_API_URL:"https://api.zeptomail.in/v1.1/email/template",
 ZEPTOMAIL_TOKEN:"dummy-provider-token",
 ZEPTOMAIL_OTP_TEMPLATE_KEY:"auth.otp",
 ZEPTOMAIL_FROM_ADDRESS:"mail@example.org",
 ZEPTOMAIL_FROM_NAME:"Campus team",
};
const valid:RecruiterMailDigest={
 recipient:" LEAD@Example.ORG ",recipientName:"<Recruiter>",
 companyName:"A&B",collegeName:"Example College",
 replyTo:"r-"+"a".repeat(32)+"@reply.example.org",
 messages:[{body:"First"},{body:"Second"},{body:"<private> & \"quoted\""},
  {body:"Last"}],
};
const transport=()=>vi.fn(async()=>new Response("",{status:202}));

describe("chat-16 recruiter digest outbound provider integration without network",()=>{
 it("email-bridge-digest-16 refuses missing feature flag and unapproved test recipient",async()=>{
  const fetchMock=transport();
  await expect(sendRecruiterMessageDigest(valid,{
   ...env,RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false",
  },fetchMock as unknown as typeof fetch)).resolves.toBe(false);
  await expect(sendRecruiterMessageDigest({...valid,recipient:"outside@example.org"},
   env,fetchMock as unknown as typeof fetch)).resolves.toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("email-bridge-digest-17 refuses OTP reuse, non-HTTPS gateway and foreign Reply-To before a send",async()=>{
  const fetchMock=transport();
  const variants:Record<string,string|undefined>[]=[
   {...env,RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"auth.otp"},
   {...env,ZEPTOMAIL_API_URL:"http://api.zeptomail.in/v1.1/email/template"},
   {...env,ZEPTOMAIL_TOKEN:""},
  ];
  for(const config of variants){
   await expect(sendRecruiterMessageDigest(valid,config,fetchMock as unknown as typeof fetch))
    .resolves.toBe(false);
  }
  await expect(sendRecruiterMessageDigest({...valid,replyTo:"r-"+"a".repeat(32)+"@evil.example.org"},
   env,fetchMock as unknown as typeof fetch)).resolves.toBe(false);
  await expect(sendRecruiterMessageDigest({...valid,messages:[]},env,
   fetchMock as unknown as typeof fetch)).resolves.toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("email-bridge-digest-18 sends normalized address and bounded escaped last-three excerpts",async()=>{
  const fetchMock=transport();
  await expect(sendRecruiterMessageDigest(valid,env,fetchMock as unknown as typeof fetch))
   .resolves.toBe(true);
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url,options]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toBe(env.ZEPTOMAIL_API_URL);
  expect(options.method).toBe("POST");
  const payload=JSON.parse(String(options.body)) as {
   template_key:string;to:Array<{email_address:{address:string}}>;
   reply_to:Array<{address:string}>;merge_info:Record<string,string>;
  };
  expect(payload.template_key).toBe(env.RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY);
  expect(payload.to[0]?.email_address.address).toBe("lead@example.org");
  expect(payload.reply_to[0]?.address).toBe(valid.replyTo);
  expect(payload.merge_info).toMatchObject({
   name:"&lt;Recruiter&gt;",company:"A&amp;B",college:"Example College",
   message1:"Second",message2:"&lt;private&gt; &amp; &quot;quoted&quot;",
   message3:"Last",
  });
  expect(JSON.stringify(payload)).not.toContain("First");
 });
 it("email-bridge-digest-19 reports provider rejection and network failure as false without retry",async()=>{
  const fetchMock=vi.fn().mockResolvedValueOnce(new Response("",{status:503}))
   .mockRejectedValueOnce(new Error("upstream exception contains sensitive headers"));
  await expect(sendRecruiterMessageDigest(valid,env,fetchMock as unknown as typeof fetch))
   .resolves.toBe(false);
  await expect(sendRecruiterMessageDigest(valid,env,fetchMock as unknown as typeof fetch))
   .resolves.toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(2);
 });
});
