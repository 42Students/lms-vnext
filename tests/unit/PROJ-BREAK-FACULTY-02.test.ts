import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess,requireProjectLifecycleMutationAccess}
  from "@/modules/projects/access";

const projectId="11111111-1111-4111-8111-111111111111";
const ownCollege="22222222-2222-4222-8222-222222222222";
const otherCollege="33333333-3333-4333-8333-333333333333";
const org="44444444-4444-4444-8444-444444444444";
const memberId="55555555-5555-4555-8555-555555555555";
const userId="66666666-6666-4666-8666-666666666666";
const store=vi.hoisted(()=>({
  reads:0,
  project:{id:"11111111-1111-4111-8111-111111111111",
    collegeId:"22222222-2222-4222-8222-222222222222",status:"ACTIVE"},
  member:{id:"77777777-7777-4777-8777-777777777777",
    role:"MENTOR",roleKind:"MENTOR",canMutate:true,isPrimary:true},
  moduleEnabled:true,
}));

vi.mock("@/db/client",()=>({
  getDb:()=>({
    select:()=>({
      from(){
        const step=++store.reads;
        const chain={
          innerJoin(){return chain;},
          where(){return chain;},
          limit:async()=>step===1?[store.project]:[store.member],
        };
        return chain;
      },
    }),
  }),
}));
vi.mock("@/modules/projects/scope",()=>({
  loadProjectCollegeScope:async(collegeId:string)=>({id:collegeId,organizationId:org}),
}));
vi.mock("@/modules/module-access/service",()=>({
  resolveOptionalModuleAccess:async()=>({projects:{enabled:store.moduleEnabled}}),
}));

function faculty(roles:string[]=[
  "FACULTY","MENTOR",
]):RequestContext {
  return {
    user:{id:userId,identityUid:"faculty-account",platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:memberId,collegeId:ownCollege,organizationId:org,
      status:"ACTIVE",roles:roles as NonNullable<RequestContext["membership"]>["roles"]},
  };
}
describe("PROJ-BREAK-FACULTY-02 assigned faculty: access and stale-session breaker",()=>{
  beforeEach(()=>{
    store.reads=0;
    store.project={id:projectId,collegeId:ownCollege,status:"ACTIVE"};
    store.member={id:"77777777-7777-4777-8777-777777777777",
      role:"MENTOR",roleKind:"MENTOR",canMutate:true,isPrimary:true};
    store.moduleEnabled=true;
  });

  it("PROJ-BREAK-FACULTY-02-01 Faculty-only display role cannot become a project Mentor",async()=>{
    await expect(requireProjectReadAccess(faculty(["FACULTY"]),projectId))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    expect(store.reads).toBe(0); // A Faculty-only actor is rejected before any object lookup.
  });

  it("PROJ-BREAK-FACULTY-02-02 persisted Mentor grant with matching role and active college can edit",async()=>{
    const scope=await requireProjectLifecycleMutationAccess(faculty(),projectId);
    expect(scope.access).toBe("MENTOR");
    expect(scope.collegeId).toBe(ownCollege);
    expect(scope.member?.id).toBe(store.member.id);
  });

  it("PROJ-BREAK-FACULTY-02-03 wrong college is denied before querying project membership",async()=>{
    const context=faculty();
    context.membership={...context.membership!,collegeId:otherCollege};
    await expect(requireProjectReadAccess(context,projectId))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    expect(store.reads).toBe(1);
  });

  it("PROJ-BREAK-FACULTY-02-04 suspended/removed or expired principal cannot reuse stale project URL",async()=>{
    for(const status of ["SUSPENDED","ENDED"] as const){
      const context=faculty();
      context.membership={...context.membership!,status};
      store.reads=0;
      await expect(requireProjectReadAccess(context,projectId))
        .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
      expect(store.reads).toBe(0); // Revoked memberships cannot probe project existence.
    }
    const expired=faculty();
    expired.user={...expired.user,platformStatus:"DISABLED"};
    store.reads=0;
    await expect(requireProjectReadAccess(expired,projectId))
      .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
    expect(store.reads).toBe(0); // Expired principals are denied before scope loading.
  });

  it("PROJ-BREAK-FACULTY-02-05 reviewer and read-only Mentor never acquire mutation via display role",async()=>{
    for(const roleKind of ["REVIEWER","OBSERVER","MENTOR"] as const){
      store.reads=0;
      store.member={...store.member,roleKind,canMutate:false};
      const scope=await requireProjectReadAccess(faculty(),projectId);
      expect(scope.access).toBe("OBSERVER");
      store.reads=0;
      await expect(requireProjectLifecycleMutationAccess(faculty(),projectId))
        .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
    }
  });

  it("PROJ-BREAK-FACULTY-02-06 disabled college Projects flag blocks mutation after role verification",async()=>{
    store.moduleEnabled=false;
    await expect(requireProjectLifecycleMutationAccess(faculty(),projectId))
      .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  });

  it("PROJ-BREAK-FACULTY-02-07 malformed ID rejected before any datastore access",async()=>{
    await expect(requireProjectReadAccess(faculty(),"not-a-uuid")).rejects.toThrow();
    expect(store.reads).toBe(0);
  });
});
