import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {SuperAdminContentDirectoryPage} from "@/components/courses/super-admin-content-directory-page";
import {adminContentQuerySchema} from "@/modules/courses/super-admin-content-directory-model";
import {readFileSync} from "node:fs";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",
  selected:true,fail:"" as ""|"directory"|"lessons"|"sections",
  directoryReads:0,lessonReads:0,sectionReads:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"actor",identityUid:"scope",
      platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
      systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
    membership:null,
    adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
  }),
}));
vi.mock("@/modules/courses/super-admin-content-directory-service",()=>({
  listSuperAdminContentDirectory:async(_context:unknown,_kind:unknown,query:Record<string,unknown>)=>{
    state.directoryReads++;
    if(state.fail==="directory")throw Error("SECRET_DIRECTORY_FAILURE");
    return {query,items:[],total:0,totalPages:1};
  },
  listSuperAdminContentSectionOptions:async()=>{
    state.sectionReads++;
    if(state.fail==="sections")throw Error("SECRET_SECTION_FAILURE");
    return [];
  },
}));
vi.mock("@/modules/courses/super-admin-content-authoring-service",()=>({
  listSuperAdminContentAuthoringLessons:async()=>{
    state.lessonReads++;
    if(state.fail==="lessons")throw Error("SECRET_LESSON_FAILURE");
    return [];
  },
}));
function textParts(node:unknown):string[]{
  if(node===null||node===undefined||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(textParts);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","href","action","eyebrow"].flatMap(k=>textParts(props[k]));
}
const render=(kind:"VIDEOS"|"RESOURCES",params:Record<string,string|string[]|undefined>={})=>
  SuperAdminContentDirectoryPage({kind,searchParams:Promise.resolve(params)});
beforeEach(()=>{
  state.role="ADMIN";state.selected=true;state.fail="";
  state.directoryReads=0;state.lessonReads=0;state.sectionReads=0;
});
describe("Super Admin last third: Videos and Resources protected directory",()=>{
  it("SA-content-admin-01 disabled and college-only accounts do not read any college lesson or resource",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      for(const kind of ["VIDEOS","RESOURCES"] as const){
        const content=textParts(await render(kind)).join(" ");
        expect(content).toContain("Content access denied");
        expect(content).toContain("Back to dashboard");
        expect(content).not.toContain("No content found");
      }
    }
    expect(state.directoryReads).toBe(0);
    expect(state.lessonReads).toBe(0);
    expect(state.sectionReads).toBe(0);
  });
  it("SA-content-admin-02 directory, lesson and section failures retain validated filters without leaking errors",async()=>{
    for(const kind of ["VIDEOS","RESOURCES"] as const){
      for(const failure of ["directory","lessons","sections"] as const){
        state.fail=failure;
        const content=textParts(await render(kind,{q:"IIT Dharwad",status:"PUBLISHED",page:"2"})).join(" ");
        expect(content).toContain("Content directory unavailable");
        expect(content).toContain("Your filters are unchanged");
        expect(content).toContain("Retry loading content");
        expect(content).toContain("q=IIT+Dharwad");
        expect(content).toContain("status=PUBLISHED");
        expect(content).toContain("page=2");
        expect(content).not.toContain("SECRET_");
        expect(content).not.toContain("No content found");
      }
    }
  });
  it("SA-content-admin-03 invalid, repeated and non-decimal URL options cannot reach content services",async()=>{
    for(const params of [{page:"0x10"},{page:"1e2"},{page:["1","2"]},{status:["ALL","PUBLISHED"]},{privateCollegeId:"forge"}]){
      const content=textParts(await render("RESOURCES",params)).join(" ");
      expect(content).toContain("Invalid content filters");
      expect(content).toContain("Clear filters");
    }
    expect(adminContentQuerySchema.safeParse({page:"0x10"}).success).toBe(false);
    expect(adminContentQuerySchema.safeParse({page:"1e2"}).success).toBe(false);
    expect(state.directoryReads).toBe(0);
    expect(state.lessonReads).toBe(0);
    expect(state.sectionReads).toBe(0);
  });
  it("SA-content-admin-05 section choices and content reject cross-offering delivery references",()=>{
    const source=readFileSync("src/modules/courses/super-admin-content-directory-service.ts","utf8");
    expect(source).toContain("eq(courseSectionDeliveries.id,lessonContents.deliveryId)");
    expect(source).toContain("eq(courseSectionDeliveries.offeringId,courseOfferings.id)");
    expect(source).toContain("lessonContents.deliveryId} is null or");
    expect(source).toContain("eq(sections.cohortId,courseOfferings.cohortId)");
    expect(source).toContain("eq(sections.academicPeriodId,courseOfferings.academicPeriodId)");
    expect(source).toContain("eq(departments.collegeId,collegeId)");
  });
  it("SA-content-admin-04 selected college is mandatory for both directories",async()=>{
    state.selected=false;
    for(const kind of ["VIDEOS","RESOURCES"] as const){
      const content=textParts(await render(kind)).join(" ");
      expect(content).toContain("Select a college to continue");
    }
    expect(state.directoryReads).toBe(0);
    expect(state.lessonReads).toBe(0);
  });
});
