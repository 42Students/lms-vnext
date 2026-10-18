import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import {listProjectMentorCandidates} from "@/modules/projects/member-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollegeId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
  scope:0,checks:0,reads:0,revoked:false,filters:[] as unknown[],limits:[] as number[],
}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(id:string)=>{
    state.scope++;
    return {id,organizationId:"33333333-3333-4333-8333-333333333333"};
  },
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async(_tx:unknown,context:RequestContext)=>{
    state.checks++;
    if(state.revoked)throw Error("COLLEGE_ADMIN_REVOKED");
    return context;
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async<T>(fn:(tx:unknown)=>Promise<T>)=>{
      const select=()=>{
        state.reads++;
        const q={
          from:()=>q,innerJoin:()=>q,where:(where:unknown)=>{
            state.filters.push(where);return q;
          },orderBy:()=>q,
          limit:async(n:number)=>{
            state.limits.push(n);
            return [{membershipId:"44444444-4444-4444-8444-444444444444",
              displayName:"Dharwad Mentor",email:"mentor@example.invalid"}];
          },
        };
        return q;
      };
      return fn({select});
    },
  }),
}));
const admin=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",
    identityUid:"staff",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
    collegeId,organizationId:"33333333-3333-4333-8333-333333333333",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
beforeEach(()=>{
  state.scope=0;state.checks=0;state.reads=0;state.revoked=false;
  state.filters=[];state.limits=[];
});
describe("IIT Dharwad Projects: eligible mentor PII read safety",()=>{
  it("PROJ-BREAK-mentor-93 rejects foreign selected college before scope existence or private email query",async()=>{
    await expect(listProjectMentorCandidates(admin(),otherCollegeId,{}))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    const learner=admin();
    learner.membership={...learner.membership!,roles:["LEARNER"]};
    await expect(listProjectMentorCandidates(learner,collegeId,{}))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(state.scope).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-94 refuses hostile pagination before scope and actor revalidation",async()=>{
    for(const input of [
      {limit:"0x10"},{limit:"1e2"},{limit:""},{limit:0},
      {limit:101},{limit:" 5"},{limit:["1","2"]},{q:"x".repeat(121)},
      {organizationId:"forged"},
    ]){
      await expect(listProjectMentorCandidates(admin(),collegeId,input))
        .rejects.toThrow();
    }
    expect(state.scope).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-95 revoked account cannot read names/emails even when its context is still ACTIVE",async()=>{
    state.revoked=true;
    await expect(listProjectMentorCandidates(admin(),collegeId,{q:"Dharwad",limit:100}))
      .rejects.toThrow("COLLEGE_ADMIN_REVOKED");
    expect(state.checks).toBe(1);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-96 active actor receives a bounded, selected-college and ACTIVE-only mentor roster",async()=>{
    const list=await listProjectMentorCandidates(admin(),collegeId,{q:"Dharwad",limit:"50"});
    expect(list).toMatchObject([{displayName:"Dharwad Mentor"}]);
    expect(state.limits).toEqual([50]);
    expect(state.checks).toBe(1);
    const predicates=state.filters.map(value=>new PgDialect().sqlToQuery(value as SQL));
    expect(predicates.some(item=>item.params.includes(collegeId))).toBe(true);
    expect(predicates.some(item=>item.params.includes("ACTIVE"))).toBe(true);
  });
});
