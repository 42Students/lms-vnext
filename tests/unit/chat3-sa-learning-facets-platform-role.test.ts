import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({
 scope:vi.fn(),reads:0,joins:[] as Array<{sql:string;params:unknown[]}>,
 limits:[] as number[],
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:state.scope}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:()=>{
  state.reads++;
  const dialect=new PgDialect();
  class Query {
   from(){return this;}
   innerJoin(_target:unknown,condition:SQL){
    const query=dialect.sqlToQuery(condition);
    state.joins.push({sql:query.sql,params:query.params});
    return this;
   }
   orderBy(){return this;}
   async limit(count:number){state.limits.push(count);return [];}
  }
  return new Query();
 },
})}));
import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const orgId="22222222-2222-4222-8222-222222222222";
const admin:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{organizationId:orgId,collegeId},
};
beforeEach(()=>{
 vi.resetAllMocks();state.reads=0;state.joins=[];state.limits=[];
 state.scope.mockResolvedValue({organizationId:orgId,collegeId});
});
describe("SA-LEARNING-FILTER-ROLE-01 scoped Super Admin teaching filters",()=>{
 it("returns only the selected active-college courses and batches, with bounded reads",async()=>{
  await expect(getSuperAdminLearningFilterOptions(admin)).resolves.toEqual({
   courses:[],cohorts:[],
  });
  expect(state.scope).toHaveBeenCalledWith(admin,"courses.read");
  expect(state.reads).toBe(2);
  expect(state.limits).toEqual([2000,2000]);
  const sql=state.joins.map(x=>x.sql).join("\n");
  expect(sql).toContain('"departments"."college_id"');
  expect(state.joins.flatMap(x=>x.params).filter(x=>x===collegeId).length)
   .toBe(2);
 });
 it("denies Faculty, Mentor, Learner and College Admin before resolving a college or querying choices",async()=>{
  for(const role of ["FACULTY","MENTOR","LEARNER","COLLEGE_ADMIN"] as const){
   const person:RequestContext={
    ...admin,user:{...admin.user,systemRoles:[]},
    membership:{id:"membership",collegeId,organizationId:orgId,
     status:"ACTIVE",roles:[role]},
   };
   await expect(getSuperAdminLearningFilterOptions(person))
    .rejects.toThrow("Missing permission: courses.read");
  }
  await expect(getSuperAdminLearningFilterOptions({
   ...admin,user:{...admin.user,platformStatus:"DISABLED"},
  })).rejects.toThrow("Missing permission: courses.read");
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.reads).toBe(0);
 });
 it("does not fallback to a global college if the selected scope is revoked",async()=>{
  state.scope.mockRejectedValueOnce(new Error("Unselected college"));
  await expect(getSuperAdminLearningFilterOptions(admin)).rejects.toThrow("Unselected college");
  expect(state.reads).toBe(0);
 });
});
