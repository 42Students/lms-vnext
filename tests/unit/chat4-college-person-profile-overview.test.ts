import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";

const mocks=vi.hoisted(()=>({
 scope:vi.fn(),editor:vi.fn(),persisted:vi.fn(),select:vi.fn(),transaction:vi.fn(),
 rows:[] as Array<Array<Record<string,unknown>>>,
}));
vi.mock("@/modules/permissions/acting-college",()=>({
 resolveActingCollege:mocks.scope,
}));
vi.mock("@/modules/people/college-directory-person-editor-service",()=>({
 getCollegePersonEditor:mocks.editor,
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
    return {from(){return this;},leftJoin(){return this;},where(){return this;},
     limit:()=>Promise.resolve(mocks.rows.shift()??[])};
   }};
   return fn(tx);
  },
 }),
}));
import {getCollegePersonProfileOverview} from "@/modules/people/college-person-profile-overview-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const memberId="22222222-2222-4222-8222-222222222222";
const organizationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"admin-member",collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
beforeEach(()=>{
 for(const fn of [mocks.scope,mocks.editor,mocks.persisted,mocks.select,mocks.transaction])
  fn.mockReset();
 mocks.rows.length=0;
 mocks.scope.mockResolvedValue({collegeId,organizationId});
 mocks.editor.mockResolvedValue({id:memberId,displayName:"Student A"});
 mocks.persisted.mockResolvedValue(undefined);
});

describe("COL-people-profile-overview-01 protected College People profile read",()=>{
 it("rejects malformed person IDs and unknown role kinds before any identity data request",async()=>{
  for(const [id,kind] of [["invalid","LEARNER"],[memberId,"ADMIN"]]){
   await expect(getCollegePersonProfileOverview(actor,id,kind)).rejects.toBeDefined();
  }
  expect(mocks.scope).not.toHaveBeenCalled();
  expect(mocks.editor).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("does not load a private document if the College Admin role was revoked since editor lookup",async()=>{
  mocks.persisted.mockRejectedValueOnce(new Error("ACTOR_REVOKED"));
  await expect(getCollegePersonProfileOverview(actor,memberId,"LEARNER"))
   .rejects.toThrow("ACTOR_REVOKED");
  expect(mocks.editor).toHaveBeenCalledWith(actor,memberId,"LEARNER");
  expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),actor,"people.manage",{
   collegeId,organizationId,
  });
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("refuses a foreign or absent member even if the editor preflight returned a stale identity",async()=>{
  mocks.rows.push([]);
  await expect(getCollegePersonProfileOverview(actor,memberId,"LEARNER"))
   .rejects.toThrow("PERSON_NOT_FOUND");
  expect(mocks.select).toHaveBeenCalledOnce();
 });
 it("redacts private Aadhaar/PAN even when the underlying learner document contains both",async()=>{
  mocks.rows.push([{
   learner:{...emptyLearnerProfileDocument,
    identity:{aadhaarNumber:"123456789012",panNumber:"ABCDE1234F"}},
   faculty:null,
  }]);
  const overview=await getCollegePersonProfileOverview(actor,memberId,"LEARNER");
  expect(overview.person).toMatchObject({id:memberId,displayName:"Student A"});
  expect(overview.identity).toContain("private");
  expect(JSON.stringify(overview)).not.toContain("123456789012");
  expect(JSON.stringify(overview)).not.toContain("ABCDE1234F");
  expect(overview).not.toHaveProperty("profileDocument");
  expect(overview).not.toHaveProperty("metadata");
 });
 it("does not forward private faculty identity document receipt IDs or masked PAN into roster UI",async()=>{
  mocks.rows.push([{
   faculty:{...emptyFacultyProfileDocument,
    identitySummary:{
     aadhaarLast4:"9012",panMasked:"ABCDE****F",
     aadhaarDocumentId:"33333333-3333-4333-8333-333333333333",
     panDocumentId:"44444444-4444-4444-8444-444444444444",
    }},
   learner:null,
  }]);
  const overview=await getCollegePersonProfileOverview(actor,memberId,"FACULTY");
  const projected=JSON.stringify(overview);
  expect(overview.identity).toContain("private");
  for(const secret of ["9012","ABCDE****F","33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444"])
   expect(projected).not.toContain(secret);
  expect(overview).toMatchObject({projects:[],publications:[],awards:[]});
 });
});
