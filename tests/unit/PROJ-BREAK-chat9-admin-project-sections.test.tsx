import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {AdminProjectSectionPage} from "@/components/projects/admin-project-section-page";

const projectId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({authorized:true,accessCalls:0,viewCalls:0}));
vi.mock("next/navigation",()=>({
  notFound:()=>{throw new Error("NEXT_NOT_FOUND");},
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"platform",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
    membership:null,adminScope:{collegeId:"college"},
  }),
}));
vi.mock("@/modules/projects/access",()=>({
  requireProjectManageAccess:async()=>{
    state.accessCalls+=1;
    if(!state.authorized)throw new Error("Missing permission: projects.manage");
    return {project:{id:projectId},collegeId:"college",organizationId:"org"};
  },
}));
vi.mock("@/modules/projects/workspace-view-service",()=>({
  getProjectWorkspaceView:async()=>{
    state.viewCalls+=1;
    return {project:{id:projectId,title:"IIT Dharwad"}};
  },
}));
vi.mock("@/components/projects/project-workspace",()=>({
  PROJECT_WORKSPACE_SECTIONS:[
    "summary","overview","team","sprints","tasks","resources",
    "meetings","readiness","delivery","audit",
  ],
  ProjectWorkspace:()=>null,
}));
const props=(element:unknown)=>isValidElement(element)
  ?element.props as Record<string,unknown>:{};

beforeEach(()=>{state.authorized=true;state.accessCalls=0;state.viewCalls=0;});
describe("Super Admin last-third Project detail role and route guard",()=>{
  it("PROJ-BREAK-ux-38 unknown and encoded sections are denied without database reads",async()=>{
    for(const section of ["", "secret", "../audit", "SUMMARY", "%2E%2E", "tenant-settings"]){
      await expect(AdminProjectSectionPage({
        projectId,section,basePath:"/admin/projects",
      })).rejects.toThrow("NEXT_NOT_FOUND");
    }
    expect(state.accessCalls).toBe(0);
    expect(state.viewCalls).toBe(0);
  });
  it("PROJ-BREAK-idor-55 unauthorized Super Admin scope fails before workspace view read",async()=>{
    state.authorized=false;
    await expect(AdminProjectSectionPage({
      projectId,section:"summary",basePath:"/admin/projects",
    })).rejects.toThrow("Missing permission: projects.manage");
    expect(state.accessCalls).toBe(1);
    expect(state.viewCalls).toBe(0);
  });
  it("PROJ-BREAK-ux-39 whitelisted at-risk and submission referrals preserve navigation safely",async()=>{
    const atRisk=props(await AdminProjectSectionPage({
      projectId,section:"delivery",basePath:"/admin/projects",
      from:"at-risk",reason:"blocker",
    }));
    expect(atRisk).toMatchObject({
      mode:"ADMIN",backHref:"/admin/projects/at-risk",
      backLabel:"Back to at-risk projects",riskReason:"BLOCKER",
      sectionQuerySuffix:"?from=at-risk&reason=BLOCKER",activeSection:"delivery",
    });
    const bad=props(await AdminProjectSectionPage({
      projectId,section:"summary",basePath:"/admin/projects",
      from:"https://evil.example",reason:"<img src=x>",
    }));
    expect(bad).toMatchObject({
      backHref:"/admin/projects",backLabel:"Projects",
      riskReason:null,sectionQuerySuffix:"",activeSection:"summary",
    });
    expect(state.viewCalls).toBe(2);
  });
});
