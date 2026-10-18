import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import TemplateCollegeAvailabilityPage from "@/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page";

const templateId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({authorized:true,fail:false,calls:0}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"global-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
    membership:null,adminScope:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({
  can:()=>state.authorized,
}));
vi.mock("@/modules/projects/template-college-availability-service",()=>({
  listSuperAdminTemplateCollegeAvailability:async()=>{
    state.calls+=1;
    if(state.fail)throw new Error("SECRET_DATABASE_INTERNAL");
    return {
      template:{id:templateId,title:"IIT Dharwad",status:"PUBLISHED"},
      query:{q:"",status:"ALL",page:1},items:[],total:0,totalPages:1,
    };
  },
}));
function textTree(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(textTree);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","href","action","eyebrow"].flatMap(k=>textTree(props[k]));
}
function render(query:Record<string,string|string[]|undefined>={}){
  return TemplateCollegeAvailabilityPage({
    params:Promise.resolve({templateId}),searchParams:Promise.resolve(query),
  });
}
beforeEach(()=>{state.authorized=true;state.fail=false;state.calls=0;});
describe("Super Admin Projects template colleges: resilient, scoped and bounded page states",()=>{
  it("PROJ-BREAK-ux-34 denied actor never reads college membership assignments",async()=>{
    state.authorized=false;
    const tree=await render();
    expect(textTree(tree).join(" ")).toContain("College availability access denied");
    expect(state.calls).toBe(0);
  });
  it("PROJ-BREAK-ux-35 failed service read is not represented as zero matching colleges",async()=>{
    state.fail=true;
    const tree=await render({status:"ASSIGNED",q:"IIT Dharwad",page:"2"});
    const txt=textTree(tree).join(" ");
    expect(txt).toContain("College availability unavailable");
    expect(txt).toContain("Retry loading colleges");
    expect(txt).toContain("status=ASSIGNED");
    expect(txt).toContain("page=2");
    expect(txt).not.toContain("No matching colleges");
    expect(txt).not.toContain("SECRET_DATABASE_INTERNAL");
    expect(state.calls).toBe(1);
  });
  it("PROJ-BREAK-ux-36 invalid filter and repeated page values recover before reads",async()=>{
    for(const q of [{status:"UNKNOWN"},{page:"1001"},{page:["1","2"]},{q:"x".repeat(101)}]){
      const tree=await render(q);
      const txt=textTree(tree).join(" ");
      expect(txt).toContain("Invalid college filters");
      expect(txt).toContain("Clear filters");
    }
    expect(state.calls).toBe(0);
  });
  it("PROJ-BREAK-ux-37 authorized empty catalogue is distinct from a service error",async()=>{
    const tree=await render();
    expect(textTree(tree).join(" ")).toContain("No matching colleges");
    expect(state.calls).toBe(1);
  });
});
