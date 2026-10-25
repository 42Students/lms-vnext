import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {listProjectMemberCandidates} from "@/modules/projects/member-service";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
  scopes:0,checks:0,reads:0,revoked:false,archived:false,
  lock:"",filters:[] as unknown[],limits:[] as number[],
}));
vi.mock("@/modules/projects/access",()=>({
  // The production API now delegates to its live read-grant resolver first,
  // then requires ADMIN or an assigned MENTOR for the candidate search.
  requireProjectReadAccess:async()=>{
    state.scopes++;
    return {access:"ADMIN",project:{id:projectId,title:"Dharwad"},collegeId,
      organizationId:"33333333-3333-4333-8333-333333333333"};
  },
  requireProjectManageAccess:async()=>{
    state.scopes++;
    return {project:{id:projectId,title:"Dharwad"},collegeId,
      organizationId:"33333333-3333-4333-8333-333333333333"};
  },
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async(_tx:unknown,ctx:RequestContext)=>{
    state.checks++;
    if(state.revoked)throw Error("PERSISTED_MEMBERSHIP_REVOKED");
    return ctx;
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async<T>(fn:(tx:unknown)=>Promise<T>)=>{
      const select=()=>{
        const step=state.reads++;
        const projectRows=[{status:state.archived?"ARCHIVED":"ACTIVE"}];
        const peopleRows=[{membershipId:"44444444-4444-4444-8444-444444444444",
          displayName:"IIT Dharwad Learner",email:"learner@example.invalid"}];
        const q={
          from:()=>q,innerJoin:()=>q,leftJoin:()=>q,
          where:(input:unknown)=>{state.filters.push(input);return q;},
          for:(lock:string)=>{state.lock=lock;return q;},
          orderBy:()=>q,
          limit:async(n:number)=>{
            state.limits.push(n);
            return step===0?projectRows:peopleRows;
          },
        };
        return q;
      };
      return fn({select});
    },
  }),
}));
const actor=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"staff",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
    collegeId,organizationId:"33333333-3333-4333-8333-333333333333",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
beforeEach(()=>{
  state.scopes=0;state.checks=0;state.reads=0;state.revoked=false;
  state.archived=false;state.lock="";state.filters=[];state.limits=[];
});
describe("IIT Dharwad Projects member search: permission and archive-sensitive PII",()=>{
  it("PROJ-BREAK-members-97 rejects malformed roles and limits before scope lookup",async()=>{
    for(const raw of [
      {role:"OTHER_TENANT"}, {role:"MENTOR",limit:"0x10"},
      {role:"LEARNER",limit:"1e2"},{role:"LEARNER",limit:""},
      {role:"LEARNER",limit:51},{role:"LEARNER",limit:["1","2"]},
      {role:"LEARNER",q:"x".repeat(121)},
      {role:"LEARNER",collegeId:"other"},
    ]){
      await expect(listProjectMemberCandidates(actor(),projectId,raw))
        .rejects.toThrow();
    }
    expect(state.scopes).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-members-98 a revoked membership fails before any candidate/email DB read",async()=>{
    state.revoked=true;
    await expect(listProjectMemberCandidates(actor(),projectId,{role:"LEARNER"}))
      .rejects.toThrow("PERSISTED_MEMBERSHIP_REVOKED");
    expect(state.checks).toBe(1);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-members-99 an archived project cannot populate active member choices",async()=>{
    state.archived=true;
    await expect(listProjectMemberCandidates(actor(),projectId,{role:"MENTOR"}))
      .rejects.toThrow("PROJECT_INVALID_STATE");
    expect(state.lock).toBe("share");
    expect(state.reads).toBe(1);
  });
  it("PROJ-BREAK-members-100 valid role gets only selected-college active, non-member choices",async()=>{
    const results=await listProjectMemberCandidates(actor(),projectId,{
      role:"LEARNER",q:"Dharwad",limit:"20",
    });
    expect(results).toMatchObject([{displayName:"IIT Dharwad Learner"}]);
    expect(state.checks).toBe(1);
    expect(state.reads).toBe(2);
    expect(state.lock).toBe("share");
    const sql=state.filters.map(f=>new PgDialect().sqlToQuery(f as SQL));
    expect(sql.some(q=>q.params.includes(collegeId))).toBe(true);
    expect(sql.some(q=>q.params.includes("ACTIVE"))).toBe(true);
    expect(state.limits).toContain(20);
  });
});
