import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminSemesterCourseMappingPage from "@/app/(authenticated)/admin/semester-courses/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",
  selected:true,fail:false,editorReads:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"admin",platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/academics/college-term-mapping-service",()=>({
  listCollegeTermMappings:async()=>{
    state.editorReads++;
    if(state.fail)throw Error("PRIVATE_MAPPING_DATABASE_PASSWORD");
    return {programs:[],courses:[],mappings:[]};
  },
}));
function visible(node:unknown):string[]{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="number"||typeof node==="string")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href"].flatMap(key=>visible(props[key]));
}
function includesDirectory(node:unknown):boolean{
  if(Array.isArray(node))return node.some(includesDirectory);
  if(!isValidElement(node))return false;
  if(typeof node.type==="function" && node.type.name==="AdminScopedReadPage")return true;
  return includesDirectory((node.props as {children?:unknown}).children);
}
const render=()=>SuperAdminSemesterCourseMappingPage({searchParams:Promise.resolve({})});
beforeEach(()=>{state.role="ADMIN";state.selected=true;state.fail=false;state.editorReads=0;});
describe("Super Admin last-third Semester–Course Mapping guarded journeys",()=>{
  it("UX-admin-semester-courses-32 disabled and college-only actor gets safe denial before curriculum read",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const page=visible(await render()).join(" ");
      expect(page).toContain("Semester mapping access denied");
      expect(page).toContain("Back to dashboard");
      expect(page).not.toContain("PRIVATE_MAPPING_DATABASE_PASSWORD");
    }
    expect(state.editorReads).toBe(0);
  });
  it("UX-admin-semester-courses-33 missing selected college shows correct next step without reading mapping data",async()=>{
    state.selected=false;
    const page=visible(await render()).join(" ");
    expect(page).toContain("Select a college to continue");
    expect(state.editorReads).toBe(0);
  });
  it("UX-admin-semester-courses-34 editor dependency failure preserves authorized mapping directory",async()=>{
    state.fail=true;
    const tree=await render();
    const page=visible(tree).join(" ");
    expect(page).toContain("Semester mapping editor is temporarily unavailable.");
    expect(page).toContain("The directory remains accessible.");
    expect(page).not.toContain("PRIVATE_MAPPING_DATABASE_PASSWORD");
    expect(includesDirectory(tree)).toBe(true);
    expect(state.editorReads).toBe(1);
  });
  it("UX-admin-semester-courses-35 healthy read still exposes the authorized mapping editor",async()=>{
    const tree=await render();
    expect(includesDirectory(tree)).toBe(true);
    expect(visible(tree).join(" ")).not.toContain("Semester mapping editor is temporarily unavailable.");
    expect(state.editorReads).toBe(1);
  });
});
