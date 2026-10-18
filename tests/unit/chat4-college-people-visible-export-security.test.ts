import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import {
 escapeRoleDirectoryCsvCell, renderCollegeRoleDirectoryCsv,
} from "@/modules/people/college-role-directory-export";

const mocks=vi.hoisted(()=>({
 directory:vi.fn(),persisted:vi.fn(),transaction:vi.fn(),select:vi.fn(),
 rows:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/modules/people/college-role-directory-service",()=>({
 listCollegeRoleDirectory:mocks.directory,
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
    return {from(){return this;},innerJoin(){return this;},
     leftJoin(){return this;},where:async()=>mocks.rows};
   }};
   return fn(tx);
  },
 }),
}));
import { exportVisibleCollegePeople } from "@/modules/people/college-visible-directory-export";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const memberId="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"actor-member",collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const learner={
 membershipId:memberId,name:"Learner A",email:"learner@example.edu",
 membershipStatus:"ACTIVE",program:"B.Tech",cohort:"2099",sections:["A"],
};
const faculty={
 membershipId:memberId,name:"Faculty A",email:"faculty@example.edu",
 membershipStatus:"ACTIVE",program:null,cohort:null,sections:[],
};
beforeEach(()=>{
 for(const fn of [mocks.directory,mocks.persisted,mocks.transaction,mocks.select])fn.mockReset();
 mocks.rows.length=0;
 mocks.persisted.mockResolvedValue(undefined);
 mocks.directory.mockResolvedValue({items:[],total:0,filter:{page:1}});
});

describe("COL-people-export-ACTOR-02 authorized visible page and private contact containment",()=>{
 it("excludes learner phone even when private profile enrichment returns a phone",async()=>{
  mocks.directory.mockResolvedValue({items:[learner],total:1,filter:{page:1}});
  mocks.rows.push({
   id:memberId,phone:"+919999999999",facultyType:null,facultyDocument:null,
   learnerDocument:{personalDetails:{gender:"Male"}},learnerRoll:"A123",
  });
  const result=await exportVisibleCollegePeople(actor,"LEARNER",{});
  expect(result).toMatchObject({total:1,shown:1,page:1});
  expect(result.csv).toContain("Roll Number");
  expect(result.csv).toContain("A123");
  expect(result.csv).toContain("B.Tech");
  expect(result.csv).not.toContain("+919999999999");
  expect(result.csv.startsWith("\uFEFF")).toBe(true);
  expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),actor,"people.manage",{
   collegeId,organizationId,
  });
  expect(mocks.transaction).toHaveBeenCalledOnce();
 });
 it("exports faculty phone only after persisted same-college authorization and escapes hostile names",async()=>{
  mocks.directory.mockResolvedValue({
   items:[{...faculty,name:"\u2066=2+2"}],total:1,filter:{page:1},
  });
  mocks.rows.push({
   id:memberId,phone:"+919888888888",facultyType:"FULL_TIME",
   facultyDocument:{personalDetails:{gender:"Female"}},
   learnerRoll:null,learnerDocument:null,
  });
  const result=await exportVisibleCollegePeople(actor,"FACULTY",{});
  expect(result.csv).toContain("+919888888888");
  expect(result.csv).toContain("FULL_TIME");
  expect(result.csv).toContain("Female");
  expect(result.csv).toContain('"' + "'" + "\u2066=2+2" + '"');
  expect(mocks.persisted).toHaveBeenCalledOnce();
 });
 it("does not enrich a visible page after the actor has been revoked",async()=>{
  mocks.directory.mockResolvedValue({items:[faculty],total:1,filter:{page:1}});
  mocks.persisted.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(exportVisibleCollegePeople(actor,"FACULTY",{})).rejects.toThrow("REVOKED");
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("never opens the private contacts table when the authorized visible page is empty",async()=>{
  const result=await exportVisibleCollegePeople(actor,"LEARNER",{});
  expect(result.shown).toBe(0);
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
});

describe("COL-people-export-formula-01 spreadsheet injection across hidden Unicode prefixes",()=>{
 it("escapes each formula operator under a format mark or combining accent",()=>{
  const attacks=[
   "\u200B=SUM(1,1)","\u2066+CMD(1)","\u0301@IMPORT(1)"," \u200B-3","\r=1",
  ];
  for(const payload of attacks){
   expect(escapeRoleDirectoryCsvCell(payload)).toBe('"' + "'" + payload.replaceAll('"','""') + '"');
  }
  expect(escapeRoleDirectoryCsvCell("Normal name")).toBe('"Normal name"');
 });
 it("preserves BOM, quote escaping, and a literal safe text cell in a valid page",()=>{
  const row={
   ...learner,joinedAt:new Date("2099-10-18T05:00:00Z"),
   userStatus:"ACTIVE",activeTeachingAssignments:0,
   name:"\u200B=3+3",
  };
  const csv=renderCollegeRoleDirectoryCsv("LEARNER",[row],false);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"' + "'" + "\u200B=3+3" + '"');
  expect(csv).toContain("B.Tech");
  expect(csv).not.toContain("EXPORT TRUNCATED");
 });
});
