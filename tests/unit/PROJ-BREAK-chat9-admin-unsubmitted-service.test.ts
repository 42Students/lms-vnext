import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {projectSubmissions} from "@/db/schema";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {listProjectAdminUnsubmitted} from "@/modules/projects/admin-unsubmitted-service";
import {adminUnsubmittedLiteralSearchPattern,adminUnsubmittedQuerySchema} from "@/modules/projects/admin-unsubmitted-query-model";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  selects:0,filters:[] as unknown[],
  limitValues:[] as number[],offsetValues:[] as number[],readOnly:true,
}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(id:string)=>({
    id,organizationId:id===otherCollegeId
      ?"44444444-4444-4444-8444-444444444444":organizationId,
  }),
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    select:(columns:Record<string,unknown>)=>{
      state.selects+=1;
      const rows="value" in columns?[{value:2}]:[
        {id:"p1",title:"Not submitted A",status:"ACTIVE"},
        {id:"p2",title:"Not submitted B",status:"PLANNED"},
      ];
      let localFilter:unknown=null;
      const q={
        from:()=>q,
        where:(filter:unknown)=>{
          localFilter=filter;
          state.filters.push(filter);
          return q;
        },
        // Drizzle notExists() embeds the supplied query as an SQLWrapper.
        // Keep the actual correlated project/submission condition visible,
        // rather than replacing the critical anti-join with a dummy literal.
        getSQL:()=>sql`select ${projectSubmissions.id} from ${projectSubmissions} where ${localFilter as SQL}`,
        orderBy:()=>q,
        limit:(n:number)=>{state.limitValues.push(n);return q;},
        offset:(n:number)=>{state.offsetValues.push(n);return q;},
        then:(resolve:(v:typeof rows)=>unknown)=>Promise.resolve(rows).then(resolve),
      };
      return q;
    },
    update:()=>{state.readOnly=false;throw Error("READ_ONLY_VIOLATION");},
    insert:()=>{state.readOnly=false;throw Error("READ_ONLY_VIOLATION");},
  }),
}));
const admin=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",
    identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
    collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
const render=(value:unknown)=>new PgDialect().sqlToQuery(value as SQL);
beforeEach(()=>{state.selects=0;state.filters=[];state.limitValues=[];state.offsetValues=[];state.readOnly=true;});
describe("IIT Dharwad Projects Admin unsubmitted workspaces service permissions and pagination",()=>{
  it("PROJ-BREAK-archive-03 scoped list excludes archived and all already-submitted workspaces",async()=>{
    const result=await listProjectAdminUnsubmitted(admin(),collegeId,{
      q:"IIT",page:2,pageSize:10,
    });
    expect(result).toMatchObject({total:2,page:2,totalPages:1});
    expect(state.selects).toBeGreaterThanOrEqual(2);
    const expressions=state.filters.map(render);
    const scoped=expressions.find(x=>x.params.includes(collegeId));
    expect(scoped).toBeDefined();
    expect(scoped!.sql).toContain('"project_instances"."college_id"');
    expect(scoped!.sql).toContain('"project_instances"."status"');
    expect(scoped!.params).toContain("ARCHIVED");
    expect(scoped!.sql.toLowerCase()).toContain("not exists");
    expect(scoped!.sql).toContain('"project_submissions"."project_id"');
    expect(state.limitValues).toContain(10);
    expect(state.offsetValues).toContain(10);
    expect(state.readOnly).toBe(true);
  });
  it("PROJ-BREAK-idor-56 unrelated college, inactive and learner actors fail before any project query",async()=>{
    const ctx=admin();
    await expect(listProjectAdminUnsubmitted(ctx,otherCollegeId,{}))
      .rejects.toThrow("Missing permission: projects.manage");
    await expect(listProjectAdminUnsubmitted({
      ...ctx,membership:{...ctx.membership!,roles:["LEARNER"]},
    },collegeId,{})).rejects.toThrow("Missing permission: projects.manage");
    await expect(listProjectAdminUnsubmitted({
      ...ctx,user:{...ctx.user,platformStatus:"DISABLED"},
    },collegeId,{})).rejects.toThrow("Missing permission: projects.manage");
    expect(state.selects).toBe(0);
  });
  it("PROJ-BREAK-scale-21 rejects hostile offsets before loading college scope or DB",async()=>{
    for(const input of [{page:0},{page:100001},{page:1.5},{pageSize:101},{pageSize:0},{q:"x".repeat(121)}]){
      await expect(listProjectAdminUnsubmitted(admin(),collegeId,input)).rejects.toThrow();
    }
    expect(state.selects).toBe(0);
    expect(state.offsetValues).toHaveLength(0);
  });
  it("PROJ-BREAK-scale-21 rejects exotic numeric encodings and duplicated search tokens before querying",async()=>{
    for(const input of [
      {page:"0x10"},{page:"1e3"},{page:" 2"},{page:"1.5"},
      {page:Infinity},{page:Number.NaN},{pageSize:"1e2"},{pageSize:" 20"},
      {pageSize:"0x20"},{pageSize:""},{page:["1","2"]},{q:["foo","bar"]},
      {page:1,unexpected:true},
    ]){
      expect(adminUnsubmittedQuerySchema.safeParse(input).success,JSON.stringify(input)).toBe(false);
      await expect(listProjectAdminUnsubmitted(admin(),collegeId,input)).rejects.toThrow();
    }
    expect(state.selects).toBe(0);
    expect(state.offsetValues).toHaveLength(0);
  });
  it("PROJ-BREAK-submissions-42 filters both count and page by actual workspace status without resurrecting archives",async()=>{
    const result=await listProjectAdminUnsubmitted(admin(),collegeId,{
      q:"100%_cohort",status:"ACTIVE",page:2,pageSize:10,
    });
    expect(result.page).toBe(2);
    const predicates=state.filters.map(render).filter(row=>row.sql.includes('"project_instances"."college_id"'));
    expect(predicates.length).toBe(2);
    for(const predicate of predicates){
      expect(predicate.sql).toContain('"project_instances"."status"');
      expect(predicate.params).toContain("ARCHIVED");
      expect(predicate.params).toContain("ACTIVE");
      expect(predicate.params).toContain("%100\\\\%\\\\_cohort%");
      expect(predicate.sql.toLowerCase()).toContain("not exists");
    }
    expect(state.limitValues).toContain(10);
    expect(state.offsetValues).toContain(10);
    expect(adminUnsubmittedQuerySchema.safeParse({status:"ARCHIVED"}).success).toBe(true);
    expect(adminUnsubmittedQuerySchema.safeParse({status:"OTHER_TENANT"}).success).toBe(false);
    expect(state.readOnly).toBe(true);
  });
  it("PROJ-BREAK-input-38 LIKE wildcards match literal text rather than broadening the tenant query",()=>{
    expect(adminUnsubmittedLiteralSearchPattern("100%_team"))
      .toBe("%100\\%\\_team%");
    expect(adminUnsubmittedLiteralSearchPattern("a\\b"))
      .toBe("%a\\\\b%");
  });
});
