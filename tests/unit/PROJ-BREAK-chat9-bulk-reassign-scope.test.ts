import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {bulkReassignProjectMentor} from "@/modules/projects/member-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollegeId="22222222-2222-4222-8222-222222222222";
const mentorId="33333333-3333-4333-8333-333333333333";
const projectId="44444444-4444-4444-8444-444444444444";
const state=vi.hoisted(()=>({scope:0,reads:0}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(id:string)=>{
    state.scope++;
    return {id,organizationId:"55555555-5555-4555-8555-555555555555"};
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>{
    state.reads++;
    throw Error("PRIVATE_DB_CONNECTION_TOKEN");
  },
}));
const admin=():RequestContext=>({
  user:{id:"66666666-6666-4666-8666-666666666666",
    identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"77777777-7777-4777-8777-777777777777",
    collegeId,organizationId:"55555555-5555-4555-8555-555555555555",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
const input=(college=collegeId)=>({
  collegeId:college,projectIds:[projectId],mentorMembershipId:mentorId,roleLabel:"Project Mentor",
});
beforeEach(()=>{state.scope=0;state.reads=0;});
describe("IIT Dharwad Projects bulk mentor reassignment request safety",()=>{
  it("PROJ-BREAK-mentor-110 rejects foreign or stale college scopes before looking up existence",async()=>{
    await expect(bulkReassignProjectMentor(admin(),input(otherCollegeId)))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    const learner=admin();
    learner.membership={...learner.membership!,roles:["LEARNER"]};
    await expect(bulkReassignProjectMentor(learner,input()))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(state.scope).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-111 validates bulk IDs and size before attempting any scope read",async()=>{
    for(const raw of [
      {...input(),projectIds:[]},
      {...input(),projectIds:Array.from({length:101},(_,n)=>String(n))},
      {...input(),projectIds:["forged-project"]},
      {...input(),mentorMembershipId:"not-a-mentor"},
      {...input(),roleLabel:""},
      {...input(),unexpectedTenant:"other"},
    ]){
      await expect(bulkReassignProjectMentor(admin(),raw)).rejects.toThrow();
    }
    expect(state.scope).toBe(0);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-mentor-112 a per-item DB outage does not leak credentials or misreport a completed reassignment",async()=>{
    const result=await bulkReassignProjectMentor(admin(),input());
    expect(result).toMatchObject({
      reassignedCount:0,skippedCount:0,
      failures:[{projectId,code:"PROJECT_REASSIGNMENT_FAILED"}],
    });
    expect(JSON.stringify(result)).not.toContain("PRIVATE_DB_CONNECTION_TOKEN");
    expect(state.scope).toBe(1);
    expect(state.reads).toBe(1);
  });
});
