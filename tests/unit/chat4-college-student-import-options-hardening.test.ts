import {afterEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeStudentImportOptions} from "@/modules/people/college-student-import-options";

const mock=vi.hoisted(()=>{
 const authorize=vi.fn();
 const select=vi.fn();
 const limits:number[]=[];
 const replies:Array<Array<Record<string,unknown>>>=[];
 const query={
  from(){return this;},
  innerJoin(){return this;},
  where(){return this;},
  orderBy(){return this;},
  limit(n:number){limits.push(n);return Promise.resolve(replies.shift()??[]);},
 };
 const tx={select: (...args:unknown[])=>{select(...args);return query;}};
 return {authorize,select,limits,replies,tx};
});
vi.mock("@/db/client",()=>({
 getDb:()=>({transaction:async(work:(tx:typeof mock.tx)=>Promise<unknown>)=>work(mock.tx)}),
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mock.authorize,
}));
const college="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const active:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
afterEach(()=>{
 mock.authorize.mockReset();mock.select.mockReset();
 mock.replies.length=0;mock.limits.length=0;
});
describe("College student import choice picker security and validation",()=>{
 it("COL-student-import-options-01 authorized College Admin gets only server-sourced selections with bounded result sets",async()=>{
  const programs=[{id:college,name:"Program"}];
  const cohorts=[{id:foreign,programId:college,name:"Batch"}];
  const classes=[{id:"33333333-3333-4333-8333-333333333333",cohortId:foreign,name:"Class",capacity:45}];
  mock.replies.push(programs,cohorts,classes);
  mock.authorize.mockResolvedValue(active);
  const result=await listCollegeStudentImportOptions(active);
  expect(result).toEqual({programs,batches:cohorts,classes});
  expect(mock.limits).toEqual([500,2000,3000]);
  expect(mock.authorize).toHaveBeenCalledOnce();
  expect(mock.authorize).toHaveBeenCalledWith(mock.tx,active,"academics.manage",{
   collegeId:college,organizationId:org,
  });
 });
 it("COL-student-import-options-02 a role-revoked admin cannot enumerate student rosters using an old session",async()=>{
  mock.authorize.mockRejectedValue(new Error("PERSISTED_ROLE_REVOKED"));
  await expect(listCollegeStudentImportOptions(active))
   .rejects.toThrow("PERSISTED_ROLE_REVOKED");
  expect(mock.select).not.toHaveBeenCalled();
  expect(mock.limits).toEqual([]);
 });
 it("COL-student-import-options-03 suspended, wrong-role and deactivated accounts fail before any tenant data read",async()=>{
  const malformed:RequestContext[]=[
   {...active,membership:null},
   {...active,membership:{...active.membership!,status:"SUSPENDED"}},
   {...active,membership:{...active.membership!,roles:["FACULTY"]}},
   {...active,user:{...active.user,platformStatus:"DISABLED"}},
  ];
  for(const actor of malformed)await expect(listCollegeStudentImportOptions(actor)).rejects.toBeDefined();
  expect(mock.select).not.toHaveBeenCalled();
  expect(mock.authorize).not.toHaveBeenCalled();
 });
 it("COL-student-import-options-04 filtered choices exclude archived programs/cohorts, closed or foreign periods",()=>{
  const s=readFileSync("src/modules/people/college-student-import-options.ts","utf8");
  expect(s).toContain("assertPersistedPlatformPermission(tx,context");
  expect(s).toContain('eq(departments.collegeId, member.collegeId)');
  expect(s).toContain('eq(programs.status,"ACTIVE")');
  expect(s).toContain('inArray(cohorts.status, ["PLANNED", "ACTIVE"])');
  // A historical cohort can start in a CLOSED period; it must still belong
  // to this college, rather than passing through a cross-college FK.
  const batches=s.slice(s.indexOf("const batches ="),s.indexOf("const classes ="));
  expect(batches).toContain("eq(academicPeriods.id, cohorts.startPeriodId)");
  expect(batches).toContain("eq(academicPeriods.collegeId, member.collegeId)");
  expect(batches).not.toContain('ne(academicPeriods.status,"CLOSED")');
  expect(s).toContain('eq(academicPeriods.collegeId, member.collegeId)');
  expect(s).toContain('ne(academicPeriods.status,"CLOSED")');
  expect(s).toContain('eq(sections.status, "ACTIVE")');
 });
});