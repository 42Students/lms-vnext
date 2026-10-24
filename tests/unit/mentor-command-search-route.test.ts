import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/mentor/search/route";

const state=vi.hoisted(()=>({
 signedIn:true,calls:[] as string[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.signedIn)throw Error("AUTH_REQUIRED");
  return {user:{id:"mentor"},membership:{id:"college-member"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"AUTH_REQUIRED"},{status:401}),
}));
vi.mock("@/modules/projects/mentor-unified-search-service",async()=>{
 const {z}=await import("zod");
 return {
  mentorUnifiedSearchQuery:z.string().trim().min(1).max(100),
  searchMentorWorkspace:async(_:unknown,term:string)=>{
   state.calls.push(term);
   return [{key:"task-id",kind:"Task",title:"Task",
     context:"Assigned project",href:"/mentor/projects/example?tab=board&task=task-id"}];
  },
 };
});
const request=(query:string)=>new Request("https://lms.example.edu/api/mentor/search"+query);
beforeEach(()=>{state.signedIn=true;state.calls=[];});
describe("Mentor in-place command search HTTP boundary",()=>{
 it("rejects missing, repeated, unknown and oversized parameters",async()=>{
  for(const suffix of ["","?q=","?q=abc&q=def","?q=abc&collegeId=other",
    "?q="+("a".repeat(101))]){
    const response=await GET(request(suffix));
    expect(response.status,suffix).toBe(400);
  }
  expect(state.calls).toEqual([]);
 });
 it("returns bounded-format private results only after server authorization",async()=>{
  const response=await GET(request("?q=%20sprint%20"));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(state.calls).toEqual(["sprint"]);
  expect((await response.json()).results).toMatchObject([
    {kind:"Task",context:"Assigned project"},
  ]);
 });
 it("does not search for unauthenticated users",async()=>{
  state.signedIn=false;
  const response=await GET(request("?q=task"));
  expect(response.status).toBe(401);
  expect(state.calls).toEqual([]);
 });
});
