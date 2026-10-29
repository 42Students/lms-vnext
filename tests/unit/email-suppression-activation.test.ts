import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";

const mock = vi.hoisted(()=>({
 getDb:vi.fn(),
 queueReady:vi.fn(),
 dispatchReady:vi.fn(),
 execute:vi.fn(),
}));

vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
vi.mock("@/modules/operations/outbound-delivery-queue",()=>({
 outboundQueueRuntimeEnabled:mock.queueReady,
 outboundDispatchRuntimeEnabled:mock.dispatchReady,
}));

import {
 globalEmailSuppressionActivationState,
 requireVerifiedGlobalEmailSuppression,
} from "@/modules/operations/email-suppression-activation";

const flagNames=[
 "DB10_EMAIL_SENDER_VERIFIED",
 "DB10_GLOBAL_SUPPRESSION_VERIFIED",
 "DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64",
 "DB10_OUTBOUND_ENCRYPTION_KEY_BASE64",
] as const;
const original=Object.fromEntries(flagNames.map(key=>[key,process.env[key]]));

describe("DB-050 EMAIL sender preflight before provider claims",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.queueReady.mockReturnValue(true);
  mock.dispatchReady.mockReturnValue(true);
  mock.execute.mockResolvedValue({rows:[{global_ready:true,local_ready:true}]});
  mock.getDb.mockReturnValue({execute:mock.execute});
  process.env["DB10_EMAIL_SENDER_VERIFIED"]="DB10_VERIFIED";
  process.env["DB10_GLOBAL_SUPPRESSION_VERIFIED"]="DB10_VERIFIED";
  process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]=Buffer.alloc(32,81).toString("base64");
  process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"]=Buffer.alloc(32,82).toString("base64");
 });
 afterEach(()=>{
  for(const key of flagNames){
   const value=original[key];
   if(value===undefined)delete process.env[key];
   else process.env[key]=value;
  }
 });
 it("accepts only explicit flags and an independently valid 32-byte suppression key",()=>{
  expect(globalEmailSuppressionActivationState()).toMatchObject({
   active:true,queueReady:true,dispatcherReady:true,senderVerified:true,
   migrationVerified:true,keyConfigured:true,
  });
  process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]="some-nonempty-invalid-secret";
  expect(globalEmailSuppressionActivationState()).toMatchObject({
   active:false,keyConfigured:false,
  });
  expect(mock.execute).not.toHaveBeenCalled();
 });
 it("refuses key reuse that would erase global opt-outs during encryption rotation",()=>{
  process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]=
   process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"];
  expect(globalEmailSuppressionActivationState()).toMatchObject({
   active:false,keyConfigured:false,
  });
  expect(mock.getDb).not.toHaveBeenCalled();
 });

 it("does not claim on missing or malformed encryption master key",()=>{
  delete process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"];
  expect(globalEmailSuppressionActivationState()).toMatchObject({
   active:false,keyConfigured:false,
  });
  process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"]="not-canonical-base64";
  expect(globalEmailSuppressionActivationState().active).toBe(false);
  process.env["DB10_OUTBOUND_ENCRYPTION_KEY_BASE64"]=Buffer.alloc(32,82).toString("base64");
  expect(globalEmailSuppressionActivationState().active).toBe(true);
 });

 it("blocks unapproved sender or global suppression migration even with a good HMAC",()=>{
  delete process.env["DB10_EMAIL_SENDER_VERIFIED"];
  expect(globalEmailSuppressionActivationState().active).toBe(false);
  process.env["DB10_EMAIL_SENDER_VERIFIED"]="DB10_VERIFIED";
  delete process.env["DB10_GLOBAL_SUPPRESSION_VERIFIED"];
  expect(globalEmailSuppressionActivationState().active).toBe(false);
 });
 it("rejects malformed key without attempting database readiness or acquiring lease",async()=>{
  process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]="invalid";
  await expect(requireVerifiedGlobalEmailSuppression())
   .rejects.toThrow("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED");
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("rejects missing global or local suppression storage",async()=>{
  mock.execute.mockResolvedValueOnce({rows:[{global_ready:true,local_ready:false}]});
  await expect(requireVerifiedGlobalEmailSuppression())
   .rejects.toThrow("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED");
  expect(mock.execute).toHaveBeenCalledTimes(1);
 });
 it("verifies both durable suppression tables on a real readiness path",async()=>{
  const result=await requireVerifiedGlobalEmailSuppression();
  expect(result.active).toBe(true);
  expect(mock.execute).toHaveBeenCalledTimes(1);
 });
});
