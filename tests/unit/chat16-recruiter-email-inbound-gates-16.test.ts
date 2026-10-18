import {beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {recruiterMailBridgeSignature} from "@/modules/placements/recruiter-message-email-model";
import {acceptAuthenticatedRecruiterEmailReply}
 from "@/modules/placements/recruiter-message-email-inbound-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));

const env={
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_INBOUND_HMAC_SECRET:"s".repeat(64),
 RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.org",
};
const payload={
 from:"lead@example.org",to:"r-"+"a".repeat(32)+"@reply.example.org",
 text:"Yes, I can attend the interview.",providerMessageId:"provider-message-123",
};
const sign=(value:string)=>recruiterMailBridgeSignature(env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET,value);
const deny={accepted:false,replayed:false};
beforeEach(()=>vi.clearAllMocks());

describe("chat-16 authenticated inbound recruiter email failure gates",()=>{
 it("email-bridge-inbound-gate-16 denies disabled, unsigned or tampered provider payloads without any storage query",async()=>{
  const raw=JSON.stringify(payload),signature=sign(raw);
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,{
   ...env,RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false",
  })).resolves.toEqual(deny);
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,"unsigned",env))
   .resolves.toEqual(deny);
  await expect(acceptAuthenticatedRecruiterEmailReply(raw+" ",signature,env))
   .resolves.toEqual(deny);
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,{
   ...env,RECRUITER_MESSAGE_INBOUND_HMAC_SECRET:"short",
  })).resolves.toEqual(deny);
  expect(getDb).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-gate-17 rejects malformed JSON, invalid From/To and quoted-only replies before database access",async()=>{
  const cases=[
   "{not-json",
   JSON.stringify({...payload,from:"not-an-email"}),
   JSON.stringify({...payload,to:"r-"+"a".repeat(32)+"@foreign.example.org"}),
   JSON.stringify({...payload,providerMessageId:"a"}),
   JSON.stringify({...payload,text:"> previous private history"}),
   JSON.stringify({...payload,text:""}),
   JSON.stringify({...payload,untrustedRole:"SUPER_ADMIN"}),
  ];
  for(const raw of cases){
   await expect(acceptAuthenticatedRecruiterEmailReply(raw,sign(raw),env))
    .resolves.toEqual(deny);
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-gate-18 stops if the inbound state and dedupe tables have not been deployed",async()=>{
  const raw=JSON.stringify(payload);
  const execute=vi.fn(async()=>({rows:[{ok:false}]}));
  const transaction=vi.fn();
  vi.mocked(getDb).mockReturnValue({execute,transaction} as unknown as ReturnType<typeof getDb>);
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,sign(raw),env))
   .resolves.toEqual(deny);
  expect(execute).toHaveBeenCalledTimes(1);
  expect(transaction).not.toHaveBeenCalled();
 });
});
