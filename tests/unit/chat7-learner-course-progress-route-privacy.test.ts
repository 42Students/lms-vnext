import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 context:vi.fn(),origin:vi.fn(),courses:vi.fn(),progress:vi.fn(),save:vi.fn(),errors:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:(error:unknown)=>{
 state.errors(error);
 return new Response(JSON.stringify({error:"Unable to load this course."}),
  {status:400,headers:{"Content-Type":"application/json"}});
}}));
vi.mock("@/modules/courses/learner-course-service",()=>({
 listLearnerCourseDeliveries:state.courses,
}));
vi.mock("@/modules/courses/progress-service",()=>({
 getLearnerContentProgress:state.progress,saveLearnerContentProgress:state.save,
}));
import {GET as listCoursesRoute} from "@/app/api/courses/learner/route";
import {GET as getProgressRoute,PUT as saveProgressRoute} from "@/app/api/courses/progress/[contentId]/route";
const contentId="11111111-1111-4111-8111-111111111111";
const deliveryId="22222222-2222-4222-8222-222222222222";
const actor={user:{id:"33333333-3333-4333-8333-333333333333"}};
const path={params:Promise.resolve({contentId})};
beforeEach(()=>{
 for(const mock of Object.values(state))mock.mockReset();
 state.context.mockResolvedValue(actor);state.origin.mockReturnValue(true);
 state.courses.mockResolvedValue([{id:deliveryId}]);
 state.progress.mockResolvedValue({percent:40});
 state.save.mockResolvedValue({percent:50});
});
describe("COURSES7-09 learner roster and progress HTTP privacy",()=>{
 it("COURSES7-09 course roster GET uses current authenticated actor, no writes, and is not cached",async()=>{
  const response=await listCoursesRoute();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(state.courses).toHaveBeenCalledTimes(1);
  expect(state.courses).toHaveBeenCalledWith(actor);
  expect(state.save).not.toHaveBeenCalled();
 });
 it("COURSES7-09 content progress GET requires service authorization and forbids caching",async()=>{
  const response=await getProgressRoute(new Request(
   "https://campus.invalid/api/courses/progress/"+contentId+"?deliveryId="+deliveryId,
  ),path);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(state.progress).toHaveBeenCalledTimes(1);
  expect(state.progress).toHaveBeenCalledWith(actor,contentId,deliveryId);
  expect(state.save).not.toHaveBeenCalled();
 });
 it("COURSES7-09 progress mutation denies forged origin before reading current account",async()=>{
  state.origin.mockReturnValue(false);
  const response=await saveProgressRoute(new Request(
   "https://campus.invalid/api/courses/progress/"+contentId,{
    method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({percent:50}),
   },
  ),path);
  expect(response.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.save).not.toHaveBeenCalled();
 });
 it("COURSES7-09 progress mutation uses authenticated actor, exact content and body",async()=>{
  const input={deliveryId,progressSeconds:60};
  const response=await saveProgressRoute(new Request(
   "https://campus.invalid/api/courses/progress/"+contentId,{
    method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),
   },
  ),path);
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(state.save).toHaveBeenCalledTimes(1);
  expect(state.save).toHaveBeenCalledWith(actor,contentId,input);
 });
 it("COURSES7-09 API maps progress lookup failures without exposing backend text",async()=>{
  state.progress.mockRejectedValueOnce(new Error("private user email and sql"));
  const response=await getProgressRoute(new Request(
   "https://campus.invalid/api/courses/progress/"+contentId,
  ),path);
  expect(response.status).toBe(400);
  expect(await response.text()).not.toContain("private user email");
  expect(state.errors).toHaveBeenCalledTimes(1);
 });
});
