import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {lookupCollegeStudentPlacement} from "@/modules/placements/college-placement-student-lookup-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({
  authorized:true,reads:0,distinctReads:0,joins:[] as unknown[],where:[] as unknown[],
}));
vi.mock("@/modules/placements/college-drive-read-service",()=>({
  requireCollegePlacementAdmin:async()=>{
    if(!state.authorized)throw new Error("Missing permission: placements.read");
    return collegeId;
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    // The service now asks a separate college-scoped question about *any*
    // accepted offer/joining outcome before paging the application history.
    // Mock that distinct correlated lookup instead of bypassing it.
    selectDistinct:(_columns:Record<string,unknown>)=>{
      state.reads+=1;state.distinctReads+=1;
      const joined=[{membershipId:"22222222-2222-4222-8222-222222222222"}];
      const query={
        from:()=>query,
        innerJoin:(_table:unknown,expression:unknown)=>{
          state.joins.push(expression);return query;
        },
        where:(expression:unknown)=>{
          state.where.push(expression);return query;
        },
        then:(resolve:(rows:typeof joined)=>unknown)=>Promise.resolve(joined).then(resolve),
      };
      return query;
    },
    select:(columns:Record<string,unknown>)=>{
      const isPeople="membershipId" in columns;
      state.reads+=1;
      const query={
        from:()=>query,
        innerJoin:(_table:unknown,expression:unknown)=>{
          state.joins.push(expression);return query;
        },
        leftJoin:()=>query,
        where:(expression:unknown)=>{state.where.push(expression);return query;},
        orderBy:()=>query,
        limit:async()=>isPeople?[{
          membershipId:"22222222-2222-4222-8222-222222222222",
          name:"IIT Dharwad Student",roll:"D001",email:null,
        }]:[],
      };
      return query;
    },
  }),
}));
const ctx:RequestContext={
  user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"admin",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{collegeId,organizationId:null},
};
beforeEach(()=>{
  state.authorized=true;state.reads=0;state.distinctReads=0;state.joins=[];state.where=[];
});
describe("Super Admin last-third student lookup: tenant-safe application joins",()=>{
  it("SA-placements-student-lookup-05 job and company-relationship joins share the selected college ID",async()=>{
    const result=await lookupCollegeStudentPlacement(ctx,"  IIT Dharwad  ");
    expect(result.students).toHaveLength(1);
    expect(state.reads).toBe(3);
    expect(state.distinctReads).toBe(1);
    expect(result.students[0]?.placed).toBe(true);
    const dialect=new PgDialect();
    const clauses=state.joins.map(item=>dialect.sqlToQuery(item as SQL));
    const relationship=clauses.find(item=>item.sql.includes('"placement_company_relationships"."college_id"'));
    expect(relationship).toBeDefined();
    expect(relationship!.sql).toContain('"placement_company_relationships"."id"');
    expect(relationship!.params).toContain(collegeId);
    const scopedRelationships=clauses.filter(item=>
      item.sql.includes('"placement_company_relationships"."college_id"'));
    expect(scopedRelationships).toHaveLength(2);
    for(const join of scopedRelationships)expect(join.params).toContain(collegeId);
    const scopedJob=clauses.find(item=>item.sql.includes('"placement_jobs"."college_id"'));
    expect(scopedJob).toBeDefined();
    expect(scopedJob!.params).toContain(collegeId);
    const membership=dialect.sqlToQuery(state.where[0] as SQL);
    expect(membership.params).toContain(collegeId);
  });
  it("SA-placements-student-lookup-06 expired or forbidden account never starts a PII query",async()=>{
    state.authorized=false;
    await expect(lookupCollegeStudentPlacement(ctx,"student"))
      .rejects.toThrow("Missing permission: placements.read");
    expect(state.reads).toBe(0);
  });
  it("SA-placements-student-lookup-07 overly long/short searches fail before authorization and query",async()=>{
    for(const value of ["ab","x".repeat(151),[],null]){
      await expect(lookupCollegeStudentPlacement(ctx,value)).rejects.toThrow();
    }
    expect(state.reads).toBe(0);
  });
});
