import {beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getTpoMessagingBatch} from "@/modules/messaging/receipt-detail-service";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));

const batchId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const ctx:RequestContext={
 user:{id:"user-1",identityUid:"identity-1",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-1",collegeId,organizationId,status:"ACTIVE",roles:["TPO"]},
};
const batch={id:batchId,purpose:"TPO email: drive opening",
 total:6,queued:1,sent:3,failed:1,suppressed:1,
 createdAt:new Date("2026-10-18T00:00:00Z"),finalizedAt:null};
function dbFixture(row:typeof batch|null){
 const batchLimit=vi.fn(async()=>row?[row]:[]);
 const batchSelect=vi.fn(()=>({from:vi.fn(()=>({
  where:vi.fn(()=>({limit:batchLimit})),
 }))}));
 const totalsWhere=vi.fn(async()=>[{receipts:6,queued:1,sent:3,failed:1,suppressed:1}]);
 const totalsSelect=vi.fn(()=>({from:vi.fn(()=>({where:totalsWhere}))}));
 const tx={select:vi.fn().mockImplementationOnce(batchSelect).mockImplementationOnce(totalsSelect)};
 const db={transaction:vi.fn(async(cb:(x:typeof tx)=>Promise<unknown>)=>cb(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {tx,batchLimit,totalsWhere};
}
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(requirePlacementManageScope).mockResolvedValue({id:collegeId,organizationId} as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(ctx);
});

describe("chat-16 TPO messaging receipt-detail service",()=>{
 it("messaging-detail-16 rejects malformed batch ID and revoked role before querying",async()=>{
  await expect(getTpoMessagingBatch(ctx,"../other-college")).rejects.toThrow();
  for(const bad of [
   {...ctx,membership:null},
   {...ctx,membership:{...ctx.membership!,roles:["LEARNER"]}},
   {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
  ]){
   await expect(getTpoMessagingBatch(bad,batchId)).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("messaging-detail-17 requires persisted live TPO grant before any batch lookup",async()=>{
  const f=dbFixture(batch);
  vi.mocked(assertPersistedPlatformPermission).mockRejectedValue(new Error("revoked"));
  await expect(getTpoMessagingBatch(ctx,batchId)).rejects.toThrow("revoked");
  expect(f.tx.select).not.toHaveBeenCalled();
  expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
   f.tx,ctx,"placements.manage",{organizationId,collegeId},
  );
 });
 it("messaging-detail-18 returns null without exposing foreign recipient receipt rows",async()=>{
  const f=dbFixture(null);
  await expect(getTpoMessagingBatch(ctx,batchId)).resolves.toBeNull();
  expect(f.tx.select).toHaveBeenCalledTimes(1);
  expect(f.totalsWhere).not.toHaveBeenCalled();
 });
 it("messaging-detail-19 reports aggregate receipt states, not contact addresses or recipient hashes",async()=>{
  const f=dbFixture(batch);
  const result=await getTpoMessagingBatch(ctx,batchId);
  expect(result).toMatchObject({
   id:batchId,actualReceipts:6,actualQueued:1,
   actualSent:3,actualFailed:1,actualSuppressed:1,
  });
  expect(result).not.toHaveProperty("recipientKey");
  expect(JSON.stringify(result)).not.toContain("emailNorm");
  expect(JSON.stringify(result)).not.toContain("toAddress");
  expect(f.tx.select).toHaveBeenCalledTimes(2);
 });
});