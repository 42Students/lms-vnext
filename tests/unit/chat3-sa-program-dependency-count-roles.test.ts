import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({
 scope:vi.fn(),queries:0,sql:[] as Array<{text:string;params:unknown[]}>,
 results:[
  [] as Array<{programId:string;total:number}>,
  [] as Array<{programId:string;total:number}>,
  [] as Array<{programId:string;total:number}>,
 ],
}));
vi.mock("@/modules/academics/scope",()=>({loadAcademicCollegeScope:state.scope}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:()=>{
  const id=state.queries++;
  const dialect=new PgDialect();
  class Query {
   from(){return this;}
   innerJoin(){return this;}
   where(condition:SQL){
    const q=dialect.sqlToQuery(condition);
    state.sql.push({text:q.sql,params:q.params});
    return this;
   }
   async groupBy(){return state.results[id]??[];}
  }
  return new Query();
 },
})}));
import {listProgramContents} from "@/modules/admin-ui/program-contents-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const programA="44444444-4444-4444-8444-444444444444";
const programB="55555555-5555-4555-8555-555555555555";
function actor(role:"FACULTY"|"MENTOR"|"LEARNER"|"COLLEGE_ADMIN"="COLLEGE_ADMIN",
 college=collegeId):RequestContext {
 return {
  user:{id:"actor",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"member",collegeId:college,organizationId,status:"ACTIVE",roles:[role]},
 };
}
beforeEach(()=>{
 vi.resetAllMocks();
 state.queries=0;state.sql=[];
 state.scope.mockResolvedValue({id:collegeId,organizationId});
 state.results=[
  [{programId:programA,total:2}],
  [{programId:programA,total:1},{programId:programB,total:4}],
  [{programId:programB,total:3}],
 ];
});
describe("SA-ACADEMICS-PROGRAM-READ-01 program dependents and role boundary",()=>{
 it("returns exact per-program semester, cohort and Section counts for a college admin",async()=>{
  const result=await listProgramContents(actor(),collegeId,[programA,programB]);
  expect(result.get(programA)).toEqual({semesters:2,batches:1,classes:0});
  expect(result.get(programB)).toEqual({semesters:0,batches:4,classes:3});
  expect(state.queries).toBe(3);
  expect(state.sql).toHaveLength(3);
  for(const statement of state.sql){
   expect(statement.text).toContain('"departments"."college_id"');
   expect(statement.params).toContain(collegeId);
   expect(statement.params).toContain(programA);
   expect(statement.params).toContain(programB);
  }
 });
 it("Faculty, Learner and Mentor cannot enumerate administrative deletion counters",async()=>{
  for(const role of ["FACULTY","LEARNER","MENTOR"] as const){
   await expect(listProgramContents(actor(role),collegeId,[programA]))
    .rejects.toThrow("Missing permission: academics.manage");
  }
  expect(state.queries).toBe(0);
 });
 it("a College Admin cannot access another college's program counts",async()=>{
  await expect(listProgramContents(actor("COLLEGE_ADMIN",foreign),collegeId,[programA]))
   .rejects.toThrow("Missing permission: academics.manage");
  expect(state.queries).toBe(0);
 });
 it("returns empty counts for zero program IDs without running SQL, but still checks admin scope",async()=>{
  await expect(listProgramContents(actor(),collegeId,[])).resolves.toEqual(new Map());
  expect(state.queries).toBe(0);
  await expect(listProgramContents(actor("FACULTY"),collegeId,[]))
   .rejects.toThrow("Missing permission: academics.manage");
 });
 it("rejects a disabled College Admin before dependent SQL",async()=>{
  const admin=actor();
  await expect(listProgramContents({
   ...admin,user:{...admin.user,platformStatus:"DISABLED"},
  },collegeId,[programA])).rejects.toThrow("Missing permission: academics.manage");
  expect(state.queries).toBe(0);
 });
});
