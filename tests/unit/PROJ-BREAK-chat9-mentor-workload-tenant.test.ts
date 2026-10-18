import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {
  listCollegeProjectMentorWorkload,listCollegeReassignmentWorkspaces,
} from "@/modules/projects/mentor-reassignment-workload-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollegeId="22222222-2222-4222-8222-222222222222";
const mentorId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  scope:0,liveChecks:0,reads:0,revoked:false,filters:[] as unknown[],
  pages:[] as number[],offsets:[] as number[],
}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(id:string)=>{
    state.scope++;
    return {id,organizationId:"44444444-4444-4444-8444-444444444444"};
  },
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async(_tx:unknown,ctx:RequestContext)=>{
    state.liveChecks++;
    if(state.revoked)throw Error("PROJECT_ROLE_REVOKED");
    return ctx;
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async<T>(fn:(tx:unknown)=>Promise<T>)=>{
      const select=(fields:Record<string,unknown>)=>{
        state.reads++;
        const rows="total" in fields?[{total:1}]:
          "activeWorkspaces" in fields?[{mentorMembershipId:mentorId,mentorName:"Mentor",activeWorkspaces:1,atRisk:0}]:
          [{id:"55555555-5555-4555-8555-555555555555",title:"IIT Dharwad",status:"ACTIVE",
            mentorName:"Mentor",mentorMembershipId:mentorId}];
        const chain={
          from:()=>chain,leftJoin:()=>chain,where:(clause:unknown)=>{
            state.filters.push(clause);return chain;
          },
          orderBy:()=>chain,groupBy:()=>chain,
          limit:(n:number)=>{state.pages.push(n);return chain;},
          offset:(n:number)=>{state.offsets.push(n);return chain;},
          then:(resolve:(rows:typeof rows)=>unknown)=>Promise.resolve(rows).then(resolve),
        };
        return chain;
      };
      return fn({select});
    },
  }),
}));
const admin=():RequestContext=>({
  user:{id:"66666666-6666-4666-8666-666666666666",
    identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"77777777-7777-4777-8777-777777777777",
    collegeId,organizationId:"44444444-4444-4444-8444-444444444444",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
beforeEach(()=>{
  state.scope=0;state.liveChecks=0;state.reads=0;state.revoked=false;
  state.filters=[];state.pages=[];state.offsets=[];
});
describe("IIT Dharwad Projects: mentor reassignment workload tenant and input safety",()=>{
  it("PROJ-BREAK-mentor-86 rejects hostile direct-service input before scope or DB lookup",async()=>{
    for(const raw of [
      {page:"0x10"},{page:"1e3"},{page:""},{page:0},
      {pageSize:"0x20"},{pageSize:101},{status:"CROSS_TENANT"},
      {page:["1","2"]},{q:"x".repeat(121)},{collegeId:otherCollegeId},
    ]){
      await expect(listCollegeReassignmentWorkspaces(admin(),collegeId,raw))
        .rejects.toThrow();
    }
    expect(state.scope).toBe(0);
    expect(state.liveChecks).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-87 wrong college and wrong role cannot fetch a mentor roster",async()=>{
    await expect(listCollegeReassignmentWorkspaces(admin(),otherCollegeId,{}))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    const learner=admin();
    learner.membership={...learner.membership!,roles:["LEARNER"]};
    await expect(listCollegeProjectMentorWorkload(learner,collegeId))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(state.scope).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-88 revoked actor cannot read even an empty mentor queue",async()=>{
    state.revoked=true;
    await expect(listCollegeReassignmentWorkspaces(admin(),collegeId,{}))
      .rejects.toThrow("PROJECT_ROLE_REVOKED");
    await expect(listCollegeProjectMentorWorkload(admin(),collegeId))
      .rejects.toThrow("PROJECT_ROLE_REVOKED");
    expect(state.liveChecks).toBe(2);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-89 active scope and mentor filter are applied to both count and page with bounded offset",async()=>{
    const result=await listCollegeReassignmentWorkspaces(admin(),collegeId,{
      fromMentorId:mentorId,q:"100%_team",status:"ACTIVE",page:2,pageSize:50,
    });
    expect(result).toMatchObject({total:1,page:2,pageSize:50});
    expect(state.pages).toContain(50);
    expect(state.offsets).toContain(50);
    expect(state.liveChecks).toBe(1);
    const rendered=state.filters.map(value=>new PgDialect().sqlToQuery(value as SQL));
    expect(rendered.some(item=>item.params.includes(collegeId))).toBe(true);
    expect(rendered.some(item=>item.params.includes(mentorId))).toBe(true);
    expect(rendered.some(item=>item.params.includes("%100\\%\\_team%"))).toBe(true);
  });
  it("PROJ-BREAK-mentor-90 authorized workload remains scoped, archived-free and read-only",async()=>{
    const result=await listCollegeProjectMentorWorkload(admin(),collegeId);
    expect(result).toMatchObject([{mentorMembershipId:mentorId,activeWorkspaces:1,atRisk:0}]);
    expect(state.liveChecks).toBe(1);
    const rendered=state.filters.map(value=>new PgDialect().sqlToQuery(value as SQL));
    expect(rendered.some(item=>item.params.includes("ARCHIVED"))).toBe(true);
    expect(rendered.some(item=>item.params.includes("COMPLETED"))).toBe(true);
    expect(rendered.some(item=>item.params.includes(collegeId))).toBe(true);
  });
});
