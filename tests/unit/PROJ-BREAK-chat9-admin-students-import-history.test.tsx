import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminStudentsPage from "@/app/(authenticated)/admin/students/page";
import {formatSuperAdminImportWhen} from "@/modules/admin-ui/super-admin-import-date-model";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",selected:true,fail:false,
  filters:0,options:0,history:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"operator",identityUid:"user",platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/admin-ui/super-admin-people-filter-options",()=>({
  getSuperAdminPeopleFilterOptions:async()=>{state.filters++;return {programs:[],batches:[]};},
}));
vi.mock("@/modules/admin-ui/super-admin-student-register-options-service",()=>({
  getSuperAdminStudentRegisterOptions:async()=>{
    state.options++;
    if(state.fail)throw Error("PRIVATE_STUDENT_IMPORT_PASSWORD");
    return [];
  },
}));
vi.mock("@/modules/people/college-student-csv-service",()=>({
  listSuperAdminStudentCsvImportHistory:async()=>{
    state.history++;
    return [{occurredAt:new Date(Number.NaN),metadata:{count:3,created:2,failed:1}}];
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
function findImportRuns(node:unknown):unknown{
  if(Array.isArray(node)){
    for(const part of node){const result=findImportRuns(part);if(result!==undefined)return result;}
    return undefined;
  }
  if(!isValidElement(node))return undefined;
  const props=node.props as Record<string,unknown>;
  if("runs" in props)return props.runs;
  return findImportRuns(props.children);
}
const render=()=>SuperAdminStudentsPage({searchParams:Promise.resolve({})});
beforeEach(()=>{
  state.role="ADMIN";state.selected=true;state.fail=false;
  state.filters=0;state.options=0;state.history=0;
});
describe("Super Admin last-third student register: role and malformed-import history resilience",()=>{
  it("UX-admin-students-27 formats valid IST midnight and corrupt legacy timestamps safely",()=>{
    expect(formatSuperAdminImportWhen(new Date(Number.NaN))).toBe("Date unavailable");
    const valid=formatSuperAdminImportWhen(new Date("2026-09-30T20:00:00.000Z"));
    expect(valid).toContain("Oct");
    expect(valid).toContain("2026");
  });
  it("UX-admin-students-28 wrong role or disabled actor never initiates PII reads",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const content=visible(await render()).join(" ");
      expect(content).toContain("Student access denied");
      expect(content).toContain("Back to dashboard");
      expect(content).not.toContain("Bulk Register Students");
    }
    expect(state.filters).toBe(0);
    expect(state.options).toBe(0);
    expect(state.history).toBe(0);
  });
  it("UX-admin-students-29 no college selection never pulls register or import history",async()=>{
    state.selected=false;
    await render();
    expect(state.filters).toBe(0);
    expect(state.options).toBe(0);
    expect(state.history).toBe(0);
  });
  it("UX-admin-students-30 invalid historical date cannot blank an otherwise authorized register",async()=>{
    const page=await render();
    const rows=findImportRuns(page);
    expect(rows).toEqual([{when:"Date unavailable",students:3,created:2,failed:1}]);
    expect(state.filters).toBe(1);
    expect(state.options).toBe(1);
    expect(state.history).toBe(1);
  });
  it("UX-admin-students-31 critical registration options failing never expose a half-loaded import form",async()=>{
    state.fail=true;
    const content=visible(await render()).join(" ");
    expect(content).toContain("Student register unavailable");
    expect(content).toContain("Retry student register");
    expect(content).not.toContain("Bulk Register Students");
    expect(content).not.toContain("PRIVATE_STUDENT_IMPORT_PASSWORD");
  });
});
