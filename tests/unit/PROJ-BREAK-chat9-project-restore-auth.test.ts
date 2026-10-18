import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {restoreProjectInstance} from "@/modules/projects/instance-restore-service";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const updatedAt=new Date("2026-10-18T10:00:00.000Z");
const state=vi.hoisted(()=>({
  enabled:true,persistedAllowed:true,
  status:"ARCHIVED",checks:0,reads:0,writes:0,events:0,notifications:0,
  transactions:0,
}));
vi.mock("@/modules/projects/access",()=>({
  requireProjectManageAccess:async()=>({
    project:{id:projectId},collegeId,organizationId,
  }),
}));
vi.mock("@/modules/module-access/service",()=>({
  resolveOptionalModuleAccess:async()=>({projects:{enabled:state.enabled}}),
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async()=>{
    state.checks+=1;
    if(!state.persistedAllowed)throw new Error("Missing permission: projects.manage");
  },
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:async()=>{state.events+=1;return {id:"activity"};},
}));
vi.mock("@/modules/projects/project-notification-service",()=>({
  notifyActiveProjectMembers:async()=>{state.notifications+=1;},
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
      state.transactions+=1;
      const q={
        from:()=>q,
        where:()=>q,
        for:()=>q,
        limit:async()=>{
          state.reads+=1;
          return [{id:projectId,collegeId,title:"IIT Dharwad",
            status:state.status,updatedAt}];
        },
      };
      const tx={
        select:()=>q,
        update:()=>{state.writes+=1;throw new Error("UNEXPECTED_RESTORE_WRITE");},
      };
      return run(tx);
    },
  }),
}));
const actor:RequestContext={
  user:{id:"44444444-4444-4444-8444-444444444444",identityUid:"college-admin",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"55555555-5555-4555-8555-555555555555",collegeId,organizationId,
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
};
beforeEach(()=>{
  state.enabled=true;state.persistedAllowed=true;state.status="ARCHIVED";
  state.checks=0;state.reads=0;state.writes=0;state.events=0;
  state.notifications=0;state.transactions=0;
});
describe("IIT Dharwad archived project restoration permission and stale requests",()=>{
  it("PROJ-BREAK-idor-54 role revoked after request authentication denies restore before writes or activity",async()=>{
    state.persistedAllowed=false;
    await expect(restoreProjectInstance(actor,projectId,{
      expectedUpdatedAt:updatedAt.toISOString(),
    })).rejects.toThrow("Missing permission: projects.manage");
    expect(state.checks).toBe(1);
    expect(state.reads).toBe(1);
    expect(state.writes).toBe(0);
    expect(state.events).toBe(0);
    expect(state.notifications).toBe(0);
  });
  it("PROJ-BREAK-state-27 completed and active workspaces cannot enter restore path",async()=>{
    for(const status of ["ACTIVE","COMPLETED","PLANNED"]){
      state.status=status;
      await expect(restoreProjectInstance(actor,projectId,{
        expectedUpdatedAt:updatedAt.toISOString(),
      })).rejects.toThrow("PROJECT_INVALID_STATE");
    }
    expect(state.writes).toBe(0);
    expect(state.events).toBe(0);
    expect(state.notifications).toBe(0);
  });
  it("PROJ-BREAK-input-37 invalid optimistic token or disabled module stops before write",async()=>{
    await expect(restoreProjectInstance(actor,projectId,{
      expectedUpdatedAt:"not-a-timestamp",
    })).rejects.toThrow();
    expect(state.transactions).toBe(0);
    state.enabled=false;
    await expect(restoreProjectInstance(actor,projectId,{
      expectedUpdatedAt:updatedAt.toISOString(),
    })).rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(state.transactions).toBe(0);
    expect(state.notifications).toBe(0);
  });
});
