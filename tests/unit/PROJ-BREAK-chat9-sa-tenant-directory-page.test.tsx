import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import TenantDirectory from "@/app/(authenticated)/admin/tenants/directory/page";

const state=vi.hoisted(()=>({calls:0,fail:false,authorized:true}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"admin",identityUid:"super-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
    membership:null,adminScope:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({
  can:()=>state.authorized,
  requirePermission:()=>{
    if(!state.authorized)throw Error("Missing permission: admin-scope.select");
  },
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
  getSuperAdminTenantLifecycleDirectory:async(_ctx:unknown,query:Record<string,unknown>)=>{
    state.calls+=1;
    if(state.fail)throw Error("DATABASE_INTERNAL_SECRET");
    return {query,items:[],organizations:[],total:0,totalPages:1};
  },
}));
function treeText(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(treeText);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","actions","label","empty","href"].flatMap(k=>treeText(props[k]));
}
function render(q:Record<string,string|string[]|undefined>={}){
  return TenantDirectory({searchParams:Promise.resolve(q)});
}
beforeEach(()=>{state.calls=0;state.fail=false;state.authorized=true;});
describe("Super Admin last-third tenants directory: failures, denial and invalid GET",()=>{
  it("SA-tenants-ux-09 DB outage preserves validated filter and reveals no tenant records",async()=>{
    state.fail=true;
    const view=treeText(await render({q:"IIT Dharwad",status:"ALL",page:"2"})).join(" ");
    expect(view).toContain("Tenant directory unavailable");
    expect(view).toContain("Retry tenant directory");
    expect(view).toContain("q=IIT+Dharwad");
    expect(view).toContain("status=ALL");
    expect(view).toContain("page=2");
    expect(view).not.toContain("No matching tenants");
    expect(view).not.toContain("DATABASE_INTERNAL_SECRET");
    expect(state.calls).toBe(1);
  });
  it("SA-tenants-ux-10 malicious status, repeated page and oversized search never enter the service",async()=>{
    for(const query of [
      {status:"OTHER_TENANT"},{page:"1001"},
      {page:["1","2"]},{q:"x".repeat(101)},{evil:"injected"},
    ]){
      const view=treeText(await render(query)).join(" ");
      expect(view).toContain("Invalid tenant filters");
      expect(view).toContain("Clear filters");
    }
    expect(state.calls).toBe(0);
  });
  it("SA-tenants-idor-58 disabled Super Admin is denied before tenant PII read",async()=>{
    state.authorized=false;
    const view=treeText(await render()).join(" ");
    expect(view).toContain("Tenant directory access denied");
    expect(view).toContain("Back to dashboard");
    expect(view).not.toContain("No matching tenants");
    expect(state.calls).toBe(0);
  });
  it("SA-tenants-ux-11 genuine zero matches are distinct from an unavailable directory",async()=>{
    const view=treeText(await render()).join(" ");
    expect(view).toContain("No matching tenants");
    expect(view).not.toContain("Tenant directory unavailable");
    expect(state.calls).toBe(1);
  });
});
