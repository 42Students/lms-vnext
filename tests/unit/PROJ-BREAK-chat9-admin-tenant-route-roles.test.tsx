import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import TenantDirectory from "@/app/(authenticated)/admin/tenants/page";
import SuperAdminTenantCreateStage from "@/app/(authenticated)/admin/tenants/create/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",
  directory:0,organizations:0,failDirectory:false,failOrganizations:false,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"platform",
      platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,adminScope:null,
  }),
}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",()=>({
  getSuperAdminTenantLifecycleDirectory:async(_context:unknown,query:unknown)=>{
    state.directory++;
    if(state.failDirectory)throw Error("TENANT_PRIVATE_SQL_PASSWORD");
    return {query,items:[],total:0,totalPages:1,organizations:[]};
  },
}));
vi.mock("@/modules/organizations/service",()=>({
  listOrganizations:async()=>{
    state.organizations++;
    if(state.failOrganizations)throw Error("TENANT_PRIVATE_ORG_PASSWORD");
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
beforeEach(()=>{
  state.role="ADMIN";state.directory=0;state.organizations=0;
  state.failDirectory=false;state.failOrganizations=false;
});
const directory=(query:Record<string,string|string[]|undefined>={})=>
  TenantDirectory({searchParams:Promise.resolve(query)});
const create=(query:Record<string,string|string[]|undefined>={})=>
  SuperAdminTenantCreateStage({searchParams:Promise.resolve(query)});
describe("Super Admin last-third tenant paths: scope and dependency failure",()=>{
  it("UX-admin-tenants-40 denied and disabled actors never read tenant directory or organization choices",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const page=visible(await directory()).join(" ");
      const createPage=visible(await create()).join(" ");
      expect(page).toContain("Tenant directory access denied");
      expect(createPage).toContain("Tenant creation access denied");
      expect(page+createPage).toContain("Back to dashboard");
    }
    expect(state.directory).toBe(0);
    expect(state.organizations).toBe(0);
  });
  it("UX-admin-tenants-41 malformed tenant URL shows recovery instead of querying private lifecycle data",async()=>{
    const page=visible(await directory({page:["1","2"]})).join(" ");
    expect(page).toContain("Invalid tenant filters");
    expect(page).toContain("Clear filters");
    expect(state.directory).toBe(0);
  });
  it("UX-admin-tenants-42 directory failure returns safe retry, not a false zero-college state",async()=>{
    state.failDirectory=true;
    const page=visible(await directory({q:"Dharwad"})).join(" ");
    expect(page).toContain("Tenant directory unavailable");
    expect(page).toContain("Retry tenant directory");
    expect(page).toContain("Dharwad");
    expect(page).not.toContain("TENANT_PRIVATE_SQL_PASSWORD");
    expect(page).not.toContain("No matching tenants");
    expect(state.directory).toBe(1);
  });
  it("UX-admin-tenants-43 unavailable organization choices fail closed before college creation",async()=>{
    state.failOrganizations=true;
    const page=visible(await create()).join(" ");
    expect(page).toContain("Organization directory unavailable");
    expect(page).toContain("Retry organization directory");
    expect(page).not.toContain("TENANT_PRIVATE_ORG_PASSWORD");
    expect(state.organizations).toBe(1);
  });
  it("UX-admin-tenants-44 healthy platform context sees legitimate empty and creation guidance",async()=>{
    const page=visible(await directory()).join(" ");
    const createPage=visible(await create()).join(" ");
    expect(page).not.toContain("Tenant directory unavailable");
    expect(createPage).toContain("No organization in the current safety scope");
    expect(state.directory).toBe(1);
    expect(state.organizations).toBe(1);
  });
});
