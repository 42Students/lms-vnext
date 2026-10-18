import {beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {markHrNotificationRead} from "@/modules/placements/hr-notification-read-service";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:vi.fn(),
}));

const id="11111111-1111-4111-8111-111111111111";
const token="2099-01-01T00:00:00.000Z";
const recruiter:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{
  userId:"recruiter-a",companyId:"company-a",companyName:"Company A",
  title:null,status:"ACTIVE",
  grants:[{id:"grant-a",organizationId:"org-a",collegeId:"college-a",collegeName:"College A",
   companyRelationshipId:"relationship-a"}],
 },
};
type Current={id:string;createdAt:Date;readAt:Date|null};
function installDatabase(current:Current|null,updated:{id:string;readAt:Date|null}|null){
 const selectLimit=vi.fn(async()=>current?[current]:[]);
 const select=vi.fn(()=>({
  from:vi.fn(()=>({
   innerJoin:vi.fn(()=>({
    where:vi.fn(()=>({
     for:vi.fn(()=>({limit:selectLimit})),
    })),
   })),
  })),
 }));
 const returning=vi.fn(async()=>updated?[updated]:[]);
 const update=vi.fn(()=>({
  set:vi.fn(()=>({where:vi.fn(()=>({returning}))})),
 }));
 const tx={select,update};
 const db={transaction:vi.fn(async(callback:(input:typeof tx)=>Promise<unknown>)=>callback(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {tx,selectLimit,returning,db};
}
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(listOwnRecruiterPlacementJobs).mockResolvedValue([{
  companyId:"company-a",collegeId:"college-a",job:{id:"job-a"},
 }] as unknown as Awaited<ReturnType<typeof listOwnRecruiterPlacementJobs>>);
});

describe("chat-16 recruiter notifications versioned acknowledgement transaction",()=>{
 it("hr-notification-read-16 denies malformed input, unauthorized user and identity substitution before job lookup",async()=>{
  await expect(markHrNotificationRead(recruiter,"not-an-id",{expectedCreatedAt:token}))
   .rejects.toThrow();
  await expect(markHrNotificationRead(recruiter,id,{expectedCreatedAt:"invalid"}))
   .rejects.toThrow();
  const spoofed:RequestContext={...recruiter,recruiter:{...recruiter.recruiter!,userId:"foreign"}};
  await expect(markHrNotificationRead(spoofed,id,{expectedCreatedAt:token})).rejects.toThrow();
  await expect(markHrNotificationRead({...recruiter,user:{...recruiter.user,platformStatus:"DISABLED"}},
   id,{expectedCreatedAt:token})).rejects.toThrow();
  expect(listOwnRecruiterPlacementJobs).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("hr-notification-read-17 refuses to read notification rows if no authorized employer drive remains",async()=>{
  vi.mocked(listOwnRecruiterPlacementJobs).mockResolvedValue([]);
  await expect(markHrNotificationRead(recruiter,id,{expectedCreatedAt:token})).rejects.toThrow();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("hr-notification-read-18 denies missing, already acknowledged and stale-version notifications before mutation",async()=>{
  for(const current of [
   null,
   {id,createdAt:new Date(token),readAt:new Date("2099-01-02T00:00:00.000Z")},
   {id,createdAt:new Date("2099-01-01T00:00:00.001Z"),readAt:null},
  ]){
   const f=installDatabase(current,{id,readAt:new Date("2099-01-03T00:00:00.000Z")});
   await expect(markHrNotificationRead(recruiter,id,{expectedCreatedAt:token})).rejects.toThrow();
   expect(f.tx.update).not.toHaveBeenCalled();
  }
 });
 it("hr-notification-read-19 rejects an optimistic race even if the first locked row looked unread",async()=>{
  const f=installDatabase({id,createdAt:new Date(token),readAt:null},null);
  await expect(markHrNotificationRead(recruiter,id,{expectedCreatedAt:token})).rejects.toThrow();
  expect(f.tx.update).toHaveBeenCalledOnce();
  expect(f.returning).toHaveBeenCalledOnce();
 });
 it("hr-notification-read-20 returns only the persisted acknowledged timestamp after CAS succeeds",async()=>{
  const readAt=new Date("2099-01-01T00:30:00.000Z");
  const f=installDatabase({id,createdAt:new Date(token),readAt:null},{id,readAt});
  await expect(markHrNotificationRead(recruiter,id,{expectedCreatedAt:token}))
   .resolves.toEqual({id,readAt:"2099-01-01T00:30:00.000Z"});
  expect(f.db.transaction).toHaveBeenCalledOnce();
  expect(f.tx.update).toHaveBeenCalledOnce();
 });
});
