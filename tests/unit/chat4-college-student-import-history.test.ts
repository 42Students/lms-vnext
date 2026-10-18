import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 persisted:vi.fn(),transaction:vi.fn(),select:vi.fn(),
 limit:vi.fn(),offset:vi.fn(),rows:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.persisted,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>{
   mocks.transaction();
   const tx={select:()=>{
    mocks.select();
    return {from(){return this;},where(){return this;},orderBy(){return this;},
     limit(n:number){mocks.limit(n);return this;},
     offset(n:number){mocks.offset(n);return Promise.resolve(mocks.rows);},
    };
   }};
   return fn(tx);
  },
 }),
}));
import { listCollegeStudentImportHistory } from "@/modules/people/college-import-history-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const event=(id:number,metadata:Record<string,unknown>)=>({
 id:"event-"+id,when:new Date("2099-10-18T05:00:00Z"),
 summary:"Imported students",metadata,
});
beforeEach(()=>{
 for(const fn of [mocks.persisted,mocks.transaction,mocks.select,mocks.limit,mocks.offset])fn.mockReset();
 mocks.rows.length=0;
 mocks.persisted.mockResolvedValue(undefined);
});

describe("COL-people-import-history-01 scoped import history",()=>{
 it.each([
  "","0","501","1e2","0x10","-1","1.5"," 1 ","Infinity",
 ])("rejects malformed page %s before history reads",async page=>{
  await expect(listCollegeStudentImportHistory(actor,page)).rejects.toBeDefined();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("denies ordinary learner, suspended College Admin, and deactivated accounts before DB reads",async()=>{
  for(const context of [
   {...actor,membership:{...actor.membership!,roles:["LEARNER" as const]}},
   {...actor,membership:{...actor.membership!,status:"SUSPENDED" as const}},
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
  ]){
   await expect(listCollegeStudentImportHistory(context,1)).rejects.toBeDefined();
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("blocks sensitive history after persisted role revocation before any query",async()=>{
  mocks.persisted.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(listCollegeStudentImportHistory(actor,1)).rejects.toThrow("REVOKED");
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.select).not.toHaveBeenCalled();
  expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),actor,"people.manage",{
   collegeId,organizationId:org,
  });
 });
 it("reads 21 authorized events for an accurate hasNext and a 20-row stable page",async()=>{
  for(let i=0;i<21;i++)mocks.rows.push(event(i,{
   count:10,created:7,partial:2,failed:1,
  }));
  const result=await listCollegeStudentImportHistory(actor,"2");
  expect(result).toMatchObject({page:2,hasNext:true});
  expect(result.items).toHaveLength(20);
  expect(result.items[0]).toEqual({
   id:"event-0",when:new Date("2099-10-18T05:00:00Z"),
   students:10,imported:7,partial:2,failed:1,
  });
  expect(result.items[19].id).toBe("event-19");
  expect(mocks.limit).toHaveBeenCalledWith(21);
  expect(mocks.offset).toHaveBeenCalledWith(20);
 });
 it("does not render corrupt negative, fractional or non-finite import counts as legitimate students",async()=>{
  mocks.rows.push(event(1,{
   count:-5,created:2.5,partial:Infinity,failed:NaN,
  }));
  const result=await listCollegeStudentImportHistory(actor,1);
  expect(result).toMatchObject({page:1,hasNext:false});
  expect(result.items[0]).toMatchObject({
   students:0,imported:0,partial:0,failed:0,
  });
 });
 it("does not fabricate historical imports when no events were stored",async()=>{
  const result=await listCollegeStudentImportHistory(actor,1);
  expect(result.items).toEqual([]);
  expect(result.hasNext).toBe(false);
 });
});
