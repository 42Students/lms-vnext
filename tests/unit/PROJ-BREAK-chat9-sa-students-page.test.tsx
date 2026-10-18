import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminStudentsPage from "@/app/(authenticated)/admin/students/page";

const state=vi.hoisted(()=>({
 scoped:true,fail:"",filterCalls:0,optionCalls:0,historyCalls:0,
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>({
  user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:state.scoped?{
   collegeId:"11111111-1111-4111-8111-111111111111",
   organizationId:"22222222-2222-4222-8222-222222222222",
  }:null,
 }),
}));
vi.mock("@/modules/admin-ui/super-admin-people-filter-options",()=>({
 getSuperAdminPeopleFilterOptions:async()=>{
  state.filterCalls+=1;
  if(state.fail==="filters")throw Error("INTERNAL_PEOPLE_FILTER_SECRET");
  return {programs:[],batches:[],classes:[]};
 },
}));
vi.mock("@/modules/admin-ui/super-admin-student-register-options-service",()=>({
 getSuperAdminStudentRegisterOptions:async()=>{
  state.optionCalls+=1;
  if(state.fail==="options")throw Error("INTERNAL_REGISTER_SECRET");
  return {programs:[],batches:[],classes:[]};
 },
}));
vi.mock("@/modules/people/college-student-csv-service",()=>({
 listSuperAdminStudentCsvImportHistory:async()=>{
  state.historyCalls+=1;
  if(state.fail==="history")throw Error("INTERNAL_IMPORT_HISTORY_SECRET");
  return [];
 },
}));
vi.mock("@/components/admin/admin-scoped-read-page",()=>({
 AdminScopedReadPage:function AdminScopedReadPage(){return null;},
}));
vi.mock("@/components/college/college-student-register-form",()=>({
 CollegeStudentRegisterForm:function CollegeStudentRegisterForm(){return null;},
}));
vi.mock("@/components/college/college-student-csv-import",()=>({
 CollegeStudentCsvImport:function CollegeStudentCsvImport(){return null;},
}));
function walk(node:unknown):unknown[]{
 if(node===null||node===undefined||typeof node==="boolean")return [];
 if(Array.isArray(node))return node.flatMap(walk);
 if(!isValidElement(node))return [node];
 const props=node.props as Record<string,unknown>;
 return [node,...["children","title","description","action","href"].flatMap(k=>walk(props[k]))];
}
const strings=(nodes:unknown[])=>nodes.filter((x):x is string=>typeof x==="string").join(" ");
const render=()=>SuperAdminStudentsPage({searchParams:Promise.resolve({})});
beforeEach(()=>{state.scoped=true;state.fail="";
 state.filterCalls=0;state.optionCalls=0;state.historyCalls=0;
});
describe("Super Admin last-third student registration and bulk import states",()=>{
 it("SA-students-ux-17 each failed policy/import read hides all registration actions",async()=>{
  for(const failure of ["filters","options","history"]){
   state.fail=failure;
   const nodes=walk(await render());
   expect(strings(nodes)).toContain("Student register unavailable");
   expect(strings(nodes)).toContain("Retry student register");
   expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
      x.type.name==="CollegeStudentRegisterForm")).toBe(false);
   expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
      x.type.name==="CollegeStudentCsvImport")).toBe(false);
   expect(strings(nodes)).not.toContain("INTERNAL_");
  }
  expect(state.filterCalls).toBe(3);
  expect(state.optionCalls).toBe(3);
  expect(state.historyCalls).toBe(3);
 });
 it("SA-students-ux-18 absent college cannot fetch or display learner creation controls",async()=>{
  state.scoped=false;
  const nodes=walk(await render());
  expect(state.filterCalls+state.optionCalls+state.historyCalls).toBe(0);
  expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
    x.type.name==="CollegeStudentRegisterForm")).toBe(false);
  expect(strings(nodes)).not.toContain("Bulk Register Students");
 });
 it("SA-students-ux-19 complete selected-college reads enable authorized controls",async()=>{
  const nodes=walk(await render());
  expect(strings(nodes)).toContain("Bulk Register Students");
  expect(nodes.some(x=>isValidElement(x)&&typeof x.type==="function"&&
    x.type.name==="CollegeStudentRegisterForm")).toBe(true);
  expect(state.filterCalls).toBe(1);
  expect(state.optionCalls).toBe(1);
  expect(state.historyCalls).toBe(1);
 });
});
