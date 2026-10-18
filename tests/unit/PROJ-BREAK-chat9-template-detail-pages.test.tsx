import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import TemplateDetail from "@/app/(authenticated)/admin/projects/templates/[templateId]/page";
import TemplateVersionComparison from "@/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page";

const templateId="11111111-1111-4111-8111-111111111111";
const versionId="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({
  read:true,manage:false,fail:false,missing:false,detailCalls:0,versionCalls:0,
}));
vi.mock("next/navigation",()=>({notFound:()=>{throw Error("NEXT_NOT_FOUND");}}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"administrator",identityUid:"admin",platformStatus:"ACTIVE",
      systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({
  can:(_ctx:unknown,permission:string)=>permission==="project-template.read"
    ?state.read:state.manage,
}));
vi.mock("@/modules/projects/template-service",()=>({
  getProjectTemplateDetail:async()=>{
    state.detailCalls+=1;
    if(state.fail)throw Error("SECRET_DB_CONNECTION");
    if(state.missing)throw {code:"PROJECT_TEMPLATE_NOT_FOUND"};
    return {
      template:{id:templateId,title:"IIT Dharwad Template",summary:"Project",status:"PUBLISHED",
        currentVersion:1,publishedVersion:1,updatedAt:new Date()},
      currentVersion:null,versions:[],assignments:[],
    };
  },
}));
vi.mock("@/modules/projects/template-version-comparison-service",()=>({
  getSuperAdminTemplateVersionComparison:async()=>{
    state.versionCalls+=1;
    if(state.fail)throw Error("SECRET_TEMPLATE_HISTORY_DB");
    if(state.missing)throw {code:"PROJECT_TEMPLATE_VERSION_NOT_FOUND"};
    return {
      template:{id:templateId,title:"IIT Dharwad Template",status:"PUBLISHED",
        currentVersion:2},
      current:{id:templateId,version:2,blueprint:{}},
      selected:{id:versionId,version:1,title:"Version one",summary:null,
        blueprint:{overview:{deliverables:[]},releases:[],sprints:[],tasks:[],resources:[]}},
      changes:[],
    };
  },
}));
const detail=()=>TemplateDetail({params:Promise.resolve({templateId})});
const history=()=>TemplateVersionComparison({params:Promise.resolve({templateId,versionId})});
function textTree(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(textTree);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href"].flatMap(k=>textTree(props[k]));
}
beforeEach(()=>{
  state.read=true;state.manage=false;state.fail=false;state.missing=false;
  state.detailCalls=0;state.versionCalls=0;
});
describe("Super Admin last-third global template detail and version history security",()=>{
  it("PROJ-BREAK-ux-40 denied read returns no template or version payload",async()=>{
    state.read=false;
    const d=textTree(await detail()).join(" ");
    const v=textTree(await history()).join(" ");
    expect(d).toContain("Project template access denied");
    expect(v).toContain("Template history access denied");
    expect(state.detailCalls).toBe(0);
    expect(state.versionCalls).toBe(0);
  });
  it("PROJ-BREAK-ux-41 DB outage is not mistaken for absent template/version and never leaks exception content",async()=>{
    state.fail=true;
    const d=textTree(await detail()).join(" ");
    const v=textTree(await history()).join(" ");
    expect(d).toContain("Project template unavailable");
    expect(d).toContain("Retry template details");
    expect(v).toContain("Template history unavailable");
    expect(v).toContain("Back to version history");
    expect(d+v).not.toContain("SECRET_DB_CONNECTION");
    expect(d+v).not.toContain("SECRET_TEMPLATE_HISTORY_DB");
    expect(state.detailCalls).toBe(1);
    expect(state.versionCalls).toBe(1);
  });
  it("PROJ-BREAK-ux-42 forged template/version identifiers 404 without calling services",async()=>{
    await expect(TemplateDetail({params:Promise.resolve({templateId:"../bad"})}))
      .rejects.toThrow("NEXT_NOT_FOUND");
    await expect(TemplateVersionComparison({
      params:Promise.resolve({templateId,versionId:"bad"}),
    })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(state.detailCalls).toBe(0);
    expect(state.versionCalls).toBe(0);
  });
  it("PROJ-BREAK-ux-43 permitted read can render details without a global mutation grant",async()=>{
    expect(isValidElement(await detail())).toBe(true);
    expect(isValidElement(await history())).toBe(true);
    expect(state.detailCalls).toBe(1);
    expect(state.versionCalls).toBe(1);
  });
});
