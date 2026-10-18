import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {parseSuperAdminPlacementStudentSearch} from "@/modules/admin-ui/super-admin-placement-student-search-model";
import SuperAdminPlacementStudentLookup from "@/app/(authenticated)/admin/placements/student-lookup/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const state=vi.hoisted(()=>({
  scoped:true,calls:0,lastQuery:null as string|null,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"22222222-2222-4222-8222-222222222222",identityUid:"admin",
      platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.scoped?{collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/placements/college-placement-student-lookup-service",()=>({
  lookupCollegeStudentPlacement:async(_ctx:unknown,query:string)=>{
    state.calls+=1;
    state.lastQuery=query;
    return {students:[],truncated:false};
  },
}));
function texts(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(texts);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href"].flatMap(key=>texts(props[key]));
}
beforeEach(()=>{state.scoped=true;state.calls=0;state.lastQuery=null;});
describe("Super Admin last-third student placement lookup: URL safety and role scope",()=>{
  it("SA-placements-student-lookup-01 valid normalized search preserves one scoped lookup",async()=>{
    expect(parseSuperAdminPlacementStudentSearch({q:"  IIT Dharwad  "}))
      .toEqual({query:"IIT Dharwad",invalid:false});
    await SuperAdminPlacementStudentLookup({searchParams:Promise.resolve({q:"  IIT Dharwad  "})});
    expect(state.calls).toBe(1);
    expect(state.lastQuery).toBe("IIT Dharwad");
  });
  it("SA-placements-student-lookup-02 invalid long, duplicate, whitespace-only and short GET never reach DB",async()=>{
    for(const q of ["x".repeat(151),"ab"," ","\t",["IIT","Other"]]){
      expect(parseSuperAdminPlacementStudentSearch({q}).invalid).toBe(true);
      const page=await SuperAdminPlacementStudentLookup({searchParams:Promise.resolve({q})});
      const content=texts(page).join(" ");
      expect(content).toContain("Invalid student search");
      expect(content).toContain("Clear search");
    }
    expect(state.calls).toBe(0);
  });
  it("SA-placements-student-lookup-03 unscoped administrator cannot search learner records",async()=>{
    state.scoped=false;
    const page=await SuperAdminPlacementStudentLookup({
      searchParams:Promise.resolve({q:"student"}),
    });
    expect(state.calls).toBe(0);
    expect(texts(page).join(" ")).toContain("Select a college to continue");
  });
  it("SA-placements-student-lookup-04 absent query is safe and does not search",async()=>{
    expect(parseSuperAdminPlacementStudentSearch({}))
      .toEqual({query:null,invalid:false});
    const page=await SuperAdminPlacementStudentLookup({searchParams:Promise.resolve({})});
    expect(texts(page).join(" ")).not.toContain("Invalid student search");
    expect(state.calls).toBe(0);
  });
});
