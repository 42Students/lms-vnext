import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({
 scope:vi.fn(),queries:0,joins:[] as Array<{table:string;sql:string;params:unknown[]}>,
 classCount:null as SQL|null,rows:{
  batch:{id:"11111111-1111-4111-8111-111111111111",name:"Batch 2099",code:"2099",programName:"Engineering"},
  classes:[] as Array<Record<string,unknown>>,
  roster:[] as Array<Record<string,unknown>>,
 },
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:state.scope}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:(projection:Record<string,unknown>)=>{
  state.queries++;
  const dialect=new PgDialect();
  const table="programName" in projection?"batch":
   "learnerCount" in projection?"classes":"roster";
  if(table==="classes")state.classCount=projection.learnerCount as SQL;
  class Query {
   from(){return this;}
   innerJoin(){return this;}
   leftJoin(_target:unknown,condition:SQL){
    const q=dialect.sqlToQuery(condition);
    state.joins.push({table,sql:q.sql,params:q.params});
    return this;
   }
   where(){return this;}
   groupBy(){return this;}
   async orderBy(){return table==="classes"?state.rows.classes:state.rows.roster;}
   async limit(){return state.rows.batch?[state.rows.batch]:[];}
  }
  return new Query();
 },
})}));
import {getSuperAdminBatchRosterOverview} from "@/modules/admin-ui/super-admin-batch-roster-service";

const batchId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const orgId="33333333-3333-4333-8333-333333333333";
const actor:RequestContext={
 user:{id:"super",identityUid:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:orgId},
};
beforeEach(()=>{
 vi.resetAllMocks();
 state.queries=0;state.joins=[];state.classCount=null;
 state.rows.classes=[];
 state.rows.roster=[];
 state.scope.mockResolvedValue({collegeId,organizationId:orgId});
});
describe("SA-ACADEMICS-BATCH-COUNT-01 scoped active batch learner census",()=>{
 it("counts only active users with active same-college memberships and enrollment in the chosen cohort",async()=>{
  const result=await getSuperAdminBatchRosterOverview(actor,batchId);
  expect(result?.batch.id).toBe(batchId);
  expect(state.scope).toHaveBeenCalledWith(actor,"academics.read");
  expect(state.queries).toBe(3);
  const dialect=new PgDialect();
  expect(state.classCount).not.toBeNull();
  const totalSql=dialect.sqlToQuery(state.classCount!).sql;
  expect(totalSql).toContain("count(distinct ");
  expect(totalSql).toContain('"users"."id"');
  const joins=state.joins.filter(x=>x.table==="classes");
  const sql=joins.map(x=>x.sql).join("\n");
  expect(sql).toContain('"users"."platform_status"');
  expect(sql).toContain('"college_memberships"."status"');
  expect(sql).toContain('"learner_program_enrollments"."status"');
  expect(sql).toContain('"section_enrollments"."status"');
  expect(joins.flatMap(x=>x.params)).toContain("ACTIVE");
  expect(joins.flatMap(x=>x.params)).toContain(collegeId);
 });
 it("returns null for a missing cohort without scanning learner membership records",async()=>{
  state.rows.batch=null as unknown as typeof state.rows.batch;
  const result=await getSuperAdminBatchRosterOverview(actor,batchId);
  expect(result).toBeNull();
  expect(state.queries).toBe(1);
 });
 it("rejects malformed batch IDs before selecting college or touching SQL",async()=>{
  await expect(getSuperAdminBatchRosterOverview(actor,"../../foreign"))
   .rejects.toThrow();
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.queries).toBe(0);
 });
 it("SA-ACADEMICS-ROLE-01 denies Faculty, Mentor, Learner, College Admin and disabled Super Admin before resolving college",async()=>{
  const blocked:RequestContext[]=[
   {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   ...(["FACULTY","MENTOR","LEARNER","COLLEGE_ADMIN"] as const).map(role=>({
    ...actor,user:{...actor.user,systemRoles:[]},
    membership:{id:"member",collegeId,organizationId:orgId,
     status:"ACTIVE" as const,roles:[role]},
   })),
  ];
  for(const principal of blocked)
   await expect(getSuperAdminBatchRosterOverview(principal,batchId))
    .rejects.toThrow("Missing permission: academics.read");
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.queries).toBe(0);
 });
 it("requires an authorized selected college before executing batch queries",async()=>{
  state.scope.mockRejectedValueOnce(new Error("Missing permission: academics.read"));
  await expect(getSuperAdminBatchRosterOverview(actor,batchId))
   .rejects.toThrow("Missing permission: academics.read");
  expect(state.queries).toBe(0);
 });
});
