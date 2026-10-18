import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
  createProjectTemplate,
  reviseProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";

const templateId="11111111-1111-4111-8111-111111111111";
const blueprint={
  overview:{goal:"Prototype",deliverables:["Demo"]},
  releases:[],sprints:[],tasks:[],resources:[],
};
const state=vi.hoisted(()=>({
  allowed:true,checks:0,locks:0,inserts:0,updates:0,events:0,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async()=>{
    state.checks+=1;
    if(!state.allowed)throw new Error("Missing permission: project-template.manage");
  },
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:async()=>{state.events+=1;return {id:"event"};},
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async(run:(tx:unknown)=>Promise<unknown>)=>{
      const query={
        from:()=>query,
        where:()=>query,
        for:()=>{state.locks+=1;return query;},
        limit:async()=>[{id:templateId,status:"DRAFT",currentVersion:1,title:"Prototype",publishedVersion:null}],
      };
      const tx={
        select:()=>query,
        insert:()=>{state.inserts+=1;throw new Error("UNEXPECTED_INSERT");},
        update:()=>{state.updates+=1;throw new Error("UNEXPECTED_UPDATE");},
      };
      return run(tx);
    },
  }),
}));
const actor=():RequestContext=>({
  user:{id:"22222222-2222-4222-8222-222222222222",identityUid:"platform-admin",
    platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,adminScope:null,
});
beforeEach(()=>{
  state.allowed=true;state.checks=0;state.locks=0;state.inserts=0;state.updates=0;state.events=0;
});
describe("IIT Dharwad global template authoring: persisted platform authorization",()=>{
  it("PROJ-BREAK-idor-50 a revoked user cannot create any template or history from a stale dialog",async()=>{
    state.allowed=false;
    await expect(createProjectTemplate(actor(),{
      slug:"prototype",title:"Prototype",blueprint,
    })).rejects.toThrow("Missing permission: project-template.manage");
    expect(state.checks).toBe(1);
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
  });
  it("PROJ-BREAK-idor-51 stale authorization fails after locking the original version on revision",async()=>{
    state.allowed=false;
    await expect(reviseProjectTemplate(actor(),templateId,{
      expectedVersion:1,title:"Revised",blueprint,
    })).rejects.toThrow("Missing permission: project-template.manage");
    expect(state.checks).toBe(1);
    expect(state.locks).toBe(1);
    expect(state.updates).toBe(0);
    expect(state.inserts).toBe(0);
    expect(state.events).toBe(0);
  });
  it("PROJ-BREAK-idor-52 a stale Super Admin cannot publish an otherwise valid template",async()=>{
    state.allowed=false;
    await expect(publishProjectTemplate(actor(),templateId))
      .rejects.toThrow("Missing permission: project-template.manage");
    expect(state.checks).toBe(1);
    expect(state.locks).toBe(1);
    expect(state.updates).toBe(0);
    expect(state.events).toBe(0);
  });
  it("PROJ-BREAK-idor-53 inactive and non-Super Admin roles stop before even starting transaction",async()=>{
    const active=actor();
    await expect(createProjectTemplate({...active,user:{...active.user,platformStatus:"DISABLED"}},{
      slug:"prototype",title:"Prototype",blueprint,
    })).rejects.toThrow("Missing permission: project-template.manage");
    await expect(reviseProjectTemplate({...active,user:{...active.user,systemRoles:[]}},templateId,{
      expectedVersion:1,title:"Revised",blueprint,
    })).rejects.toThrow("Missing permission: project-template.manage");
    expect(state.checks).toBe(0);
    expect(state.locks).toBe(0);
    expect(state.inserts).toBe(0);
  });
});
