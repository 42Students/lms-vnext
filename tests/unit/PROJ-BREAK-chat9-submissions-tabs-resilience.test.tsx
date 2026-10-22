import {beforeEach,describe,expect,it,vi} from "vitest";
import {isValidElement} from "react";
import {ProjectAdminPagination} from "@/components/projects/project-admin-collection-controls";
import {readFileSync} from "node:fs";
import {ProjectAdminSubmissionsPage} from "@/components/projects/project-admin-submissions-page";

const state=vi.hoisted(()=>({
  queue:0,summary:0,unsubmitted:0,
  failure:"" as ""|"queue"|"summary"|"unsubmitted",
  unsubmittedQuery:null as unknown,
}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>({
    user:{id:"operator",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:"membership",organizationId:"org",collegeId:"11111111-1111-4111-8111-111111111111",status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
    adminScope:null,
  }),
}));
vi.mock("@/modules/projects/admin-submission-lock-policy",()=>({
  mayRecordCollegeAdminDeliveryLock:()=>true,
}));
vi.mock("@/modules/projects/admin-insights-service",()=>({
  listProjectAdminSubmissionQueue:async()=>{
    state.queue++;
    if(state.failure==="queue")throw Error("DO_NOT_EXPOSE_SUBMISSION_DB_KEY");
    return {items:[],page:1,total:0,totalPages:1};
  },
  getProjectAdminSubmissionSummary:async()=>{
    state.summary++;
    if(state.failure==="summary")throw Error("DO_NOT_EXPOSE_SUMMARY_DB_KEY");
    return {activeWorkspaces:2,pendingReview:1,needsStudentAction:0,reviewed:1};
  },
}));
vi.mock("@/modules/projects/admin-unsubmitted-service",()=>({
  listProjectAdminUnsubmitted:async(_context:unknown,_college:unknown,query:unknown)=>{
    state.unsubmitted++;state.unsubmittedQuery=query;
    if(state.failure==="unsubmitted")throw Error("DO_NOT_EXPOSE_UNSUBMITTED_DB_KEY");
    return {items:[],page:2,total:0,totalPages:2};
  },
}));
function strings(value:unknown):string[]{
  if(value===null||value===undefined||typeof value==="boolean")return [];
  if(typeof value==="number"||typeof value==="string")return [String(value)];
  if(Array.isArray(value))return value.flatMap(strings);
  if(!isValidElement(value))return [];
  const p=value.props as Record<string,unknown>;
  return ["children","title","description","action","href","eyebrow","empty"].flatMap(key=>strings(p[key]));
}
const render=(query:Record<string,string|string[]|undefined>={})=>
  ProjectAdminSubmissionsPage({
    collegeId:"11111111-1111-4111-8111-111111111111",
    basePath:"/college/projects",eyebrow:"Projects",searchParams:query,
  });
beforeEach(()=>{state.queue=0;state.summary=0;state.unsubmitted=0;state.failure="";state.unsubmittedQuery=null;});

describe("IIT Dharwad Projects: adversarial tab outage and pagination journeys",()=>{
  it("PROJ-BREAK-submissions-41 unsubmitted-only navigation never calls final-delivery services",async()=>{
    const view=await render({
      view:"NOT_SUBMITTED",q:"  IIT  ",status:"ACTIVE",page:"2",pageSize:"50",
    });
    const page=strings(view).join(" ");
    expect(state.queue).toBe(0);
    expect(state.summary).toBe(0);
    expect(state.unsubmitted).toBe(1);
    expect(state.unsubmittedQuery).toEqual({q:"IIT",status:"ACTIVE",page:2,pageSize:50});
    expect(page).toContain("Not submitted");
    // The shared pagination is an unexecuted Server Component at this boundary:
    // verify both real data props and the filter-preserving link factory.
    const source=readFileSync("src/components/projects/project-admin-submissions-page.tsx","utf8");
    expect(source).toContain('<Pagination page={unsubmitted.page} pageCount={unsubmitted.totalPages}');
    expect(source).toContain('hrefForPage={page=>projectAdminUnsubmittedHref(queuePath,query,page)}');
    expect(page).toContain("q=IIT");
    expect(page).toContain("status=ACTIVE");
    expect(page).toContain("pageSize=50");
    expect(page).not.toContain("Submission totals are temporarily unavailable.");
  });
  it("PROJ-BREAK-submissions-44 optional aggregate outage cannot hide otherwise authorized submissions",async()=>{
    state.failure="summary";
    const page=strings(await render({})).join(" ");
    expect(state.queue).toBe(1);
    expect(state.summary).toBe(1);
    expect(state.unsubmitted).toBe(0);
    expect(page).toContain("Submission totals are temporarily unavailable.");
    expect(page).toContain("No submissions yet");
    expect(page).not.toContain("DO_NOT_EXPOSE");
  });
  it("PROJ-BREAK-submissions-45 essential queue outage shows retry preserving filters",async()=>{
    state.failure="queue";
    const page=strings(await render({q:"IIT",status:"ACTIVE",page:"3",pageSize:"50"})).join(" ");
    expect(page).toContain("Submissions could not be loaded");
    expect(page).toContain("Retry loading submissions");
    expect(page).toContain("q=IIT");
    expect(page).toContain("status=ACTIVE");
    expect(page).toContain("page=3");
    expect(page).toContain("pageSize=50");
    expect(page).not.toContain("DO_NOT_EXPOSE");
  });
  it("PROJ-BREAK-submissions-46 unsubmitted outage never implies zero workspaces",async()=>{
    state.failure="unsubmitted";
    const page=strings(await render({view:"NOT_SUBMITTED",q:"alpha",page:"2"})).join(" ");
    expect(state.queue).toBe(0);
    expect(state.summary).toBe(0);
    expect(state.unsubmitted).toBe(1);
    expect(page).toContain("Unsubmitted workspaces unavailable");
    expect(page).toContain("Retry loading workspaces");
    expect(page).toContain("q=alpha");
    expect(page).toContain("page=2");
    expect(page).not.toContain("All matching workspaces have a submission.");
    expect(page).not.toContain("DO_NOT_EXPOSE");
  });
});
