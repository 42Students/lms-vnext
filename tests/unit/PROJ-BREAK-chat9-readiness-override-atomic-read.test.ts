import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeActiveReadinessOverrides} from "@/modules/projects/admin-readiness-overrides-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollege="22222222-2222-4222-8222-222222222222";
const projectId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  reads:0,scope:0,liveChecks:0,transactionCalls:0,lock:"",revoked:false,
  rows:[{projectId,metadata:{state:"FORCE_UNLOCK",note:"Approved exception"},
    by:"College Admin",at:new Date("2026-10-17T20:00:00.000Z")}] as {
      projectId:string;metadata:{state:string;note?:string};by:string|null;at:Date;
    }[],
  projectRows:[{id:projectId,title:"Dharwad team"}] as {id:string;title:string}[],
}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(id:string)=>{
    state.scope++;
    return {id,organizationId:"44444444-4444-4444-8444-444444444444"};
  },
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async(_tx:unknown,context:RequestContext)=>{
    state.liveChecks++;
    if(state.revoked)throw Error("Permission revoked");
    return context;
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async<T>(fn:(tx:unknown)=>Promise<T>)=>{
      state.transactionCalls++;
      const selectDistinctOn=()=>{
        state.reads++;
        const q={
          from:()=>q,leftJoin:()=>q,where:()=>q,orderBy:()=>q,
          then:(resolve:(rows:typeof state.rows)=>unknown)=>Promise.resolve(state.rows).then(resolve),
        };
        return q;
      };
      const select=()=>{
        state.reads++;
        const q={
          from:()=>q,where:()=>q,
          for:(lock:string)=>{state.lock=lock;return q;},
          then:(resolve:(rows:typeof state.projectRows)=>unknown)=>
            Promise.resolve(state.projectRows).then(resolve),
        };
        return q;
      };
      return fn({selectDistinctOn,select});
    },
  }),
}));
const admin=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"staff",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
    collegeId,organizationId:"44444444-4444-4444-8444-444444444444",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
beforeEach(()=>{
  state.reads=0;state.scope=0;state.liveChecks=0;state.transactionCalls=0;
  state.lock="";state.revoked=false;
  state.rows=[{projectId,metadata:{state:"FORCE_UNLOCK",note:"Approved exception"},
    by:"College Admin",at:new Date("2026-10-17T20:00:00.000Z")}];
  state.projectRows=[{id:projectId,title:"Dharwad team"}];
});
describe("IIT Dharwad readiness override: tenant and concurrent archive protection",()=>{
  it("PROJ-BREAK-readiness-74 wrong college is rejected before discovering tenant existence",async()=>{
    await expect(listCollegeActiveReadinessOverrides(admin(),otherCollege))
      .rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(state.scope).toBe(0);
    expect(state.transactionCalls).toBe(0);
  });
  it("PROJ-BREAK-readiness-75 role revoked after request context capture cannot read even an empty list",async()=>{
    state.revoked=true;state.rows=[];
    await expect(listCollegeActiveReadinessOverrides(admin(),collegeId))
      .rejects.toThrow("Permission revoked");
    expect(state.liveChecks).toBe(1);
    expect(state.reads).toBe(0);
  });
  it("PROJ-BREAK-readiness-76 current overrides are emitted only from locked, non-archived workspace rows",async()=>{
    const results=await listCollegeActiveReadinessOverrides(admin(),collegeId);
    expect(results).toMatchObject([{
      projectId,workspace:"Dharwad team",direction:"Ready",
      note:"Approved exception",by:"College Admin",
    }]);
    expect(state.transactionCalls).toBe(1);
    expect(state.liveChecks).toBe(1);
    expect(state.reads).toBe(2);
    expect(state.lock).toBe("share");
  });
  it("PROJ-BREAK-readiness-77 archived or removed projects cannot retain a stale readiness indicator",async()=>{
    state.projectRows=[];
    expect(await listCollegeActiveReadinessOverrides(admin(),collegeId)).toEqual([]);
    expect(state.lock).toBe("share");
    state.reads=0;state.rows=[];
    expect(await listCollegeActiveReadinessOverrides(admin(),collegeId)).toEqual([]);
    expect(state.reads).toBe(1);
  });
});
