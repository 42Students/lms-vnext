import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 context:vi.fn(),origin:vi.fn(),submitQuiz:vi.fn(),submitAssignment:vi.fn(),
 myAttempts:vi.fn(),mySubmission:vi.fn(),workspace:vi.fn(),errors:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:(error:unknown)=>{
  state.errors(error);
  return new Response(JSON.stringify({error:"Unable to complete your request."}),
   {status:400,headers:{"Content-Type":"application/json"}});
 },
}));
vi.mock("@/modules/courses/quiz-attempt-service",()=>({
 submitCourseQuiz:state.submitQuiz,getMyQuizAttempts:state.myAttempts,
}));
vi.mock("@/modules/courses/learner-course-service",()=>({getLearnerCourseWorkspace:state.workspace}));
vi.mock("@/modules/courses/assignment-submission-service",()=>({
 submitCourseAssignment:state.submitAssignment,getMyAssignmentSubmission:state.mySubmission,
}));

import {POST as submitQuizRoute} from "@/app/api/courses/quizzes/[quizId]/submit/route";
import {POST as submitAssignmentRoute} from "@/app/api/courses/assignments/[assignmentId]/submit/route";
import {GET as myQuizAttemptsRoute} from "@/app/api/courses/quizzes/[quizId]/my-attempts/route";
import {GET as myAssignmentSubmissionRoute} from "@/app/api/courses/assignments/[assignmentId]/my-submission/route";
import {GET as learnerWorkspaceRoute} from "@/app/api/courses/learner/workspace/route";

const quizId="11111111-1111-4111-8111-111111111111";
const assignmentId="22222222-2222-4222-8222-222222222222";
const deliveryId="33333333-3333-4333-8333-333333333333";
const actor={user:{id:"44444444-4444-4444-8444-444444444444"}};
const quizParams={params:Promise.resolve({quizId})};
const assignmentParams={params:Promise.resolve({assignmentId})};
const post=(path:string,body:unknown)=>new Request("https://campus.invalid"+path,{
 method:"POST",headers:{"Content-Type":"application/json"},
 body:JSON.stringify(body),
});

beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.context.mockResolvedValue(actor);
 state.origin.mockReturnValue(true);
 state.submitQuiz.mockResolvedValue({id:"quiz-attempt"});
 state.submitAssignment.mockResolvedValue({id:"assignment-submission"});
 state.myAttempts.mockResolvedValue([]);
 state.mySubmission.mockResolvedValue(null);
 state.workspace.mockResolvedValue({courseName:"Safe workspace"});
});

describe("COURSES7-07 / COURSES7-08 authenticated learner assessment HTTP boundaries",()=>{
 it("COURSES7-07 prevents cross-origin quiz mutation before context, decoding, or submission",async()=>{
  state.origin.mockReturnValue(false);
  const response=await submitQuizRoute(post("/api/courses/quizzes/"+quizId+"/submit",{
   deliveryId,
  }),quizParams);
  expect(response.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.submitQuiz).not.toHaveBeenCalled();
 });
 it("COURSES7-08 prevents cross-origin assignment mutation before context or submission",async()=>{
  state.origin.mockReturnValue(false);
  const response=await submitAssignmentRoute(post("/api/courses/assignments/"+assignmentId+"/submit",{
   deliveryId,
  }),assignmentParams);
  expect(response.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.submitAssignment).not.toHaveBeenCalled();
 });
 it("COURSES7-07 passes the authenticated context, path quiz, and unmodified body into the authorized service",async()=>{
  const body={deliveryId,answers:[]};
  const response=await submitQuizRoute(post("/api/courses/quizzes/"+quizId+"/submit",body),quizParams);
  expect(response.status).toBe(201);
  expect(state.submitQuiz).toHaveBeenCalledTimes(1);
  expect(state.submitQuiz).toHaveBeenCalledWith(actor,quizId,body);
 });
 it("COURSES7-08 passes the authenticated context, path assignment, and unmodified body into the authorized service",async()=>{
  const body={deliveryId,submissionType:"TEXT",textContent:"Work done"};
  const response=await submitAssignmentRoute(post("/api/courses/assignments/"+assignmentId+"/submit",body),assignmentParams);
  expect(response.status).toBe(201);
  expect(state.submitAssignment).toHaveBeenCalledTimes(1);
  expect(state.submitAssignment).toHaveBeenCalledWith(actor,assignmentId,body);
 });
 it("COURSES7-07 and COURSES7-08 read only authenticated own results for the supplied delivery",async()=>{
  const quiz=await myQuizAttemptsRoute(new Request(
   "https://campus.invalid/api/courses/quizzes/"+quizId+"/my-attempts?deliveryId="+deliveryId,
  ),quizParams);
  const assignment=await myAssignmentSubmissionRoute(new Request(
   "https://campus.invalid/api/courses/assignments/"+assignmentId+"/my-submission?deliveryId="+deliveryId,
  ),assignmentParams);
  expect(quiz.status).toBe(200);
  expect(assignment.status).toBe(200);
  expect(quiz.headers.get("Cache-Control")).toContain("no-store");
  expect(assignment.headers.get("Cache-Control")).toContain("no-store");
  expect(state.myAttempts).toHaveBeenCalledTimes(1);
  expect(state.myAttempts).toHaveBeenCalledWith(actor,quizId,deliveryId);
  expect(state.mySubmission).toHaveBeenCalledTimes(1);
  expect(state.mySubmission).toHaveBeenCalledWith(actor,assignmentId,deliveryId);
  expect(state.submitQuiz).not.toHaveBeenCalled();
  expect(state.submitAssignment).not.toHaveBeenCalled();
 });
 it("COURSES7-08 learner workspace GET keeps private course progress uncached",async()=>{
  const response=await learnerWorkspaceRoute(new Request(
   "https://campus.invalid/api/courses/learner/workspace?deliveryId="+deliveryId,
  ));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(state.workspace).toHaveBeenCalledTimes(1);
  expect(state.workspace).toHaveBeenCalledWith(actor,deliveryId);
 });
 it("COURSES7-07 and COURSES7-08 never send raw exceptions to learner clients",async()=>{
  state.myAttempts.mockRejectedValueOnce(new Error("sensitive postgres connection: secret"));
  state.mySubmission.mockRejectedValueOnce(new Error("sensitive membership lookup: secret"));
  const quiz=await myQuizAttemptsRoute(new Request(
   "https://campus.invalid/api/courses/quizzes/"+quizId+"/my-attempts",
  ),quizParams);
  const assignment=await myAssignmentSubmissionRoute(new Request(
   "https://campus.invalid/api/courses/assignments/"+assignmentId+"/my-submission",
  ),assignmentParams);
  expect(quiz.status).toBe(400);
  expect(assignment.status).toBe(400);
  expect(await quiz.text()).not.toContain("secret");
  expect(await assignment.text()).not.toContain("secret");
  expect(state.errors).toHaveBeenCalledTimes(2);
 });
});
