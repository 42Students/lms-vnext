import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import CollegeProjectsPage from "@/app/(authenticated)/college/projects/page";

const state=vi.hoisted(()=>({
  selected:true,failWorkspaces:false,failTemplates:false,
  workspaceReads:0,templateReads:0,receivedQuery:null as unknown,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
    membership:state.selected?{id:"membership",collegeId:"11111111-1111-4111-8111-111111111111",
      organizationId:"organization",status:"ACTIVE",roles:["COLLEGE_ADMIN"]}:null,
    adminScope:null,
  }),
}));
vi.mock("@/modules/projects/admin-insights-service",()=>({
  listProjectAdminSnapshots:async(_context:unknown,_collegeId:unknown,query:unknown)=>{
    state.workspaceReads++;state.receivedQuery=query;
    if(state.failWorkspaces)throw Error("PRIVATE_PROJECT_DATABASE_CREDENTIAL");
    return {items:[],total:0,page:1,pageSize:25,totalPages:1};
  },
}));
vi.mock("@/modules/projects/template-service",()=>({
  listAssignedProjectTemplates:async()=>{
    state.templateReads++;
    if(state.failTemplates)throw Error("PRIVATE_TEMPLATE_SERVICE_CREDENTIAL");
    return [];
  },
}));
function visible(node:unknown):string[]{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href"].flatMap(key=>visible(props[key]));
}
const render=(query:Record<string,string|string[]|undefined>={})=>
  CollegeProjectsPage({searchParams:Promise.resolve(query)});
beforeEach(()=>{
  state.selected=true;state.failWorkspaces=false;state.failTemplates=false;
  state.workspaceReads=0;state.templateReads=0;state.receivedQuery=null;
});
describe("IIT Dharwad College Admin Projects: independent outage and view contracts",()=>{
  it("PROJ-BREAK-college-resilience-23 primary read outage shows a filter-preserving retry without leaking DB internals",async()=>{
    state.failWorkspaces=true;
    const content=visible(await render({q:"IIT Dharwad",status:"ACTIVE",page:"2",pageSize:"50",view:"cards"})).join(" ");
    expect(content).toContain("Project workspaces unavailable");
    expect(content).toContain("Retry loading workspaces");
    expect(content).toContain("q=IIT+Dharwad");
    expect(content).toContain("status=ACTIVE");
    expect(content).toContain("page=2");
    expect(content).toContain("pageSize=50");
    expect(content).toContain("view=cards");
    expect(content).not.toContain("PRIVATE_PROJECT_DATABASE_CREDENTIAL");
    expect(content).not.toContain("No projects match");
    expect(state.workspaceReads).toBe(1);
  });

  it("PROJ-BREAK-college-resilience-24 optional template outage leaves workspace read available",async()=>{
    state.failTemplates=true;
    const content=visible(await render()).join(" ");
    expect(content).not.toContain("Project workspaces unavailable");
    expect(content).not.toContain("PRIVATE_TEMPLATE_SERVICE_CREDENTIAL");
    expect(state.workspaceReads).toBe(1);
    expect(state.templateReads).toBe(1);
  });

  it("PROJ-BREAK-college-idor-25 no college membership avoids every private DB query",async()=>{
    state.selected=false;
    const content=visible(await render()).join(" ");
    expect(content).toContain("Select a college to continue.");
    expect(state.workspaceReads).toBe(0);
    expect(state.templateReads).toBe(0);
  });

  it("PROJ-BREAK-college-ux-26 strict backend query excludes cards/table view but keeps valid filters",async()=>{
    const content=visible(await render({view:"table",q:"alpha",status:"ACTIVE",page:"2",pageSize:"25"})).join(" ");
    expect(content).not.toContain("Project workspaces unavailable");
    expect(state.receivedQuery).toEqual({q:"alpha",status:"ACTIVE",page:2,pageSize:25});
    expect(state.workspaceReads).toBe(1);
  });
});
