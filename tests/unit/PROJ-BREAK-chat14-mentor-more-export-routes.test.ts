import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET as sprintExport} from "@/app/api/mentor/sprint-progress/export/route";
import {GET as taskHistoryExport} from "@/app/api/mentor/task-review-history/export/route";

const state=vi.hoisted(()=>({sprintReads:0,historyReads:0,queries:[] as Record<string,unknown>[]}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-sprint-progress-service",()=>({
 getMentorSprintProgress:async(_:unknown,query:Record<string,unknown>)=>{
  state.sprintReads++;state.queries.push(query);
  return {enabled:true,total:1,totalPages:1,items:[{
   id:"sprint",projectTitle:"Atlas",title:"Iteration",releaseTitle:"Phase",
   status:"ACTIVE",releaseStatus:"IN_PROGRESS",
   tasks:{total:3,completed:1,inReview:1,blocked:1,completionPercent:33},
  }]};
 },
}));
vi.mock("@/modules/projects/mentor-task-history-service",()=>({
 getMentorTaskReviewHistory:async(_:unknown,query:Record<string,unknown>)=>{
  state.historyReads++;state.queries.push(query);
  return {enabled:true,total:1,totalPages:1,items:[{
   id:"submission",projectTitle:"Atlas",taskTitle:"Task",status:"APPROVED",
   version:2,reviewedAt:new Date("2026-10-18T10:00:00.000Z"),
  }]};
 },
}));
const routes=[
 {name:"sprint",path:"/api/mentor/sprint-progress/export",handler:sprintExport,valid:"state=ACTIVE",
  key:"state",value:"ACTIVE"},
 {name:"task",path:"/api/mentor/task-review-history/export",handler:taskHistoryExport,
  valid:"decision=APPROVED",key:"decision",value:"APPROVED"},
] as const;
const request=(path:string,query:string)=>new Request("https://lms.example.edu"+path+"?"+query);
beforeEach(()=>{state.sprintReads=0;state.historyReads=0;state.queries=[];});

describe("PROJ-BREAK-MENTOR-99..102 export handler query trust boundaries",()=>{
 it("PROJ-BREAK-MENTOR-99 rejects duplicate and unknown query fields before I/O",async()=>{
  for(const route of routes)for(const hostile of [
   route.valid+"&"+route.valid,route.valid+"&collegeId=foreign",
   route.valid+"&actorId=admin",route.valid+"&page=10001",
  ]){
   const response=await route.handler(request(route.path,hostile));
   expect(response.status,route.name+" "+hostile).toBe(400);
   expect((await response.json()).error).toBe("INVALID_QUERY");
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  expect(state.sprintReads).toBe(0);expect(state.historyReads).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-100 valid filtering is exactly retained with bounded first page",async()=>{
  for(const route of routes){
   const response=await route.handler(request(route.path,route.valid));
   expect(response.status).toBe(200);
   expect(response.headers.get("Content-Type")).toContain("text/csv");
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
   const csv=await response.text();
   expect(csv).toContain("Atlas");
   expect(csv).toContain(route.name==="task"?"Reviewed (IST)":"Completion percent");
   expect(csv).not.toContain("learner_email");
  }
  expect(state.queries).toHaveLength(2);
  for(const [i,route] of routes.entries()){
   expect(state.queries[i]).toHaveProperty(route.key,route.value);
   expect(state.queries[i].page).toBe(1);
   expect(state.queries[i]).not.toHaveProperty("collegeId");
  }
 });
 it("PROJ-BREAK-MENTOR-101 malformed enums are rejected without querying data",async()=>{
  for(const route of routes){
   const response=await route.handler(request(route.path,route.key+"=FORGED"));
   expect(response.status).toBeGreaterThanOrEqual(400);
   expect(response.status).toBeLessThan(500);
  }
  expect(state.sprintReads).toBe(0);expect(state.historyReads).toBe(0);
 });
});
