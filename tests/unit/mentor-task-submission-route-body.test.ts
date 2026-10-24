import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST as submit} from
  "@/app/api/projects/[projectId]/tasks/[taskId]/submissions/route";
import {POST as review} from
  "@/app/api/projects/[projectId]/tasks/[taskId]/submissions/[submissionId]/review/route";
import {MENTOR_PROJECT_COMMAND_LIMIT_BYTES}
  from "@/modules/projects/mentor-command-body";

const state=vi.hoisted(()=>({
  validOrigin:true,authReads:0,submissions:0,reviews:0,body:null as unknown,
}));
const ids={
  projectId:"11111111-1111-4111-8111-111111111111",
  taskId:"22222222-2222-4222-8222-222222222222",
  submissionId:"33333333-3333-4333-8333-333333333333",
};
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.validOrigin}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{state.authReads++;return {user:{id:"test-actor"}};},
}));
vi.mock("@/lib/api-error",()=>({
  apiErrorResponse:()=>Response.json({error:"INVALID_ACTION"},{status:403}),
}));
vi.mock("@/modules/projects/task-submission-service",()=>({
  listProjectTaskSubmissions:async()=>[],
  submitProjectTask:async(_user:unknown,_project:string,_task:string,body:unknown)=>{
    state.submissions++;state.body=body;
    return {id:"accepted",status:"SUBMITTED"};
  },
  reviewProjectTaskSubmission:async(
    _user:unknown,_project:string,_task:string,_submission:string,body:unknown,
  )=>{
    state.reviews++;state.body=body;
    return {submission:{id:"accepted",status:"APPROVED"}};
  },
}));
const routes=[
  {name:"learner submit",params:{params:Promise.resolve(ids)},
   invoke:(request:Request)=>submit(request,{params:Promise.resolve(ids)}),
   expected:"submissions"},
  {name:"Mentor review",params:{params:Promise.resolve(ids)},
   invoke:(request:Request)=>review(request,{params:Promise.resolve(ids)}),
   expected:"reviews"},
] as const;
function post(body:BodyInit,media="application/json",length?:number){
  return new Request("https://college.example/api/projects/task-submissions",{
    method:"POST",body,headers:{
      "content-type":media,
      ...(length===undefined?{}:{"content-length":String(length)}),
    },
  });
}
beforeEach(()=>{
  state.validOrigin=true;state.authReads=0;state.submissions=0;
  state.reviews=0;state.body=null;
});
describe("Task submission and review routes reject unsafe payloads",()=>{
  for(const route of routes){
    it(route.name+" rejects forged origin before reading identity",async()=>{
      state.validOrigin=false;
      const response=await route.invoke(post("{}"));
      expect(response.status).toBe(403);
      expect(state.authReads).toBe(0);
      expect(state[route.expected]).toBe(0);
    });
    it(route.name+" rejects oversized declared body with HTTP 413",async()=>{
      const response=await route.invoke(post("{}","application/json",
        MENTOR_PROJECT_COMMAND_LIMIT_BYTES+1));
      expect(response.status).toBe(413);
      expect(state[route.expected]).toBe(0);
    });
    it(route.name+" rejects oversized streamed body without content-length",async()=>{
      const response=await route.invoke(post(
        JSON.stringify({note:"x".repeat(MENTOR_PROJECT_COMMAND_LIMIT_BYTES)})));
      expect(response.status).toBe(413);
      expect(state[route.expected]).toBe(0);
    });
    it(route.name+" rejects malformed JSON, wrong media and invalid UTF-8",async()=>{
      const cases=[
        {r:post("{invalid"),status:400},
        {r:post("status=APPROVED","application/x-www-form-urlencoded"),status:415},
        {r:post(new Uint8Array([0xc3,0x28])),status:400},
      ];
      for(const {r,status} of cases){
        const response=await route.invoke(r);
        expect(response.status).toBe(status);
      }
      expect(state[route.expected]).toBe(0);
    });
    it(route.name+" forwards a valid JSON object exactly once",async()=>{
      const body={decision:"APPROVED",confirmed:true};
      const response=await route.invoke(post(JSON.stringify(body)));
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
      expect(state[route.expected]).toBe(1);
      expect(state.body).toEqual(body);
    });
  }
});
