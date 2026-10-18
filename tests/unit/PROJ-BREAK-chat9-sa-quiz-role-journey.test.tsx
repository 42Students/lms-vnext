import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import SuperAdminQuizzesPage from "@/app/(authenticated)/admin/quizzes/page";

const state=vi.hoisted(()=>({
  role:"ADMIN" as "ADMIN"|"COLLEGE"|"DISABLED",selected:true,
  fail:"" as ""|"directory"|"options",contextReads:0,dirReads:0,optionReads:0,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{
    state.contextReads++;
    return {
      user:{id:"admin",identityUid:"platform",platformStatus:state.role==="DISABLED"?"DISABLED":"ACTIVE",
        systemRoles:state.role==="COLLEGE"?[]:["SUPER_ADMIN"]},
      membership:null,
      adminScope:state.selected?{organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111"}:null,
    };
  },
}));
vi.mock("@/modules/courses/college-assessment-aggregate-service",()=>({
  listCollegeAssessmentAggregate:async()=>{
    state.dirReads++;
    if(state.fail==="directory")throw Error("PRIVATE_PG_CREDENTIAL");
    return {items:[],total:0,totalPages:1,reviewDeliveries:[],query:{}};
  },
}));
vi.mock("@/modules/courses/college-quiz-authoring-options",()=>({
  getCollegeQuizAuthoringOptions:async()=>{
    state.optionReads++;
    if(state.fail==="options")throw Error("PRIVATE_AUTHORING_CREDENTIAL");
    return [];
  },
}));

function visible(node:unknown):string[]{
  if(node==null||typeof node==="boolean")return [];
  if(typeof node==="string"||typeof node==="number")return [String(node)];
  if(Array.isArray(node))return node.flatMap(visible);
  if(!isValidElement(node))return [];
  const props=node.props as Record<string,unknown>;
  return ["children","title","description","action","href","eyebrow"].flatMap(key=>visible(props[key]));
}
const render=(params:Record<string,string|string[]|undefined>={})=>
  SuperAdminQuizzesPage({searchParams:Promise.resolve(params)});

beforeEach(()=>{
  state.role="ADMIN";state.selected=true;state.fail="";
  state.contextReads=0;state.dirReads=0;state.optionReads=0;
});

describe("Super Admin last-third: quiz directory guarded server journey",()=>{
  it("UX-admin-quizzes-05 inactive and non-platform accounts cannot query assessments or lessons",async()=>{
    for(const role of ["COLLEGE","DISABLED"] as const){
      state.role=role;
      const content=visible(await render()).join(" ");
      expect(content).toContain("Quiz access denied");
      expect(content).toContain("Back to dashboard");
      expect(content).not.toContain("PRIVATE_");
    }
    expect(state.dirReads).toBe(0);
    expect(state.optionReads).toBe(0);
  });

  it("UX-admin-quizzes-06 missing selected college shows guidance without touching private services",async()=>{
    state.selected=false;
    const content=visible(await render()).join(" ");
    expect(content).toContain("Select a college to continue");
    expect(state.dirReads).toBe(0);
    expect(state.optionReads).toBe(0);
  });

  it("UX-admin-quizzes-07 hostile query is denied before even reading a session",async()=>{
    for(const params of [{page:["1","2"]},{page:"1e2"},{collegeId:"other-college"}]){
      const content=visible(await render(params)).join(" ");
      expect(content).toContain("Invalid quiz filters");
      expect(content).toContain("Clear filters");
    }
    expect(state.contextReads).toBe(0);
    expect(state.dirReads).toBe(0);
    expect(state.optionReads).toBe(0);
  });

  it("UX-admin-quizzes-08 directory outage retains valid filters and shows retry without leaking internals",async()=>{
    state.fail="directory";
    const content=visible(await render({q:"IIT Dharwad",status:"PUBLISHED",page:"2"})).join(" ");
    expect(content).toContain("Quizzes unavailable");
    expect(content).toContain("Retry loading quizzes");
    expect(content).toContain("q=IIT+Dharwad");
    expect(content).toContain("status=PUBLISHED");
    expect(content).toContain("page=2");
    expect(content).not.toContain("PRIVATE_PG_CREDENTIAL");
    expect(state.dirReads).toBe(1);
  });

  it("UX-admin-quizzes-09 authoring-option outage never hides existing authorized quiz directory",async()=>{
    state.fail="options";
    const content=visible(await render()).join(" ");
    expect(content).toContain("Existing quizzes remain visible.");
    expect(content).not.toContain("Quizzes unavailable");
    expect(content).not.toContain("PRIVATE_AUTHORING_CREDENTIAL");
    expect(state.dirReads).toBe(1);
    expect(state.optionReads).toBe(1);
  });
});
