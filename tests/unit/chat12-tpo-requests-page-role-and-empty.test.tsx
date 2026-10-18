import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ActiveMembership,RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 context:vi.fn(),redirect:vi.fn(),inbox:vi.fn(),jobs:vi.fn(),
 afterCollege:vi.fn(),tableReady:vi.fn(),
}));
vi.mock("next/navigation",()=>({
 redirect:(url:string)=>{mocks.redirect(url);throw new Error("REDIRECT_TO_"+url);},
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/tpo-global-requests-service",()=>({getTpoGlobalRequestsInbox:mocks.inbox}));
vi.mock("@/modules/placements/job-service",()=>({listPlacementJobs:mocks.jobs}));
vi.mock("@/modules/placements/tpo-after-college-roster-service",()=>({getTpoAfterCollegeForRoster:mocks.afterCollege}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mocks.tableReady}));
vi.mock("@/components/ui/page-header",()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
vi.mock("@/components/placements/tpo-general-requests-panel",()=>({TpoGeneralRequestsPanel:()=>null}));
vi.mock("@/components/placements/tpo-request-decision-control",()=>({TpoRequestDecisionControl:()=>null}));
vi.mock("@/components/placements/tpo-request-bulk-decision",()=>({TpoRequestBulkDecision:()=>null}));
vi.mock("@/components/placements/tpo-sequential-request-review",()=>({TpoSequentialRequestReview:()=>null}));
vi.mock("@/components/tpo/tpo-student-nudge-panel",()=>({TpoStudentNudgePanel:()=>null}));

import GlobalTpoRequestsPage from "@/app/(authenticated)/tpo/requests/page";

const COLLEGE="11111111-1111-4111-8111-111111111111";
const ORG="22222222-2222-4222-8222-222222222222";
const ctx=(roles:ActiveMembership["roles"]):RequestContext=>({
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"tpo-request-page",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",collegeId:COLLEGE,
  organizationId:ORG,status:"ACTIVE",roles},
});
const query={
 status:"PENDING",age:"ALL",sort:"URGENCY_FIRST",requestType:"ALL",search:"",
 page:1,pageSize:25,urgentOnly:false,
};
const empty={
 query,requests:[],total:0,page:1,totalPages:0,
 summary:{total:0,pending:0,approved:0,rejected:0,cancelled:0},
};

describe("UX-tpo-first-third-requests-01 role, filter recovery, honest empty state",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.context.mockResolvedValue(ctx(["TPO"]));
  mocks.inbox.mockResolvedValue(empty);
  mocks.jobs.mockResolvedValue([]);
  mocks.afterCollege.mockResolvedValue({available:false,entries:{}});
  mocks.tableReady.mockResolvedValue(false);
 });
 it("denies a Learner/FACULTY role before any private request or job query",async()=>{
  for(const roles of [["LEARNER"],["FACULTY"]] as const){
   mocks.context.mockResolvedValueOnce(ctx([...roles]));
   await expect(GlobalTpoRequestsPage({searchParams:Promise.resolve({})}))
    .rejects.toThrow("REDIRECT_TO_/dashboard");
  }
  expect(mocks.redirect).toHaveBeenCalledTimes(2);
  expect(mocks.inbox).not.toHaveBeenCalled();
  expect(mocks.jobs).not.toHaveBeenCalled();
 });
 it("rejects invalid pagination and unknown request status with an actionable error and no private reads",async()=>{
  for(const filters of [{pageSize:"501"},{page:"0"},{status:"PRIVATE_OTHER_COLLEGE"}]){
   const node=await GlobalTpoRequestsPage({searchParams:Promise.resolve(filters)});
   const html=renderToStaticMarkup(node);
   expect(html).toContain("Invalid request filters");
   expect(html).toContain("Clear invalid filters");
   expect(html).toContain('role="alert"');
   expect(html).not.toContain("PRIVATE_OTHER_COLLEGE");
  }
  expect(mocks.inbox).not.toHaveBeenCalled();
  expect(mocks.jobs).not.toHaveBeenCalled();
 });
 it("renders the genuine empty pending queue with safe status and existing legacy history tabs",async()=>{
  const node=await GlobalTpoRequestsPage({searchParams:Promise.resolve({})});
  const html=renderToStaticMarkup(node);
  expect(html).toContain("Requests");
  expect(html).toContain("Waiting");
  expect(html).toContain("Last 30 days");
  expect(html).toContain("All history");
  expect(html).toContain("Nothing is waiting for you.");
  expect(html).toContain("No requests");
  expect(mocks.inbox).toHaveBeenCalledTimes(1);
  expect(mocks.jobs).toHaveBeenCalledTimes(1);
  expect(mocks.afterCollege).toHaveBeenCalledWith(ctx(["TPO"]),[]);
 });
});
