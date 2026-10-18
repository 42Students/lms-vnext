import {beforeEach,describe,expect,it,vi} from "vitest";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {createCourseTeachingAssignmentsBatch} from "@/modules/courses/teaching-assignment-batch-service";
import {POST} from "@/app/api/admin/faculty-assignment/batch/route";
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/courses/teaching-assignment-batch-service",()=>({
 createCourseTeachingAssignmentsBatch:vi.fn(),
}));
const deliveryId="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
const context={user:{id:"33333333-3333-4333-8333-333333333333"},adminScope:{collegeId:"44444444-4444-4444-8444-444444444444"}};
const request=(body:unknown)=>new Request("https://iit.test/api/admin/faculty-assignment/batch",{
 method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
 vi.mocked(createCourseTeachingAssignmentsBatch).mockResolvedValue([{id:"one"}] as never);
});
describe("SA-academics-people-101 guarded course selection HTTP endpoint",()=>{
 it("rejects cross-origin faculty assignment attempts without authenticating or writing",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await POST(request({deliveryIds:[deliveryId],membershipId,role:"PRIMARY"}));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(getCurrentRequestContext).not.toHaveBeenCalled();
  expect(createCourseTeachingAssignmentsBatch).not.toHaveBeenCalled();
 });
 it("forwards exact actor context and array to a single atomic service",async()=>{
  const body={deliveryIds:[deliveryId],membershipId,role:"CO_TEACHER"};
  const response=await POST(request(body));
  expect(response.status).toBe(201);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({assignments:[{id:"one"}]});
  expect(createCourseTeachingAssignmentsBatch).toHaveBeenCalledOnce();
  expect(createCourseTeachingAssignmentsBatch).toHaveBeenCalledWith(context,body);
 });
});
