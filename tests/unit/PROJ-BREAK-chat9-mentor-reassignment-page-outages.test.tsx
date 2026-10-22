import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {ProjectAdminReassignMentorPage} from "@/components/projects/project-admin-reassign-mentor-page";
import {
  parseProjectAdminReassignMentorQuery,projectAdminReassignMentorHref,
} from "@/modules/projects/admin-reassign-mentor-query-model";

const state=vi.hoisted(()=>({
  context:0,projects:0,mentors:0,workload:0,
  fail:"" as ""|"projects"|"mentors"|"workload",
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{
    state.context++;
    return {user:{id:"admin",identityUid:"platform",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
      membership:null,adminScope:{collegeId:"11111111-1111-4111-8111-111111111111",organizationId:"org"}};
  },
}));
vi.mock("@/modules/projects/member-service",()=>({
  listProjectMentorCandidates:async()=>{
    state.mentors++;
    if(state.fail==="mentors")throw Error("PRIVATE_MENTOR_PII_DB_TOKEN");
    return [];
  },
}));
vi.mock("@/modules/projects/mentor-reassignment-workload-service",()=>({
  listCollegeReassignmentWorkspaces:async()=>{
    state.projects++;
    if(state.fail==="projects")throw Error("PRIVATE_PROJECTS_DB_TOKEN");
    return {items:[],matchingWorkspaces:[],matchingCapped:false,total:0,page:1,totalPages:1};
  },
  listCollegeProjectMentorWorkload:async()=>{
    state.workload++;
    if(state.fail==="workload")throw Error("PRIVATE_WORKLOAD_DB_TOKEN");
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
const render=(query:Record<string,string|string[]|undefined>={})=>
  ProjectAdminReassignMentorPage({
    collegeId:"11111111-1111-4111-8111-111111111111",
    basePath:"/admin/projects",eyebrow:"Super Admin Projects",searchParams:query,
  });
beforeEach(()=>{state.context=0;state.projects=0;state.mentors=0;state.workload=0;state.fail="";});
describe("IIT Dharwad Projects: bulk mentor reassignment partial failure states",()=>{
  it("PROJ-BREAK-mentor-113 the retry URI never drops selected mentor/search/page or mis-encodes separators",()=>{
    const query=parseProjectAdminReassignMentorQuery({
      q:"IIT & Dharwad",mentorSearch:"mentor@example.invalid",
      fromMentorId:"22222222-2222-4222-8222-222222222222",
      status:"ACTIVE",page:"2",pageSize:"50",
    });
    expect(query.success).toBe(true);
    if(!query.success)return;
    const href=projectAdminReassignMentorHref("/admin/projects",query.data);
    const url=new URL(href,"https://example.invalid");
    expect(url.pathname).toBe("/admin/projects/reassign-mentor");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      fromMentorId:"22222222-2222-4222-8222-222222222222",
      mentorSearch:"mentor@example.invalid",q:"IIT & Dharwad",
      status:"ACTIVE",page:"2",pageSize:"50",
    });
  });
  it("PROJ-BREAK-mentor-114 malformed filters show Clear before context or any private roster requests",async()=>{
    const page=visible(await render({status:["ACTIVE","ARCHIVED"]})).join(" ");
    expect(page).toContain("Invalid mentor reassignment filters");
    expect(page).toContain("Clear filters");
    // The bookmark crosswalk resolves the active actor before checking URL
    // ambiguity. Invalid filters still must never reach private roster reads.
    expect(state.context).toBe(1);
    expect(state.projects+state.mentors+state.workload).toBe(0);
  });
  it("PROJ-BREAK-mentor-115 failure in any essential dependency blocks all mutation forms and retains filters",async()=>{
    for(const fail of ["projects","mentors","workload"] as const){
      state.fail=fail;
      const page=visible(await render({q:"IIT",status:"ACTIVE",page:"2",mentorSearch:"faculty"})).join(" ");
      if(fail==="projects"||fail==="workload"){
        expect(page).toContain(fail==="projects"?"Failed to load project workspaces":"Mentor workload could not be loaded");
        expect(page).toContain("Retry loading mentor reassignment");
      }else{
        expect(page).toContain("Mentor options could not be loaded");
        expect(page).toContain("Retry mentors");
        expect(page).toContain("Mentor assignments are read-only");
      }
      expect(page).toContain("q=IIT");
      expect(page).toContain("mentorSearch=faculty");
      expect(page).toContain("status=ACTIVE");
      expect(page).toContain("page=2");
      expect(page).not.toContain("PRIVATE_");
      expect(page).not.toContain("Select workspaces");
    }
    expect(state.projects).toBe(3);
    expect(state.mentors).toBe(3);
    expect(state.workload).toBe(3);
  });
  it("PROJ-BREAK-mentor-116 authorized and completely loaded data keeps the bulk action view reachable",async()=>{
    const page=visible(await render()).join(" ");
    expect(page).toContain("Bulk mentor reassignment");
    expect(page).toContain("Mentor workload");
    expect(page).not.toContain("Mentor reassignment unavailable");
    expect(state.projects).toBe(1);
    expect(state.mentors).toBe(1);
    expect(state.workload).toBe(1);
  });
});
