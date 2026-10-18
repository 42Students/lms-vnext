import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {listTpoMessagingHistory,exportTpoMessagingHistory} from "@/modules/messaging/receipt-history-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",()=>({assertPersistedPlatformPermission:vi.fn()}));

const officer:RequestContext={
 user:{id:"tpo-u",identityUid:"identity-u",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership-u",collegeId:"college-u",organizationId:"org-u",status:"ACTIVE",roles:["TPO"]},
};
const row={id:"batch-1",purpose:"TPO email: welcome",total:5,queued:1,sent:3,failed:1,
 suppressed:0,createdAt:new Date("2099-01-01T00:00:00Z"),finalizedAt:null};

beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(requirePlacementManageScope).mockResolvedValue({id:"college-u",organizationId:"org-u"} as Awaited<ReturnType<typeof requirePlacementManageScope>>);
 vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(officer);
});

describe("chat-16 TPO aggregate outbound receipt authorization and privacy",()=>{
 it("messaging-receipt-history-16 denies learner, recruiter, revoked TPO and absent college before storage",async()=>{
  const contexts:RequestContext[]=[
   {...officer,membership:{...officer.membership!,roles:["LEARNER"]}},
   {...officer,membership:null},
   {...officer,user:{...officer.user,platformStatus:"DISABLED"}},
   {...officer,membership:{...officer.membership!,status:"SUSPENDED"}},
   {...officer,recruiter:{userId:"tpo-u",companyId:"company",companyName:"Co",title:null,status:"ACTIVE",grants:[]},
    membership:null},
  ];
  for(const context of contexts){
   await expect(listTpoMessagingHistory(context,{})).rejects.toThrow();
   await expect(exportTpoMessagingHistory(context,{})).rejects.toThrow();
  }
  expect(requirePlacementManageScope).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("messaging-receipt-history-17 validates bounded filters before querying receipt counts",async()=>{
  for(const filter of [{page:0},{page:10001},{purpose:"x".repeat(161)},{companyId:"other-college"}]){
   await expect(listTpoMessagingHistory(officer,filter)).rejects.toThrow();
   await expect(exportTpoMessagingHistory(officer,filter)).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("messaging-receipt-history-18 rechecks persisted actor inside scoped transaction before reading aggregate rows",async()=>{
  const countWhere=vi.fn(async()=>[{total:1}]);
  const rowsOffset=vi.fn(async()=>[row]);
  const rowsLimit=vi.fn(()=>({offset:rowsOffset}));
  const rowsOrder=vi.fn(()=>({limit:rowsLimit}));
  const countFrom=vi.fn(()=>({where:countWhere}));
  const rowsFrom=vi.fn(()=>({where:vi.fn(()=>({orderBy:rowsOrder}))}));
  const tx={select:vi.fn().mockReturnValueOnce({from:countFrom}).mockReturnValueOnce({from:rowsFrom})};
  const db={transaction:vi.fn(async (action:(input:typeof tx)=>Promise<unknown>)=>action(tx))};
  vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
  const result=await listTpoMessagingHistory(officer,{page:1,purpose:"TPO email: welcome"});
  expect(result).toMatchObject({page:1,total:1,pages:1,rows:[{
   id:"batch-1",acceptedByProvider:3,status:"IN_PROGRESS",
  }]});
  expect(rowsLimit).toHaveBeenCalledWith(25);
  expect(rowsOffset).toHaveBeenCalledWith(0);
  expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(tx,officer,"placements.manage",{
   organizationId:"org-u",collegeId:"college-u",
  });
 });
 it("messaging-receipt-history-19 never reads aggregate history after a revoked persisted grant",async()=>{
  const tx={select:vi.fn()};
  const db={transaction:vi.fn(async (action:(input:typeof tx)=>Promise<unknown>)=>action(tx))};
  vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
  vi.mocked(assertPersistedPlatformPermission).mockRejectedValue(new Error("Permission revoked"));
  await expect(listTpoMessagingHistory(officer,{})).rejects.toThrow("Permission revoked");
  expect(tx.select).not.toHaveBeenCalled();
 });
});
