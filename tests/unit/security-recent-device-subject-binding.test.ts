import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({current:vi.fn(),execute:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/current-session",()=>({getCurrentDeviceSession:mocks.current}));
vi.mock("@/db/client",()=>({getDb:()=>({execute:mocks.execute})}));
vi.mock("@/auth/session",()=>({
 SessionAuthenticationError:class extends Error{
  code:string;
  constructor(code:string){super(code);this.name="SessionAuthenticationError";this.code=code;}
 },
}));
import {requireRecentDeviceAuthentication}
 from "@/auth/recent-device-auth";

const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const SESSION="33333333-3333-4333-8333-333333333333";
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.current.mockResolvedValue({userId:A,sessionId:SESSION,platformStatus:"ACTIVE"});
 mocks.execute.mockResolvedValue({rows:[{created_at:new Date()}]});
});

describe("fresh authentication must be bound to the authorized actor",()=>{
 it("allows a fresh real session when it belongs to the actual request-context user",async()=>{
  const device=await requireRecentDeviceAuthentication(A);
  expect(device).toMatchObject({userId:A,sessionId:SESSION});
  expect(mocks.current).toHaveBeenCalledOnce();
  expect(mocks.execute).toHaveBeenCalledOnce();
 });
 it("rejects an E2E/impersonated admin context backed by someone else's recent device",async()=>{
  // E2E impersonation may produce a context for user B while a signed-in
  // real session cookie still belongs to A. Possession of A's session does
  // not prove fresh authentication for B.
  await expect(requireRecentDeviceAuthentication(B))
   .rejects.toMatchObject({code:"SESSION_INVALID"});
  expect(mocks.current).toHaveBeenCalledOnce();
  expect(mocks.execute).not.toHaveBeenCalled();
 });
 it.each(["","admin-a","11111111-1111-4111-8111-11111111111Z"])
  ("does not accept a missing or malformed identity selector: %s",async input=>{
   await expect(requireRecentDeviceAuthentication(input))
    .rejects.toMatchObject({code:"SESSION_INVALID"});
   expect(mocks.current).not.toHaveBeenCalled();
   expect(mocks.execute).not.toHaveBeenCalled();
  });
 it("requires a live non-revoked persisted device row for the matching actor",async()=>{
  mocks.execute.mockResolvedValueOnce({rows:[]});
  await expect(requireRecentDeviceAuthentication(A))
   .rejects.toMatchObject({code:"RECENT_SIGN_IN_REQUIRED"});
  expect(mocks.execute).toHaveBeenCalledOnce();
 });
 it("rejects a matching actor whose last full sign-in was too old",async()=>{
  mocks.execute.mockResolvedValueOnce({rows:[{
   created_at:new Date(Date.now()-11*60*1000),
  }]});
  await expect(requireRecentDeviceAuthentication(A))
   .rejects.toMatchObject({code:"RECENT_SIGN_IN_REQUIRED"});
 });
 it("fails closed when the session database cannot establish the attestation",async()=>{
  mocks.execute.mockRejectedValueOnce(new Error("DATABASE_UNAVAILABLE"));
  await expect(requireRecentDeviceAuthentication(A)).rejects.toThrow("DATABASE_UNAVAILABLE");
 });
});
