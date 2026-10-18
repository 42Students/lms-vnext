import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminProjectsPage from "@/app/(authenticated)/admin/projects/page";

const state=vi.hoisted(()=>({
  selected:true,disabled:false,nonAdmin:false,failList:false,failTemplates:false,listReads:0,templateReads:0,
}));

vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"platform",platformStatus:state.disabled?"DISABLED":"ACTIVE",systemRoles:state.nonAdmin?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/projects/admin-insights-service",()=>({
  listProjectAdminSnapshots:async()=>{
    state.listReads++;
    if(state.failList)throw Error("INTERNAL_DATABASE_CREDENTIAL_NEVER_SHOW");
    return {items:[],total:0,page:1,pageSize:20,totalPages:1};
  },
}));
vi.mock("@/modules/projects/template-service",()=>({
  listAssignedProjectTemplates:async()=>{
    state.templateReads++;
    if(state.failTemplates)throw Error("INTERNAL_TEMPLATE_STORAGE_CREDENTIAL_NEVER_SHOW");
    return [];
  },
}));
function visibleProps(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visibleProps);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href","eyebrow"].flatMap(key=>visibleProps(props[key]));
}
function render(searchParams:Record<string,string|string[]|undefined>={}){
  return SuperAdminProjectsPage({searchParams:Promise.resolve(searchParams)});
}
beforeEach(()=>{
  state.selected=true;state.disabled=false;state.nonAdmin=false;state.failList=false;state.failTemplates=false;
  state.listReads=0;state.templateReads=0;
});

describe("IIT Dharwad Super Admin Projects workspace page privacy and failure recovery",()=>{
  it("PROJ-BREAK-admin-resilience-24 DB outage returns a friendly retry with exact validated filters",async()=>{
    state.failList=true;
    const content=visibleProps(await render({
      search:"IIT Dharwad",status:"ACTIVE",page:"2",pageSize:"20",view:"cards",
    })).join(" ");
    expect(content).toContain("Project workspaces unavailable");
    expect(content).toContain("Your search and filters were not changed.");
    expect(content).toContain("Retry loading workspaces");
    expect(content).toContain("search=IIT+Dharwad");
    expect(content).toContain("status=ACTIVE");
    expect(content).toContain("page=2");
    expect(content).not.toContain("INTERNAL_DATABASE_CREDENTIAL_NEVER_SHOW");
    expect(content).not.toContain("No Projects match these filters");
    expect(state.listReads).toBe(1);
  });
  it("PROJ-BREAK-admin-resilience-25 optional template outage does not masquerade as a workspace outage",async()=>{
    state.failTemplates=true;
    const content=visibleProps(await render()).join(" ");
    expect(content).toContain("Project templates are temporarily unavailable");
    expect(content).toContain("Your workspaces are still visible");
    expect(content).not.toContain("Project workspaces unavailable");
    expect(content).not.toContain("INTERNAL_TEMPLATE_STORAGE_CREDENTIAL_NEVER_SHOW");
    expect(state.listReads).toBe(1);
    expect(state.templateReads).toBe(1);
  });
  it("PROJ-BREAK-admin-idor-26 missing selected college denies both data reads",async()=>{
    state.selected=false;
    const content=visibleProps(await render()).join(" ");
    expect(content).toContain("No college selected");
    expect(content).toContain("Pick a college in the header");
    expect(state.listReads).toBe(0);
    expect(state.templateReads).toBe(0);
  });
  it("PROJ-BREAK-admin-idor-28 disabled and non-platform actors never reach any project read",async()=>{
    for(const role of ["DISABLED","NOT_SUPER_ADMIN"]){
      state.disabled=role==="DISABLED";
      state.nonAdmin=role==="NOT_SUPER_ADMIN";
      const content=visibleProps(await render()).join(" ");
      expect(content).toContain("Project access denied");
      expect(content).toContain("Back to dashboard");
      expect(content).not.toContain("No Projects match these filters");
    }
    expect(state.listReads).toBe(0);
    expect(state.templateReads).toBe(0);
  });
  it("PROJ-BREAK-admin-input-27 duplicate, non-decimal and unknown query values fail before SQL",async()=>{
    for(const query of [
      {page:"0x10"},{page:"1e4"},{page:["1","2"]},
      {q:"safe",search:"conflicting"},{unexpected:"tenant"},
    ]){
      const content=visibleProps(await render(query)).join(" ");
      expect(content).toContain("Invalid project filters");
      expect(content).toContain("Clear filters");
    }
    expect(state.listReads).toBe(0);
    expect(state.templateReads).toBe(0);
  });
});
