import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {FacultyQuizBodyError} from "@/modules/courses/faculty-quiz-request-body";
const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),error:vi.fn(),command:vi.fn(),
 grade:vi.fn(),publish:vi.fn(),results:vi.fn(),submit:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/courses/faculty-quiz-authoring-service",()=>({commandFacultyQuiz:state.command}));
vi.mock("@/modules/courses/assignment-submission-service",()=>({
 gradeAssignmentSubmission:state.grade,publishAssignmentGrade:state.publish,
}));
vi.mock("@/modules/courses/faculty-quiz-results-command-service",()=>({commandFacultyQuizResults:state.results}));
vi.mock("@/modules/courses/quiz-attempt-service",()=>({submitCourseQuiz:state.submit}));
import {POST as authorQuiz} from "@/app/api/courses/faculty/quizzes/[deliveryId]/command/route";
import {PATCH as grade} from "@/app/api/courses/assignment-submissions/[submissionId]/grade/route";
import {POST as publish} from "@/app/api/courses/assignment-submissions/[submissionId]/publish/route";
import {POST as results} from "@/app/api/courses/quizzes/[quizId]/faculty-results/route";
import {POST as submit} from "@/app/api/courses/quizzes/[quizId]/submit/route";
const id="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"signed-in-actor"},membership:{id:"persisted-faculty-membership"}};
const params={params:Promise.resolve({deliveryId:id,submissionId:id,quizId:id})};
const command={action:"SAVE",title:"Quiz",requestedActorId:"foreign"};
const make=(method:string,body:unknown=command,contentType="application/json")=>
 new Request("https://college.invalid/api/courses",{method,
  headers:{"content-type":contentType},body:JSON.stringify(body)});
beforeEach(()=>{
 for(const x of Object.values(state))x.mockReset();
 state.origin.mockReturnValue(true);state.context.mockResolvedValue(actor);
 state.error.mockImplementation(()=>NextResponse.json({
  error:"CONFLICT",message:"This changed. Refresh and try again."},{status:409}));
 for(const x of [state.command,state.grade,state.publish,state.results,state.submit])x.mockResolvedValue({id});
});
describe("COURSES-BREAK-ROUTES-01 real Learner/Faculty course mutation route boundaries",()=>{
 const handlers=[
  {name:"Faculty quiz authoring",fn:authorQuiz,method:"POST",service:state.command},
  {name:"Faculty assignment grade",fn:grade,method:"PATCH",service:state.grade},
  {name:"Faculty grade publication",fn:publish,method:"POST",service:state.publish},
  {name:"Faculty quiz result release",fn:results,method:"POST",service:state.results},
  {name:"Learner quiz final submission",fn:submit,method:"POST",service:state.submit},
 ] as const;
 for(const spec of handlers){
  it(`rejects cross-origin ${spec.name} before reading session or calling service`,async()=>{
   state.origin.mockReturnValueOnce(false);
   const res=await spec.fn(make(spec.method),params);
   expect(res.status).toBe(403);
   expect(await res.json()).toEqual({error:"INVALID_ORIGIN"});
   expect(state.context).not.toHaveBeenCalled();
   expect(spec.service).not.toHaveBeenCalled();
  });
  it(`uses authenticated request context for ${spec.name} and returns only persisted service result`,async()=>{
   const body=spec.name==="Faculty assignment grade"
    ?{pointsAwarded:80,expectedVersion:0,feedback:"Evidence reviewed"}:command;
   const res=await spec.fn(make(spec.method,body),params);
   // Quiz submissions update one existing attempt; they do not create a
   // second persisted attempt, so the response is a successful 200.
   expect(res.status).toBe(200);
   expect(spec.service).toHaveBeenCalledTimes(1);
   expect(spec.service.mock.calls[0][0]).toBe(actor);
   expect(JSON.stringify(await res.json())).not.toContain("foreign");
  });
  it(`converts stale, expired or foreign-scope ${spec.name} service failure to safe response`,async()=>{
   spec.service.mockRejectedValueOnce(new Error("internal DB schema password"));
   const res=await spec.fn(make(spec.method),params);
   expect(res.status).toBe(409);
   const body=await res.json();
   expect(body.message).toContain("Refresh");
   expect(JSON.stringify(body)).not.toMatch(/password|schema/i);
   expect(state.error).toHaveBeenCalledTimes(1);
  });
 }
 it("rejects wrong Content-Type and malformed Faculty Quiz JSON before command service",async()=>{
  const wrong=await authorQuiz(make("POST",command,"text/plain"),params);
  expect(wrong.status).toBe(415);
  expect((await wrong.json()).error).toBe("UNSUPPORTED_QUIZ_CONTENT_TYPE");
  expect(state.command).not.toHaveBeenCalled();
  const malformed=new Request("https://college.invalid/api/courses",{method:"POST",
   headers:{"content-type":"application/json"},body:"{bad"});
  const result=await authorQuiz(malformed,params);
  expect(result.status).toBe(400);
  expect((await result.json()).error).toBe("INVALID_QUIZ_JSON");
  expect(state.command).not.toHaveBeenCalled();
 });
});
