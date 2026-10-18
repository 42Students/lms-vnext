import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminTenantSetup from "@/app/(authenticated)/admin/tenants/setup/page";

const state=vi.hoisted(()=>({
  scoped:false,allowed:true,failAt:"",
  orgReads:0,directoryReads:0,collegeReads:0,readinessReads:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"platform-admin",identityUid:"admin",platformStatus:"ACTIVE",
      systemRoles:["SUPER_ADMIN"]},membership:null,
    adminScope:state.scoped?{
      collegeId:"11111111-1111-4111-8111-111111111111",
      organizationId:"22222222-2222-4222-8222-222222222222",
    }:null,
  }),
}));
vi.mock("@/modules/permissions/policy",()=>({
  requirePermission:()=>{
    if(!state.allowed)throw Error("Missing permission: admin-scope.select");
  },
  can:()=>state.allowed,
}));
vi.mock("@/modules/organizations/service",()=>({
  listOrganizations:async()=>{
    state.orgReads+=1;
    if(state.failAt==="organizations")throw Error("SECRET_ORGANIZATIONS_ERROR");
    return [{id:"22222222-2222-4222-8222-222222222222",name:"Organization"}];
  },
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
  getSuperAdminTenantLifecycleDirectory:async()=>{
    state.directoryReads+=1;
    if(state.failAt==="directory")throw Error("SECRET_COLLEGES_ERROR");
    return {items:[]};
  },
  getSuperAdminTenantLifecycleDetail:async()=>{
    state.collegeReads+=1;
    if(state.failAt==="college")throw Error("SECRET_COLLEGE_ERROR");
    return {
      id:"11111111-1111-4111-8111-111111111111",
      organizationId:"22222222-2222-4222-8222-222222222222",
      name:"IIT Dharwad",
    };
  },
}));
vi.mock("@/modules/colleges/readiness-service",()=>({
  getSuperAdminCollegeReadiness:async()=>{
    state.readinessReads+=1;
    if(state.failAt==="readiness")throw Error("SECRET_READINESS_ERROR");
    return {evaluation:null};
  },
}));
vi.mock("@/components/admin/college-create-form",()=>({
  CollegeCreateForm:function CollegeCreateForm(){return null;},
}));
vi.mock("@/components/admin/organization-create-form",()=>({
  OrganizationCreateForm:function OrganizationCreateForm(){return null;},
}));
function walk(node:unknown):unknown[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(Array.isArray(node))return node.flatMap(walk);
  if(!isValidElement(node))return [node];
  const props=node.props as Record<string,unknown>;
  return [node,...["children","title","description","href","action"].flatMap(k=>walk(props[k]))];
}
const content=(elements:unknown[])=>elements.filter(x=>typeof x==="string").join(" ");
const render=(tab:string)=>SuperAdminTenantSetup({
  searchParams:Promise.resolve({tab}),
});
beforeEach(()=>{
  state.scoped=false;state.allowed=true;state.failAt="";
  state.orgReads=0;state.directoryReads=0;state.collegeReads=0;state.readinessReads=0;
});
describe("Super Admin Tenant Setup: unauthorized and incomplete readiness must fail closed",()=>{
  it("SA-tenants-setup-12 org read outage does not leave creation controls active",async()=>{
    state.failAt="organizations";
    const nodes=walk(await render("STRUCTURE"));
    expect(content(nodes)).toContain("Tenant setup unavailable");
    expect(content(nodes)).toContain("Retry tenant setup");
    expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
      x.type.name==="CollegeCreateForm")).toBe(false);
    expect(state.orgReads).toBe(1);
    expect(state.directoryReads).toBe(0);
  });
  it("SA-tenants-setup-13 failed college directory must not claim no colleges exist",async()=>{
    state.failAt="directory";
    const copy=content(walk(await render("STRUCTURE")));
    expect(copy).toContain("Tenant setup unavailable");
    expect(copy).not.toContain("No colleges in the current scope.");
    expect(copy).not.toContain("SECRET_COLLEGES_ERROR");
    expect(state.directoryReads).toBe(1);
  });
  it("SA-tenants-setup-14 incomplete selected-college readiness cannot show launch actions",async()=>{
    state.scoped=true;state.failAt="readiness";
    const copy=content(walk(await render("LAUNCH")));
    expect(copy).toContain("Tenant setup unavailable");
    expect(copy).not.toContain("Launch checklist");
    expect(copy).not.toContain("SECRET_READINESS_ERROR");
    expect(state.collegeReads).toBe(1);
    expect(state.readinessReads).toBe(1);
  });
  it("SA-tenants-setup-15 absent selected college never fetches readiness or guesses a tenant",async()=>{
    const copy=content(walk(await render("LAUNCH")));
    expect(copy).toContain("No college selected");
    expect(state.collegeReads).toBe(0);
    expect(state.readinessReads).toBe(0);
  });
  it("SA-tenants-setup-16 failed authority blocks both workflows before DB reads",async()=>{
    state.allowed=false;
    await expect(render("STRUCTURE")).rejects.toThrow("Missing permission: admin-scope.select");
    expect(state.orgReads+state.directoryReads+state.collegeReads+state.readinessReads).toBe(0);
  });
});
