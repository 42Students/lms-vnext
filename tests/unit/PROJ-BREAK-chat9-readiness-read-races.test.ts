import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeReadinessWorkspaceChoices,listCollegeReadinessReleases} from "@/modules/projects/college-readiness-releases-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const anotherCollege="22222222-2222-4222-8222-222222222222";
const projectId="33333333-3333-4333-8333-333333333333";
const state=vi.hoisted(()=>({
  scopeLoads:0,reads:0,liveChecks:0,locked:0,revoked:false,
  missingProject:false,conditions:[] as unknown[],
}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(id:string)=>{
    state.scopeLoads++;
    return {id,organizationId:"44444444-4444-4444-8444-444444444444"};
  },
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:async(_tx:unknown,ctx:RequestContext)=>{
    state.liveChecks++;
    if(state.revoked)throw Error("Missing permission: projects.manage");
    return ctx;
  },
}));
vi.mock("@/db/client",()=>({
  getDb:()=>{
    const select=(columns:Record<string,unknown>)=>{
      state.reads++;
      const key=Object.keys(columns);
      const rows=key.includes("points")?[{sprintId:"sprint",points:8}]
        :key.includes("releaseId")?[{id:"sprint",releaseId:"release",status:"COMPLETED"}]
        :key.includes("sequence")?[{id:"release",title:"Release",status:"PLANNED",sequence:0}]
        :key.includes("title")?[{id:projectId,title:"Workspace",status:"ACTIVE"}]
        :state.missingProject?[]:[{id:projectId}];
      const chain={
        from:()=>chain,
        where:(filter:unknown)=>{state.conditions.push(filter);return chain;},
        orderBy:()=>chain,
        for:(lock:string)=>{if(lock==="share")state.locked++;return chain;},
        groupBy:()=>chain,
        limit:()=>chain,
        then:(resolve:(rows:typeof rows)=>unknown)=>Promise.resolve(rows).then(resolve),
      };
      return chain;
    };
    return {select,transaction:<T>(fn:(tx:{select:typeof select})=>Promise<T>)=>fn({select})};
  },
}));

const admin=():RequestContext=>({
  user:{id:"55555555-5555-4555-8555-555555555555",
    identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
    collegeId,organizationId:"44444444-4444-4444-8444-444444444444",
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  adminScope:null,
});
const render=(fragment:unknown)=>new PgDialect().sqlToQuery(fragment as SQL);
beforeEach(()=>{
  state.scopeLoads=0;state.reads=0;state.liveChecks=0;state.locked=0;
  state.revoked=false;state.missingProject=false;state.conditions=[];
});
describe("IIT Dharwad Projects readiness: revoked roles and archive races",()=>{
  it("PROJ-BREAK-readiness-61 selected college choices exclude archived rows and are bounded",async()=>{
    const items=await listCollegeReadinessWorkspaceChoices(admin(),collegeId);
    expect(items).toHaveLength(1);
    expect(state.liveChecks).toBe(1);
    const sql=state.conditions.map(render).map(x=>x.sql).join(" ");
    const params=state.conditions.map(render).flatMap(x=>x.params);
    expect(sql).toContain('"project_instances"."college_id"');
    expect(sql).toContain('"project_instances"."status"');
    expect(params).toContain(collegeId);
    expect(params).toContain("ARCHIVED");
  });
  it("PROJ-BREAK-readiness-62 a live owned project is held through sprint and task totals",async()=>{
    const rows=await listCollegeReadinessReleases(admin(),collegeId,projectId);
    expect(rows).toMatchObject([{id:"release",sprintCount:1,completedSprints:1,points:8,targetDate:null}]);
    expect(state.liveChecks).toBe(1);
    expect(state.locked).toBe(1);
    expect(state.reads).toBe(4);
    expect(state.conditions.map(render).flatMap(q=>q.params)).toContain(projectId);
  });
  it("PROJ-BREAK-readiness-63 missing or archived project cannot expose its releases",async()=>{
    state.missingProject=true;
    const rows=await listCollegeReadinessReleases(admin(),collegeId,projectId);
    expect(rows).toEqual([]);
    expect(state.reads).toBe(1);
    expect(state.locked).toBe(1);
  });
  it("PROJ-BREAK-readiness-64 a revoked actor cannot query either list using stale request credentials",async()=>{
    state.revoked=true;
    await expect(listCollegeReadinessWorkspaceChoices(admin(),collegeId)).rejects.toThrow("Missing permission: projects.manage");
    await expect(listCollegeReadinessReleases(admin(),collegeId,projectId)).rejects.toThrow("Missing permission: projects.manage");
    expect(state.reads).toBe(0);
    expect(state.liveChecks).toBe(2);
  });
  it("PROJ-BREAK-readiness-65 wrong college and role are rejected before tenant existence lookup",async()=>{
    await expect(listCollegeReadinessWorkspaceChoices(admin(),anotherCollege)).rejects.toThrow("PROJECT_ACCESS_DENIED");
    await expect(listCollegeReadinessReleases(admin(),anotherCollege,projectId)).rejects.toThrow("PROJECT_ACCESS_DENIED");
    const learner=admin();
    learner.membership={...learner.membership!,roles:["LEARNER"]};
    await expect(listCollegeReadinessWorkspaceChoices(learner,collegeId)).rejects.toThrow("PROJECT_ACCESS_DENIED");
    expect(state.scopeLoads).toBe(0);
    expect(state.reads).toBe(0);
  });
});
