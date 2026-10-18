import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminProgramsPage from "@/app/(authenticated)/admin/programs/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",selected:true,
  failure:"" as ""|"programs"|"departments"|"contents",
  programs:0,departments:0,contents:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"platform",
      platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/academics/program-service",()=>({
  listPrograms:async()=>{
    state.programs++;
    if(state.failure==="programs")throw Error("PRIVATE_PROGRAM_SQL_TOKEN");
    return [{id:"program",name:"Computer Science",code:"CS",departmentId:"dept",departmentName:"Computing",durationTerms:8}];
  },
}));
vi.mock("@/modules/departments/service",()=>({
  listDepartments:async()=>{
    state.departments++;
    if(state.failure==="departments")throw Error("PRIVATE_DEPARTMENT_SQL_TOKEN");
    return [{id:"dept",name:"Computing"}];
  },
}));
vi.mock("@/modules/admin-ui/program-contents-service",()=>({
  listProgramContents:async()=>{
    state.contents++;
    if(state.failure==="contents")throw Error("PRIVATE_CONTENT_SQL_TOKEN");
    return new Map([["program",{courseCount:2}]]);
  },
}));
function readable(value:unknown):string[]{
  if(value===null||value===undefined||typeof value==="boolean")return [];
  if(typeof value==="string"||typeof value==="number")return [String(value)];
  if(Array.isArray(value))return value.flatMap(readable);
  if(!isValidElement(value))return [];
  const props=value.props as Record<string,unknown>;
  return ["children","title","description","href","action"].flatMap(key=>readable(props[key]));
}
const componentProps=(node:unknown):Record<string,unknown>|undefined=>{
  if(Array.isArray(node)){
    for(const item of node){const found=componentProps(item);if(found)return found;}
    return undefined;
  }
  if(!isValidElement(node))return undefined;
  if(typeof node.type==="function"&&node.type.name==="AdminProgramDirectory")
    return node.props as Record<string,unknown>;
  return componentProps((node.props as {children?:unknown}).children);
};
beforeEach(()=>{
  state.role="ADMIN";state.selected=true;state.failure="";
  state.programs=0;state.departments=0;state.contents=0;
});
describe("Super Admin last-third Programs: cross-role, partial outage and scoped directory",()=>{
  it("UX-admin-programs-36 disabled and College Admin actors never read private program membership",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const content=readable(await SuperAdminProgramsPage()).join(" ");
      expect(content).toContain("Program access denied");
      expect(content).toContain("Back to dashboard");
    }
    expect(state.programs).toBe(0);
    expect(state.departments).toBe(0);
    expect(state.contents).toBe(0);
  });
  it("UX-admin-programs-37 missing selected college never performs cross-tenant fallback",async()=>{
    state.selected=false;
    const content=readable(await SuperAdminProgramsPage()).join(" ");
    expect(content).toContain("Select a college to continue");
    expect(state.programs).toBe(0);
  });
  it("UX-admin-programs-38 any essential directory outage displays an honest retry, never a false zero-program list",async()=>{
    for(const fail of ["programs","departments","contents"] as const){
      state.failure=fail;
      const content=readable(await SuperAdminProgramsPage()).join(" ");
      expect(content).toContain("Programs unavailable");
      expect(content).toContain("Retry loading programs");
      expect(content).not.toContain("PRIVATE_");
      expect(content).not.toContain("Computer Science");
      expect(content).not.toContain("Manage programs within");
    }
  });
  it("UX-admin-programs-39 a valid college preserves the exact program/dept association",async()=>{
    const tree=await SuperAdminProgramsPage();
    const props=componentProps(tree);
    expect(props).toBeDefined();
    expect(props?.programs).toMatchObject([{id:"program",code:"CS",departmentId:"dept",departmentName:"Computing",durationTerms:8}]);
    expect(props?.departments).toEqual([{id:"dept",name:"Computing"}]);
    expect(state.contents).toBe(1);
  });
});
