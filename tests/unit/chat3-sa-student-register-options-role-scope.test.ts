import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({
 scope:vi.fn(),reads:0,
 predicates:[] as Array<{sql:string;params:unknown[]}>,
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:stubs.scope}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:(_projection:Record<string,unknown>)=>{
  stubs.reads++;
  const dialect=new PgDialect();
  class Query{
   from(){return this;}
   innerJoin(_target:unknown,condition:SQL){
    const q=dialect.sqlToQuery(condition);
    stubs.predicates.push({sql:q.sql,params:q.params});
    return this;
   }
   where(){return this;}
   orderBy(){return this;}
   async limit(){return [];}
  }
  return new Query();
 },
})}));
import {getSuperAdminStudentRegisterOptions} from "@/modules/admin-ui/super-admin-student-register-options-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const context:RequestContext={
 user:{id:"super",identityUid:"super",platformStatus:"ACTIVE",
  systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId},
};
beforeEach(()=>{
 vi.resetAllMocks();stubs.reads=0;stubs.predicates=[];
 stubs.scope.mockResolvedValue({collegeId,organizationId});
});
describe("SA-ACADEMICS-ROLE-01 Super Admin registration options",()=>{
 it("loads only program, batch and Section choices joined to the persisted selected college",async()=>{
  await expect(getSuperAdminStudentRegisterOptions(context)).resolves.toEqual({
   programs:[],batches:[],classes:[],
  });
  expect(stubs.scope).toHaveBeenCalledWith(context,"people.manage");
  expect(stubs.reads).toBe(3);
  const joined=stubs.predicates.filter(predicate=>
   predicate.sql.includes('"departments"."college_id"'));
  expect(joined).toHaveLength(3);
  for(const predicate of joined)expect(predicate.params).toContain(collegeId);
 });
 it("blocks Faculty, Mentor, Learner, College Admin and disabled Super Admin before SQL or selected-scope reads",async()=>{
  const blocked:RequestContext[]=[
   {...context,user:{...context.user,platformStatus:"DISABLED"}},
   ...(["FACULTY","MENTOR","LEARNER","COLLEGE_ADMIN"] as const).map(role=>({
    ...context,user:{...context.user,systemRoles:[]},
    membership:{id:"member",organizationId,collegeId,
     status:"ACTIVE" as const,roles:[role]},
   })),
  ];
  for(const person of blocked){
   await expect(getSuperAdminStudentRegisterOptions(person))
    .rejects.toThrow("Missing permission: people.manage");
  }
  expect(stubs.scope).not.toHaveBeenCalled();
  expect(stubs.reads).toBe(0);
 });
 it("does not reveal options if selected college ownership or organization checks fail",async()=>{
  stubs.scope.mockRejectedValueOnce(new Error("Missing permission: people.manage"));
  await expect(getSuperAdminStudentRegisterOptions(context))
   .rejects.toThrow("Missing permission: people.manage");
  expect(stubs.reads).toBe(0);
 });
});
