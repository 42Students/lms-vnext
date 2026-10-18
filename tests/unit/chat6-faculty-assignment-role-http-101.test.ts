import {beforeEach,describe,expect,it,vi} from "vitest";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {changeCourseTeachingAssignmentRole} from "@/modules/courses/teaching-assignment-service";
import {PATCH} from "@/app/api/courses/teaching-assignments/[assignmentId]/route";
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/courses/teaching-assignment-service",()=>({
 changeCourseTeachingAssignmentRole:vi.fn(),endCourseTeachingAssignment:vi.fn(),
}));
const assignmentId="11111111-1111-4111-8111-111111111111";
const expectedUpdatedAt="2026-10-18T12:34:56.789Z";
const context={user:{id:"22222222-2222-4222-8222-222222222222"},adminScope:{collegeId:"33333333-3333-4333-8333-333333333333"}};
const params={params:Promise.resolve({assignmentId})};
const request=(body:unknown)=>new Request("https://iit.example/api/courses/teaching-assignments/"+assignmentId,{
 method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body),
});
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(changeCourseTeachingAssignmentRole).mockResolvedValue({id:assignmentId,role:"CO_TEACHER"} as never);
});
describe("SA-academics-people-101 teaching-role PATCH HTTP boundary",()=>{
 it("rejects a foreign-origin edit before session lookup or SQL",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await PATCH(request({role:"CO_TEACHER",expectedUpdatedAt}),params);
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(getCurrentRequestContext).not.toHaveBeenCalled();
  expect(changeCourseTeachingAssignmentRole).not.toHaveBeenCalled();
 });
 it("rejects missing version, forged scope, invalid roles and invalid ISO timestamps",async()=>{
  for(const body of [
   {role:"CO_TEACHER"},{role:"CO_TEACHER",expectedUpdatedAt,collegeId:"attacker"},
   {role:"OWNER",expectedUpdatedAt},{role:"PRIMARY",expectedUpdatedAt:"yesterday"},
   null,[],
  ]){
   const response=await PATCH(request(body),params);
   expect(response.status,JSON.stringify(body)).toBe(400);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
  }
  expect(changeCourseTeachingAssignmentRole).not.toHaveBeenCalled();
 });
 it("passes selected actor, route identity and exact server revision unchanged",async()=>{
  const body={role:"CO_TEACHER",expectedUpdatedAt};
  const response=await PATCH(request(body),params);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({assignment:{id:assignmentId,role:"CO_TEACHER"}});
  expect(changeCourseTeachingAssignmentRole).toHaveBeenCalledOnce();
  expect(changeCourseTeachingAssignmentRole).toHaveBeenCalledWith(context,assignmentId,body);
 });
});
