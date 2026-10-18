import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {duplicateProjectTemplate} from "@/modules/projects/template-service";

const sourceId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({
 reads:0,inserts:0,events:0,checks:0,allowed:true,conflict:false,
 copied:null as unknown,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:async()=>{
  state.checks+=1;
  if(!state.allowed)throw new Error("Missing permission: project-template.manage");
 },
}));
vi.mock("@/modules/activity/service",()=>({
 recordActivityEventInTransaction:async()=>{state.events+=1;return {id:"activity"};},
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   const step=state.reads++;
   const rows=step===0
    ?[{id:sourceId,slug:"historical-project",title:"Historical",summary:"Past",status:"ARCHIVED",currentVersion:4}]
    :[{id:"old-version",version:4,templateId:sourceId,summary:"Pinned",
       blueprint:{overview:{goal:"Prototype",deliverables:["Demo"]},releases:[],sprints:[],tasks:[],resources:[]}}];
   const q={from:()=>q,where:()=>q,limit:async()=>rows};
   return q;
  },
  transaction:async(run:(tx:unknown)=>Promise<unknown>)=>run({
   insert:()=>({values:(values:Record<string,unknown>)=>({
    returning:async()=>{
     if(state.conflict&&state.inserts===0)throw {constraint:"project_templates_slug_uq"};
     state.inserts+=1;
     if(state.inserts===1)return [{id:"new-template",...values}];
     state.copied=values.blueprint;
     return [{id:"new-version",version:1,...values}];
    },
   })}),
  }),
 }),
}));
const actor=():RequestContext=>({
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"admin",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
});
beforeEach(()=>{
 state.reads=0;state.inserts=0;state.events=0;state.checks=0;
 state.allowed=true;state.conflict=false;state.copied=null;
});
describe("IIT Dharwad template duplicate permissions and version pinning",()=>{
 it("PROJ-BREAK-idor-39 revoked role aborts duplicate without insert or activity",async()=>{
  state.allowed=false;
  await expect(duplicateProjectTemplate(actor(),sourceId,{slug:"safe-copy"}))
   .rejects.toThrow("Missing permission: project-template.manage");
  expect(state.checks).toBe(1);
  expect(state.inserts).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-state-24 archived history duplicates only as unpublished version 1",async()=>{
  const result=await duplicateProjectTemplate(actor(),sourceId,{slug:"safe-copy",title:"New run"});
  expect(result.template).toMatchObject({slug:"safe-copy",title:"New run",status:"DRAFT",currentVersion:1,publishedVersion:null});
  expect(result.version.version).toBe(1);
  expect(state.copied).toMatchObject({overview:{goal:"Prototype",deliverables:["Demo"]}});
  expect(state.inserts).toBe(2);
  expect(state.events).toBe(1);
 });
 it("PROJ-BREAK-races-17 duplicate slug maps to a safe conflict and records no event",async()=>{
  state.conflict=true;
  await expect(duplicateProjectTemplate(actor(),sourceId,{slug:"taken"}))
   .rejects.toThrow("PROJECT_TEMPLATE_SLUG_CONFLICT");
  expect(state.inserts).toBe(0);
  expect(state.events).toBe(0);
 });
 it("PROJ-BREAK-input-35 invalid slug and wrong role fail before DB access",async()=>{
  await expect(duplicateProjectTemplate(actor(),sourceId,{slug:"=unsafe"})).rejects.toThrow();
  const admin=actor();
  await expect(duplicateProjectTemplate({...admin,user:{...admin.user,systemRoles:[]}},sourceId,{slug:"safe"}))
   .rejects.toThrow("Missing permission: project-template.manage");
  expect(state.reads).toBe(0);
 });
});
