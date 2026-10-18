import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET as boardExport} from "@/app/api/projects/[projectId]/mentor-board-export/route";
import {GET as sprintExport} from "@/app/api/projects/[projectId]/mentor-sprint-summary-export/route";
import {GET as reportExport} from "@/app/api/mentor/reports/export/route";
import {GET as deliveryExport} from "@/app/api/projects/[projectId]/mentor-delivery-review-export/route";

const state=vi.hoisted(()=>({calls:[] as Array<{kind:string;query:Record<string,unknown>}>}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-board-review-service",()=>({
 getMentorBoardReview:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls.push({kind:"board",query});
  return {enabled:true,
   exportItems:[{id:"task",title:"=Command",status:"TODO",priority:"HIGH",sprintTitle:"Sprint"}],
   exportOmitted:0,
   sprintSummaryExportItems:[{id:"sprint",title:"Sprint",registeredTasks:1,
    matchingTasks:1,done:0,blocked:0,awaitingReview:0,matchingDonePercent:0}],
   sprintSummaryExportOmitted:0,
  };
 },
}));
vi.mock("@/modules/projects/mentor-reports-service",()=>({
 getMentorReports:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls.push({kind:"report",query});
  return {enabled:true,exportItems:[{id:"project",title:"Project",status:"ACTIVE",
   isPrimaryMentor:true,attention:[],updatedAt:new Date("2026-10-18T10:00:00Z")}],
   exportOmitted:0};
 },
}));
vi.mock("@/modules/projects/mentor-review-overview-service",()=>({
 getMentorDeliveryReviewOverview:async(_:unknown,query:Record<string,unknown>)=>{
  state.calls.push({kind:"review",query});
  return {enabled:true,totalPages:1,total:1,items:[{id:"delivery",version:1,
   status:"APPROVED",reviewLabel:"Approved",submittedAt:new Date("2026-10-18T10:00:00Z"),
   reviewedAt:new Date("2026-10-18T11:00:00Z"),feedbackPresent:true}]};
 },
}));

const projectId="11111111-1111-4111-8111-111111111111";
const context={params:Promise.resolve({projectId})};
const routes=[
 {id:"board",path:"/api/projects/"+projectId+"/mentor-board-export",
  fn:(r:Request)=>boardExport(r,context),filter:"status=BLOCKED"},
 {id:"sprint",path:"/api/projects/"+projectId+"/mentor-sprint-summary-export",
  fn:(r:Request)=>sprintExport(r,context),filter:"status=BLOCKED"},
 {id:"report",path:"/api/mentor/reports/export",
  fn:(r:Request)=>reportExport(r),filter:"status=ACTIVE"},
 {id:"review",path:"/api/projects/"+projectId+"/mentor-delivery-review-export",
  fn:(r:Request)=>deliveryExport(r,context),filter:"status=SUBMITTED"},
] as const;
const request=(route:{path:string},query:string)=>new Request("https://lms.example.edu"+route.path+"?"+query);
beforeEach(()=>{state.calls=[];});

describe("PROJ-BREAK-MENTOR-55..59 real HTTP route handler input trust boundaries",()=>{
 it("PROJ-BREAK-MENTOR-55 all export GETs reject repeated keys instead of silently taking first",async()=>{
  for(const route of routes){
   const response=await route.fn(request(route,route.filter+"&"+route.filter));
   expect(response.status,route.id).toBe(400);
   expect(response.headers.get("cache-control"),route.id).toBe("private, no-store");
   expect((await response.json()).error).toBe("INVALID_QUERY");
   expect(state.calls).toHaveLength(0);
  }
 });
 it("PROJ-BREAK-MENTOR-56 unknown college, actor or cursor controls never reach scoped services",async()=>{
  for(const route of routes)for(const added of ["collegeId=other","actorId=other","page=999999"]){
   const response=await route.fn(request(route,route.filter+"&"+added));
   expect(response.status,route.id+" "+added).toBe(400);
  }
  expect(state.calls).toHaveLength(0);
 });
 it("PROJ-BREAK-MENTOR-57 valid report/project exports preserve their exact approved filter",async()=>{
  for(const route of routes){
   const response=await route.fn(request(route,route.filter));
   expect(response.status,route.id).toBe(200);
   expect(response.headers.get("content-type"),route.id).toContain("text/csv");
   expect(response.headers.get("cache-control"),route.id).toBe("private, no-store");
   expect(await response.text()).toContain("IST");
  }
  expect(state.calls.map(c=>c.kind)).toEqual(["board","board","report","review"]);
  for(const call of state.calls){
   expect(call.query.status).toBe(call.kind==="report"?"ACTIVE":
    call.kind==="review"?"SUBMITTED":"BLOCKED");
   expect(call.query.page).toBe(1);
   expect(call.query).not.toHaveProperty("collegeId");
   expect(call.query).not.toHaveProperty("actorId");
  }
 });
 it("PROJ-BREAK-MENTOR-58 export endpoints do not override project ID from request URL",async()=>{
  for(const route of routes.filter(r=>r.id!=="report")){
   const response=await route.fn(request(route,route.filter+"&projectId=22222222-2222-4222-8222-222222222222"));
   expect(response.status,route.id).toBe(400);
  }
  expect(state.calls).toHaveLength(0);
 });
});
