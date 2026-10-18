import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminSemestersPage from "@/app/(authenticated)/admin/semesters/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",selected:true,fail:false,reads:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"user",platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/academics/college-academic-directory-service",()=>({
  listCollegeSemesters:async(_context:unknown,query:Record<string,unknown>)=>{
    state.reads++;
    if(state.fail)throw Error("INTERNAL_SEMESTER_DB_PASSWORD");
    return {query,programs:[],items:[],total:0,totalPages:1};
  },
}));
function visible(node:unknown):string[]{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","href","action","eyebrow"].flatMap(key=>visible(props[key]));
}
const render=(params:Record<string,string|string[]|undefined>={})=>
  SuperAdminSemestersPage({searchParams:Promise.resolve(params)});
beforeEach(()=>{state.role="ADMIN";state.selected=true;state.fail=false;state.reads=0;});

describe("Super Admin last-third /admin/semesters security and resilience",()=>{
  it("UX-admin-semesters-12 disabled and college-only actors never query private academic rows",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const page=visible(await render()).join(" ");
      expect(page).toContain("Semester access denied");
      expect(page).toContain("Back to dashboard");
      expect(page).not.toContain("INTERNAL_");
    }
    expect(state.reads).toBe(0);
  });
  it("UX-admin-semesters-13 missing selected college gives a safe next step without data reads",async()=>{
    state.selected=false;
    const page=visible(await render()).join(" ");
    expect(page).toContain("Select a college to continue");
    expect(state.reads).toBe(0);
  });
  it("UX-admin-semesters-14 malformed paging gets an explicit error before the service",async()=>{
    const page=visible(await render({page:"-1",pageSize:"1000"})).join(" ");
    expect(page).toContain("Invalid semester filters");
    expect(page).toContain("Clear filters");
    expect(state.reads).toBe(0);
  });
  it("UX-admin-semesters-15 directory outage never becomes a false empty state or raw error",async()=>{
    state.fail=true;
    const page=visible(await render({q:"IIT Dharwad",status:"ACTIVE",page:"2",pageSize:"25"})).join(" ");
    expect(page).toContain("Semesters unavailable");
    expect(page).toContain("Retry loading semesters");
    expect(page).toContain("q=IIT+Dharwad");
    expect(page).toContain("status=ACTIVE");
    expect(page).toContain("page=2");
    expect(page).toContain("pageSize=25");
    expect(page).not.toContain("No semesters found");
    expect(page).not.toContain("INTERNAL_SEMESTER_DB_PASSWORD");
    expect(state.reads).toBe(1);
  });
  it("UX-admin-semesters-16 successful zero-results page uses the legacy empty state",async()=>{
    const page=visible(await render()).join(" ");
    expect(page).toContain("Semesters");
    expect(page).not.toContain("Semesters unavailable");
    expect(state.reads).toBe(1);
  });
});
