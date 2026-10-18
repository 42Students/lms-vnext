import {beforeEach,describe,expect,it,vi} from "vitest";
import {MENTOR_PROJECT_COMMAND_LIMIT_BYTES} from "@/modules/projects/mentor-command-body";

vi.mock("server-only",()=>({}));
const state=vi.hoisted(()=>({
 origin:vi.fn(),actor:vi.fn(),scope:vi.fn(),
 mentor:vi.fn(),learner:vi.fn(),apiError:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.actor}));
vi.mock("@/modules/projects/access",()=>({requireProjectReadAccess:state.scope}));
vi.mock("@/modules/projects/mentor-task-create-service",()=>({
 createMentorProjectTask:state.mentor,
}));
vi.mock("@/modules/projects/learner-own-task-service",()=>({
 createLearnerOwnTask:state.learner,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.apiError}));
import {POST} from "@/app/api/projects/[projectId]/tasks/route";

const projectId="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"faculty-mentor"}};
const params={params:Promise.resolve({projectId})};
function post(body:string,contentType="application/json"){
 return new Request("https://college.example/api/projects/"+projectId+"/tasks",{
  method:"POST",body,headers:{"content-type":contentType},
 });
}
beforeEach(()=>{
 vi.resetAllMocks();
 state.origin.mockReturnValue(true);
 state.actor.mockResolvedValue(actor);
 state.scope.mockResolvedValue({access:"MENTOR"});
 state.mentor.mockResolvedValue({id:"created-mentor-task"});
 state.learner.mockResolvedValue({id:"created-learner-task"});
 state.apiError.mockReturnValue(Response.json({
  error:"FORBIDDEN",message:"You cannot change this project.",requestId:"safe",
 },{status:403}));
});
describe("PROJ-BREAK-chat3-FACULTY-04 mentor/learner task create dispatch",()=>{
 it("never dispatches a task mutation for a read-only Observer project grant",async()=>{
  state.scope.mockResolvedValueOnce({access:"OBSERVER"});
  const response=await POST(post(JSON.stringify({title:"Private"})),params);
  expect(response.status).toBe(403);
  expect(state.apiError).toHaveBeenCalledOnce();
  expect(state.mentor).not.toHaveBeenCalled();
  expect(state.learner).not.toHaveBeenCalled();
 });
 it("does not route an administrative project view through a Mentor-only task writer",async()=>{
  state.scope.mockResolvedValueOnce({access:"ADMIN"});
  const response=await POST(post(JSON.stringify({title:"Try privileged task"})),params);
  expect(response.status).toBe(403);
  expect(state.mentor).not.toHaveBeenCalled();
  expect(state.learner).not.toHaveBeenCalled();
 });
 it("keeps Faculty-only project authorization denied without attempting a Mentor write",async()=>{
  state.scope.mockRejectedValueOnce(new Error("PROJECT_ACCESS_DENIED"));
  const response=await POST(post(JSON.stringify({title:"Not permitted"})),params);
  expect(response.status).toBe(403);
  expect(state.mentor).not.toHaveBeenCalled();
  expect(state.learner).not.toHaveBeenCalled();
 });
 it("uses the independent active Mentor or Learner grant to select an exact handler",async()=>{
  const request={title:"Created within authorized project"};
  const mentor=await POST(post(JSON.stringify(request)),params);
  expect(mentor.status).toBe(201);
  expect(state.mentor).toHaveBeenCalledWith(actor,{projectId},request);
  expect(state.learner).not.toHaveBeenCalled();
  state.scope.mockResolvedValueOnce({access:"LEARNER"});
  const learner=await POST(post(JSON.stringify(request)),params);
  expect(learner.status).toBe(201);
  expect(state.learner).toHaveBeenCalledWith(actor,{projectId},request);
 });
 it("does not bypass the same-origin check or load session for forged POSTs",async()=>{
  state.origin.mockReturnValueOnce(false);
  const response=await POST(post("{}"),params);
  expect(response.status).toBe(403);
  expect(state.actor).not.toHaveBeenCalled();
  expect(state.mentor).not.toHaveBeenCalled();
  expect(state.learner).not.toHaveBeenCalled();
 });
 it("rejects oversized, malformed JSON, unsupported media type and corrupt UTF-8 before task creation",async()=>{
  const cases=[
   {request:post("x".repeat(MENTOR_PROJECT_COMMAND_LIMIT_BYTES+1)),status:413},
   {request:post("{"),status:400},
   {request:post("{}","text/plain"),status:415},
   {request:post(String.fromCharCode(0xd800)),status:400},
  ];
  for(const {request,status} of cases){
   const response=await POST(request,params);
   expect(response.status).toBe(status);
   expect((await response.json()).message).toMatch(/retry|read|JSON|Shorten/);
  }
  expect(state.mentor).not.toHaveBeenCalled();
  expect(state.learner).not.toHaveBeenCalled();
 });
});
