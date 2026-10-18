import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocked=vi.hoisted(()=>({
  scope:vi.fn(),persisted:vi.fn(),getDb:vi.fn(),
  selected:vi.fn(),where:vi.fn(),limit:vi.fn(),offset:vi.fn(),
  count:0,rows:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocked.getDb}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:mocked.persisted,
}));
vi.mock("@/modules/placements/scope",()=>({
  requirePlacementManageScope:mocked.scope,
}));
import {
  exportTpoMessagingHistory,listTpoMessagingHistory,
} from "@/modules/messaging/receipt-history-service";

const college="11111111-1111-4111-8111-111111111111";
const organization="22222222-2222-4222-8222-222222222222";
const tpo:RequestContext={
  user:{id:"tpo",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"member",collegeId:college,organizationId:organization,
    status:"ACTIVE",roles:["TPO"]},
  recruiter:null,
};
const receipt={
  id:"33333333-3333-4333-8333-333333333333",
  purpose:"drive notice",
  total:3,queued:0,sent:2,failed:1,suppressed:0,
  createdAt:new Date("2026-10-18T10:00:00Z"),finalizedAt:null,
};
function fakeTx(){
  const tx={
    select:mocked.selected,
  };
  mocked.selected.mockImplementation((selection:Record<string,unknown>)=>{
    const isCount=Object.keys(selection).length===1&&"total" in selection;
    if(isCount)return {from:()=>({where:mocked.where.mockImplementation(
      async()=>[{total:mocked.count}],
    )})};
    const query={
      from:vi.fn(),where:vi.fn(),orderBy:vi.fn(),limit:mocked.limit,
    };
    query.from.mockReturnValue(query);
    query.where.mockReturnValue(query);
    query.orderBy.mockReturnValue(query);
    mocked.limit.mockImplementation(()=>{
      const result=Promise.resolve(mocked.rows);
      return Object.assign(result,{offset:mocked.offset.mockImplementation(
        async()=>mocked.rows,
      )});
    });
    return query;
  });
  return tx;
}
describe("HR-BREAK-MESSAGING-HISTORY-01: persisted TPO/HR boundary and immutable receipt export",()=>{
  beforeEach(()=>{
    vi.clearAllMocks();
    mocked.rows=[receipt];
    mocked.count=1;
    mocked.scope.mockResolvedValue({id:college,organizationId:organization});
    mocked.persisted.mockResolvedValue(undefined);
    mocked.getDb.mockReturnValue({
      transaction:async(callback:(tx:ReturnType<typeof fakeTx>)=>unknown)=>
        callback(fakeTx()),
    });
  });
  it.each([
    ["recruiter without TPO membership",{...tpo,membership:null,recruiter:{
      userId:"tpo",companyId:"company",companyName:"Employer",
      title:null,status:"ACTIVE" as const,grants:[],
    }}],
    ["wrong membership role",{...tpo,membership:{...tpo.membership!,roles:["COLLEGE_ADMIN" as const]}}],
    ["revoked membership",{...tpo,membership:{...tpo.membership!,status:"SUSPENDED" as const}}],
    ["disabled user",{...tpo,user:{...tpo.user,platformStatus:"DISABLED" as const}}],
  ])("denies %s before DB and export",async(_label,actor)=>{
    await expect(exportTpoMessagingHistory(actor)).rejects.toThrow();
    await expect(listTpoMessagingHistory(actor)).rejects.toThrow();
    expect(mocked.scope).not.toHaveBeenCalled();
    expect(mocked.getDb).not.toHaveBeenCalled();
  });
  it("rechecks persisted permission in a transaction, scoped to current college + organization",async()=>{
    const rows=await exportTpoMessagingHistory(tpo,{purpose:"drive notice"});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({acceptedByProvider:2,status:"IN_PROGRESS"});
    expect(mocked.scope).toHaveBeenCalledWith(tpo,college);
    expect(mocked.persisted).toHaveBeenCalledWith(
      expect.anything(),tpo,"placements.manage",{
        organizationId:organization,collegeId:college,
      },
    );
    expect(mocked.limit).toHaveBeenCalledWith(2001);
  });
  it("does not fall back to another college when persisted permission has been revoked",async()=>{
    mocked.persisted.mockRejectedValue(new Error("persisted grant revoked"));
    await expect(exportTpoMessagingHistory(tpo)).rejects.toThrow("persisted grant revoked");
    expect(mocked.selected).not.toHaveBeenCalled();
  });
  it("rejects invalid history filters before touching the database",async()=>{
    for(const bad of [{purpose:"x".repeat(161)},{page:"-5"},{unexpected:true}]){
      await expect(exportTpoMessagingHistory(tpo,bad)).rejects.toThrow();
      expect(mocked.getDb).not.toHaveBeenCalled();
    }
  });
  it("caps exported rows, refusing a partial 2001-row CSV presented as complete",async()=>{
    mocked.rows=Array.from({length:2001},(_,index)=>({...receipt,id:String(index)}));
    await expect(exportTpoMessagingHistory(tpo)).rejects.toThrow("CAMPAIGN_EXPORT_TOO_LARGE");
    expect(mocked.limit).toHaveBeenCalledWith(2001);
  });
  it("bounds requested pages, reads 25 rows max and distinguishes accepted from delivered",async()=>{
    mocked.count=49;
    const result=await listTpoMessagingHistory(tpo,{page:99,purpose:"drive notice"});
    expect(result).toMatchObject({page:2,pages:2,total:49,pageSize:25});
    expect(result.rows[0]).toMatchObject({
      acceptedByProvider:2,status:"IN_PROGRESS",
    });
    expect(mocked.limit).toHaveBeenCalledWith(25);
    expect(mocked.offset).toHaveBeenCalledWith(25);
  });
});
