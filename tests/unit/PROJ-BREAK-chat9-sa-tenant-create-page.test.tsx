import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminTenantCreateStage from "@/app/(authenticated)/admin/tenants/create/page";

const allowedOrg="11111111-1111-4111-8111-111111111111";
const blockedOrg="22222222-2222-4222-8222-222222222222";
const state=vi.hoisted(()=>({allowed:true,fail:false,calls:0}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"platform-admin",identityUid:"platform",platformStatus:"ACTIVE",
      systemRoles:["SUPER_ADMIN"]},membership:null,adminScope:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({
  requirePermission:()=>{
    if(!state.allowed)throw Error("Missing permission: admin-scope.select");
  },
  can:(_context:unknown,action:string,resource?:{organizationId?:string})=>{
    if(action==="organization.manage")return state.allowed;
    if(action==="college.manage")return state.allowed&&resource?.organizationId==="11111111-1111-4111-8111-111111111111";
    return false;
  },
}));
vi.mock("@/modules/organizations/service",()=>({
  listOrganizations:async()=>{
    state.calls+=1;
    if(state.fail)throw Error("INTERNAL_ORGANIZATION_DB_ERROR");
    return [
      {id:"11111111-1111-4111-8111-111111111111",name:"Authorized college group"},
      {id:"22222222-2222-4222-8222-222222222222",name:"Forbidden college group"},
    ];
  },
}));
vi.mock("@/components/admin/college-create-form",()=>({
  CollegeCreateForm:function CollegeCreateForm(){return null;},
}));
vi.mock("@/components/admin/organization-create-form",()=>({
  OrganizationCreateForm:function OrganizationCreateForm(){return null;},
}));
function collect(node:unknown):unknown[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(Array.isArray(node))return node.flatMap(collect);
  if(!isValidElement(node))return [node];
  const props=node.props as Record<string,unknown>;
  return [node,...["children","action","title","description","href"].flatMap(k=>collect(props[k]))];
}
const render=(params:Record<string,string|string[]|undefined>={})=>
  SuperAdminTenantCreateStage({searchParams:Promise.resolve(params)});
const text=(items:unknown[])=>items.filter(x=>typeof x==="string").join(" ");
beforeEach(()=>{state.allowed=true;state.fail=false;state.calls=0;});
describe("Super Admin last-third tenant creation role and selected-organization boundaries",()=>{
  it("SA-tenants-create-08 failed organization lookup never exposes the college creation form",async()=>{
    state.fail=true;
    const nodes=collect(await render());
    const copy=text(nodes);
    expect(copy).toContain("Organization directory unavailable");
    expect(copy).toContain("Retry organization directory");
    expect(copy).not.toContain("INTERNAL_ORGANIZATION_DB_ERROR");
    expect(nodes.some(n=>isValidElement(n)&&typeof n.type==="function"&&n.type.name==="CollegeCreateForm")).toBe(false);
    expect(state.calls).toBe(1);
  });
  it("SA-tenants-create-09 disabled Super Admin cannot read organization list",async()=>{
    state.allowed=false;
    await expect(render()).rejects.toThrow("Missing permission: admin-scope.select");
    expect(state.calls).toBe(0);
  });
  it("SA-tenants-create-10 poisoned preferred organization may not select a cross-tenant destination",async()=>{
    const nodes=collect(await render({organizationId:blockedOrg}));
    const form=nodes.find(n=>isValidElement(n)&&typeof n.type==="function"&&n.type.name==="CollegeCreateForm");
    expect(isValidElement(form)).toBe(true);
    const props=(form as {props:{preferredOrganizationId?:string;organizations:{id:string}[]}}).props;
    expect(props.preferredOrganizationId).toBeUndefined();
    expect(props.organizations.map(x=>x.id)).toEqual([allowedOrg]);
    expect(state.calls).toBe(1);
  });
  it("SA-tenants-create-11 authorized selection is retained while duplicate/invalid IDs are ignored",async()=>{
    const allowed=collect(await render({organizationId:allowedOrg}));
    const form=allowed.find(n=>isValidElement(n)&&typeof n.type==="function"&&n.type.name==="CollegeCreateForm");
    expect((form as {props:{preferredOrganizationId?:string}}).props.preferredOrganizationId).toBe(allowedOrg);
    const multi=collect(await render({organizationId:[allowedOrg,blockedOrg]}));
    const form2=multi.find(n=>isValidElement(n)&&typeof n.type==="function"&&n.type.name==="CollegeCreateForm");
    expect((form2 as {props:{preferredOrganizationId?:string}}).props.preferredOrganizationId).toBeUndefined();
    expect(state.calls).toBe(2);
  });
});
