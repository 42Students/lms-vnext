import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {getSuperAdminShortlistedDetail} from "@/modules/admin-ui/super-admin-shortlisted-detail-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const applicationId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  reads:0,joinFilters:[] as unknown[],whereFilters:[] as unknown[],
  found:true,
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    select:()=>{
      state.reads+=1;
      const query={
        from:()=>query,
        innerJoin:(_table:unknown,predicate:unknown)=>{
          state.joinFilters.push(predicate);
          return query;
        },
        where:(predicate:unknown)=>{
          state.whereFilters.push(predicate);
          return query;
        },
        limit:async()=>state.found?[{
          applicationId,applicationStatus:"SUBMITTED",channel:"CAMPUS",
          submittedAt:new Date("2026-10-18T10:00:00.000Z"),
          screeningStatus:"SHORTLISTED",decidedAt:new Date("2026-10-18T10:10:00.000Z"),
          applicant:"IIT Student",jobTitle:"Engineer",role:"SDE",
        }]:[],
      };
      return query;
    },
  }),
}));
const actor=():RequestContext=>({
  user:{id:"44444444-4444-4444-8444-444444444444",
    identityUid:"super-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:{collegeId,organizationId},
});
const render=(fragment:unknown)=>new PgDialect().sqlToQuery(fragment as SQL);
beforeEach(()=>{state.reads=0;state.joinFilters=[];state.whereFilters=[];state.found=true;});
describe("Super Admin last-third shortlisted applicant detail role, tenant and privacy boundaries",()=>{
  it("SA-placements-shortlisted-01 exact college and organization inner joins prevent cross-tenant applicant disclosure",async()=>{
    const result=await getSuperAdminShortlistedDetail(actor(),applicationId);
    expect(result?.title).toBe("IIT Student");
    expect(result?.status).toBe("SHORTLISTED");
    expect(result?.related.href).toBe("/admin/placements/applications/"+applicationId);
    const sql=state.joinFilters.map(render);
    const college=sql.find(item=>item.sql.includes('"placement_jobs"."college_id"'));
    expect(college?.params).toContain(collegeId);
    const org=sql.find(item=>item.sql.includes('"colleges"."organization_id"'));
    expect(org?.params).toContain(organizationId);
    const student=sql.find(item=>item.sql.includes('"college_memberships"."college_id"'));
    expect(student?.params).toContain(collegeId);
    const screen=sql.find(item=>item.sql.includes('"placement_application_screenings"."status"'));
    expect(screen?.params).toContain("SHORTLISTED");
    const role=sql.find(item=>item.sql.includes('"placement_job_role_options"."job_id"'));
    expect(role).toBeDefined();
    expect(render(state.whereFilters[0]).params).toContain(applicationId);
    expect(result?.facts.some(x=>x.label==="Privacy"&&x.value.includes("withheld"))).toBe(true);
    expect(JSON.stringify(result)).not.toContain("internalNote");
    expect(JSON.stringify(result)).not.toContain("screeningReason");
  });
  it("SA-placements-shortlisted-02 unauthorized, disabled and unscoped global accounts never touch application tables",async()=>{
    const admin=actor();
    const sessions=[
      {...admin,adminScope:null},
      {...admin,user:{...admin.user,platformStatus:"DISABLED" as const}},
      {...admin,user:{...admin.user,systemRoles:[]}},
    ];
    for(const session of sessions){
      await expect(getSuperAdminShortlistedDetail(session,applicationId)).rejects.toThrow();
    }
    expect(state.reads).toBe(0);
  });
  it("SA-placements-shortlisted-03 invalid application ID cannot enter SQL and not-found response is null",async()=>{
    expect(await getSuperAdminShortlistedDetail(actor(),"not-a-uuid")).toBeNull();
    expect(state.reads).toBe(0);
    state.found=false;
    expect(await getSuperAdminShortlistedDetail(actor(),applicationId)).toBeNull();
    expect(state.reads).toBe(1);
  });
});
