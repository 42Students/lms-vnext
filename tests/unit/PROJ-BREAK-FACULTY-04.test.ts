import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),task:vi.fn(),
 meetingDecision:vi.fn(),meetingNotes:vi.fn(),meetingReschedule:vi.fn(),
 sprint:vi.fn(),delivery:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/projects/mentor-task-transition-service",
 ()=>({transitionMentorProjectTask:state.task}));
vi.mock("@/modules/projects/mentor-meeting-decision-service",
 ()=>({decideMentorProjectMeeting:state.meetingDecision}));
vi.mock("@/modules/projects/mentor-meeting-notes-service",
 ()=>({updateMentorMeetingNotes:state.meetingNotes}));
vi.mock("@/modules/projects/mentor-meeting-reschedule-service",
 ()=>({rescheduleMentorMeeting:state.meetingReschedule}));
vi.mock("@/modules/projects/mentor-sprint-write-service",
 ()=>({transitionMentorProjectSprint:state.sprint}));
vi.mock("@/modules/projects/mentor-final-delivery-decision-service",
 ()=>({decideMentorFinalDelivery:state.delivery}));

import {PATCH as task} from "@/app/api/projects/[projectId]/tasks/[taskId]/mentor-transition/route";
import {POST as meetingDecision} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-decision/route";
import {PATCH as meetingNotes} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-notes/route";
import {PATCH as meetingReschedule} from "@/app/api/projects/[projectId]/meetings/[meetingId]/mentor-reschedule/route";
import {POST as sprint} from "@/app/api/projects/[projectId]/sprints/[sprintId]/mentor-transition/route";
import {POST as delivery} from "@/app/api/projects/[projectId]/submissions/[submissionId]/mentor-decision/route";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const meetingId="33333333-3333-4333-8333-333333333333";
const sprintId="44444444-4444-4444-8444-444444444444";
const submissionId="55555555-5555-4555-8555-555555555555";
const actor={user:{id:"real-faculty"},membership:{id:"assigned-mentor"}};
const ctx={params:Promise.resolve({projectId,taskId,meetingId,sprintId,submissionId})};
const body={expectedUpdatedAt:"2026-10-18T04:35:00.000Z",
 confirmed:true,status:"IN_PROGRESS",userId:"attacker",
 collegeId:"guessed-foreign-college"};
function request(method:string,value:unknown=body){
 return new Request("https://college.invalid/api/projects/mentor",{
  method,headers:{"content-type":"application/json"},
  body:JSON.stringify(value),
 });
}
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(actor);
 for(const mock of [state.task,state.meetingDecision,state.meetingNotes,
  state.meetingReschedule,state.sprint,state.delivery]){
  mock.mockResolvedValue({status:"ACTIVE",id:projectId});
 }
 state.error.mockImplementation(()=>NextResponse.json({
  error:"SAFE_RETRY",message:"Review the latest record and retry."},{status:409}));
});
describe("PROJ-BREAK-FACULTY-04 actual Faculty / Mentor project API boundaries",()=>{
 const handlers=[
  {name:"task state",method:"PATCH",handler:task,service:state.task},
  {name:"meeting decision",method:"POST",handler:meetingDecision,service:state.meetingDecision},
  {name:"meeting notes",method:"PATCH",handler:meetingNotes,service:state.meetingNotes},
  {name:"meeting reschedule",method:"PATCH",handler:meetingReschedule,service:state.meetingReschedule},
  {name:"sprint transition",method:"POST",handler:sprint,service:state.sprint},
  {name:"final delivery decision",method:"POST",handler:delivery,service:state.delivery},
 ] as const;

 for(const spec of handlers){
  it(`PROJ-BREAK-FACULTY-04 origin must reject forged ${spec.name} before identity lookup or mutation`,async()=>{
   state.origin.mockReturnValueOnce(false);
   const response=await spec.handler(request(spec.method),ctx);
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(state.context).not.toHaveBeenCalled();
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`PROJ-BREAK-FACULTY-04 ${spec.name} delegates authenticated context, never forged user ID`,async()=>{
   const response=await spec.handler(request(spec.method),ctx);
   expect(response.status).toBe(200);
   expect(spec.service).toHaveBeenCalledTimes(1);
   expect(spec.service.mock.calls[0]?.[0]).toBe(actor);
   expect(JSON.stringify(await response.json())).not.toContain("attacker");
   const sent=spec.service.mock.calls[0]!;
   expect(sent.some((arg:unknown)=>arg && typeof arg==="object" &&
    "expectedUpdatedAt" in arg && (arg as typeof body).userId==="attacker")).toBe(true);
  });
  it(`PROJ-BREAK-FACULTY-04 ${spec.name} rejects malformed JSON before service mutations`,async()=>{
   const response=await spec.handler(new Request("https://college.invalid/api/projects/mentor",{
    method:spec.method,headers:{"content-type":"application/json"},body:"{",
   }),ctx);
   expect(response.status).toBe(400);
   expect((await response.json()).error).toBe("INVALID_PROJECT_COMMAND_BODY");
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`PROJ-BREAK-FACULTY-04 ${spec.name} rejects non-JSON and oversized streams before writes`,async()=>{
   const unsupported=await spec.handler(new Request("https://college.invalid/api/projects/mentor",{
    method:spec.method,headers:{"content-type":"text/plain"},body:"{}",
   }),ctx);
   expect(unsupported.status).toBe(415);
   const huge=await spec.handler(new Request("https://college.invalid/api/projects/mentor",{
    method:spec.method,headers:{"content-type":"application/json",
     "content-length":String(128*1024+1)},body:"{}",
   }),ctx);
   expect(huge.status).toBe(413);
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`PROJ-BREAK-FACULTY-04 ${spec.name} converts stale/denied errors to a safe recovery`,async()=>{
   spec.service.mockRejectedValueOnce(new Error("internal db password=secret"));
   const response=await spec.handler(request(spec.method),ctx);
   expect(response.status).toBe(409);
   const payload=await response.json();
   expect(payload.message).toContain("retry");
   expect(JSON.stringify(payload)).not.toMatch(/password|secret|internal db/i);
   expect(state.error).toHaveBeenCalledTimes(1);
  });
 }
});
