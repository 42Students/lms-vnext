import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as meetingDecision} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-decision/route";
import {PATCH as meetingNotes} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-notes/route";
import {PATCH as meetingReschedule} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-reschedule/route";
import {POST as sprintTransition} from "@/app/api/projects/[projectId]/sprints/[sprintId]/mentor-transition/route";
import {POST as submissionDecision} from "@/app/api/projects/[projectId]/submissions/[submissionId]/mentor-decision/route";
import {PATCH as taskTransition} from "@/app/api/projects/[projectId]/tasks/[taskId]/mentor-transition/route";

const state=vi.hoisted(()=>({sameOrigin:true,calls:[] as string[]}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.sameOrigin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:async()=>({user:{id:"mentor"}})}));
vi.mock("@/modules/projects/mentor-meeting-decision-service",()=>({
 decideMentorProjectMeeting:async()=>{state.calls.push("meeting-decision");return {id:"meeting"};},
}));
vi.mock("@/modules/projects/mentor-meeting-notes-service",()=>({
 updateMentorMeetingNotes:async()=>{state.calls.push("meeting-notes");return {id:"meeting"};},
}));
vi.mock("@/modules/projects/mentor-meeting-reschedule-service",()=>({
 rescheduleMentorMeeting:async()=>{state.calls.push("meeting-reschedule");return {id:"meeting"};},
}));
vi.mock("@/modules/projects/mentor-sprint-write-service",()=>({
 transitionMentorProjectSprint:async()=>{state.calls.push("sprint-transition");return {id:"sprint"};},
}));
vi.mock("@/modules/projects/mentor-final-delivery-decision-service",()=>({
 decideMentorFinalDelivery:async()=>{state.calls.push("submission-decision");return {id:"submission"};},
}));
vi.mock("@/modules/projects/mentor-task-transition-service",()=>({
 transitionMentorProjectTask:async()=>{state.calls.push("task-transition");return {id:"task"};},
}));
const projectId="11111111-1111-4111-8111-111111111111";
const itemId="22222222-2222-4222-8222-222222222222";
const p2={params:Promise.resolve({projectId,meetingId:itemId})};
const ps={params:Promise.resolve({projectId,sprintId:itemId})};
const pd={params:Promise.resolve({projectId,submissionId:itemId})};
const pt={params:Promise.resolve({projectId,taskId:itemId})};
const handlers=[
 {name:"meeting-decision",path:"/meetings/decision",method:"POST",
  run:(req:Request)=>meetingDecision(req,p2)},
 {name:"meeting-notes",path:"/meetings/notes",method:"PATCH",
  run:(req:Request)=>meetingNotes(req,p2)},
 {name:"meeting-reschedule",path:"/meetings/reschedule",method:"PATCH",
  run:(req:Request)=>meetingReschedule(req,p2)},
 {name:"sprint-transition",path:"/sprints/transition",method:"POST",
  run:(req:Request)=>sprintTransition(req,ps)},
 {name:"submission-decision",path:"/submissions/decision",method:"POST",
  run:(req:Request)=>submissionDecision(req,pd)},
 {name:"task-transition",path:"/tasks/transition",method:"PATCH",
  run:(req:Request)=>taskTransition(req,pt)},
] as const;
const makeRequest=(h:(typeof handlers)[number],body:string,contentType="application/json")=>
 new Request("https://lms.example.edu/api/projects/"+projectId+h.path,{
  method:h.method,headers:{"content-type":contentType},body,
 });
beforeEach(()=>{state.sameOrigin=true;state.calls=[];});

describe("PROJ-BREAK-MENTOR-109..113 bounded command HTTP for every Mentor lifecycle mutation route",()=>{
 it("PROJ-BREAK-MENTOR-109 same-origin denial precedes JSON parsing for all six routes",async()=>{
  state.sameOrigin=false;
  for(const h of handlers){
   const result=await h.run(makeRequest(h,"{garbled"));
   expect(result.status,h.name).toBe(403);
   expect((await result.json()).error,h.name).toBe("INVALID_ORIGIN");
  }
  expect(state.calls).toEqual([]);
 });
 it("PROJ-BREAK-MENTOR-110 malformed JSON maps to actionable 400 before services",async()=>{
  for(const h of handlers){
   const result=await h.run(makeRequest(h,'{"incomplete":'));
   expect(result.status,h.name).toBe(400);
   const error=await result.json();
   expect(error.error).toBe("INVALID_PROJECT_COMMAND_BODY");
   expect(error.message).toContain("Check the form and retry");
  }
  expect(state.calls).toEqual([]);
 });
 it("PROJ-BREAK-MENTOR-111 oversized command payload fails with 413 and no mutation",async()=>{
  const giant=JSON.stringify({payload:"x".repeat(128*1024+1)});
  for(const h of handlers){
   const result=await h.run(makeRequest(h,giant));
   expect(result.status,h.name).toBe(413);
   expect((await result.json()).error).toBe("PROJECT_COMMAND_BODY_TOO_LARGE");
  }
  expect(state.calls).toEqual([]);
 });
 it("PROJ-BREAK-MENTOR-112 unsupported text/plain MIME returns safe 415",async()=>{
  for(const h of handlers){
   const result=await h.run(makeRequest(h,'{"action":"START"}',"text/plain"));
   expect(result.status,h.name).toBe(415);
   expect((await result.json()).error).toBe("UNSUPPORTED_PROJECT_COMMAND_CONTENT_TYPE");
  }
  expect(state.calls).toEqual([]);
 });
 it("PROJ-BREAK-MENTOR-113 valid JSON delegates exactly once to expected scoped service",async()=>{
  for(const h of handlers){
   const result=await h.run(makeRequest(h,'{"confirmed":true}'));
   expect(result.status,h.name).toBe(200);
  }
  expect(state.calls).toEqual(handlers.map(h=>h.name));
 });
});
