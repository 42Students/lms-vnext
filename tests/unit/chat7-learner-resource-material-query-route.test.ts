import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 read:vi.fn(),write:vi.fn(),context:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>true}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/modules/courses/lesson-resource-materials-service",()=>({
 listLessonResourceMaterials:state.read,
 commandLessonResourceMaterial:state.write,
}));
import {GET,POST} from "@/app/api/courses/lesson-contents/[contentId]/materials/route";
const contentId="11111111-1111-4111-8111-111111111111";
const deliveryId="22222222-2222-4222-8222-222222222222";
const params={params:Promise.resolve({contentId})};
const url=(query:string)=>"https://lms.example.edu/api/courses/lesson-contents/"+contentId+"/materials"+query;
const get=(query:string)=>GET(new Request(url(query)),params);
const post=(query:string)=>POST(new Request(url(query),{
 method:"POST",headers:{"Content-Type":"application/json"},
 body:JSON.stringify({action:"REMOVE",materialId:contentId}),
}),params);

beforeEach(()=>{
 state.context.mockReset().mockResolvedValue({user:{id:"learner"}});
 state.read.mockReset().mockResolvedValue([]);
 state.write.mockReset().mockResolvedValue({id:contentId,action:"REMOVE"});
});
describe("LEARNER-RESOURCE-QUERY-09 learner and authoring material route audience scope",()=>{
 it("accepts only the exact optional delivery ID and never mutates on GET",async()=>{
  const withScope=await get("?deliveryId="+deliveryId);
  expect(withScope.status).toBe(200);
  expect(state.read).toHaveBeenCalledWith(expect.anything(),contentId,deliveryId);
  expect(state.write).not.toHaveBeenCalled();
  expect(withScope.headers.get("Cache-Control")).toBe("private, no-store");
  const withoutScope=await get("");
  expect(withoutScope.status).toBe(200);
  expect(state.read).toHaveBeenCalledWith(expect.anything(),contentId,null);
  expect(state.write).not.toHaveBeenCalled();
 });
 it("rejects repeated, malformed, empty or unexpected GET scope parameters before reading materials",async()=>{
  for(const query of [
   "?deliveryId="+deliveryId+"&deliveryId="+deliveryId,
   "?deliveryId="+deliveryId+"&deliveryId=other",
   "?deliveryId=invalid","?deliveryId=",
   "?deliveryId="+deliveryId+"&collegeId="+contentId,
   "?download=1",
  ]){
   const before=state.read.mock.calls.length;
   const result=await get(query);
   expect(result.status).toBe(400);
   expect(state.read).toHaveBeenCalledTimes(before);
  }
 });
 it("rejects duplicate and forged POST scope before any persisted change",async()=>{
  for(const query of [
   "?deliveryId="+deliveryId+"&deliveryId="+deliveryId,
   "?deliveryId="+deliveryId+"&collegeId="+contentId,
   "?deliveryId=not-uuid",
  ]){
   const response=await post(query);
   expect(response.status).toBe(400);
  }
  expect(state.write).not.toHaveBeenCalled();
 });
 it("maps oversized or non-object material bodies to 400 without calling any writer",async()=>{
  for(const body of ["x".repeat(16_385),"[]","null","{invalid"]){
   const response=await POST(new Request(url(""),{
    method:"POST",headers:{"Content-Type":"application/json"},body,
   }),params);
   expect(response.status).toBe(400);
  }
  expect(state.write).not.toHaveBeenCalled();
 });
 it("passes one validated active Section scope into the authorized POST mutation service",async()=>{
  const result=await post("?deliveryId="+deliveryId);
  expect(result.status).toBe(201);
  expect(result.headers.get("Cache-Control")).toBe("private, no-store");
  expect(state.write).toHaveBeenCalledWith(
   expect.anything(),contentId,deliveryId,{action:"REMOVE",materialId:contentId},
  );
 });
});
