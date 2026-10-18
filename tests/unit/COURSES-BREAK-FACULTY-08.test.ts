import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";

const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),
 assignment:vi.fn(),attendance:vi.fn(),live:vi.fn(),quiz:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/courses/faculty-assignment-authoring-service",
 ()=>({commandFacultyAssignment:state.assignment}));
vi.mock("@/modules/attendance/faculty-schedule-mutation-service",
 ()=>({commandFacultyAttendanceSchedule:state.attendance}));
vi.mock("@/modules/courses/faculty-live-mutation-service",
 ()=>({commandFacultyLiveClass:state.live}));
vi.mock("@/modules/courses/faculty-quiz-authoring-service",
 ()=>({commandFacultyQuiz:state.quiz}));

import {POST as assignment} from "@/app/api/courses/faculty/assignments/[deliveryId]/command/route";
import {POST as attendance} from "@/app/api/courses/faculty/attendance/[deliveryId]/schedule/route";
import {POST as live} from "@/app/api/courses/faculty/live-classes/[deliveryId]/command/route";
import {POST as quiz} from "@/app/api/courses/faculty/quizzes/[deliveryId]/command/route";

const deliveryId="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"persisted-faculty",platformStatus:"ACTIVE"},
 membership:{id:"persisted-teaching-membership"}};
const ctx={params:Promise.resolve({deliveryId})};
const body={action:"CREATE",confirmed:true,title:"Safe lesson",
 collegeId:"attacker-college",userId:"attacker"};
function request(value:unknown=body,contentType="application/json"){
 return new Request("https://college.invalid/api/courses/faculty/command",{
  method:"POST",headers:{"content-type":contentType},body:JSON.stringify(value),
 });
}
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(actor);
 state.error.mockImplementation(()=>NextResponse.json({
  error:"SAFE_RETRY",message:"Reload your Section and try again."},{status:409}));
 for(const mock of [state.assignment,state.attendance,state.live,state.quiz])
  mock.mockResolvedValue({id:"saved-id",updatedAt:"2026-10-18T04:35:00.000Z"});
});
describe("COURSES-BREAK-FACULTY-08 actual authoring API origin, actor and failure boundaries",()=>{
 const handlers=[
  {name:"assignment authoring",handler:assignment,service:state.assignment},
  {name:"attendance schedule",handler:attendance,service:state.attendance},
  {name:"live-class authoring",handler:live,service:state.live},
  {name:"quiz authoring",handler:quiz,service:state.quiz},
 ] as const;
 for(const spec of handlers){
  it(`FAC-courses-01 ${spec.name} rejects cross-origin POST before session or DB command`,async()=>{
   state.origin.mockReturnValueOnce(false);
   const response=await spec.handler(request(),ctx);
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(state.context).not.toHaveBeenCalled();
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`FAC-courses-01 ${spec.name} supplies server actor and delivery, never trusts caller actor`,async()=>{
   const response=await spec.handler(request(),ctx);
   expect(response.status).toBe(200);
   expect(spec.service).toHaveBeenCalledTimes(1);
   expect(spec.service).toHaveBeenCalledWith(actor,{deliveryId},body);
   const data=await response.json();
   expect(JSON.stringify(data)).not.toContain("attacker");
  });
  it(`FAC-courses-01 ${spec.name} routes stale, revoked and DB faults to a safe recovery`,async()=>{
   spec.service.mockRejectedValueOnce(new Error("secret server credentials"));
   const response=await spec.handler(request(),ctx);
   expect(response.status).toBe(409);
   expect(state.error).toHaveBeenCalledTimes(1);
   expect(JSON.stringify(await response.json())).not.toMatch(/secret|credentials/i);
  });
 }
 it("FAC-courses-01 invalid quiz content type is rejected before mutation",async()=>{
  const response=await quiz(request(body,"text/plain"),ctx);
  expect(response.status).toBe(415);
  expect(state.quiz).not.toHaveBeenCalled();
  expect((await response.json()).error).toBe("UNSUPPORTED_QUIZ_CONTENT_TYPE");
 });
 it("FAC-courses-01 malformed quiz JSON is rejected before mutation",async()=>{
  const response=await quiz(new Request("https://college.invalid",{
   method:"POST",headers:{"content-type":"application/json"},body:"{",
  }),ctx);
  expect(response.status).toBe(400);
  expect(state.quiz).not.toHaveBeenCalled();
  expect((await response.json()).error).toBe("INVALID_QUIZ_JSON");
 });
 it("FAC-courses-01 oversized quiz authoring request is denied before mutation",async()=>{
  const response=await quiz(new Request("https://college.invalid",{
   method:"POST",headers:{"content-type":"application/json",
    "content-length":String(16*1024*1024+1)},body:"{}",
  }),ctx);
  expect(response.status).toBe(413);
  expect(state.quiz).not.toHaveBeenCalled();
  expect((await response.json()).error).toBe("FACULTY_QUIZ_BODY_TOO_LARGE");
 });
});
