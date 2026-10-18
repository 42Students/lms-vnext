import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/courses/faculty/assignments/[deliveryId]/methods/route";
import {parseFacultyAssignmentMethodsQuery}
 from "@/modules/courses/faculty-assignment-methods-query";

const deliveryId="11111111-1111-4111-8111-111111111111";
const assignmentId="22222222-2222-4222-8222-222222222222";
const otherAssignment="33333333-3333-4333-8333-333333333333";
const user={user:{id:"faculty"},membership:{id:"teaching-grant"}};
const state=vi.hoisted(()=>({
 readActor:vi.fn(),getMethods:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:state.readActor,
}));
vi.mock("@/modules/courses/faculty-assignment-authoring-service",()=>({
 getFacultyAssignmentMethods:state.getMethods,
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:state.error,
}));
const url=(search:string)=>"https://college.invalid/api/courses/faculty/assignments/"+
 deliveryId+"/methods"+search;
const get=(search:string)=>GET(new Request(url(search)),{
 params:Promise.resolve({deliveryId}),
});

describe("COURSES-BREAK-FACULTY-11 Faculty submission-methods GET selector privacy",()=>{
 beforeEach(()=>{
  state.readActor.mockReset();
  state.getMethods.mockReset();
  state.error.mockReset();
  state.readActor.mockResolvedValue(user);
  state.getMethods.mockResolvedValue(["FILE","LINK"]);
  state.error.mockReturnValue(Response.json({message:"Check the assignment link."},{status:400}));
 });
 it("FAC-courses-02 exactly one own Section UUID selector reads the authorized methods once",async()=>{
  const result=await get("?assignmentId="+assignmentId);
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({methods:["FILE","LINK"]});
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(state.getMethods).toHaveBeenCalledWith(user,{deliveryId},assignmentId);
  expect(state.getMethods).toHaveBeenCalledTimes(1);
 });
 it("FAC-courses-02 duplicate, conflicting and unexpected selectors never query the actor or methods",async()=>{
  for(const search of [
   "","?assignmentId="+assignmentId+"&assignmentId="+otherAssignment,
   "?assignmentId="+assignmentId+"&assignmentId="+assignmentId,
   "?assignmentId="+assignmentId+"&collegeId=foreign",
   "?assignmentId="+assignmentId+"&source=legacy",
   "?assignmentId=not-a-uuid",
   "?assignmentId=",
  ]){
   const result=await get(search);
   expect(result.status).toBe(400);
   expect(state.getMethods).not.toHaveBeenCalled();
   expect(state.readActor).not.toHaveBeenCalled();
  }
 });
 it("FAC-courses-02 malformed query is rejected without ambiguous fallback selection",()=>{
  for(const q of [
   "?assignmentId="+assignmentId+"&assignmentId="+otherAssignment,
   "?assignmentId="+assignmentId+"&role=SUPER_ADMIN",
   "?assignmentId=../../other-college",
  ])expect(()=>parseFacultyAssignmentMethodsQuery(url(q))).toThrow();
 });
 it("FAC-courses-02 expired Faculty grant and backend failures never return cached or public data",async()=>{
  state.getMethods.mockRejectedValueOnce(new Error("revoked role"));
  const response=await get("?assignmentId="+assignmentId);
  expect(response.status).toBe(400);
  expect(JSON.stringify(await response.json())).not.toContain("revoked role");
  expect(state.error).toHaveBeenCalledTimes(1);
 });
});
