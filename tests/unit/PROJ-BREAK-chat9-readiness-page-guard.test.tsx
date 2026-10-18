import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {ProjectWorkspaceReadiness} from "@/components/projects/project-workspace-readiness";

const state=vi.hoisted(()=>({
  contextReads:0,accessChecks:0,readinessReads:0,
  deny:false,outage:false,badDate:false,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{
    state.contextReads++;
    return {user:{id:"actor",identityUid:"scope",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
      membership:null,adminScope:{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}};
  },
}));
vi.mock("@/modules/projects/access",()=>({
  requireProjectManageAccess:async()=>{
    state.accessChecks++;
    if(state.deny)throw Error("OTHER_TENANT_PRIVATE_NAME");
    return {collegeId:"11111111-1111-4111-8111-111111111111"};
  },
}));
vi.mock("@/modules/projects/readiness-service",()=>({
  getProjectReadiness:async()=>{
    state.readinessReads++;
    if(state.outage)throw Error("PRIVATE_READINESS_SQL_CREDENTIAL");
    return {
      execution:{complete:false,tasks:{done:0,total:1},sprints:{completed:0,total:1},releases:{shipped:0,total:1}},
      readinessOverride:{state:null,note:null,overriddenBy:null,
        occurredAt:state.badDate?new Date(Number.NaN):new Date("2026-10-17T20:00:00.000Z")},
      finalSubmission:{latest:null,canSubmitDraft:false},
    };
  },
}));
function visible(node:unknown):string[]{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href","eyebrow"].flatMap(key=>visible(props[key]));
}
const projectId="22222222-2222-4222-8222-222222222222";
const render=(id=projectId)=>ProjectWorkspaceReadiness({projectId:id,basePath:"/admin/projects"});
beforeEach(()=>{
  state.contextReads=0;state.accessChecks=0;state.readinessReads=0;
  state.deny=false;state.outage=false;state.badDate=false;
});
describe("IIT Dharwad Projects: readiness deep-link, denied and partial-data states",()=>{
  it("PROJ-BREAK-readiness-67 invalid UUID cannot trigger authorization or a project read",async()=>{
    const page=visible(await render("../../another-tenant")).join(" ");
    expect(page).toContain("Workspace readiness unavailable");
    expect(page).toContain("Back to workspaces");
    expect(state.contextReads).toBe(0);
    expect(state.accessChecks).toBe(0);
    expect(state.readinessReads).toBe(0);
  });
  it("PROJ-BREAK-readiness-68 revoked/foreign actor never sees readiness content",async()=>{
    state.deny=true;
    const page=visible(await render()).join(" ");
    expect(page).toContain("Workspace readiness unavailable");
    expect(page).not.toContain("OTHER_TENANT_PRIVATE_NAME");
    expect(state.readinessReads).toBe(0);
  });
  it("PROJ-BREAK-readiness-69 a service outage shows an actionable safe state without data leakage",async()=>{
    state.outage=true;
    const page=visible(await render()).join(" ");
    expect(page).toContain("Back to workspaces");
    expect(page).not.toContain("PRIVATE_READINESS_SQL_CREDENTIAL");
    expect(state.readinessReads).toBe(1);
  });
  it("PROJ-BREAK-readiness-70 valid role renders legacy readiness and safely handles a bad stored date",async()=>{
    state.badDate=true;
    const page=visible(await render()).join(" ");
    expect(page).toContain("Current readiness");
    expect(page).toContain("Date unavailable");
    expect(page).toContain("Not ready");
    expect(page).not.toContain("Workspace readiness unavailable");
    expect(state.readinessReads).toBe(1);
  });
});
