import {describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {recruiterMailBridgeSignature} from "@/modules/placements/recruiter-message-email-model";
import {acceptAuthenticatedRecruiterEmailReply} from "@/modules/placements/recruiter-message-email-inbound-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
const secret="s".repeat(64);
const env={
 RECRUITER_MESSAGE_INBOUND_HMAC_SECRET:secret,
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.org",
};
const envelope=JSON.stringify({
 from:"recruiter@example.org",
 to:"r-"+"a".repeat(32)+"@reply.example.org",
 text:"I accept the offered interview slot.",
 providerMessageId:"message-2099-01",
});

describe("chat-16 signed recruiter email internal service byte guard",()=>{
 it("HR-MAIL-INBOUND-BYTES-08 denies a valid signed JSON envelope padded past 20KB before DB",async()=>{
  vi.clearAllMocks();
  const body=envelope+" ".repeat(20_001-Buffer.byteLength(envelope));
  expect(Buffer.byteLength(body)).toBe(20_001);
  const signature=recruiterMailBridgeSignature(secret,body);
  await expect(acceptAuthenticatedRecruiterEmailReply(body,signature,env))
   .resolves.toEqual({accepted:false,replayed:false});
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-MAIL-INBOUND-BYTES-09 counts UTF-8 bytes rather than code units",async()=>{
  vi.clearAllMocks();
  const padCount=10_100;
  const body=envelope+"é".repeat(padCount);
  expect(body.length).toBeLessThan(20_000);
  expect(Buffer.byteLength(body)).toBeGreaterThan(20_000);
  await expect(acceptAuthenticatedRecruiterEmailReply(body,recruiterMailBridgeSignature(secret,body),env))
   .resolves.toEqual({accepted:false,replayed:false});
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-MAIL-INBOUND-BYTES-10 preserves the existing disabled-gateway refusal",async()=>{
  vi.clearAllMocks();
  const signature=recruiterMailBridgeSignature(secret,envelope);
  await expect(acceptAuthenticatedRecruiterEmailReply(envelope,signature,{
   ...env,RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false",
  })).resolves.toEqual({accepted:false,replayed:false});
  expect(getDb).not.toHaveBeenCalled();
 });
});